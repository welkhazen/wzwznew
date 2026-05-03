import { RadialOrbitalTimelineDemo } from "@/components/ui/radial-orbital-timeline-demo";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

export function ProblemSection() {
  const sectionRef = useTrackSectionView("problem");

  return (
    <section ref={sectionRef} className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2
          className="text-center font-display text-3xl tracking-[0.04em] text-[#F1C42D] sm:text-4xl md:text-5xl"
          style={{
            textShadow: "0 0 10px rgba(241,196,45,0.35), 0 0 22px rgba(241,196,45,0.18)",
          }}
        >
          THE PROBLEM
        </h2>
        <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-[#F1C42D]/90 to-transparent sm:w-56" aria-hidden />
        <h3 className="mt-3 text-center font-display text-lg tracking-wide text-raw-text/80 sm:text-xl md:text-2xl">
          Why existing social apps still leave people disconnected
        </h3>

        <div className="mt-10 sm:mt-14">
          <RadialOrbitalTimelineDemo />
        </div>
      </div>
    </section>
  );
}
