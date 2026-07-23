/**
 * AwardPilot backend.
 *
 * Bridges the browser chat to the Cursor Agent SDK — the same mechanism
 * ~/ws/infra-ai uses (cursor-sdk + CURSOR_API_KEY -> api.cursor.com), just the
 * Node flavour (@cursor/sdk). The Cursor key lives here on the server and is
 * NEVER shipped to the browser.
 *
 * It exposes an OpenAI-compatible streaming endpoint so the existing React
 * client (src/lib/llm.ts) can talk to it unchanged:
 *
 *   POST /v1/chat/completions   { model, messages, stream: true }  -> SSE
 *   GET  /health
 *
 * Run:  node --env-file=.env.local server/index.mjs   (see package.json scripts)
 */
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Load env from .env.local (preferred) or .env, whichever exists.
for (const file of [".env.local", ".env"]) {
  if (fs.existsSync(file)) {
    process.loadEnvFile(file);
    console.log(`[awardpilot] loaded env from ${file}`);
    break;
  }
}

/**
 * Route the Cursor SDK's traffic through the corporate proxy.
 *
 * The Node SDK talks to api.cursor.com over HTTP/2 (via @connectrpc/connect-node
 * -> node:http2) IN THIS PROCESS. node:http2 ignores HTTPS_PROXY, so on networks
 * where only the corporate proxy reaches the internet it fails with "Network
 * request failed". Same fix as ~/ws/infra-ai: load a preload that patches
 * tls.connect to tunnel via CONNECT. Because the connection is in-process (not a
 * spawned node bridge), we must load the preload HERE, before importing the SDK.
 */
async function configureProxy() {
  process.env.NODE_USE_ENV_PROXY ??= "1";
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const preload = path.join(import.meta.dirname, "proxy_preload.cjs");
  if (!proxy || !fs.existsSync(preload)) return;

  // Patch tls.connect in THIS process (covers the in-process http2 client).
  await import(pathToFileURL(preload).href);

  // Also help any child executor process the SDK may spawn.
  const requireArg = `--require=${preload}`;
  const existing = process.env.NODE_OPTIONS ?? "";
  if (!existing.includes(requireArg)) {
    process.env.NODE_OPTIONS = `${existing} ${requireArg}`.trim();
  }
  console.log(`[awardpilot] proxy tunneling enabled via ${proxy}`);
}

await configureProxy();

// Import the SDK only after the proxy tunnel is in place.
const { Agent, CursorAgentError } = await import("@cursor/sdk");

const PORT = Number(process.env.PORT ?? process.env.AWARDPILOT_PORT ?? 8787);
const API_KEY = process.env.CURSOR_API_KEY?.trim();
// infra-ai uses claude-haiku-4-5 / auto; "auto" lets Cursor pick a capable model.
const MODEL = (process.env.CURSOR_MODEL || "auto").trim();

if (!API_KEY) {
  console.warn(
    "[awardpilot] WARNING: CURSOR_API_KEY is not set. Add it to .env.local " +
      "(get a key at https://cursor.com/dashboard/integrations).",
  );
}

// Scratch workspace for the local agent (it runs against a cwd like infra-ai).
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "awardpilot-"));

/** Flatten OpenAI-style messages into a single prompt for the Cursor agent. */
function toPrompt(messages) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const convo = messages.filter((m) => m.role !== "system");

  const lines = [];
  if (system) lines.push(system);
  lines.push("\n---\nCONVERSATION SO FAR:");
  if (convo.length === 0) {
    lines.push("(none yet)");
  } else {
    for (const m of convo) {
      const who = m.role === "user" ? "User" : "AwardPilot";
      lines.push(`${who}: ${m.content}`);
    }
  }
  lines.push(
    "\nRespond as AwardPilot to the user's latest message. Follow your system " +
      "instructions and response format exactly. Answer directly from your own " +
      "expert knowledge — do not use file, shell, or code tools.",
  );
  return lines.join("\n");
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 5_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sseChunk(res, text) {
  const payload = {
    choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
  };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function handleChat(req, res) {
  const body = await readJson(req);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const model = (body.model && String(body.model)) || MODEL;

  if (!API_KEY) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "CURSOR_API_KEY is not configured on the server.",
      }),
    );
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  const prompt = toPrompt(messages);
  let agent;
  let sent = "";

  try {
    agent = await Agent.create({
      apiKey: API_KEY,
      model: { id: model },
      local: { cwd: SCRATCH, settingSources: [] },
    });

    const run = await agent.send(prompt);

    for await (const event of run.stream()) {
      if (event.type !== "assistant") continue;
      const content = event.message?.content ?? [];
      for (const block of content) {
        if (block.type === "text" && block.text) {
          // Handle both delta and cumulative streaming shapes safely.
          const next = block.text;
          if (next.startsWith(sent)) {
            const delta = next.slice(sent.length);
            if (delta) sseChunk(res, delta);
            sent = next;
          } else {
            sseChunk(res, next);
            sent += next;
          }
        }
      }
    }

    await run.wait();
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message =
      err instanceof CursorAgentError
        ? `Cursor agent could not start: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown error";
    console.error("[awardpilot] chat error:", message);
    if (!sent) {
      // Nothing streamed yet — surface the error in-stream so the UI shows it.
      sseChunk(res, `⚠️ ${message}`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } finally {
    try {
      await agent?.[Symbol.asyncDispose]?.();
    } catch {
      /* ignore disposal errors */
    }
  }
}

const server = http.createServer((req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, model: MODEL, keyConfigured: Boolean(API_KEY) }));
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/v1/chat/completions")) {
    handleChat(req, res).catch((err) => {
      console.error("[awardpilot] fatal:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err?.message || err) }));
      } else {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`[awardpilot] backend listening on http://localhost:${PORT}`);
  console.log(`[awardpilot] model: ${MODEL} | key: ${API_KEY ? "configured" : "MISSING"}`);
});
