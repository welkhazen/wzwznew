import { memo } from 'react';
import { useTheme } from '@/providers/useTheme';

const PerforatedBackground = memo(() => {
  const { mode } = useTheme();
  const isLight = mode === 'light';

  return (
    <>
      <style>{`
        @keyframes dotDrift {
          0%, 100% {
            background-position:
              0% 0%,
              0px 0px,
              0px 0px,
              0% 0%;
          }
          25% {
            background-position:
              0% 0%,
              2px 1px,
              -1px 2px,
              0% 0%;
          }
          50% {
            background-position:
              0% 0%,
              0px 2px,
              2px 0px,
              0% 0%;
          }
          75% {
            background-position:
              0% 0%,
              -1px 1px,
              1px -1px,
              0% 0%;
          }
        }

        @keyframes dotPulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
      <div
        className="fixed inset-0 pointer-events-none z-[0]"
        style={{
          background: isLight ? `
            /* Center light vignette - subtle warmth */
            radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, hsl(40 15% 90% / 0.5) 90%),
            /* Perforated dot pattern - small, ~15% darker for stronger visibility */
            radial-gradient(circle at center, hsl(40 10% 70%) 1px, transparent 1px),
            /* Perforated dot pattern - larger, ~15% darker for stronger visibility */
            radial-gradient(circle at center, hsl(40 8% 75%) 2.5px, transparent 2.5px),
            /* Base creamy white gradient */
            linear-gradient(145deg, hsl(40 20% 96%) 0%, hsl(40 15% 94%) 50%, hsl(40 18% 95%) 100%)
          ` : `
            /* Center dark vignette - softer */
            radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, hsl(220 10% 6% / 0.4) 90%),
            /* Perforated dot pattern - small, more visible */
            radial-gradient(circle at center, hsl(220 8% 22%) 1px, transparent 1px),
            /* Perforated dot pattern - larger */
            radial-gradient(circle at center, hsl(220 8% 14%) 2.5px, transparent 2.5px),
            /* Base gunmetal gradient - lighter for better texture visibility */
            linear-gradient(145deg, hsl(220 10% 10%) 0%, hsl(220 10% 7%) 50%, hsl(220 10% 9%) 100%)
          `,
          backgroundSize: '100% 100%, 8px 8px, 12px 12px, 100% 100%',
          backgroundAttachment: 'fixed',
          animation: 'dotDrift 20s ease-in-out infinite, dotPulse 8s ease-in-out infinite',
        }}
      />
    </>
  );
});

PerforatedBackground.displayName = 'PerforatedBackground';

export default PerforatedBackground;
