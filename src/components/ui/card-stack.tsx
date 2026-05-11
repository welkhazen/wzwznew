import { useEffect, useState } from "react";
import { motion } from "motion/react";

let interval: ReturnType<typeof setInterval>;

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
}: {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
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
          className="absolute dark:bg-black bg-white h-60 w-60 md:h-60 md:w-96 rounded-3xl p-4 shadow-xl border border-neutral-200 dark:border-white/[0.1] shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col justify-between select-none"
          style={{ transformOrigin: "top center" }}
          animate={{
            top: index * -CARD_OFFSET,
            scale: 1 - index * SCALE_FACTOR,
            zIndex: cards.length - index,
          }}
        >
          <div className="font-normal text-neutral-700 dark:text-neutral-200">
            {card.content}
          </div>
          <div>
            <p className="text-neutral-500 font-medium dark:text-white">{card.name}</p>
            <p className="text-neutral-400 font-normal dark:text-neutral-200">{card.designation}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
