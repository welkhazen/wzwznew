import type React from "react";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { Sparkles, Zap, Crown } from "lucide-react";
import { GlareCard } from "@/components/ui/glare-card";
import { useTheme } from "@/providers/useTheme";

const insights = [
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
  },
  {
    name: "Growth Friction Index",
    description: "Measures your tendency to choose stretch and discomfort versus immediate comfort. Reveals how you negotiate challenge and expansion.",
    badge: "Momentum",
    icon: Sparkles,
    accentText: "text-emerald-300",
    accentBorder: "border-emerald-400/40",
    softSurface: "bg-emerald-500/8",
    glowFrom: "from-emerald-500/15",
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
  },
];

export function PersonalityInsightsSection() {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const sectionRef = useTrackSectionView("personality_insights");

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
              <GlareCard
                key={insight.name}
                className={`border ${insight.accentBorder} bg-raw-surface/30 p-6 sm:p-7`}
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
                </div>
              </GlareCard>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-raw-silver/30 sm:mt-10">
          Unlock deeper insights as your War Level rises. Signal Discipline is free for everyone.
        </p>
      </div>
    </section>
  );
}
