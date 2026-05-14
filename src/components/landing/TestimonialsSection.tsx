import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonails";
import { Instagram } from "lucide-react";

const metallicTitleClass = "bg-gradient-to-b from-[#f6f7f8] via-[#bec3c9] to-[#6e737a] bg-clip-text text-transparent [text-shadow:0_1px_0_rgba(255,255,255,0.35),0_3px_8px_rgba(0,0,0,0.55)] dark:from-[#f2f4f7] dark:via-[#9ba3af] dark:to-[#4b5563]";

const testimonials = [
  { id: "ava", body: "Cascade AI made my workflow 10x faster!" },
  { id: "ana", body: "Vertical marquee is a game changer!" },
  { id: "mat", body: "Animations are buttery smooth!" },
  { id: "maya", body: "Setup was a breeze!" },
  { id: "noah", body: "Best marquee component!" },
  { id: "luc", body: "Very customizable and smooth." },
  { id: "haru", body: "Impressive performance on mobile!" },
  { id: "emma", body: "Love the pause on hover feature!" },
  { id: "carl", body: "Great for testimonials and logos." },
];

function TestimonialCard({ body }: (typeof testimonials)[number]) {
  return (
    <Card className="w-56 border-border/70 bg-card/95">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
          <Instagram className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span className={metallicTitleClass}>Instagram</span>
        </div>
        <blockquote className="text-sm leading-relaxed text-foreground">“{body}”</blockquote>
      </CardContent>
    </Card>
  );
}

export function TestimonialsSection() {
  return (
    <section className="landing-section relative px-4 py-14 sm:px-6 sm:py-20">
      <div className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14">
        <p className="mb-10 text-center font-display text-[10px] uppercase tracking-[0.3em] sm:mb-12">
          <span className={metallicTitleClass}>From the community</span>
        </p>

        <div className="relative mx-auto flex h-96 w-full max-w-[800px] flex-row items-center justify-center overflow-hidden gap-1.5 rounded-lg border border-border [perspective:300px]">
          <div
            className="flex flex-row items-center gap-4"
            style={{
              transform:
                "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
            }}
          >
            <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`a-${review.id}`} {...review} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`b-${review.id}`} {...review} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`c-${review.id}`} {...review} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`d-${review.id}`} {...review} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background" />
          </div>
        </div>
      </div>
    </section>
  );
}
