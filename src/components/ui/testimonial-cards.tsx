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
        rotate: position === "front" ? -5 : position === "middle" ? 1 : 7,
        x: position === "front" ? "0%" : position === "middle" ? "28%" : "56%",
        y: position === "front" ? "0%" : position === "middle" ? "3%" : "6%",
        scale: position === "front" ? 1 : position === "middle" ? 0.96 : 0.92,
        opacity: position === "front" ? 1 : position === "middle" ? 0.78 : 0.48,
      }}
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
      transition={{ duration: 0.35, ease: "easeOut" }}
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
