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
      { label: "Introversion", value: 61 },
      { label: "Intuition", value: 78 },
      { label: "Thinking", value: 56 },
      { label: "Judging", value: 64 },
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
      { label: "Openness", value: 82 },
      { label: "Conscientiousness", value: 63 },
      { label: "Extraversion", value: 49 },
      { label: "Agreeableness", value: 71 },
      { label: "Emotional Stability", value: 66 },
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
      { label: "Self-Awareness", value: 74 },
      { label: "Self-Regulation", value: 69 },
      { label: "Empathy", value: 83 },
      { label: "Social Skill", value: 72 },
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
      { label: "Control Reflex", value: 71 },
      { label: "Avoidance", value: 42 },
      { label: "Defensiveness", value: 54 },
      { label: "Repair Capacity", value: 77 },
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
      { label: "Secure", value: 25 },
      { label: "Anxious", value: 18 },
      { label: "Avoidant", value: 78 },
      { label: "Disorganized", value: 12 },
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
      { label: "Confirmation Bias", value: 62 },
      { label: "Anchoring", value: 58 },
      { label: "Availability", value: 51 },
      { label: "Outcome Bias", value: 45 },
    ],
    previewVariant: "pie",
  },
];


function LockedPreview({ insight, isLight }: { insight: InsightPreview; isLight: boolean }) {
  const accent = { color: insight.accentColor };
  const previewPanelClass = isLight ? "border-slate-300/70 bg-slate-100/80" : "border-white/10 bg-black/30";
  const mutedTextClass = isLight ? "text-slate-700" : "text-white/80";
  const secondaryTextClass = isLight ? "text-slate-600" : "text-white/75";
  const subtleBorderClass = isLight ? "border-slate-300/70 bg-white/45" : "border-white/10 bg-white/5";
  const trackClass = isLight ? "bg-slate-300/80" : "bg-white/10";

  return (
    <div className={`mt-5 rounded-xl border p-3 blur-[1px] ${previewPanelClass}`}>
      {insight.previewVariant === "radar" && (
        <div className="space-y-2">
          <div
            className={`h-24 rounded-lg border ${
              isLight ? "border-slate-300/70 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.22),transparent_70%)]" : "border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_70%)]"
            }`}
          />
          {insight.traits.slice(0, 3).map((trait) => (
            <div key={trait.label} className="flex items-center justify-between text-[10px]">
              <span className={mutedTextClass}>{trait.label}</span>
              <span style={accent}>{trait.value}%</span>
            </div>
          ))}
        </div>
      )}

      {insight.previewVariant === "summary" && (
        <div className="space-y-2 text-[10px]">
          <p className={`rounded border px-2 py-1 ${subtleBorderClass} ${mutedTextClass}`}>AI Analysis Summary</p>
          <p className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">Top Strengths & Advantages</p>
          <p className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-100">Growth Opportunities</p>
        </div>
      )}

      {insight.previewVariant === "pie" && (
        <div className="flex items-center gap-3">
          <div
            className={`h-20 w-20 rounded-full border ${isLight ? "border-slate-300/80" : "border-white/20"}`}
            style={{
              background: isLight
                ? `conic-gradient(${insight.accentColor} 0 38%, rgba(148,163,184,0.35) 38% 66%, rgba(226,232,240,0.9) 66% 100%)`
                : `conic-gradient(${insight.accentColor} 0 38%, rgba(255,255,255,0.18) 38% 66%, rgba(255,255,255,0.08) 66% 100%)`,
            }}
          />
          <div className="space-y-1 text-[10px]">
            {insight.traits.slice(0, 3).map((trait) => (
              <p key={trait.label} className={secondaryTextClass}>{trait.label}: <span style={accent}>{trait.value}%</span></p>
            ))}
          </div>
        </div>
      )}

      {insight.previewVariant === "bars" && (
        <div className="space-y-2">
          {insight.traits.map((trait) => (
            <div key={trait.label}>
              <p className={`mb-1 text-[10px] ${mutedTextClass}`}>{trait.label}</p>
              <div className={`h-1.5 rounded-full ${trackClass}`}>
                <div className="h-full rounded-full" style={{ width: `${trait.value}%`, backgroundColor: insight.accentColor }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {insight.previewVariant === "quadrants" && (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {insight.traits.map((trait) => (
            <div key={trait.label} className={`rounded border p-2 ${subtleBorderClass}`}>
              <p className={secondaryTextClass}>{trait.label}</p>
              <p className="mt-1 font-semibold" style={accent}>{trait.value}%</p>
            </div>
          ))}
        </div>
      )}

      {insight.previewVariant === "timeline" && (
        <div className="space-y-2">
          {insight.traits.map((trait) => (
            <div key={trait.label} className="flex items-center gap-2 text-[10px]">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: insight.accentColor }} />
              <span className={mutedTextClass}>{trait.label}</span>
              <span className="ml-auto" style={accent}>{trait.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
                  <div className="relative z-10">
                    <div className={`mb-4 inline-flex items-center gap-1.5 rounded-full border ${insight.accentBorder} ${insight.softSurface} px-3 py-1`}>
                      <Icon className={`h-3 w-3 ${insight.accentText}`} />
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${insight.accentText}`}>{insight.badge}</span>
                    </div>
                    <h3 className={`font-display text-base tracking-wide ${insight.accentText}`}>{insight.name}</h3>
                    <p className="mt-3 text-xs leading-relaxed text-raw-silver/50">{insight.description}</p>
                    <LockedPreview insight={insight} isLight={isLight} />
                  </div>
                  <div className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm">Locked · Sample</div>
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
