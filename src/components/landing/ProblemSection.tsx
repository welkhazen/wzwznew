import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
import { SpiralAnimation } from "@/components/ui/spiral-animation";

const truths = [
  {
    label: "Boredom",
    title: "Fucking boredom is real.",
    body: "You open your phone because you want something to happen — but nothing does. raW gives you live anonymous rooms where you can talk, answer, react, and meet people now.",
  },
  {
    label: "Loneliness",
    title: "People everywhere. Still lonely.",
    body: "Followers, contacts, group chats — and still no real connection. raW helps you find people who actually match your thoughts, energy, and interests.",
  },
  {
    label: "Judgment",
    title: "No mask. Say it.",
    body: "Some things are easier to say when your name is not attached. raW lets you be honest without turning your real identity into the price of speaking.",
  },
  {
    label: "Fake social",
    title: "Tired of performing? Same.",
    body: "Most apps push people to look perfect, interesting, or successful. raW is built for what people really think, feel, and want to say.",
  },
  {
    label: "Lost",
    title: "Not sure where you fit?",
    body: "Sometimes you don’t know what you need or where you belong. raW uses questions, conversations, and communities to help you understand yourself better.",
  },
  {
    label: "Discovery",
    title: "Don’t know any interesting people?",
    body: "Your circle should not limit who you get to know. raW helps you discover people through shared interests, honest answers, and conversations worth joining.",
  },
];

export function ProblemSection() {
  const sectionRef = useTrackSectionView("problem");
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      ref={sectionRef}
      className="landing-section relative px-4 py-20 sm:px-6 sm:py-28 md:py-32"
    >
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative mb-8 h-36 w-full overflow-hidden rounded-[1.75rem] border border-raw-border/40 bg-black/80 sm:mb-10 sm:h-44 md:h-52">
            <SpiralAnimation className="opacity-80" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.08)_36%,rgba(10,10,10,0.72)_100%)]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.4em] text-raw-silver/70 sm:text-xs">
                {highlightRawWordmark("The Problems raW Solves")}
              </p>
            </div>
          </div>

          <p className="text-[0.68rem] font-medium uppercase tracking-[0.45em] text-raw-silver/50 sm:text-xs">
            {highlightRawWordmark("Why raW exists")}
          </p>
          <h2 className="mt-5 font-editorial text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Stop performing.
            <span className="block italic text-primary">Start belonging.</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-raw-silver/60 sm:text-base">
            {highlightRawWordmark("Social media turned everyone into a performer. raW is the opposite — anonymous rooms where you say what you actually think, get heard, and find people who get you. No followers, no likes, no act.")}
          </p>
        </motion.div>

        <div className="mt-12 border-t border-raw-border sm:mt-16">
          {truths.map((truth, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={truth.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.06, ease: "easeOut" }}
                className="border-b border-raw-border"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-baseline gap-4 py-5 text-left sm:gap-8 sm:py-6"
                >
                  <span
                    className={`w-7 shrink-0 font-editorial text-sm italic transition-colors sm:w-9 sm:text-base ${
                      isOpen
                        ? "text-primary"
                        : "text-raw-silver/60 group-hover:text-primary/70"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex-1 font-editorial text-xl leading-snug transition-colors sm:text-2xl md:text-[1.7rem] ${
                      isOpen
                        ? "text-foreground"
                        : "text-raw-silver/75 group-hover:text-foreground"
                    }`}
                  >
                    {truth.title}
                  </span>
                  <span className="hidden text-[0.62rem] uppercase tracking-[0.3em] text-raw-silver/55 sm:block">
                    {truth.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-lg leading-none transition-transform duration-300 ${
                      isOpen ? "rotate-45 text-primary" : "text-raw-silver/50"
                    }`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pl-11 pr-4 text-sm leading-relaxed text-raw-silver/60 sm:pl-[4.25rem] sm:text-base">
                        {highlightRawWordmark(truth.body)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
