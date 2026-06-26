import * as React from "react";
import { motion } from "framer-motion";

export type TestimonialCardPosition = "front" | "middle" | "back" | "far";

export type TestimonialCardItem = {
  id: number;
  src: string;
  alt: string;
};

interface TestimonialCardProps extends TestimonialCardItem {
  handleShuffle: (direction: "next" | "previous") => void;
  position: TestimonialCardPosition;
  isLight?: boolean;
  compact?: boolean;
}

export function TestimonialCard({
  handleShuffle,
  src,
  alt,
  position,
  isLight = false,
  compact = false,
}: TestimonialCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  const xOffset = compact
    ? (position === "front" ? "-12%" : position === "middle" ? "8%" : position === "back" ? "22%" : "32%")
    : (position === "front" ? "-28%" : position === "middle" ? "18%" : position === "back" ? "58%" : "92%");

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? 4 : position === "middle" ? 3 : position === "back" ? 2 : 1,
      }}
      animate={{
        rotate: position === "front" ? -6 : position === "middle" ? 1 : position === "back" ? 7 : 12,
        x: xOffset,
        y: position === "front" ? "2%" : position === "middle" ? "0%" : position === "back" ? "5%" : "11%",
        scale: position === "front" ? 1 : position === "middle" ? 0.94 : position === "back" ? 0.88 : 0.82,
        opacity: position === "front" ? 1 : position === "middle" ? 0.72 : position === "back" ? 0.5 : 0.28,
        filter: position === "front" ? "brightness(1)" : position === "middle" ? "brightness(0.78)" : position === "back" ? "brightness(0.62)" : "brightness(0.46)",
      }}
      initial={{ opacity: 0, scale: 0.84, x: "68%", rotate: 10 }}
      whileHover={isFront ? { scale: 1.015, rotate: -4 } : undefined}
      drag={isFront ? "x" : false}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(event) => {
        dragRef.current = "clientX" in event ? event.clientX : (event.touches[0]?.clientX ?? 0);
      }}
      onDragEnd={(event) => {
        const eventClientX = "clientX" in event ? event.clientX : (event.changedTouches[0]?.clientX ?? 0);
        const dragDistance = dragRef.current - eventClientX;
        if (dragDistance > 120) {
          handleShuffle("next");
        } else if (dragDistance < -120) {
          handleShuffle("previous");
        }
        dragRef.current = 0;
      }}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.9 }}
      className={`absolute left-0 top-0 flex h-[300px] w-[200px] select-none items-center justify-center overflow-hidden rounded-[24px] border p-2 backdrop-blur-md sm:h-[420px] sm:w-[320px] ${
        isLight
          ? "border-slate-300/70 bg-white/85 shadow-[0_28px_70px_rgba(15,23,42,0.18)]"
          : "border-white/10 bg-black/80 shadow-[0_28px_90px_rgba(0,0,0,0.48)]"
      } ${
        isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="pointer-events-none max-h-full w-full rounded-[18px] object-contain"
      />
    </motion.div>
  );
}
