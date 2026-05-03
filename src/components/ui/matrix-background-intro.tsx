import { memo, useEffect, useRef } from "react";
import { MATRIX_CHAR_ARRAY, MATRIX_FONT_SIZE } from "@/lib/matrixConstants";

interface MatrixBackgroundIntroProps {
  onComplete?: () => void;
  className?: string;
}

const START_INTERVAL = 16;
const END_INTERVAL = 52;
const SLOWDOWN_MS = 5000;
const FADE_DELAY_MS = 3000;
const FADE_DURATION_MS = 1800;

const MatrixBackgroundIntro = memo(function MatrixBackgroundIntro({
  onComplete,
  className = "",
}: MatrixBackgroundIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const getAccentRgb = (): [number, number, number] => {
      const accentTriplet = getComputedStyle(document.documentElement)
        .getPropertyValue("--raw-accent")
        .trim();
      const parts = accentTriplet.split(/\s+/).map((part) => Number(part));

      if (parts.length === 3 && parts.every((value) => Number.isFinite(value))) {
        return [parts[0], parts[1], parts[2]];
      }

      return [241, 196, 45];
    };

    const toRgba = (rgb: [number, number, number], alpha: number) => {
      const [r, g, b] = rgb;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const darkenRgb = (rgb: [number, number, number], factor: number): [number, number, number] => {
      const [r, g, b] = rgb;
      const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
      return [clamp(r * factor), clamp(g * factor), clamp(b * factor)];
    };

    const getThemePalette = () => {
      const isLightMode = document.documentElement.classList.contains("theme-light");
      const accent = getAccentRgb();

      return isLightMode
        ? {
            trail: "rgba(255, 255, 255, 0.12)",
            glyph: toRgba(darkenRgb(accent, 0.42), 0.72),
          }
        : {
            trail: "rgba(0, 0, 0, 0.05)",
            glyph: toRgba(accent, 0.9),
          };
    };

    let rafId = 0;
    let ended = false;
    let columns = 0;
    let drops: number[] = [];
    const startTime = performance.now();
    let lastDrawTime = 0;

    const createDrops = () => {
      columns = Math.max(1, Math.floor(canvas.width / MATRIX_FONT_SIZE));
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * (canvas.height / MATRIX_FONT_SIZE)));
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.font = `${MATRIX_FONT_SIZE}px monospace`;
      createDrops();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawFrame = () => {
      const palette = getThemePalette();
      context.fillStyle = palette.trail;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = palette.glyph;

      for (let i = 0; i < drops.length; i += 1) {
        const glyph = MATRIX_CHAR_ARRAY[Math.floor(Math.random() * MATRIX_CHAR_ARRAY.length)];
        context.fillText(glyph, i * MATRIX_FONT_SIZE, drops[i] * MATRIX_FONT_SIZE);

        if (drops[i] * MATRIX_FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += 1;
      }
    };

    const tick = (now: number) => {
      if (ended) return;

      const elapsed = now - startTime;
      const slowProgress = Math.min(elapsed / SLOWDOWN_MS, 1);
      const interval = START_INTERVAL + (END_INTERVAL - START_INTERVAL) * (1 - Math.pow(1 - slowProgress, 3));

      if (now - lastDrawTime >= interval) {
        drawFrame();
        lastDrawTime = now;
      }

      let opacity = 0.32;
      if (elapsed > FADE_DELAY_MS) {
        const fadeProgress = Math.min((elapsed - FADE_DELAY_MS) / FADE_DURATION_MS, 1);
        opacity = 0.32 * (1 - fadeProgress * fadeProgress);
      }

      canvas.style.opacity = `${opacity}`;

      if (opacity <= 0.001) {
        ended = true;
        context.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      ended = true;
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className={`matrix-intro-canvas pointer-events-none fixed inset-0 z-[2] ${className}`}
      style={{ opacity: 0 }}
      aria-hidden="true"
    />
  );
});

export default MatrixBackgroundIntro;
