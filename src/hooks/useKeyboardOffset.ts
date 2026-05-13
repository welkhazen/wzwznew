import { useEffect, useRef, useState } from "react";

/**
 * Detects iOS virtual keyboard height via window.visualViewport and returns
 * the number of pixels the keyboard is covering (0 when keyboard is closed).
 * Sets --keyboard-offset CSS variable on the root element as a side-effect.
 */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);
  const lastOffset = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // On iOS Safari, visualViewport.height shrinks by keyboard height.
      const keyboardHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (keyboardHeight === lastOffset.current) return;
      lastOffset.current = keyboardHeight;
      setOffset(keyboardHeight);
      document.documentElement.style.setProperty("--keyboard-offset", `${keyboardHeight}px`);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return offset;
}
