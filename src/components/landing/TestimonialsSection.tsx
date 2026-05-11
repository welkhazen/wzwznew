import { CardStack } from "@/components/ui/card-stack";
import { useTheme } from "@/providers/useTheme";

const CARDS = [
  {
    id: 0,
    name: "anon_wolf",
    designation: "Late Night Talks",
    content: (
      <p>I've never felt this comfortable being honest online. No judgment, just real talk.</p>
    ),
  },
  {
    id: 1,
    name: "midnight_sage",
    designation: "Self-Improvement Circle",
    content: (
      <p>The anonymity actually makes the community stronger. People show up as who they really are.</p>
    ),
  },
  {
    id: 2,
    name: "quiet_storm",
    designation: "Mental Wellness",
    content: (
      <p>Finally a place where I don't have to perform. I just exist and connect.</p>
    ),
  },
  {
    id: 3,
    name: "echo_mind",
    designation: "Late Night Talks",
    content: (
      <p>I feel more like myself here than on traditional profiles.</p>
    ),
  },
  {
    id: 4,
    name: "raw_thinker",
    designation: "Self-Improvement Circle",
    content: (
      <p>The polls are addictive. Seeing how others think without the social pressure is powerful.</p>
    ),
  },
];

export function TestimonialsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";

  return (
    <section className="landing-section relative py-14 px-4 sm:py-20 sm:px-6">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <p className="mb-10 text-center font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40 sm:mb-12">
          From the community
        </p>

        <div className="flex items-center justify-center">
          <CardStack items={CARDS} isLight={isLight} />
        </div>
      </div>
    </section>
  );
}
