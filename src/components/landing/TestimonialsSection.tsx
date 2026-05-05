import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const testimonials = [
  {
    quote: "I've never felt this comfortable being honest online. No judgment, just real talk.",
    name: "anon_wolf",
    title: "Late Night Talks",
  },
  {
    quote: "The anonymity actually makes the community stronger. People show up as who they really are.",
    name: "midnight_sage",
    title: "Self-Improvement Circle",
  },
  {
    quote: "Finally a place where I don't have to perform. I just exist and connect.",
    name: "quiet_storm",
    title: "Mental Wellness",
  },
  {
    quote: "I feel more like myself here than on traditional profiles.",
    name: "echo_mind",
    title: "Late Night Talks",
  },
  {
    quote: "The polls are addictive. Seeing how others think without the social pressure is powerful.",
    name: "raw_thinker",
    title: "Self-Improvement Circle",
  },
];

export function TestimonialsSection() {
  return (
    <section className="landing-section relative py-14 px-4 sm:py-20 sm:px-6">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <p className="mb-5 text-center font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40 sm:mb-6">
          From the community
        </p>
        <InfiniteMovingCards
          items={testimonials}
          direction="left"
          speed="slow"
          className="mx-auto"
        />
      </div>
    </section>
  );
}
