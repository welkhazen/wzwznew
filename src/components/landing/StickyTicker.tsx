import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function StickyTicker() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const y = window.scrollY;

      if (y <= 80) {
        // Near top — always hide
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        setVisible(false);
      } else if (y < lastY) {
        // Scrolling up — show immediately, cancel any pending hide
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        setVisible(true);
      } else if (y > lastY) {
        // Scrolling down — hide after short delay to avoid flicker from momentum
        if (!hideTimer) {
          hideTimer = setTimeout(() => {
            setVisible(false);
            hideTimer = null;
          }, 150);
        }
      }

      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-ticker"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="fixed left-0 right-0 top-16 z-40 flex justify-center pointer-events-none"
        >
          <div className="relative inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 px-4 py-2 backdrop-blur-xl shadow-2xl sm:gap-3 sm:px-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="relative z-10 text-center text-[0.69rem] font-bold uppercase tracking-[0.2em] text-primary sm:text-sm sm:tracking-wider">
              ANONYMOUS  FIRST • IDENTITY  BASED • COMMUNITY  DRIVEN
            </span>
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" style={{ animationDelay: "0.5s" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
