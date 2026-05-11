import { Sparkles, ChartBar, Users } from "lucide-react";

export function PollBenefitsSection() {
  return (
    <section
      id="poll-benefits"
      className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28"
    >
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        {/* top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <div className="mb-8 text-center sm:mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">Poll Intelligence</p>
          <h2 className="mt-3 landing-heading">
            Why ra<span className="raw-word-w">W</span> Polls Matter
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-raw-silver/60 sm:text-base">
            Polls are the first step in turning anonymous answers into real insight. They show what people really think, help the AI understand each voice, and recommend the best community for you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-raw-border/30 bg-raw-surface/30 p-6 text-left sm:p-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-raw-gold/10 text-raw-gold">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-3 font-display text-xl tracking-wide text-raw-text">Discover personal insight</h3>
            <p className="text-sm leading-relaxed text-raw-silver/65">
              Each poll answer reveals a bit of your mindset. Over time, the AI learns your style, values, and the persona you want to show up as.
            </p>
          </div>

          <div className="rounded-[2rem] border border-raw-border/30 bg-raw-surface/30 p-6 text-left sm:p-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-raw-gold/10 text-raw-gold">
              <ChartBar className="h-6 w-6" />
            </div>
            <h3 className="mb-3 font-display text-xl tracking-wide text-raw-text">Understand community signals</h3>
            <p className="text-sm leading-relaxed text-raw-silver/65">
              Poll results are aggregated to surface shared opinions and hidden trends. That helps everyone see what matters most across the community.
            </p>
          </div>

          <div className="rounded-[2rem] border border-raw-border/30 bg-raw-surface/30 p-6 text-left sm:p-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-raw-gold/10 text-raw-gold">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-3 font-display text-xl tracking-wide text-raw-text">Match you with the right community</h3>
            <p className="text-sm leading-relaxed text-raw-silver/65">
              The AI maps your answers to community profiles, then recommends the groups where your thoughts and energy will fit best.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-poll-showcase"))}
            className="inline-flex items-center justify-center rounded-full bg-raw-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-raw-black transition hover:bg-amber-300"
          >
            Explore the polls
          </button>
        </div>
      </div>
    </section>
  );
}

