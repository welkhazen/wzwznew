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
      { label: "Introversion", value: 61 },
      { label: "Intuition", value: 78 },
      { label: "Thinking", value: 56 },
      { label: "Judging", value: 64 },
    ],
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
      { label: "Openness", value: 82 },
      { label: "Conscientiousness", value: 63 },
      { label: "Extraversion", value: 49 },
      { label: "Agreeableness", value: 71 },
      { label: "Emotional Stability", value: 66 },
    ],
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
      { label: "Self-Awareness", value: 74 },
      { label: "Self-Regulation", value: 69 },
      { label: "Empathy", value: 83 },
      { label: "Social Skill", value: 72 },
    ],
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
      { label: "Control Reflex", value: 71 },
      { label: "Avoidance", value: 42 },
      { label: "Defensiveness", value: 54 },
      { label: "Repair Capacity", value: 77 },
    ],
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
      { label: "Secure", value: 25 },
      { label: "Anxious", value: 18 },
      { label: "Avoidant", value: 78 },
      { label: "Disorganized", value: 12 },
    ],
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
      { label: "Confirmation Bias", value: 62 },
      { label: "Anchoring", value: 58 },
      { label: "Availability", value: 51 },
      { label: "Outcome Bias", value: 45 },
    ],
  },
];

function DonutPreview({ traits, color }: { traits: Trait[]; color: string }) {
  const cx = 80;
  const cy = 80;
  const r = 52;
  const stroke = 16;
  const c = 2 * Math.PI * r;
  const total = Math.max(1, traits.reduce((sum, trait) => sum + trait.value, 0));
  let offset = 0;

  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      {traits.map((trait) => {
        const segment = (trait.value / total) * c;
        const current = offset;
        offset += segment;

        return (
          <circle
            key={trait.label}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeOpacity={0.25 + trait.value / 140}
            strokeWidth={stroke}
            strokeDasharray={`${segment} ${c - segment}`}
            strokeDashoffset={-current}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="round"
          />
        );
      })}
      <text x="80" y="76" textAnchor="middle" className="fill-white text-[9px] uppercase tracking-[0.2em]">
        Sample
      </text>
      <text x="80" y="94" textAnchor="middle" className="fill-white text-[11px] font-semibold">
        Preview
      </text>
    </svg>
  );
}

function InsightModal({ insight, onClose, isLight }: { insight: InsightPreview; onClose: () => void; isLight: boolean }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          isLight ? "border-black/10 bg-white text-stone-900" : "border-white/10 bg-[#0e0e0e] text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-stone-400" : "text-white/35"}`}>{insight.badge}</p>
            <h3 className={`text-lg font-bold ${isLight ? "text-stone-900" : "text-white"}`}>{insight.name}</h3>
          </div>
          <button onClick={onClose} className="ml-3 mt-0.5 rounded-full bg-white/5 p-1.5 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-center text-[10px] uppercase tracking-[0.16em] text-white/45">{insight.summaryTitle}</p>
          <p className="mt-2 text-center text-xs text-white/70">{insight.summary}</p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <DonutPreview traits={insight.traits} color={insight.accentColor} />
          <div className="w-full space-y-2">
            {insight.traits.map((trait) => (
              <div key={trait.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-white/75">{trait.label}</span>
                  <span style={{ color: insight.accentColor }} className="font-semibold">{trait.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full" style={{ width: `${trait.value}%`, backgroundColor: insight.accentColor }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Insight</p>
          <p className="mt-1 text-xs text-white/75">{insight.insight}</p>
        </div>
      </div>
    </div>
  );
}

export function PersonalityInsightsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const sectionRef = useTrackSectionView("personality_insights");
  const [openInsight, setOpenInsight] = useState<InsightPreview | null>(null);

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="landing-section relative px-4 py-14 sm:px-6 sm:py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_65%)]" />
      <div
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 px-6 py-10 sm:px-10 sm:py-14"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

        <div className="mb-8 text-center sm:mb-14">
          <span className="inline-flex items-center rounded-full border border-raw-gold/40 bg-raw-gold/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-raw-gold/80">
            Coming Soon
          </span>
          <h2 className="mt-3 landing-heading">Personality Insights</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-raw-silver/50 sm:text-base">
            The full reports are locked for now. Click any card to preview a sample infographic result.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <button key={insight.id} type="button" onClick={() => setOpenInsight(insight)} className="w-full text-left">
                <GlareCard className={`relative border ${insight.accentBorder} bg-raw-surface/30 p-6 transition-transform duration-200 hover:scale-[1.02] sm:p-7`}>
                  {!isLight && <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${insight.glowFrom} via-transparent to-transparent`} />}
                  <div className="relative z-10 blur-[2px]">
                    <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full border ${insight.accentBorder} ${insight.softSurface} px-3 py-1`}>
                      <Icon className={`h-3 w-3 ${insight.accentText}`} />
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${insight.accentText}`}>{insight.badge}</span>
                    </div>
                    <h3 className={`font-display text-base tracking-wide ${insight.accentText}`}>{insight.name}</h3>
                    <p className="mt-3 text-xs leading-relaxed text-raw-silver/50">{insight.description}</p>
                  </div>
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
                      Locked · Preview Sample
                    </div>
                  </div>
                </GlareCard>
              </button>
            );
          })}
        </div>
      </div>

      {openInsight && createPortal(<InsightModal insight={openInsight} onClose={() => setOpenInsight(null)} isLight={isLight} />, document.body)}
    </section>
  );
}
