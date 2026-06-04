import * as React from "react";
import { motion } from "framer-motion";

export type TestimonialCardPosition = "front" | "middle" | "back";

export type TestimonialCardItem = {
  id: number;
  src: string;
  alt: string;
};

interface TestimonialCardProps extends TestimonialCardItem {
  handleShuffle: (direction: "next" | "previous") => void;
  position: TestimonialCardPosition;
}

export function TestimonialCard({
  handleShuffle,
  src,
  alt,
  position,
}: TestimonialCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  return (
    <motion.div
      style={{
        zIndex: position === "front" ? 3 : position === "middle" ? 2 : 1,
      }}
      animate={{
        rotate: position === "front" ? -6 : position === "middle" ? 1 : 7,
        x: position === "front" ? "0%" : position === "middle" ? "24%" : "46%",
        y: position === "front" ? "0%" : position === "middle" ? "5%" : "10%",
        scale: position === "front" ? 1 : position === "middle" ? 0.94 : 0.88,
        opacity: position === "front" ? 1 : position === "middle" ? 0.68 : 0.38,
        filter: position === "front" ? "brightness(1)" : position === "middle" ? "brightness(0.72)" : "brightness(0.48)",
      }}
      initial={{ opacity: 0, scale: 0.84, x: "68%", rotate: 10 }}
      whileHover={isFront ? { scale: 1.015, rotate: -4 } : undefined}
      drag={isFront ? "x" : false}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(event) => {
        dragRef.current = event.clientX;
      }}
      onDragEnd={(event) => {
        const dragDistance = dragRef.current - event.clientX;
        if (dragDistance > 120) {
          handleShuffle("next");
        } else if (dragDistance < -120) {
          handleShuffle("previous");
        }
        dragRef.current = 0;
      }}
      transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.9 }}
      className={`absolute left-0 top-0 flex h-[430px] w-[310px] select-none items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/80 p-2 shadow-[0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-md sm:h-[500px] sm:w-[380px] ${
        isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
      }`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="pointer-events-none max-h-full w-full rounded-[18px] object-contain"
      />
    </motion.div>
  );
}
