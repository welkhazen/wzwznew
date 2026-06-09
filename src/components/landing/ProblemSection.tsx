import { RadialOrbitalTimelineDemo } from "@/components/ui/radial-orbital-timeline-demo";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

export function ProblemSection() {
  const sectionRef = useTrackSectionView("problem");

  return (
    <section ref={sectionRef} className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28">
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <h2 className="text-center landing-heading">
          Find online communities where you can be honest.
        </h2>
        <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-[#F1C42D]/90 to-transparent sm:w-56" aria-hidden />
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-raw-silver/55 sm:text-base">
          raW helps people who feel lonely, unheard, bored, or tired of performing find anonymous group chats built for meaningful conversation and belonging.
        </p>

        <div className="mt-10 sm:mt-14">
          <RadialOrbitalTimelineDemo />
        </div>
      </div>
    </section>
  );
}
