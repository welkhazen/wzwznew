import { useEffect, useRef } from "react";

/**
 * Listens to window.visualViewport to detect the iOS virtual keyboard.
 * When the keyboard opens and `targetRef` is the active element (or contains it),
 * scrolls the page so the target stays visible above the keyboard.
 * Also sets --keyboard-offset on <html> for any CSS that needs it.
 */
export function useKeyboardOffset(targetRef?: React.RefObject<HTMLElement | null>): void {
  const lastHeight = useRef<number>(typeof window !== "undefined" ? window.innerHeight : 0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onViewportChange = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - vv.offsetTop - vv.height);
      document.documentElement.style.setProperty("--keyboard-offset", `${keyboardHeight}px`);

      if (keyboardHeight <= 0 || !targetRef?.current) return;

      // Only scroll if the target (or a child) is focused
      if (!targetRef.current.contains(document.activeElement)) return;

      const rect = targetRef.current.getBoundingClientRect();
      // Bottom of visible viewport in page coordinates
      const visibleBottom = vv.offsetTop + vv.height;
      const gap = 16; // breathing room above keyboard
      const overlapBy = rect.bottom + gap - visibleBottom;

      if (overlapBy > 0) {
        window.scrollBy({ top: overlapBy, behavior: "instant" });
      }
    };

    vv.addEventListener("resize", onViewportChange);
    vv.addEventListener("scroll", onViewportChange);
    return () => {
      vv.removeEventListener("resize", onViewportChange);
      vv.removeEventListener("scroll", onViewportChange);
    };
  }, [targetRef]);
}
