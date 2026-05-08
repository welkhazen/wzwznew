import { GlareCard } from "@/components/ui/glare-card";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const pillars = ["No real names", "Better honesty", "Better matching"];

const cards = [
  {
    title: "Less pressure",
    description: "People answer more honestly when they are not performing.",
  },
  {
    title: "Better communities",
    description: "Real connection starts when people stop managing appearances.",
  },
  {
    title: "Stronger signals",
    description: "Honest participation creates better recommendations over time.",
  },
];


export function WhyAnonymity() {
  const sectionRef = useTrackSectionView("why_anonymity");

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28">
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <div className="mb-6 grid gap-2 text-center sm:mb-8 md:grid-cols-3 md:gap-4">
          {pillars.map((pillar) => (
            <p key={pillar} className="font-display text-2xl tracking-wide text-raw-gold sm:text-3xl">
              {pillar}
            </p>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {cards.map((card, i) => (
            <GlareCard key={card.title}>
              <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-5 text-center sm:p-7">
                <h3
                  className="inline-block font-display text-sm tracking-wide text-raw-gold animate-heartbeat will-change-transform"
                  style={{ animationDelay: `${i * 0.18}s` }}
                >
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-raw-silver/45">{card.description}</p>
              </div>
            </GlareCard>
          ))}
        </div>

      </div>
    </section>
  );
}
