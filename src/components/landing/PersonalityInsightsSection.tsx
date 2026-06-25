import type React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { Brain, CircleGauge, Fingerprint, Map, Sparkles, WandSparkles, X } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";
import { useTheme } from "@/providers/useTheme";

interface Trait {
  label: string;
  value: number;
  desc: string;
  color: string;
}

interface InsightPreview {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: React.ElementType;
  accentText: string;
  accentBorder: string;
  softSurface: string;
  glowFrom: string;
  accentColor: string;
  summaryTitle: string;
  summary: string;
  insight: string;
  traits: Trait[];
  previewVariant: "radar" | "summary" | "pie" | "bars" | "quadrants" | "timeline";
}

const insights: InsightPreview[] = [
  {
    id: "myers-briggs",
    name: "Myers-Briggs",
    description: "Understand your personality across four dimensions of how you process the world.",
    badge: "Type Signal",
    icon: Brain,
    accentText: "text-orange-300",
    accentBorder: "border-orange-400/40",
    softSurface: "bg-orange-500/8",
    glowFrom: "from-orange-500/15",
    accentColor: "#FB923C",
    summaryTitle: "Diplomatic Strategist",
    summary: "You blend intuition and structure. You think in patterns, but still care about practical execution.",
    insight: "Your growth edge is turning reflection into faster action.",
    traits: [
      { label: "Introversion", value: 61, desc: "Prefers depth over breadth in social contexts", color: "#FB923C" },
      { label: "Intuition", value: 78, desc: "Drawn to abstract patterns and future possibilities", color: "#FBBF24" },
      { label: "Thinking", value: 56, desc: "Weighs logic and objectivity in decisions", color: "#F97316" },
      { label: "Judging", value: 64, desc: "Prefers structure, plans, and closure", color: "#EA580C" },
    ],
    previewVariant: "quadrants",
  },
  {
    id: "big-five-profile",
    name: "Big Five Profile",
    description: "Measure openness, conscientiousness, extraversion, agreeableness, and emotional range.",
    badge: "Trait Model",
    icon: Fingerprint,
    accentText: "text-sky-300",
    accentBorder: "border-sky-400/40",
    softSurface: "bg-sky-500/8",
    glowFrom: "from-sky-500/15",
    accentColor: "#38BDF8",
    summaryTitle: "Balanced Explorer",
    summary: "You combine high openness with stable emotional grounding and collaborative social behavior.",
    insight: "You thrive when structure supports curiosity.",
    traits: [
      { label: "Openness", value: 82, desc: "Highly creative and open to new experiences", color: "#38BDF8" },
      { label: "Conscientiousness", value: 94, desc: "Extremely organised and goal-oriented", color: "#34D399" },
      { label: "Extraversion", value: 62, desc: "Moderately seeks social engagement", color: "#A78BFA" },
      { label: "Agreeableness", value: 79, desc: "Cooperative and empathetic", color: "#F472B6" },
      { label: "Neuroticism", value: 23, desc: "Naturally serene and resilient", color: "#FB923C" },
    ],
    previewVariant: "radar",
  },
  {
    id: "emotional-intelligence",
    name: "Emotional Intelligence",
    description: "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
    badge: "EQ Matrix",
    icon: CircleGauge,
    accentText: "text-emerald-300",
    accentBorder: "border-emerald-400/40",
    softSurface: "bg-emerald-500/8",
    glowFrom: "from-emerald-500/15",
    accentColor: "#34D399",
    summaryTitle: "Composed Connector",
    summary: "You read social context well and usually respond with composure even when tension rises.",
    insight: "High empathy plus boundaries keeps your energy stable.",
    traits: [
      { label: "Self-Awareness", value: 74, desc: "Recognises emotional triggers clearly", color: "#34D399" },
      { label: "Self-Regulation", value: 69, desc: "Manages impulses under pressure", color: "#10B981" },
      { label: "Empathy", value: 83, desc: "Attuned to others' emotional states", color: "#6EE7B7" },
      { label: "Social Skill", value: 72, desc: "Navigates group dynamics with ease", color: "#059669" },
    ],
    previewVariant: "bars",
  },
  {
    id: "shadow-self",
    name: "Shadow Self",
    description: "Reveal hidden patterns and blind spots that surface in difficult moments.",
    badge: "Depth Scan",
    icon: WandSparkles,
    accentText: "text-fuchsia-300",
    accentBorder: "border-fuchsia-400/40",
    softSurface: "bg-fuchsia-500/8",
    glowFrom: "from-fuchsia-500/15",
    accentColor: "#E879F9",
    summaryTitle: "Protective Performer",
    summary: "Under pressure, you can default to control and perfection as a way to avoid vulnerability.",
    insight: "Naming the pattern early reduces emotional overcorrection.",
    traits: [
      { label: "Control Reflex", value: 71, desc: "Seeks to manage outcomes when anxious", color: "#E879F9" },
      { label: "Avoidance", value: 42, desc: "Occasionally sidesteps conflict", color: "#C026D3" },
      { label: "Defensiveness", value: 54, desc: "Moderate tendency to shield the ego", color: "#A855F7" },
      { label: "Repair Capacity", value: 77, desc: "Strong ability to reconnect after rupture", color: "#D946EF" },
    ],
    previewVariant: "summary",
  },
  {
    id: "attachment-style",
    name: "Attachment Style",
    description: "Understand your patterns in relationships and emotional bonding with others.",
    badge: "Bond Pattern",
    icon: Sparkles,
    accentText: "text-rose-300",
    accentBorder: "border-rose-400/40",
    softSurface: "bg-rose-500/8",
    glowFrom: "from-rose-500/15",
    accentColor: "#FB7185",
    summaryTitle: "Avoidant-Dismissive",
    summary: "You value independence highly. Closeness can feel suffocating, and you prefer self-sufficiency.",
    insight: "Growth comes from accepting support without interpreting it as weakness.",
    traits: [
      { label: "Secure", value: 25, desc: "Comfortable with closeness and independence", color: "#34D399" },
      { label: "Anxious", value: 18, desc: "Fear of abandonment or inconsistency", color: "#FBBF24" },
      { label: "Avoidant", value: 78, desc: "Strong preference for emotional distance", color: "#FB7185" },
      { label: "Disorganized", value: 12, desc: "Conflicting approach to intimacy", color: "#A78BFA" },
    ],
    previewVariant: "timeline",
  },
  {
    id: "cognitive-bias-map",
    name: "Cognitive Bias Map",
    description: "Identify mental shortcuts and biases that shape your decisions and thinking.",
    badge: "Thinking Map",
    icon: Map,
    accentText: "text-indigo-300",
    accentBorder: "border-indigo-400/40",
    softSurface: "bg-indigo-500/8",
    glowFrom: "from-indigo-500/15",
    accentColor: "#818CF8",
    summaryTitle: "Pattern-First Thinker",
    summary: "You quickly detect patterns but can overweight first impressions in fast-moving contexts.",
    insight: "Brief counter-evidence checks improve decision quality.",
    traits: [
      { label: "Confirmation Bias", value: 62, desc: "Favours info that confirms existing beliefs", color: "#818CF8" },
      { label: "Anchoring", value: 58, desc: "First data point heavily influences judgement", color: "#6366F1" },
      { label: "Availability", value: 51, desc: "Recent events feel more likely to recur", color: "#A5B4FC" },
      { label: "Outcome Bias", value: 45, desc: "Judges decisions by results not process", color: "#4F46E5" },
    ],
    previewVariant: "pie",
  },
];

// ─── Locked card preview ──────────────────────────────────────────────────────

function LockedPreview({ insight, isLight }: { insight: InsightPreview; isLight: boolean }) {
  const panelClass = isLight ? "border-slate-300/70 bg-slate-100/80" : "border-white/10 bg-black/30";
  const mutedText = isLight ? "text-slate-700" : "text-white/80";
  const trackClass = isLight ? "bg-slate-300/80" : "bg-white/10";

  return (
    <div className={`mt-3 rounded-xl border p-2 blur-[1px] sm:mt-5 sm:p-3 ${panelClass}`}>
      <div className="space-y-2">
        {insight.previewVariant === "radar" && (
          <div
            className={`mb-2 h-14 rounded-lg border sm:h-20 ${isLight ? "border-slate-300/70" : "border-white/10"}`}
            style={{ background: `radial-gradient(circle at center, ${insight.accentColor}22, transparent 70%)` }}
          />
        )}
        {insight.traits.slice(0, 3).map((trait) => (
          <div key={trait.label}>
            <div className={`mb-0.5 flex items-center justify-between text-[10px] ${mutedText}`}>
              <span>{trait.label}</span>
              <span style={{ color: trait.color }}>{trait.value}%</span>
            </div>
            <div className={`h-1 rounded-full ${trackClass}`}>
              <div className="h-full rounded-full" style={{ width: `${trait.value}%`, backgroundColor: trait.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal chart components ───────────────────────────────────────────────────

function RadarChart({ traits, isLight }: { traits: Trait[]; isLight: boolean }) {
  const n = traits.length;
  const cx = 80, cy = 80, r = 52;
  const gridStroke = isLight ? "rgba(100,100,100,0.25)" : "rgba(255,255,255,0.07)";

  function getPoint(index: number, ratio: number) {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = gridLevels.map((level) =>
    traits.map((_, i) => getPoint(i, level)).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"
  );
  const dataPoints = traits.map((t, i) => getPoint(i, t.value / 100));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const labelPoints = traits.map((t, i) => ({ ...getPoint(i, 1.3), label: t.label, color: t.color }));

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={gridStroke} strokeWidth={0.8} />
      ))}
      {traits.map((_, i) => {
        const end = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={gridStroke} strokeWidth={0.8} />;
      })}
      <path d={dataPath} fill="rgba(56,189,248,0.15)" stroke="#38BDF8" strokeWidth={1.5} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={traits[i].color} />
      ))}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: "6.5px", fill: p.color, fontWeight: 600 }}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ traits, isLight }: { traits: Trait[]; isLight: boolean }) {
  const cx = 80, cy = 80, r = 52, stroke = 16;
  const c = 2 * Math.PI * r;
  const total = Math.max(1, traits.reduce((s, t) => s + t.value, 0));
  let offset = 0;
  const dominant = traits.reduce((a, b) => (a.value > b.value ? a : b));
  const bgStroke = isLight ? "rgba(100,100,100,0.2)" : "rgba(255,255,255,0.06)";
  const labelColor = isLight ? "rgba(100,100,100,0.6)" : "rgba(255,255,255,0.4)";

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={bgStroke} strokeWidth={stroke} />
      {traits.map((trait) => {
        const segment = (trait.value / total) * c;
        const cur = offset;
        offset += segment;
        return (
          <circle key={trait.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={trait.color} strokeOpacity={0.85} strokeWidth={stroke}
            strokeDasharray={`${segment} ${c - segment}`}
            strokeDashoffset={-cur} transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt" />
        );
      })}
      <text x="80" y="73" textAnchor="middle" style={{ fontSize: "7px", fill: labelColor, letterSpacing: "0.15em" }}>Dominant</text>
      <text x="80" y="88" textAnchor="middle" style={{ fontSize: "10px", fill: dominant.color, fontWeight: 700 }}>{dominant.label}</text>
    </svg>
  );
}

function QuadrantChart({ traits, isLight }: { traits: Trait[]; isLight: boolean }) {
  const positions = [{ x: 44, y: 44 }, { x: 116, y: 44 }, { x: 44, y: 116 }, { x: 116, y: 116 }];
  const gridStroke = isLight ? "rgba(100,100,100,0.3)" : "rgba(255,255,255,0.1)";
  const percentColor = isLight ? "rgba(100,100,100,0.7)" : "rgba(255,255,255,0.6)";

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
      <line x1="80" y1="8" x2="80" y2="152" stroke={gridStroke} strokeWidth={0.8} />
      <line x1="8" y1="80" x2="152" y2="80" stroke={gridStroke} strokeWidth={0.8} />
      {traits.map((trait, i) => {
        const pos = positions[i];
        const radius = 6 + (trait.value / 100) * 18;
        return (
          <g key={trait.label}>
            <circle cx={pos.x} cy={pos.y} r={radius} fill={trait.color} fillOpacity={0.2} stroke={trait.color} strokeWidth={1} />
            <circle cx={pos.x} cy={pos.y} r={3} fill={trait.color} />
            <text x={pos.x} y={pos.y + radius + 9} textAnchor="middle" style={{ fontSize: "6px", fill: trait.color }}>{trait.label}</text>
            <text x={pos.x} y={pos.y + radius + 17} textAnchor="middle" style={{ fontSize: "7px", fill: percentColor, fontWeight: 700 }}>{trait.value}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ traits, isLight }: { traits: Trait[]; isLight: boolean }) {
  const cx = 80, cy = 80, r = 52;
  const total = traits.reduce((s, t) => s + t.value, 0);
  let currentAngle = -Math.PI / 2;
  const strokeColor = isLight ? "#d0d0d0" : "#0e0e0e";
  const textColor = isLight ? "rgba(100,100,100,0.9)" : "rgba(255,255,255,0.85)";

  function polarToXY(angle: number, radius: number) {
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  }

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
      {traits.map((trait) => {
        const angle = (trait.value / total) * Math.PI * 2;
        const start = polarToXY(currentAngle, r);
        const end = polarToXY(currentAngle + angle, r);
        const largeArc = angle > Math.PI ? 1 : 0;
        const midAngle = currentAngle + angle / 2;
        const labelPos = polarToXY(midAngle, r * 0.65);
        currentAngle += angle;
        return (
          <g key={trait.label}>
            <path
              d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
              fill={trait.color} fillOpacity={0.7} stroke={strokeColor} strokeWidth={1.5}
            />
            <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: "7px", fill: textColor, fontWeight: 700 }}>
              {trait.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function InsightModal({ insight, onClose, isLight }: { insight: InsightPreview; onClose: () => void; isLight: boolean }) {
  const bg = isLight ? "border-black/10 bg-white text-stone-900" : "border-white/10 bg-[#0e0e0e] text-white";
  const cardBg = isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/20";
  const mutedText = isLight ? "text-stone-500" : "text-white/45";
  const bodyText = isLight ? "text-stone-700" : "text-white/70";
  const trackBg = isLight ? "bg-slate-200" : "bg-white/10";

  const hasTopChart = ["radar", "timeline", "quadrants", "pie"].includes(insight.previewVariant);

  function TopChart() {
    if (insight.previewVariant === "radar") return <RadarChart traits={insight.traits} isLight={isLight} />;
    if (insight.previewVariant === "timeline") return <DonutChart traits={insight.traits} isLight={isLight} />;
    if (insight.previewVariant === "quadrants") return <QuadrantChart traits={insight.traits} isLight={isLight} />;
    if (insight.previewVariant === "pie") return <PieChart traits={insight.traits} isLight={isLight} />;
    return null;
  }

  const traitSectionLabel: Record<InsightPreview["previewVariant"], string> = {
    radar: "Big Five Traits",
    bars: "EQ Dimensions",
    timeline: "Attachment Breakdown",
    quadrants: "MBTI Axes",
    pie: "Bias Profile",
    summary: "Core Traits",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className={`relative z-10 w-full max-w-sm overflow-y-auto rounded-2xl border p-6 shadow-2xl max-h-[90vh] ${bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${mutedText}`}>{insight.badge}</p>
            <h3 className={`text-lg font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{insight.name}</h3>
          </div>
          <button onClick={onClose} className={`ml-3 mt-0.5 rounded-full p-1.5 ${isLight ? "bg-slate-100 text-stone-500 hover:text-stone-800" : "bg-white/5 text-white/60 hover:text-white"}`}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`rounded-xl border p-3 ${cardBg}`}>
          <p className={`text-center text-[10px] uppercase tracking-[0.16em] ${mutedText}`}>{insight.summaryTitle}</p>
          <p className={`mt-2 text-center text-xs ${bodyText}`}>{insight.summary}</p>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${cardBg}`}>
          {hasTopChart && (
            <div className="mb-4 flex justify-center">
              <TopChart />
            </div>
          )}
          <p className={`mb-3 text-[10px] uppercase tracking-[0.18em] ${mutedText}`}>{traitSectionLabel[insight.previewVariant]}</p>
          <div className="space-y-3">
            {insight.traits.map((trait) => (
              <div key={trait.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? "text-stone-800" : "text-white/90"}`}>{trait.label}</span>
                  <span className="text-xs font-bold" style={{ color: trait.color }}>{trait.value}%</span>
                </div>
                <div className={`h-1.5 overflow-hidden rounded-full ${trackBg}`}>
                  <div className="h-full rounded-full" style={{ width: `${trait.value}%`, backgroundColor: trait.color }} />
                </div>
                <p className={`mt-0.5 text-[10px] leading-tight ${mutedText}`}>{trait.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 rounded-xl border p-3 ${cardBg}`}>
          <p className={`text-[10px] uppercase tracking-[0.16em] ${mutedText}`}>Insight</p>
          <p className={`mt-1 text-xs ${bodyText}`}>{insight.insight}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function PersonalityInsightsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const sectionRef = useTrackSectionView("personality_insights");
  const [openInsight, setOpenInsight] = useState<InsightPreview | null>(null);

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="landing-section relative px-4 py-8 sm:px-6 sm:py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_65%)]" />
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-3 py-5 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <div className="mb-4 text-center sm:mb-14">
          <span className="inline-flex items-center rounded-full border border-raw-gold/40 bg-raw-gold/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-raw-gold/80">
            Coming Soon
          </span>
          <h2 className="mt-3 landing-heading">Insights that make your answers useful</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-raw-silver/50 sm:text-base">
            Your poll answers can become visual reports about personality, relationships, emotional patterns, and decision-making. Preview what is coming next.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <button key={insight.id} type="button" onClick={() => setOpenInsight(insight)} className="h-full w-full text-left">
                <GlareCard className={`relative h-full border ${insight.accentBorder} bg-raw-surface/30 p-3 transition-transform duration-200 hover:scale-[1.02] sm:p-7`}>
                  {!isLight && <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${insight.glowFrom} via-transparent to-transparent`} />}
                  <div className="relative z-10">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 rounded-full border ${insight.accentBorder} ${insight.softSurface} px-3 py-1`}>
                        <Icon className={`h-3 w-3 ${insight.accentText}`} />
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${insight.accentText}`}>{insight.badge}</span>
                      </div>
                      <div className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">
                        Preview · Coming Soon
                      </div>
                    </div>
                    <h3 className={`font-display text-base tracking-wide ${insight.accentText}`}>{insight.name}</h3>
                    <p className="mt-3 text-xs leading-relaxed text-raw-silver/50">{insight.description}</p>
                    <LockedPreview insight={insight} isLight={isLight} />
                  </div>
                </GlareCard>
              </button>
            );
          })}
        </div>
      </div>

      {openInsight && createPortal(
        <InsightModal insight={openInsight} onClose={() => setOpenInsight(null)} isLight={isLight} />,
        document.body
      )}
    </section>
  );
}
