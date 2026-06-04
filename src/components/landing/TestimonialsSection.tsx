import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers3 } from "lucide-react";
import { motion } from "framer-motion";
import { TestimonialCard, type TestimonialCardPosition, type TestimonialCardItem } from "@/components/ui/testimonial-cards";
import test1 from "@/assets/test1.png";
import test2 from "@/assets/test2.png";
import test3 from "@/assets/test3.png";
import test4 from "@/assets/test4.png";
import test5 from "@/assets/test5.png";
import test6 from "@/assets/test6.png";
import test7 from "@/assets/test7.png";
import test8 from "@/assets/test8.png";
import test9 from "@/assets/test9.png";
import test10 from "@/assets/test10.png";
import test11 from "@/assets/test11.png";
import test12 from "@/assets/test12.png";
import test13 from "@/assets/test13.png";
import test14 from "@/assets/test14.png";
import test15 from "@/assets/test15.png";
import test16 from "@/assets/test16.png";
import test17 from "@/assets/test17.png";

const testimonials: TestimonialCardItem[] = [
  { id: 8, src: test8, alt: "raW community testimonial screenshot" },
  { id: 1, src: test1, alt: "raW community testimonial screenshot" },
  { id: 2, src: test2, alt: "raW community testimonial screenshot" },
  { id: 3, src: test3, alt: "raW community testimonial screenshot" },
  { id: 4, src: test4, alt: "raW community testimonial screenshot" },
  { id: 5, src: test5, alt: "raW community testimonial screenshot" },
  { id: 6, src: test6, alt: "raW community testimonial screenshot" },
  { id: 7, src: test7, alt: "raW community testimonial screenshot" },
  { id: 9, src: test9, alt: "raW community testimonial screenshot" },
  { id: 10, src: test10, alt: "raW community testimonial screenshot" },
  { id: 11, src: test11, alt: "raW community testimonial screenshot" },
  { id: 12, src: test12, alt: "raW community testimonial screenshot" },
  { id: 13, src: test13, alt: "raW community testimonial screenshot" },
  { id: 14, src: test14, alt: "raW community testimonial screenshot" },
  { id: 15, src: test15, alt: "raW community testimonial screenshot" },
  { id: 16, src: test16, alt: "raW community testimonial screenshot" },
  { id: 17, src: test17, alt: "raW community testimonial screenshot" },
];

const positions: TestimonialCardPosition[] = ["front", "middle", "back"];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const visibleTestimonials = [
    testimonials[activeIndex],
    testimonials[(activeIndex + 1) % testimonials.length],
    testimonials[(activeIndex + 2) % testimonials.length],
  ];

  const handleShuffle = (direction: "next" | "previous") => {
    setActiveIndex((current) => (
      direction === "next"
        ? (current + 1) % testimonials.length
        : (current - 1 + testimonials.length) % testimonials.length
    ));
  };

  return (
    <section className="landing-section relative z-0 px-4 py-14 sm:px-6 sm:py-20">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[30px] border border-raw-border/35 bg-[radial-gradient(circle_at_50%_0%,rgba(241,196,45,0.1),transparent_34%),rgba(15,15,13,0.78)] px-4 py-9 shadow-[0_32px_130px_rgba(0,0,0,0.34)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/50 to-transparent" />

        <p className="relative text-center font-display text-[10px] uppercase tracking-[0.3em] text-raw-silver/45">
          From the community
        </p>

        <div className="relative mt-4 flex items-center justify-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/35">
            {testimonials.length} real messages
          </span>
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="rounded-full border border-raw-gold/30 bg-raw-gold/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] text-raw-gold transition hover:bg-raw-gold/20"
          >
            {showAll ? "Back to stack" : "View all testimonials"}
          </button>
        </div>

        {showAll ? (
          <div className="relative mt-8 max-h-[680px] overflow-y-auto rounded-[24px] border border-raw-border/45 bg-raw-black/65 p-4 [scrollbar-color:rgba(129,140,248,0.75)_transparent]">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.42, delay: (index % 6) * 0.045, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.015 }}
                className="relative flex h-[250px] min-w-0 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black/80 p-2 shadow-[0_16px_45px_rgba(0,0,0,0.35)] sm:h-[270px]"
              >
                <img
                  src={testimonial.src}
                  alt={testimonial.alt}
                  loading="lazy"
                  className="max-h-full max-w-full rounded-[13px] object-contain"
                />
              </motion.div>
            ))}
            </div>
          </div>
        ) : (
        <div className="relative mx-auto mt-8 h-[470px] w-full max-w-[680px] overflow-hidden rounded-[24px] border border-raw-border/45 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_36%),rgba(8,8,8,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_30px_90px_rgba(0,0,0,0.36)] sm:h-[540px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(241,196,45,0.08),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:10px_10px]" />
          <div className="absolute left-1/2 top-8 h-[430px] w-[310px] -translate-x-[66%] sm:top-5 sm:h-[500px] sm:w-[380px] sm:-translate-x-[72%]">
            {visibleTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial.id}-${activeIndex}`}
                {...testimonial}
                position={positions[index]}
                handleShuffle={handleShuffle}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-raw-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-raw-black/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleShuffle("previous")}
              className="rounded-full border border-white/10 bg-black/65 p-2 text-raw-silver/60 transition hover:border-raw-gold/35 hover:text-raw-gold"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-3 py-2 text-[10px] tracking-[0.16em] text-raw-silver/50">
              <Layers3 className="h-3.5 w-3.5 text-raw-gold/65" />
              {activeIndex + 1} / {testimonials.length}
            </span>
            <button
              type="button"
              onClick={() => handleShuffle("next")}
              className="rounded-full border border-white/10 bg-black/65 p-2 text-raw-silver/60 transition hover:border-raw-gold/35 hover:text-raw-gold"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
