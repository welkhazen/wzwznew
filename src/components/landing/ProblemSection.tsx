import { motion } from "framer-motion";
import { RadialOrbitalTimelineDemo } from "@/components/ui/radial-orbital-timeline-demo";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
import { SpiralAnimation } from "@/components/ui/spiral-animation";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

export function ProblemSection() {
  const sectionRef = useTrackSectionView("problem");

  return (
    <section ref={sectionRef} className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28">
      <div className="mx-auto w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center sm:text-left"
        >
          <div className="relative mb-7 h-32 w-full overflow-hidden rounded-[1.5rem] border border-raw-border/40 bg-black/80 sm:mb-10 sm:h-44 sm:rounded-[1.75rem] md:h-52">
            <SpiralAnimation className="opacity-80" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.08)_36%,rgba(10,10,10,0.72)_100%)]" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 text-center">
              <p className="max-w-[18rem] text-[0.56rem] font-medium uppercase leading-relaxed tracking-[0.28em] text-raw-silver/70 sm:max-w-none sm:text-xs sm:tracking-[0.4em]">
                {highlightRawWordmark("The Problems raW Solves")}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 sm:mt-10">
          <RadialOrbitalTimelineDemo />
        </div>
      </div>
    </section>
  );
}
