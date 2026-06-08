import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/providers/useTheme";
import { useIsMobile } from "@/hooks/use-mobile";
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

const positions: TestimonialCardPosition[] = ["front", "middle", "back", "far"];

export function TestimonialsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showStack, setShowStack] = useState(false);

  const visibleTestimonials = [
    testimonials[activeIndex],
    testimonials[(activeIndex + 1) % testimonials.length],
    testimonials[(activeIndex + 2) % testimonials.length],
    testimonials[(activeIndex + 3) % testimonials.length],
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
      <div className={`relative mx-auto w-full max-w-5xl overflow-hidden rounded-[30px] border px-4 py-9 sm:px-10 sm:py-12 ${
        isLight
          ? "border-slate-300/70 bg-[radial-gradient(circle_at_50%_0%,rgba(241,196,45,0.12),transparent_34%),rgba(255,255,255,0.82)] shadow-[0_32px_90px_rgba(15,23,42,0.12)]"
          : "border-raw-border/35 bg-[radial-gradient(circle_at_50%_0%,rgba(241,196,45,0.1),transparent_34%),rgba(15,15,13,0.78)] shadow-[0_32px_130px_rgba(0,0,0,0.34)]"
      }`}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/50 to-transparent" />

        <p className="relative text-center font-display text-[10px] uppercase tracking-[0.32em] text-raw-gold/70">
          From the community
        </p>
        <h2 className={`relative mx-auto mt-3 max-w-3xl text-center font-display text-3xl font-black uppercase tracking-[0.04em] sm:text-4xl md:text-5xl ${
          isLight ? "text-slate-950" : "text-raw-text"
        }`}>
          What the People Think
        </h2>
        <div className="relative mx-auto mt-4 h-px w-28 bg-gradient-to-r from-transparent via-raw-gold/80 to-transparent sm:w-40" />

        <div className="relative mt-4 flex items-center justify-center gap-3">
          {showStack ? (
            <button
              type="button"
              onClick={() => setShowStack(false)}
              className="rounded-full border border-raw-gold/30 bg-raw-gold/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] text-raw-gold transition hover:bg-raw-gold/20"
            >
              Back to all testimonials
            </button>
          ) : null}
        </div>

        {!showStack ? (
          <div className={`relative mt-8 max-h-[680px] overflow-y-auto rounded-[24px] border p-4 [scrollbar-color:rgba(129,140,248,0.75)_transparent] ${
            isLight ? "border-slate-300/70 bg-slate-100/75" : "border-raw-border/45 bg-raw-black/65"
          }`}>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.button
                key={testimonial.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setShowStack(true);
                }}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.42, delay: (index % 6) * 0.045, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, scale: 1.015 }}
                className={`relative flex h-[170px] min-w-0 items-center justify-center overflow-hidden rounded-[18px] border p-2 outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/60 sm:h-[270px] ${
                  isLight
                    ? "border-slate-300/80 bg-white shadow-[0_16px_35px_rgba(15,23,42,0.12)]"
                    : "border-white/10 bg-black/80 shadow-[0_16px_45px_rgba(0,0,0,0.35)]"
                }`}
                aria-label={`Open testimonial ${index + 1} in stack`}
              >
                <img
                  src={testimonial.src}
                  alt={testimonial.alt}
                  loading="lazy"
                  className="max-h-full max-w-full rounded-[13px] object-contain"
                />
              </motion.button>
            ))}
            </div>
          </div>
        ) : (
        <div className={`relative mx-auto mt-8 h-[380px] w-full max-w-[760px] overflow-hidden rounded-[24px] border sm:h-[500px] ${
          isLight
            ? "border-slate-300/80 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),transparent_42%),rgba(241,245,249,0.92)] shadow-[inset_0_1px_0_white,0_30px_70px_rgba(15,23,42,0.14)]"
            : "border-raw-border/45 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.07),transparent_36%),rgba(8,8,8,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_30px_90px_rgba(0,0,0,0.36)]"
        }`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(241,196,45,0.08),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:10px_10px]" />
          <div className="absolute left-1/2 top-6 h-[300px] w-[200px] -translate-x-1/2 sm:top-8 sm:h-[420px] sm:w-[320px] sm:-translate-x-[62%]">
            {visibleTestimonials.map((testimonial, index) => (
              <TestimonialCard
                key={`${testimonial.id}-${activeIndex}`}
                {...testimonial}
                position={positions[index]}
                handleShuffle={handleShuffle}
                isLight={isLight}
                compact={isMobile}
              />
            ))}
          </div>

          {!isLight ? <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-raw-black/80 to-transparent" /> : null}
          {!isLight ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-raw-black/85 to-transparent" /> : null}
          <button
            type="button"
            onClick={() => handleShuffle("previous")}
            className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border p-3 transition hover:border-raw-gold/35 hover:text-raw-gold sm:left-5 ${
              isLight ? "border-slate-300 bg-white/90 text-slate-600 shadow-md" : "border-white/10 bg-black/65 text-raw-silver/60"
            }`}
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleShuffle("next")}
            className={`absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border p-3 transition hover:border-raw-gold/35 hover:text-raw-gold sm:right-5 ${
              isLight ? "border-slate-300 bg-white/90 text-slate-600 shadow-md" : "border-white/10 bg-black/65 text-raw-silver/60"
            }`}
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        )}
      </div>
    </section>
  );
}
