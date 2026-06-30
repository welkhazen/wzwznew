"use client";

import { Suspense, lazy, useRef } from "react";
import { BrandName } from "@/components/ui/brand-name";
import { motion, useScroll, useTransform } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { track } from "@/lib/analytics";

import { useTheme } from "@/providers/useTheme";

// Lazy-load the Three.js scene so the ~500KB three+fiber+drei bundle
// doesn't block initial paint on mobile.
const LazyGlobeScene = lazy(() =>
  import("./GlobeHeroScene").then((m) => ({ default: m.GlobeHeroScene })),
);

interface GlobeHeroProps {
  onSignupClick: () => void;
}

const headlineLines = [
  { text: "Your place.", accent: false },
  { text: "Your people.", accent: false },
  { text: "Your self.", accent: true },
];

export function GlobeHero({ onSignupClick }: GlobeHeroProps) {
  const { mode } = useTheme();
  const globeColor = mode === "light" ? "#0A0A0A" : "#F5F5F5";

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -56]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const handlePrimaryClick = () => {
    track("landing_cta_clicked", {
      cta_id: "globe_hero_join_now",
      cta_text: "Join Now",
      source_section: "globe_hero",
    });
    onSignupClick();
  };

  const handleSecondaryClick = () => {
    track("landing_cta_clicked", {
      cta_id: "globe_hero_learn_more",
      cta_text: "Learn More",
      source_section: "globe_hero",
    });
  };

  return (
    <div
      ref={sectionRef}
      className="relative flex min-h-[620px] items-center justify-center overflow-hidden pb-12 pt-10 sm:min-h-[680px] sm:pt-14"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_28%,rgba(241,196,45,0.08),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.62))] sm:hidden" />
      {/* Globe behind text, centered, melted into the dark */}
      <div className="pointer-events-none absolute inset-0 z-0 hidden items-center justify-center opacity-100 sm:flex">
        <div className="relative h-[340px] w-[340px] md:h-[440px] md:w-[440px] lg:h-[560px] lg:w-[560px]">
          <Suspense fallback={null}>
            <div className="absolute inset-0">
              <LazyGlobeScene globeColor={globeColor} />
            </div>
          </Suspense>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-44 bg-gradient-to-t from-background to-transparent" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-20 text-center sm:px-6 sm:pt-14"
      >
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.15 }}
          className="flex items-center justify-center gap-3 sm:gap-4"
        >
          <span className="hidden h-px w-10 bg-gradient-to-r from-transparent to-primary/45 sm:block sm:w-16" aria-hidden="true" />
          <span
            className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/[0.07] px-3.5 py-1.5 backdrop-blur-sm sm:px-4"
            style={{ boxShadow: "0 0 28px hsl(var(--primary) / 0.22), inset 0 0 14px hsl(var(--primary) / 0.06)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span
              className="text-[0.62rem] font-semibold uppercase tracking-[0.38em] text-primary sm:text-[0.72rem]"
              style={{ textShadow: "0 0 16px hsl(var(--primary) / 0.5)" }}
            >
              Anonymous by design
            </span>
          </span>
          <span className="hidden h-px w-10 bg-gradient-to-l from-transparent to-primary/45 sm:block sm:w-16" aria-hidden="true" />
        </motion.div>

        <h1 className="mt-7 font-editorial text-[3.2rem] leading-[1.02] tracking-tight text-foreground sm:mt-9 sm:text-7xl md:text-[5.4rem] lg:text-[6.2rem]">
          <span className="sr-only">
            raW — anonymous group chats, live polls, and online communities. Your Place. Your People. Your Self.
          </span>
          {headlineLines.map((line, i) => (
            <motion.span
              key={line.text}
              aria-hidden="true"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.3 + i * 0.18, ease: "easeOut" }}
              className={`block ${line.accent ? "italic text-primary" : ""}`}
            >
              {line.text}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 1.05 }}
          className="mx-auto mt-9 max-w-xl space-y-4 sm:mt-11"
        >
          <div className="mx-auto h-px w-16 bg-primary/60" aria-hidden="true" />
          <p className="text-base leading-relaxed text-raw-silver/80 sm:text-lg">
            This is <BrandName /> — rooms where you say what
            you actually think, and meet the people who get it.
          </p>
          <p className="text-sm leading-relaxed text-raw-silver/50">
            A username and a password. No email, no phone, no real name.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-5 sm:mt-12 sm:flex-row sm:gap-9"
        >
          <button
            type="button"
            onClick={handlePrimaryClick}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary px-10 py-3.5 text-base font-semibold tracking-wide text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)] sm:w-auto"
          >
            Join now
          </button>
          <a
            href="#how-it-works"
            onClick={handleSecondaryClick}
            className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium tracking-wide text-raw-silver/70 transition-colors hover:text-foreground"
          >
            <span className="border-b border-raw-silver/30 pb-0.5 transition-colors group-hover:border-primary">
              How it works
            </span>
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-y-0.5"
            >
              ↓
            </span>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
