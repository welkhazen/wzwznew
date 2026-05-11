"use client";
/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/
import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  orientation = "horizontal",
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: () => void;
    active?: boolean;
  }[];
  desktopClassName?: string;
  mobileClassName?: string;
  orientation?: "horizontal" | "vertical";
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} orientation={orientation} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};
const FloatingDockMobile = ({
  items,
  className,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: () => void;
    active?: boolean;
  }[];
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex lg:hidden flex-row items-center justify-around border-t border-white/10",
        className
      )}
      style={{
        background: "rgba(10,10,10,0.98)",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingTop: "0.6rem",
      }}
    >
      {items.map((item) => (
        <motion.a
          whileTap={{ scale: 0.88 }}
          href={item.href}
          key={item.title}
          onClick={(event) => {
            if (item.onClick) {
              event.preventDefault();
              item.onClick();
            }
          }}
          className={cn(
            "flex flex-col items-center gap-1 px-3 transition-colors",
            item.active ? "text-raw-gold" : "text-white/60",
          )}
        >
          <div className="h-5 w-5">{item.icon}</div>
          <span className="text-[9px] font-semibold tracking-wide uppercase">{item.title}</span>
        </motion.a>
      ))}
    </div>
  );
};
const FloatingDockDesktop = ({
  items,
  className,
  orientation,
}: {
  items: {
    title: string;
    icon: React.ReactNode;
    href: string;
    onClick?: () => void;
    active?: boolean;
  }[];
  className?: string;
  orientation: "horizontal" | "vertical";
}) => {
  const pointer = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(event) => pointer.set(orientation === "vertical" ? event.pageY : event.pageX)}
      onMouseLeave={() => pointer.set(Infinity)}
      className={cn(
        orientation === "vertical"
          ? "mx-auto hidden w-16 flex-col items-center gap-4 rounded-3xl border border-raw-border/35 bg-raw-surface/60 px-2 py-3 md:flex"
          : "mx-auto hidden h-16 items-end gap-4 rounded-2xl border border-raw-border/35 bg-raw-surface/60 px-4 pb-3 md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer pointer={pointer} axis={orientation} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};
function IconContainer({
  pointer,
  title,
  icon,
  href,
  onClick,
  active = false,
  axis,
}: {
  pointer: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: () => void;
  active?: boolean;
  axis: "horizontal" | "vertical";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(pointer, (value) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, y: 0, width: 0, height: 0 };
    return axis === "vertical"
      ? value - bounds.y - bounds.height / 2
      : value - bounds.x - bounds.width / 2;
  });
  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 74, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 74, 40]);
  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [18, 32, 18]);
  const heightTransformIcon = useTransform(
    distance,
    [-150, 0, 150],
    [18, 32, 18],
  );
  const width = useSpring(widthTransform, {
    mass: 0.12,
    stiffness: 170,
    damping: 14,
  });
  const height = useSpring(heightTransform, {
    mass: 0.12,
    stiffness: 170,
    damping: 14,
  });
  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.12,
    stiffness: 170,
    damping: 14,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.12,
    stiffness: 170,
    damping: 14,
  });
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onClick={(event) => {
        if (onClick) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "relative flex aspect-square items-center justify-center rounded-full border text-raw-silver/70 shadow-[0_8px_18px_rgba(6,10,24,0.2)] transition-colors",
          active
            ? "border-primary/45 bg-primary/15 text-primary shadow-[0_0_18px_rgb(var(--raw-accent)/0.45)]"
            : "border-raw-border/40 bg-raw-black/25 hover:border-raw-border/60 hover:text-raw-text",
        )}
      >
        <AnimatePresence>
          {hovered && (
            axis === "vertical" ? (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="absolute left-full ml-3 w-fit rounded-md border border-raw-border bg-raw-surface px-2 py-0.5 text-xs whitespace-pre text-raw-text"
              >
                {title}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 2, x: "-50%" }}
                className="absolute -top-8 left-1/2 w-fit rounded-md border border-raw-border bg-raw-surface px-2 py-0.5 text-xs whitespace-pre text-raw-text"
              >
                {title}
              </motion.div>
            )
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
