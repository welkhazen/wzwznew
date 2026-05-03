const levelBadgesImage = "/assets/war-level-badges.svg";

export function EarnedWarUpgradesSection() {
  return (
    <section className="landing-section relative px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(241,196,45,0.06),transparent_65%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">War Rewards</p>

        <h2
          className="mt-3 font-display text-3xl tracking-wide sm:text-5xl"
          style={{
            background: "linear-gradient(135deg, #F6D454 0%, #F1C42D 40%, #B8941E 65%, #F1C42D 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter:
              "drop-shadow(0 0 18px rgba(241,196,45,0.45)) drop-shadow(0 0 32px rgba(241,196,45,0.2))",
          }}
        >
          Earned War Upgrades
        </h2>

        <p className="mt-5 text-sm leading-relaxed text-raw-silver/60 sm:text-base">
          We give back to those who are being{" "}
          <span className="font-medium text-raw-gold/80">raW</span>. Earn{" "}
          <span className="font-medium text-raw-gold/80">War Points</span> and{" "}
          <span className="font-medium text-raw-gold/80">War-Up</span> by staying active — you
          deserve it and earned it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-raw-silver/40">
          The higher the Level, the higher the deserved privileges. The more the surprises.
        </p>

        <div className="mt-10">
          <img
            src={levelBadgesImage}
            alt="War level badge progression"
            className="mx-auto w-full max-w-5xl object-contain mix-blend-screen opacity-95 drop-shadow-[0_0_30px_rgba(241,196,45,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}
