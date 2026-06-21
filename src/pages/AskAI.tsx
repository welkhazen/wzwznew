import { FormEvent, useMemo, useState } from "react";
import { BrandName } from "@/components/ui/brand-name";
import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/http";
import { LandingFooter } from "@/components/landing/LandingFooter";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AskAI() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correction, setCorrection] = useState("");

  const lastQuestion = useMemo(
    () => [...messages].reverse().find((message) => message.role === "user")?.content ?? "",
    [messages]
  );
  const lastAnswer = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant")?.content ?? "",
    [messages]
  );

  const sendQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    setError(null);
    setCorrection("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history = nextMessages.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await apiFetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      const rawBody = await response.text();
      let data: { answer?: string; error?: string } = {};
      try {
        data = JSON.parse(rawBody) as { answer?: string; error?: string };
      } catch {
        data = {};
      }

      if (!response.ok || !data.answer) {
        if (response.status === 404) {
          setError("Assistant API route not found. Ensure backend server is running and Vite proxy is configured.");
          return;
        }

        if (response.status === 503) {
          setError(data.error ?? "Assistant is disabled or not configured (check OPENAI_API_KEY / AI_ASSISTANT_ENABLED).");
          return;
        }

        setError(data.error ?? `Assistant unavailable right now (status ${response.status}).`);
        return;
      }

      setMessages((current) => [...current, { role: "assistant", content: data.answer! }]);
    } catch {
      setError("Unable to reach AI assistant right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (helpful: boolean) => {
    if (!lastQuestion || !lastAnswer) {
      return;
    }

    await apiFetch("/api/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: lastQuestion,
        answer: lastAnswer,
        helpful,
        correction: correction.trim() || undefined,
      }),
    });

    setCorrection("");
  };

  return (
    <div className="min-h-screen bg-raw-black">
      <header className="border-b border-raw-border/30 bg-raw-black/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            <BrandName />
          </Link>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-raw-border/40 bg-raw-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-raw-silver/75 transition hover:border-raw-gold/35 hover:text-raw-gold sm:text-xs"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="px-4 py-10 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-5xl rounded-2xl border border-raw-gold/15 bg-[linear-gradient(160deg,rgba(18,18,18,0.96),rgba(8,8,8,0.98))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:p-6 md:p-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Ask AI</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Website Assistant</h1>
          <p className="mt-2 text-sm text-raw-silver/55">
            Ask anything about your website features, onboarding, dashboard, policies, and settings.
          </p>

          <div className="mt-6 h-[38vh] min-h-[240px] overflow-y-auto rounded-2xl border border-raw-border/35 bg-raw-black/35 p-4 sm:h-[46vh] sm:min-h-[320px]">
            {messages.length === 0 ? (
              <p className="text-sm text-raw-silver/45">Start by asking a question about your website.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "ml-auto border-raw-gold/40 bg-raw-gold/12 text-raw-text"
                        : "border-raw-border/35 bg-raw-black/45 text-raw-silver/85"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={sendQuestion} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the AI about your website..."
              className="flex-1 rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-3 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl border border-raw-gold/45 bg-raw-gold/15 px-4 py-3 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/25 disabled:opacity-45 sm:py-2.5"
            >
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </form>

          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

          {lastAnswer ? (
            <div className="mt-5 rounded-2xl border border-raw-border/35 bg-raw-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-raw-gold/75">Did this answer help?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void sendFeedback(true)}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/20"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => void sendFeedback(false)}
                  className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-400/20"
                >
                  No
                </button>
              </div>
              <textarea
                value={correction}
                onChange={(event) => setCorrection(event.target.value)}
                placeholder="Optional: add the correction so AI learns for next time"
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
              />
            </div>
          ) : null}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
