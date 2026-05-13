import { useEffect, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";

interface LevelUpCelebrationProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpCelebration({ newLevel, onClose }: LevelUpCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setParticles(
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
      }))
    );
    const show = setTimeout(() => setVisible(true), 40);
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
    >
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-particle { animation: confetti-fall linear forwards; }
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .spin-slow { animation: spin-slow 4s linear infinite; }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-particle absolute h-2 w-2 rounded-full"
            style={{
              left: `${p.x}%`,
              top: -10,
              background: p.id % 3 === 0 ? "#facc15" : p.id % 3 === 1 ? "#a855f7" : "#5ed6ff",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative z-10 text-center transition-all duration-500 ${visible ? "scale-100 translate-y-0" : "scale-75 translate-y-6"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <Sparkles className="h-7 w-7 animate-pulse text-raw-gold" style={{ filter: "drop-shadow(0 0 8px #facc15)" }} />
        </div>

        {/* Level badge */}
        <div className="relative mb-5 inline-flex items-center justify-center">
          <div
            className="flex h-28 w-28 flex-col items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #1a1200, #2e1f00)", border: "2px solid #facc15", boxShadow: "0 0 40px rgba(250,204,21,0.4), inset 0 0 20px rgba(250,204,21,0.1)" }}
          >
            <TrendingUp className="mb-1 h-5 w-5 text-raw-gold" />
            <span className="font-display text-4xl font-black leading-none text-raw-gold">{newLevel}</span>
          </div>
          <div
            className="spin-slow pointer-events-none absolute rounded-full border-2 border-dashed border-raw-gold/40"
            style={{ inset: -10 }}
          />
        </div>

        <h2 className="mb-1 font-display text-2xl font-bold tracking-wide text-raw-text">Level Up!</h2>
        <p className="mb-4 text-raw-silver/60">You've reached Level {newLevel}</p>

        <div
          className="inline-block rounded-2xl border border-raw-gold/35 px-6 py-3"
          style={{ background: "rgba(250,204,21,0.07)", boxShadow: "0 0 20px rgba(250,204,21,0.1)" }}
        >
          <p className="font-display text-sm tracking-wider text-raw-gold">
            🏆 Level {newLevel} Unlocked
          </p>
        </div>

        <p className="mt-4 text-xs text-raw-silver/35">Tap anywhere to continue</p>
      </div>
    </div>
  );
}
