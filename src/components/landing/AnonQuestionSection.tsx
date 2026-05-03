import { FormEvent, useState } from "react";
import { track } from "@/lib/analytics";
import { apiFetch } from "@/lib/http";

export function AnonQuestionSection() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/anon-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (res.ok) {
        track("anon_question_submitted", { source: "landing" });
        setSubmitted(true);
        setQuestion("");
      } else {
        setError("Something went wrong. Try again.");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="landing-section relative px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(241,196,45,0.04),transparent_65%)]" />
      <div className="relative mx-auto max-w-xl text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">Your Voice</p>
        <h2 className="mt-3 font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
          Want to ask your own anonymous question?
        </h2>
        <p className="mt-3 text-sm text-raw-silver/50">
          Submit it here. If it resonates, it goes live for the whole community to answer — no name attached.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] px-6 py-5 text-sm text-emerald-200">
            Question received. We'll review it and put it to the community.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's something you've always wanted to ask but never could?"
              maxLength={300}
              rows={3}
              className="w-full resize-none rounded-2xl border border-raw-border/50 bg-raw-black/50 px-4 py-3.5 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
            />
            {error && (
              <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full rounded-full bg-raw-gold px-8 py-3.5 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {loading ? "Submitting…" : "Submit anonymously"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
