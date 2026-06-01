import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Marquee } from "@/components/ui/3d-testimonails";
import { motion } from "framer-motion";
import { useRef } from "react";

type Testimonial = {
  name: string;
  username: string;
  body: string;
  img: string;
  country: string;
};

// Tiny thumb params — Unsplash without params returns multi-MB hero images.
const THUMB = "?w=88&h=88&fit=crop&crop=faces&q=70&auto=format";
const testimonials: Testimonial[] = [
  { name: "Ava Green", username: "@ava", body: "Cascade AI made my workflow 10x faster!", img: `https://images.unsplash.com/photo-1494790108377-be9c29b29330${THUMB}`, country: "🇦🇺 Australia" },
  { name: "Ana Miller", username: "@ana", body: "Vertical marquee is a game changer!", img: `https://images.unsplash.com/photo-1438761681033-6461ffad8d80${THUMB}`, country: "🇩🇪 Germany" },
  { name: "Mateo Rossi", username: "@mat", body: "Animations are buttery smooth!", img: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e${THUMB}`, country: "🇮🇹 Italy" },
  { name: "Maya Patel", username: "@maya", body: "Setup was a breeze!", img: `https://images.unsplash.com/photo-1544005313-94ddf0286df2${THUMB}`, country: "🇮🇳 India" },
  { name: "Noah Smith", username: "@noah", body: "Best marquee component!", img: `https://images.unsplash.com/photo-1506794778202-cad84cf45f1d${THUMB}`, country: "🇺🇸 USA" },
  { name: "Lucas Stone", username: "@luc", body: "Very customizable and smooth.", img: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d${THUMB}`, country: "🇫🇷 France" },
  { name: "Haruto Sato", username: "@haru", body: "Impressive performance on mobile!", img: `https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f${THUMB}`, country: "🇯🇵 Japan" },
  { name: "Emma Lee", username: "@emma", body: "Love the pause on hover feature!", img: `https://images.unsplash.com/photo-1487412720507-e7ab37603c6f${THUMB}`, country: "🇨🇦 Canada" },
  { name: "Carlos Ray", username: "@carl", body: "Great for testimonials and logos.", img: `https://images.unsplash.com/photo-1504257432389-52343af06ae3${THUMB}`, country: "🇪🇸 Spain" },
];

function TestimonialCard({ img, name, username, body, country }: Testimonial) {
  return (
    <Card className="w-52">
      <CardContent>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <figcaption className="flex items-center gap-1 text-sm font-medium text-foreground">
              {name} <span className="text-xs">{country}</span>
            </figcaption>
            <p className="text-xs font-medium text-muted-foreground">{username}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-secondary-foreground">{body}</blockquote>
      </CardContent>
    </Card>
  );
}

export function TestimonialsSection() {
  const dragConstraintsRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="landing-section relative z-0 px-4 py-14 sm:px-6 sm:py-20">
      <div className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14">
        <p className="mb-10 text-center font-display text-[10px] uppercase tracking-[0.3em] text-raw-silver/40 sm:mb-12">
          From the community
        </p>

        <div
          ref={dragConstraintsRef}
          className="relative mx-auto h-[350px] w-[600px] max-w-full overflow-hidden rounded-[1.25rem] border border-raw-border/45 bg-raw-black/45"
        >
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.06}
            dragConstraints={dragConstraintsRef}
            className="absolute inset-0 flex cursor-grab items-center justify-center gap-4 p-4 touch-none active:cursor-grabbing"
          >
            <Marquee vertical pauseOnHover repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`a-${review.username}`} {...review} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:40s]">
              {testimonials.map((review) => (
                <TestimonialCard key={`b-${review.username}`} {...review} />
              ))}
            </Marquee>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
