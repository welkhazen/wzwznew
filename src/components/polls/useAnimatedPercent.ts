import { useEffect, useState } from "react";

interface UseAnimatedPercentOptions {
  durationMs?: number;
  enabled?: boolean;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function useAnimatedPercent(targetPercent: number, options: UseAnimatedPercentOptions = {}) {
  const { durationMs = 800, enabled = true } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    const safeTarget = Math.max(0, Math.min(100, targetPercent));
    let animationFrame = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const easedProgress = easeOutCubic(progress);
      setValue(Math.round(safeTarget * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    setValue(0);
    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [durationMs, enabled, targetPercent]);

  return value;
}
