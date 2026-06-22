import { GlareCard } from "@/components/ui/glare-card";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const pillars = ["No real names", "Better honesty", "Better matching"];

const cards = [
  {
    title: "No performance",
    description: "No real-name pressure means more honest answers, cleaner signals, and better conversations.",
  },
  {
    title: "Better matches",
    description: "When people stop curating themselves, raW can guide them toward rooms that actually fit.",
  },
  {
    title: "Safer expression",
    description: "A username and avatar create space to speak freely while keeping your offline identity separate.",
  },
];


export function WhyAnonymity() {
  const sectionRef = useTrackSectionView("why_anonymity");

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28">
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-3 py-5 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <h2 className="text-center landing-heading">
          Why anonymity?
        </h2>
        <p className="mx-auto mt-4 mb-8 max-w-2xl text-center text-sm leading-relaxed text-raw-silver/55 sm:mb-10 sm:text-base">
          Take away the audience and people stop performing. That is the entire idea behind raW.
        </p>

        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {cards.map((card, i) => (
            <GlareCard key={card.title}>
              <div className="h-full rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-2 text-center sm:p-7">
                <h3
                  className={`inline-block font-display text-[11px] leading-tight tracking-wide sm:text-sm ${
                    i === 1
                      ? "text-raw-gold px-2 py-0.5 rounded"
                      : "text-raw-gold animate-heartbeat will-change-transform"
                  }`}
                  style={
                    i === 1
                      ? { background: "rgba(var(--raw-accent), 0.22)", boxShadow: "0 0 0 1px rgba(var(--raw-accent), 0.18)" }
                      : { animationDelay: `${i * 0.18}s` }
                  }
                >
                  {card.title}
                </h3>
                <p className="mt-1.5 text-[10px] leading-snug text-raw-silver/45 sm:mt-3 sm:text-sm sm:leading-relaxed">{card.description}</p>
              </div>
            </GlareCard>
          ))}
        </div>

      </div>
    </section>
  );
}
