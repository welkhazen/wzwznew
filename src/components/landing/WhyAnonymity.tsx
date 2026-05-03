import { GlareCard } from "@/components/ui/glare-card";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

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
      <div className="w-full">
        <h2 className="mb-8 text-center font-display text-xl tracking-wide text-raw-text sm:mb-12 sm:text-2xl md:text-3xl">
          No real names. Better honesty. Better matching.
        </h2>

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
