import warLevelBadgesImage from "@/assets/war-level-badges.webp";
import { BrandName } from "@/components/ui/brand-name";

export function EarnedWarUpgradesSection() {
  return (
    <section className="landing-section relative px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(241,196,45,0.06),transparent_65%)]" />
      <div
        className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 text-center sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        {/* top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">Progress Rewards</p>

        <h2 className="mt-3 landing-heading">
          Level up by showing up
        </h2>

        <p className="mt-5 text-sm leading-relaxed text-raw-silver/60 sm:text-base">
          Showing up{" "}
          <span className="font-medium text-raw-gold/80"><BrandName /></span>{" "}
          pays off. Stay active, earn{" "}
          <span className="font-medium text-raw-gold/80">War Points</span>, and{" "}
          <span className="font-medium text-raw-gold/80">War-Up</span> through the ranks.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-raw-silver/60">
          The higher your level, the bigger the privileges — and the better the surprises.
        </p>

        <div className="mt-10 sm:mt-12">
          <img
            src={warLevelBadgesImage}
            alt="raW war level badges — anonymous avatar ranks earned by staying active"
            className="mx-auto w-full max-w-[660px]"
          />
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-raw-silver/45">
          New avatar rewards unlock as you level up
        </p>
      </div>
    </section>
  );
}
