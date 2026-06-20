import { BookOpen, Brain, CircleGauge, Fingerprint, Map, Sparkles, WandSparkles } from "lucide-react";
import TokenImage from "@/assets/tokens.webp";

const PERSONALITY_INSIGHTS = [
  {
    id: "myers-briggs",
    name: "Myers-Briggs",
    icon: Brain,
    description: "Discover your personality type across 4 key dimensions of how you see the world.",
    requiredPolls: 10,
    tokenPrice: 10,
    accent: "from-orange-400/25 via-amber-300/10 to-transparent",
    iconColor: "text-orange-400",
    border: "border-orange-300/45",
  },
  {
    id: "big-five-profile",
    name: "Big Five Profile",
    icon: Fingerprint,
    description: "Measure your openness, conscientiousness, extraversion, agreeableness, and emotional range.",
    requiredPolls: 30,
    tokenPrice: 30,
    accent: "from-sky-400/25 via-cyan-300/10 to-transparent",
    iconColor: "text-sky-400",
    border: "border-sky-300/45",
  },
  {
    id: "emotional-intelligence",
    name: "Emotional Intelligence",
    icon: CircleGauge,
    description: "Understand how you process emotions, empathy, and interpersonal cues under pressure.",
    requiredPolls: 70,
    tokenPrice: 70,
    accent: "from-emerald-400/25 via-lime-300/10 to-transparent",
    iconColor: "text-emerald-400",
    border: "border-emerald-300/45",
  },
  {
    id: "shadow-self",
    name: "Shadow Self",
    icon: WandSparkles,
    description: "Reveal hidden patterns, blind spots, and traits that surface in difficult moments.",
    requiredPolls: 100,
    tokenPrice: 100,
    accent: "from-fuchsia-400/25 via-violet-300/10 to-transparent",
    iconColor: "text-fuchsia-400",
    border: "border-fuchsia-300/45",
  },
  {
    id: "attachment-style",
    name: "Attachment Style",
    icon: BookOpen,
    description: "Understand your patterns in relationships and emotional bonding with others.",
    requiredPolls: 150,
    tokenPrice: 150,
    accent: "from-rose-400/25 via-pink-300/10 to-transparent",
    iconColor: "text-rose-400",
    border: "border-rose-300/45",
  },
  {
    id: "cognitive-bias-map",
    name: "Cognitive Bias Map",
    icon: Map,
    description: "Identify the mental shortcuts and biases that shape your decisions and thinking.",
    requiredPolls: 200,
    tokenPrice: 200,
    accent: "from-indigo-400/25 via-blue-300/10 to-transparent",
    iconColor: "text-indigo-400",
    border: "border-indigo-300/45",
  },
];

export const PERSONALITY_INSIGHTS_CATALOG = PERSONALITY_INSIGHTS;

export function PersonalityInsightsInventory({
  pollsAnswered,
  totalPolls,
  tokenBalance,
  ownedIds = new Set<string>(),
  onPurchase,
}: {
  pollsAnswered: number;
  totalPolls: number;
  tokenBalance: number;
  ownedIds?: Set<string>;
  onPurchase?: (insightId: string, tokenPrice: number) => Promise<void> | void;
}) {
  const readyCount = PERSONALITY_INSIGHTS.filter(
    (insight) => pollsAnswered >= insight.requiredPolls && tokenBalance >= insight.tokenPrice
  ).length;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-raw-border/35 bg-raw-black/35">
      <div className="relative overflow-hidden border-b border-raw-border/30 bg-gradient-to-br from-raw-gold/18 via-sky-400/10 to-fuchsia-500/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.14)_0.8px,transparent_0.8px)] [background-size:9px_9px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-raw-gold/85">
              <Sparkles className="h-3.5 w-3.5" />
              Personality Insights
            </p>
            <h2 className="mt-3 font-display text-2xl text-raw-text">Identity Report Vault</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-raw-silver/55">
              Unlock deeper personality reports with poll activity and tokens.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-right backdrop-blur">
            <p className="text-[10px] uppercase tracking-[0.2em] text-raw-silver/45">Progress</p>
            <p className="mt-1 font-display text-lg text-raw-text">{readyCount}/{PERSONALITY_INSIGHTS.length} ready</p>
            <p className="text-[10px] text-raw-silver/45">{pollsAnswered} polls answered</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
        {PERSONALITY_INSIGHTS.filter((i) => !ownedIds.has(i.id)).map((insight) => {
          const Icon = insight.icon;
          const hasPolls = pollsAnswered >= insight.requiredPolls;
          const hasTokens = tokenBalance >= insight.tokenPrice;
          const ready = hasPolls && hasTokens;
          const progress = Math.min(100, (pollsAnswered / insight.requiredPolls) * 100);

          return (
            <article
              key={insight.id}
              className={`relative overflow-hidden rounded-2xl border ${insight.border} bg-gradient-to-br ${insight.accent} p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)]`}
            >
              <div className="pointer-events-none absolute inset-0 bg-raw-black/20" />
              <div className="relative flex min-h-[152px] flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 ${insight.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-base leading-tight text-raw-text">{insight.name}</h3>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-raw-silver/45">
                        {insight.requiredPolls} polls req.
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] ${
                    ready ? "border-emerald-300/45 bg-emerald-400/15 text-emerald-200" : "border-white/15 bg-black/20 text-raw-silver/55"
                  }`}>
                    {ready ? "Ready" : "Locked"}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-xs leading-relaxed text-raw-silver/65">{insight.description}</p>

                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${ready ? "bg-emerald-300" : "bg-raw-gold"}`} style={{ width: `${Math.max(5, progress)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-raw-silver/50">
                    <span>{Math.min(pollsAnswered, insight.requiredPolls)}/{insight.requiredPolls} polls</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-2 py-0.5 text-raw-gold/85">
                      <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
                      {insight.tokenPrice} tokens
                    </span>
                  </div>
                  {onPurchase && (
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => void onPurchase(insight.id, insight.tokenPrice)}
                      className={`mt-3 w-full rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition ${
                        ready
                          ? "border-raw-gold/55 bg-raw-gold/15 text-raw-gold hover:bg-raw-gold/25"
                          : "border-raw-border/30 bg-raw-surface/20 text-raw-silver/40"
                      }`}
                    >
                      {ready ? `Unlock · ${insight.tokenPrice} tokens` : "Locked"}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="border-t border-raw-border/30 px-4 py-3 text-center text-xs text-raw-silver/45">
        {totalPolls} polls available. Keep answering polls to open the full report vault.
      </div>
    </div>
  );
}
