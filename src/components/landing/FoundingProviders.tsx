import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";

export function FoundingProviders() {
  return (
    <section className="relative py-14 px-4 sm:py-20 sm:px-6 md:py-28 bg-gradient-to-b from-transparent to-[rgba(255,255,255,0.01)]">
      <div className="w-full text-center">
        <p className="mb-3 font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/30">
          The Next Layer
        </p>
        <h2 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl">
          Support is the next layer.
        </h2>
        <p className="mt-4 text-base text-raw-silver/50 max-w-lg mx-auto">
          {highlightRawWordmark("As raW learns what people actually need, we open access to better-fit coaches, mentors, therapists, and instructors.")}
        </p>
        <p className="mt-3 text-sm text-raw-silver/35">
          The goal is not random discovery. It is better-fit support.
        </p>

        {/* Provider CTA card */}
        <div className="mt-12 rounded-2xl border border-raw-border/50 bg-raw-surface/50 p-10 transition-all hover:border-raw-gold/15">
          <h3 className="font-display text-base tracking-wide text-raw-text">
            Are you a provider?
          </h3>
          <p className="mt-3 text-sm text-raw-silver/50 max-w-md mx-auto">
            {highlightRawWordmark("Join the founding network and be first in line when raW opens curated matching.")}
          </p>
          <button className="mt-6 rounded-full border border-raw-gold/30 bg-raw-gold/5 px-8 py-3 text-sm font-medium text-raw-gold transition-all hover:bg-raw-gold/10 hover:border-raw-gold/50">
            Apply as a Founding Provider
          </button>
        </div>
      </div>
    </section>
  );
}
