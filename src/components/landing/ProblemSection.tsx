import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/providers/useTheme";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
import { SpiralAnimation } from "@/components/ui/spiral-animation";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const problemRows = [
  {
    category: "Boredom",
    title: "Fucking boredom is real.",
    body: "You open your phone because you want something to happen, but nothing does. raW gives you live anonymous rooms where you can talk, react, answer, and meet people right now.",
  },
  {
    category: "Loneliness",
    title: "People everywhere. Still lonely.",
    body: "Being surrounded by followers, contacts, and group chats does not always mean feeling known. raW helps you find people who actually match your thoughts, energy, and interests.",
  },
  {
    category: "Judgment",
    title: "No mask. Say it.",
    body: "Some things are easier to say when your real name is not attached. raW gives you a safer place to be honest without turning your identity into the price of speaking.",
  },
  {
    category: "Fake Social",
    title: "Tired of performing? Same.",
    body: "Most social apps reward looking perfect, interesting, or successful. raW is built for what people really think, feel, and want to say when the performance drops.",
  },
  {
    category: "Lost",
    title: "Not sure where you fit?",
    body: "Sometimes you do not know what you need yet. Through questions, conversations, and communities, raW helps you understand yourself and where you naturally belong.",
  },
  {
    category: "Discovery",
    title: "Don't know any interesting people?",
    body: "Your current circle should not decide who you get to meet. raW helps you discover people through shared interests, honest answers, and conversations worth joining.",
  },
];

export function ProblemSection() {
  const sectionRef = useTrackSectionView("problem");
  const { mode } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const getBgColor = () => {
    switch (mode) {
      case "light":
        return "bg-slate-200/80";
      case "dusk":
        return "bg-slate-700/80";
      case "dark":
        return "bg-black/80";
    }
  };

  const getNumberColor = () => {
    switch (mode) {
      case "light":
        return "text-stone-600";
      case "dusk":
        return "text-slate-400";
      case "dark":
        return "text-raw-silver/70";
    }
  };

  const getTitleColor = () => {
    switch (mode) {
      case "light":
        return "text-stone-900";
      case "dusk":
        return "text-slate-100";
      case "dark":
        return "text-raw-text/82";
    }
  };

  const getCategoryColor = () => {
    switch (mode) {
      case "light":
        return "text-stone-500";
      case "dusk":
        return "text-slate-500";
      case "dark":
        return "text-raw-silver/45";
    }
  };

  const getIconColor = (isOpen: boolean) => {
    if (isOpen) return "text-raw-gold";
    switch (mode) {
      case "light":
        return "text-stone-400";
      case "dusk":
        return "text-slate-500";
      case "dark":
        return "text-raw-silver/60";
    }
  };

  return (
    <section
      ref={sectionRef}
      className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center sm:text-left"
        >
          <div className={`relative mb-7 h-32 w-full overflow-hidden rounded-[1.5rem] border border-raw-border/40 sm:mb-10 sm:h-44 sm:rounded-[1.75rem] md:h-52 ${getBgColor()}`}>
            <SpiralAnimation className="opacity-80" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.08)_36%,rgba(10,10,10,0.72)_100%)]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 text-center">
              <p className="max-w-[18rem] text-[0.56rem] font-medium uppercase leading-relaxed tracking-[0.28em] text-raw-silver/70 sm:max-w-none sm:text-xs sm:tracking-[0.4em]">
                {highlightRawWordmark("The Problems raW Solves")}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
          className="mt-8 border-y border-raw-border/55 sm:mt-10"
        >
          {problemRows.map((item, index) => {
            const isOpen = openIndex === index;
            const itemId = `problem-truth-${index + 1}`;

            return (
              <div key={item.title} className="border-t border-raw-border/45 first:border-t-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={itemId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="group w-full py-5 text-left transition-colors duration-300 hover:bg-raw-gold/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/60 sm:py-7"
                >
                  <span className="grid grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-center gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_9rem_2rem] sm:gap-6">
                    <span className={`font-editorial text-sm italic leading-none sm:text-base ${getNumberColor()}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`font-editorial text-2xl font-semibold italic leading-tight transition-colors duration-300 group-hover:text-raw-text sm:text-3xl ${getTitleColor()}`}>
                      {item.title}
                    </span>
                    <span className={`hidden justify-self-end font-display text-[0.56rem] uppercase tracking-[0.42em] transition-colors duration-300 group-hover:text-raw-gold/75 sm:block ${getCategoryColor()}`}>
                      {item.category}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`justify-self-end font-display text-xl leading-none transition duration-300 group-hover:text-raw-gold ${
                        isOpen ? "rotate-45 text-raw-gold" : getIconColor(isOpen)
                      }`}
                    >
                      +
                    </span>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={itemId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 pl-[3.25rem] pr-4 sm:pl-[5.75rem] sm:pr-48">
                        <p className="max-w-2xl text-sm leading-relaxed text-raw-silver/68 sm:text-base">
                          {highlightRawWordmark(item.body)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
