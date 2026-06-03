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

type TestimonialImage = {
  src: string;
  alt: string;
};

const testimonialImages: TestimonialImage[] = [
  { src: test8, alt: "Community testimonial screenshot" },
  { src: test1, alt: "Community testimonial screenshot" },
  { src: test2, alt: "Community testimonial screenshot" },
  { src: test3, alt: "Community testimonial screenshot" },
  { src: test4, alt: "Community testimonial screenshot" },
  { src: test5, alt: "Community testimonial screenshot" },
  { src: test6, alt: "Community testimonial screenshot" },
  { src: test7, alt: "Community testimonial screenshot" },
  { src: test9, alt: "Community testimonial screenshot" },
  { src: test10, alt: "Community testimonial screenshot" },
  { src: test11, alt: "Community testimonial screenshot" },
  { src: test12, alt: "Community testimonial screenshot" },
  { src: test13, alt: "Community testimonial screenshot" },
  { src: test14, alt: "Community testimonial screenshot" },
  { src: test15, alt: "Community testimonial screenshot" },
  { src: test16, alt: "Community testimonial screenshot" },
  { src: test17, alt: "Community testimonial screenshot" },
];

function splitColumns(items: TestimonialImage[]): [TestimonialImage[], TestimonialImage[]] {
  return items.reduce<[TestimonialImage[], TestimonialImage[]]>(
    (columns, item, index) => {
      columns[index % 2].push(item);
      return columns;
    },
    [[], []],
  );
}

function TestimonialColumn({
  items,
  reverse = false,
}: {
  items: TestimonialImage[];
  reverse?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="testimonial-image-column overflow-hidden">
      <div className={`flex flex-col gap-3 sm:gap-4 ${reverse ? "testimonial-scroll-reverse" : "testimonial-scroll"}`}>
        {[...items, ...items, ...items].map((item, index) => (
          <div
            key={`${item.src}-${index}`}
            className="testimonial-image-card overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.42)]"
          >
            <img
              src={item.src}
              alt={item.alt}
              className="block h-auto w-full"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const [leftColumn, rightColumn] = splitColumns(testimonialImages);

  return (
    <section className="landing-section relative z-0 px-4 py-14 sm:px-6 sm:py-20">
      <style>{`
        @keyframes testimonial-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-33.333%); }
        }

        .testimonial-image-column {
          height: 430px;
          min-width: 0;
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }

        .testimonial-image-card {
          transform: translateZ(0);
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
        }

        .testimonial-image-card:hover {
          transform: scale(1.025);
          border-color: rgba(241, 196, 45, 0.34);
          box-shadow: 0 28px 90px rgba(0,0,0,0.56), 0 0 34px rgba(241,196,45,0.08);
        }

        .testimonial-scroll {
          animation: testimonial-scroll 42s linear infinite;
        }

        .testimonial-scroll-reverse {
          animation: testimonial-scroll 48s linear infinite reverse;
        }

        .testimonial-image-column:hover .testimonial-scroll,
        .testimonial-image-column:hover .testimonial-scroll-reverse {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-raw-border/35 bg-[radial-gradient(circle_at_50%_0%,rgba(241,196,45,0.08),transparent_34%),rgba(16,16,14,0.72)] px-3 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/45 to-transparent" />

        <p className="relative mb-8 text-center font-display text-[10px] uppercase tracking-[0.3em] text-raw-silver/45">
          From the community
        </p>

        <div className="relative mx-auto grid h-[430px] max-w-[650px] grid-cols-2 gap-3 overflow-hidden rounded-[22px] border border-raw-border/45 bg-raw-black/65 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:gap-4 sm:p-4">
          <TestimonialColumn items={leftColumn} />
          <TestimonialColumn items={rightColumn} reverse />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-raw-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-raw-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-raw-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-raw-black/50 to-transparent" />
        </div>
      </div>
    </section>
  );
}
