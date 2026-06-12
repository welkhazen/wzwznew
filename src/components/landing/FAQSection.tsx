import { FormEvent, useState } from "react";
import { useTheme } from "@/providers/useTheme";

const FAQ_ITEMS = [
  {
    question: "What is raW?",
    answer:
      "raW is an anonymous social app for live polls, avatar-based identities, and online communities where people can speak honestly without using a real name or personal photo.",
  },
  {
    question: "How does raW help me find my people?",
    answer:
      "You answer anonymous polls, compare your views, and explore interest-based communities. Over time, your answers help reveal which group chats match your personality, interests, and experiences.",
  },
  {
    question: "Do I need to show my real identity?",
    answer:
      "No. You can join with a username, choose an avatar, and participate without displaying your real name, personal photo, or offline social profile.",
  },
  {
    question: "Is raW free?",
    answer:
      "Yes. Joining raW, answering polls, and chatting in communities is free. Optional extras like premium avatars and additional unlocks use tokens.",
  },
  {
    question: "Is raW moderated and safe?",
    answer:
      "Yes. Anonymity is not a free pass — communities have content rules and automated filtering, backed by human review. You can report messages, block users, and appeal moderation decisions.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your answers and activity stay tied to your anonymous username, never your real-world identity. We collect only what's needed to run raW — see our Privacy page for the full details.",
  },
];

export function FAQSection() {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const { mode } = useTheme();
  const isLight = mode === "light";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const subject = encodeURIComponent("raW FAQ question");
    const body = encodeURIComponent(`Name: ${name.trim() || "Anonymous"}\n\nQuestion:\n${trimmedQuestion}`);
    window.location.href = `mailto:support@theartofraw.me?subject=${subject}&body=${body}`;
  };

  return (
    <section id="faq" className="landing-section px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <div
        className="mx-auto max-w-6xl rounded-2xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:rounded-[2rem] sm:p-6 md:p-8"
        style={{
          background: isLight
            ? "linear-gradient(160deg, #faf6e8, #f0ead4)"
            : "linear-gradient(160deg,rgba(18,18,18,0.96),rgba(8,8,8,0.98))",
          borderColor: isLight ? "rgba(180,140,0,0.2)" : "rgba(var(--raw-gold-rgb,180,140,0)/0.15)",
        }}
      >
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">FAQ</p>
          <h2 className={`font-display text-2xl tracking-wide sm:text-3xl md:text-4xl ${isLight ? "text-[#1a1400]" : "text-raw-text"}`}>
            Questions before you enter raW?
          </h2>
          <p className={`text-sm ${isLight ? "text-stone-500" : "text-raw-silver/55"}`}>
            Start here if you are wondering how anonymous polls, avatars, and community chats work.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border p-4"
              style={{
                background: isLight ? "rgba(255,248,220,0.7)" : "rgba(0,0,0,0.35)",
                borderColor: isLight ? "rgba(180,140,0,0.18)" : "rgba(var(--raw-border-rgb,120,120,120)/0.35)",
              }}
            >
              <h3 className={`text-base font-semibold ${isLight ? "text-[#1a1400]" : "text-raw-text"}`}>{item.question}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${isLight ? "text-stone-600" : "text-raw-silver/60"}`}>{item.answer}</p>
            </article>
          ))}
        </div>

        <div
          id="faq-ask"
          className="mt-6 rounded-2xl border p-4 sm:mt-8 sm:p-5"
          style={{
            background: isLight ? "rgba(255,248,220,0.7)" : "rgba(0,0,0,0.35)",
            borderColor: isLight ? "rgba(180,140,0,0.18)" : "rgba(var(--raw-border-rgb,120,120,120)/0.35)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-raw-gold/75">Ask your own question</p>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Username (optional)"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${
                isLight
                  ? "border-amber-200 bg-white/80 text-[#1a1400] placeholder:text-stone-400 focus:border-amber-400"
                  : "border-raw-border/40 bg-raw-black/30 text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45"
              }`}
            />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question here..."
              rows={4}
              className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${
                isLight
                  ? "border-amber-200 bg-white/80 text-[#1a1400] placeholder:text-stone-400 focus:border-amber-400"
                  : "border-raw-border/40 bg-raw-black/30 text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45"
              }`}
            />
            <button
              type="submit"
              className="w-full rounded-xl border border-raw-gold/45 bg-raw-gold/15 px-4 py-2.5 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/25 sm:w-auto"
            >
              Submit Question
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
