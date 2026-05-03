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
      <div className="w-full">
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
