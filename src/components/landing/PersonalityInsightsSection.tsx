import type React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { Sparkles, Zap, Crown, X } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";
import { useTheme } from "@/providers/useTheme";

interface Trait {
  label: string;
  value: number;
  description: string;
}

interface InsightDetail {
  name: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  accentText: string;
  accentBorder: string;
  softSurface: string;
  glowFrom: string;
  isFree?: boolean;
  accentColor: string;
  radarColor: string;
  traits: Trait[];
}

const insights: InsightDetail[] = [
  {
    name: "Signal Discipline",
    description: "How consistently your responses align with deliberate, conviction-driven choices. Tracks your consistency signature over time.",
    badge: "Core Pattern",
    icon: Zap,
    accentText: "text-amber-300",
    accentBorder: "border-amber-400/40",
    softSurface: "bg-amber-500/8",
    glowFrom: "from-amber-500/15",
    isFree: true,
    accentColor: "#F59E0B",
    radarColor: "rgba(245,158,11,0.55)",
    traits: [
      { label: "Consistency", value: 82, description: "Repeatable response patterns across sessions" },
      { label: "Conviction", value: 76, description: "Strength of commitment to chosen positions" },
      { label: "Deliberateness", value: 91, description: "Intentional, non-impulsive decision making" },
      { label: "Reflexivity", value: 68, description: "Tendency to revisit and refine past views" },
      { label: "Self-Alignment", value: 79, description: "Internal coherence between stated values and choices" },
    ],
  },
  {
    name: "Growth Friction Index",
    description: "Measures your tendency to choose stretch and discomfort versus immediate comfort. Reveals how you negotiate challenge and expansion.",
    badge: "Example",
    icon: Sparkles,
    accentText: "text-emerald-300",
    accentBorder: "border-emerald-400/40",
    softSurface: "bg-emerald-500/8",
    glowFrom: "from-emerald-500/15",
    accentColor: "#10B981",
    radarColor: "rgba(16,185,129,0.55)",
    traits: [
      { label: "Challenge Seeking", value: 88, description: "Appetite for difficult, stretch-goal scenarios" },
      { label: "Discomfort Tolerance", value: 73, description: "Ability to sit with uncertainty and friction" },
      { label: "Growth Drive", value: 94, description: "Orientation toward expansion over comfort" },
      { label: "Adaptability", value: 67, description: "Flexibility when plans or expectations shift" },
      { label: "Resilience", value: 81, description: "Recovery speed after friction or setback" },
    ],
  },
  {
    name: "Collective Impact Lens",
    description: "Maps whether your choices prioritize individual agency or broader social impact framing. Highlights how your perspective affects shared systems.",
    badge: "Community Signal",
    icon: Crown,
    accentText: "text-sky-300",
    accentBorder: "border-sky-400/40",
    softSurface: "bg-sky-500/8",
    glowFrom: "from-sky-500/15",
    accentColor: "#38BDF8",
    radarColor: "rgba(56,189,248,0.55)",
    traits: [
      { label: "Social Awareness", value: 79, description: "Sensitivity to collective context in decisions" },
      { label: "Collective Thinking", value: 85, description: "Weighting of group outcomes over personal ones" },
      { label: "Agency", value: 61, description: "Belief in individual influence on shared systems" },
      { label: "Systems View", value: 72, description: "Ability to see downstream effects of choices" },
      { label: "Empathy Reach", value: 90, description: "Breadth of concern across in/out-group divides" },
    ],
  },
];

// SVG radar chart — pure, no library
function RadarChart({ traits, color, isLight }: { traits: Trait[]; color: string; isLight: boolean }) {
  const cx = 140;
  const cy = 130;
  const r = 80;
  const n = traits.length;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointAt = (i: number, pct: number) => {
    const a = angleOf(i);
    return {
      x: cx + r * pct * Math.cos(a),
      y: cy + r * pct * Math.sin(a),
    };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const axisPoints = traits.map((_, i) => pointAt(i, 1));
  const dataPoints = traits.map((t, i) => pointAt(i, t.value / 100));
  const toPoints = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");
  const gridStroke = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)";
  const axisStroke = isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)";
  const labelFill = isLight ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.55)";

  return (
    <svg viewBox="0 0 280 260" className="w-full max-w-[280px] mx-auto">
      {gridLevels.map((lvl) => (
        <polygon key={lvl} points={toPoints(traits.map((_, i) => pointAt(i, lvl)))} fill="none" stroke={gridStroke} strokeWidth="1" />
      ))}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={axisStroke} strokeWidth="1" />
      ))}
      <polygon points={toPoints(dataPoints)} fill={color} stroke={color.replace("0.55", "0.9")} strokeWidth="1.5" />
      {traits.map((t, i) => {
        const p = pointAt(i, 1.28);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={labelFill}>
            {t.label}
          </text>
        );
      })}
    </svg>
  );
}

function InsightModal({ insight, onClose, isLight }: { insight: InsightDetail; onClose: () => void; isLight: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          isLight ? "border-black/10 bg-white text-stone-900" : "border-white/10 bg-[#0e0e0e] text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: `0 0 60px ${insight.accentColor}33, 0 24px 64px rgba(0,0,0,0.6)` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${isLight ? "text-stone-400" : "text-white/30"}`}>{insight.badge}</p>
            <h3 className={`text-lg font-bold leading-tight ${isLight ? "text-stone-900" : "text-white"}`}>{insight.name}</h3>
          </div>
          <button
            onClick={onClose}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition ml-3 mt-0.5 ${
              isLight ? "bg-black/5 text-stone-400 hover:text-stone-800" : "bg-white/5 text-white/40 hover:text-white"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Radar */}
        <RadarChart traits={insight.traits} color={insight.radarColor} isLight={isLight} />

        {/* Traits */}
        <div className="mt-5 space-y-4">
          <p className={`text-xs font-bold uppercase tracking-[0.15em] ${isLight ? "text-stone-500" : "text-white/80"}`}>Trait Breakdown</p>
          {insight.traits.map((trait) => (
            <div key={trait.label}>
              <div className="flex justify-between items-baseline mb-1">
                <span className={`text-sm font-semibold ${isLight ? "text-stone-800" : "text-white"}`}>{trait.label}</span>
                <span className="text-sm font-bold" style={{ color: insight.accentColor }}>{trait.value}%</span>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? "bg-black/8" : "bg-white/5"}`}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${trait.value}%`, backgroundColor: insight.accentColor }}
                />
              </div>
              <p className={`mt-1 text-[11px] ${isLight ? "text-stone-400" : "text-white/35"}`}>{trait.description}</p>
            </div>
          ))}
        </div>

        <p className={`mt-6 text-center text-[10px] ${isLight ? "text-stone-300" : "text-white/20"}`}>
          Sample data · your real profile unlocks with raW membership
        </p>
      </div>
    </div>
  );
}

export function PersonalityInsightsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const sectionRef = useTrackSectionView("personality_insights");
  const [openInsight, setOpenInsight] = useState<InsightDetail | null>(null);

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_65%)]" />
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        {/* top shimmer line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <div className="mb-8 text-center sm:mb-14">
          <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">Premium Feature</p>
          <h2 className="mt-3 landing-heading">
            Personality Insights
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-raw-silver/50 sm:text-base">
            Dynamic, non-clinical identity reports powered by your poll behavior. The more you answer, the sharper your signal.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <button
                key={insight.name}
                type="button"
                onClick={() => setOpenInsight(insight)}
                className="text-left w-full"
              >
                <GlareCard
                  className={`border ${insight.accentBorder} bg-raw-surface/30 p-6 sm:p-7 cursor-pointer hover:scale-[1.02] transition-transform duration-200`}
                >
                  {!isLight && <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${insight.glowFrom} via-transparent to-transparent`} />}
                  <div className="relative z-10">
                    <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full border ${insight.accentBorder} ${insight.softSurface} px-3 py-1`}>
                      <Icon className={`h-3 w-3 ${insight.accentText}`} />
                      <span className={`text-[10px] font-medium tracking-wider uppercase ${insight.accentText}`}>
                        {insight.badge}
                      </span>
                      {insight.isFree && (
                        <span className="ml-1 text-[9px] text-emerald-400/70 uppercase tracking-wider">· Free</span>
                      )}
                    </div>
                    <h3 className={`font-display text-base tracking-wide ${insight.accentText}`}>
                      {insight.name}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-raw-silver/50">
                      {insight.description}
                    </p>
                    <p className={`mt-4 text-[10px] font-semibold uppercase tracking-wider ${insight.accentText} opacity-60`}>
                      View Example →
                    </p>
                  </div>
                </GlareCard>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-raw-silver/30 sm:mt-10">
          Unlock deeper insights as your War Level rises. Signal Discipline is free for everyone.
        </p>
      </div>

      {openInsight && createPortal(
        <InsightModal insight={openInsight} onClose={() => setOpenInsight(null)} isLight={isLight} />,
        document.body,
      )}
    </section>
  );
}
