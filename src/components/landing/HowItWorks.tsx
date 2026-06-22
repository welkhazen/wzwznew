import type React from "react";
import { BrandName } from "@/components/ui/brand-name";
import { Terminal } from "@/components/ui/terminal";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const howItWorksSteps = [
  "01 Sign up anonymously and step into raW",
  "02 Build your identity — choose your avatar and change it if earned",
  "03 Answer honest questions — AI reads your patterns in real time",
  "04 Your character takes shape from every answer you give",
  "05 Find your Place. Find your People. Find your Purpose.",
];

const howItWorksOutputs = {
  0: ["Create a username — no email, no phone, no real-world identity."],
  1: ["Build your identity through the avatar you choose and the upgrades you earn."],
  2: [
    "Every poll you answer feeds the AI with a data point about who you are.",
    "The more honest you are, the better your matches get.",
  ],
  3: [
    "Every answer becomes a signal: what you value, what you avoid, and where you feel understood.",
    "Those signals power personality insights and better community recommendations.",
  ],
  4: [
    "Join spaces shaped around shared experiences, not surface-level profiles.",
    "Talk freely, find your people, and turn honest answers into real connection.",
  ],
} satisfies Record<number, string[]>;

export function HowItWorks() {
  const sectionRef = useTrackSectionView("how_it_works");

  return (
    <section
      id="how-it-works"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28"
    >
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <h2 className="mb-3 text-center landing-heading sm:mb-4">
          How <BrandName /> works
        </h2>
        <p className="mx-auto mb-10 max-w-2xl px-1 text-center text-sm leading-relaxed text-raw-silver/60 sm:mb-14 sm:text-base">
          Build an anonymous identity, answer honest polls, and discover online communities
          shaped around your personality, interests, and lived experiences.
        </p>

        <div className="overflow-x-auto rounded-[2rem] border border-raw-border/40 bg-gradient-to-b from-raw-surface/60 to-raw-black/90 p-3 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6">
          <Terminal
            className="max-w-4xl"
            username="raw-world"
            commands={howItWorksSteps}
            outputs={howItWorksOutputs}
            typingSpeed={22}
            delayBetweenCommands={950}
            initialDelay={200}
            enableSound={false}
            commandClassName="py-1 text-base font-extrabold leading-snug tracking-[-0.02em] sm:text-lg"
          />
        </div>
      </div>
    </section>
  );
}
