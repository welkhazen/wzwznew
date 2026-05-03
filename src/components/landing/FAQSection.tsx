import { FormEvent, useState } from "react";

const FAQ_ITEMS = [
  {
    question: "Is raW really anonymous?",
    answer:
      "Yes. Your identity is represented by your chosen avatar name and username, while personal details stay private.",
  },
  {
    question: "Can I change my avatar later?",
    answer:
      "You can change your avatar at any time from your profile settings.",
  },
  {
    question: "How do comments unlock on polls?",
    answer:
      "Comments unlock after you vote, so every conversation starts with real participation.",
  },
];

export function FAQSection() {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");

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
    <section id="faq" className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
      <div className="mx-auto max-w-6xl rounded-2xl border border-raw-gold/15 bg-[linear-gradient(160deg,rgba(18,18,18,0.96),rgba(8,8,8,0.98))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:rounded-[2rem] sm:p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">FAQ</p>
          <h2 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Frequently Asked Questions</h2>
          <p className="text-sm text-raw-silver/55">Quick answers, plus a place to ask your own question.</p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {FAQ_ITEMS.map((item) => (
            <article key={item.question} className="rounded-2xl border border-raw-border/35 bg-raw-black/35 p-4">
              <h3 className="text-base font-semibold text-raw-text">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-raw-silver/60">{item.answer}</p>
            </article>
          ))}
        </div>

        <div id="faq-ask" className="mt-6 rounded-2xl border border-raw-border/35 bg-raw-black/35 p-4 sm:mt-8 sm:p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-raw-gold/75">Ask a Question</p>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name (optional)"
              className="w-full rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
            />
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Type your question here..."
              rows={4}
              className="w-full resize-none rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
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
