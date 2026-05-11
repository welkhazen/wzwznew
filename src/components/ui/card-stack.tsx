import { useEffect, useState } from "react";
import { motion } from "motion/react";

type Card = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

export const CardStack = ({
  items,
  offset,
  scaleFactor,
  isLight,
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
  isLight?: boolean;
}) => {
  const CARD_OFFSET = offset ?? 10;
  const SCALE_FACTOR = scaleFactor ?? 0.06;
  const [cards, setCards] = useState<Card[]>(items);

  const flip = () => {
    setCards((prev) => {
      const next = [...prev];
      next.unshift(next.pop()!);
      return next;
    });
  };

  useEffect(() => {
    const id = setInterval(flip, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-60 w-60 md:h-60 md:w-96 cursor-pointer" onClick={flip}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className="absolute h-60 w-60 md:h-60 md:w-96 rounded-xl p-5 shadow-lg flex flex-col justify-between select-none"
          style={{
            transformOrigin: "top center",
            background: isLight ? "#ffffff" : "#0e0e0e",
            border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: isLight
              ? "0 4px 24px rgba(0,0,0,0.08)"
              : "0 4px 24px rgba(0,0,0,0.5)",
          }}
          animate={{
            top: index * -CARD_OFFSET,
            scale: 1 - index * SCALE_FACTOR,
            zIndex: cards.length - index,
          }}
        >
          <p className={`text-sm leading-relaxed ${isLight ? "text-stone-700" : "text-white/80"}`}>
            {card.content}
          </p>
          <div>
            <p className={`text-sm font-semibold ${isLight ? "text-stone-800" : "text-white"}`}>{card.name}</p>
            <p className={`text-xs mt-0.5 ${isLight ? "text-stone-400" : "text-white/40"}`}>{card.designation}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
