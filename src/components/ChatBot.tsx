import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Plane, Send, Square, Sparkles, AlertTriangle, User as UserIcon } from "lucide-react";
import Button from "./Button";
import { getSession } from "../lib/auth";
import { AWARDPILOT_SYSTEM_PROMPT, buildUserContext } from "../lib/systemPrompt";
import { ChatMessage, isLlmConfigured, streamChat } from "../lib/llm";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  "Find me the best points strategy to fly Toronto → Tokyo in business class.",
  "Audit my balances and suggest the best trips I could book right now.",
  "Which credit card should I apply for next based on my travel goals?",
  "What's the best way to fly Business or First Class for fewer points?",
];

/** Render one assistant message as rich markdown (headings, tables, lists). */
function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-2 text-lg font-bold text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-2 text-base font-bold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-3 border-b border-white/10 pb-1 text-sm font-bold text-white">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="text-slate-200">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-5 text-slate-200">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-5 text-slate-200">{children}</ol>
          ),
          li: ({ children }) => <li className="marker:text-slate-500">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-amex underline decoration-amex/40 underline-offset-2 hover:decoration-amex"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-amber-200">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 text-slate-300">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/10 px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/5 px-3 py-2 align-top text-slate-300">
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amex/50 pl-3 text-slate-400">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function MessageRow({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-white/10 text-slate-200"
            : "bg-gradient-to-br from-amex to-aeroplan text-white"
        }`}
        aria-hidden="true"
      >
        {isUser ? <UserIcon size={16} /> : <Plane size={16} />}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-tr-sm bg-amex/15 text-slate-100"
            : "rounded-tl-sm border border-white/10 bg-white/5"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm text-slate-100">
            {message.content}
          </p>
        ) : message.content ? (
          <AssistantMarkdown content={message.content} />
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-slate-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
            AwardPilot is thinking…
          </span>
        )}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const configured = useMemo(() => isLlmConfigured(), []);
  // Read session once for the header badge; context is re-read on each send.
  const sessionUser = useMemo(() => getSession(), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    if (!configured) {
      setError(
        "AwardPilot isn't connected yet. Copy .env.example to .env.local, add your CURSOR_API_KEY, then run `npm run dev:all`.",
      );
      return;
    }

    setError(null);
    setInput("");

    const userMsg: UiMessage = {
      id: `u${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantMsg: UiMessage = {
      id: `a${Date.now()}`,
      role: "assistant",
      content: "",
    };

    // Snapshot the prior conversation before adding the new turn.
    const history = messages;
    setMessages([...history, userMsg, assistantMsg]);
    setBusy(true);

    // Build the payload: system prompt + fresh user profile context + history.
    const currentUser = getSession();
    const payload: ChatMessage[] = [
      {
        role: "system",
        content: `${AWARDPILOT_SYSTEM_PROMPT}\n\n${buildUserContext(currentUser)}`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: trimmed },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(payload, {
        signal: controller.signal,
        onToken: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          );
        },
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped the stream — keep whatever streamed so far.
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        setError(msg);
        // Drop the empty assistant bubble if nothing streamed.
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantMsg.id && m.content === "")),
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const stop = () => abortRef.current?.abort();

  return (
    <div className="glass flex h-[70vh] max-h-[760px] min-h-[520px] flex-col overflow-hidden rounded-2xl shadow-xl shadow-black/30">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amex to-aeroplan text-white">
            <Plane size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">AwardPilot</h2>
            <p className="text-xs text-slate-400">
              Your AI award-travel strategist
            </p>
          </div>
        </div>
        <span
          className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex ${
            sessionUser
              ? "bg-success/10 text-success"
              : "bg-white/5 text-slate-400"
          }`}
        >
          <Sparkles size={13} />
          {sessionUser ? `Profile linked · ${sessionUser.username}` : "Sign in to personalize"}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amex to-aeroplan text-white">
              <Plane size={26} strokeWidth={2.5} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">
                Where do you want to fly?
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                I'll turn your points and miles into the best possible award
                itinerary — ranked by value, with every transfer path spelled
                out.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  disabled={busy}
                  className="glass rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageRow key={m.id} message={m} />)
        )}
      </div>

      {/* Error banner */}
      {error ? (
        <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 px-4 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              configured
                ? "Ask about a route, a program, or your best redemption…"
                : "Add CURSOR_API_KEY to .env.local, then run npm run dev:all…"
            }
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 backdrop-blur-md transition-colors focus:border-amex/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amex"
          />
          {busy ? (
            <Button type="button" variant="secondary" onClick={stop} aria-label="Stop">
              <Square size={16} />
              Stop
            </Button>
          ) : (
            <Button type="submit" aria-label="Send" disabled={!input.trim()}>
              <Send size={16} />
              Send
            </Button>
          )}
        </div>
        <p className="mt-2 px-1 text-[11px] text-slate-500">
          AwardPilot can make mistakes — always verify live award availability
          before transferring points (transfers are irreversible).
        </p>
      </form>
    </div>
  );
}
