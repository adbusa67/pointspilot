/**
 * Minimal, dependency-free client for an OpenAI-compatible
 * Chat Completions endpoint, with token streaming via SSE.
 *
 * Configuration comes from Vite env vars (see .env.example):
 *   VITE_LLM_API_KEY   — required
 *   VITE_LLM_BASE_URL  — default https://api.openai.com/v1
 *   VITE_LLM_MODEL     — default gpt-4o
 */

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const API_KEY = import.meta.env.VITE_LLM_API_KEY?.trim();
const BASE_URL = (
  import.meta.env.VITE_LLM_BASE_URL?.trim() || "https://api.openai.com/v1"
).replace(/\/+$/, "");
const MODEL = import.meta.env.VITE_LLM_MODEL?.trim() || "gpt-4o";

/** True when an API key has been configured in .env.local. */
export function isLlmConfigured(): boolean {
  return Boolean(API_KEY);
}

export type StreamOptions = {
  /** Called with each new chunk of text as it streams in. */
  onToken: (chunk: string) => void;
  /** Optional AbortSignal so the caller can cancel an in-flight response. */
  signal?: AbortSignal;
};

/**
 * Stream a chat completion. Resolves with the full assistant message once the
 * stream ends. Throws on network/auth/config errors.
 */
export async function streamChat(
  messages: ChatMessage[],
  { onToken, signal }: StreamOptions,
): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "No API key configured. Add VITE_LLM_API_KEY to your .env.local file and restart the dev server.",
    );
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      // Allow direct browser calls when the provider is Anthropic's OpenAI-compatible API.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.4,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(
      `Model request failed (${res.status} ${res.statusText}).${
        detail ? ` ${detail.slice(0, 300)}` : ""
      }`,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  // Parse Server-Sent Events: lines of `data: {json}` terminated by blank lines.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly partial) line in the buffer.
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data:")) continue;

      const data = line.slice(5).trim();
      if (data === "[DONE]") return full;

      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // Ignore keep-alive / non-JSON lines.
      }
    }
  }

  return full;
}
