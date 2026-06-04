import { useEffect, useState } from "react";
import { Archive, BookOpen, Brain, CircleGauge, Fingerprint, Lock, Map, Sparkles, WandSparkles } from "lucide-react";
import { readOwnedInsightIds } from "@/lib/insightsOwnership";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/avatarRarity";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import type { Poll } from "@/store/useRawStore";
import TokenImage from "@/assets/tokens.webp";
import { spendTokens } from "@/lib/api/tokens";

interface DashboardInventoryProps {
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  onAvatarChange: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  onAvatarPurchased: (level: number) => void;
  avatarPricesByLevel: Record<number, string>;
  avatarCatalog: AvatarCatalogItem[];
  tokenBalance: number;
  userId: string;
}

const AVATAR_SHOP_PRICE = 50;
const TOKEN_BALANCE_STORAGE_PREFIX = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

function updateTokenBalanceCache(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  const key = `${TOKEN_BALANCE_STORAGE_PREFIX}.${userId}`;
  window.localStorage.setItem(key, String(balance));
  window.dispatchEvent(new CustomEvent(TOKEN_BALANCE_UPDATED_EVENT, { detail: { storageKey: key, balance } }));
}

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

// ─── Avatar Shop ────────────────────────────────────────────────────────────

export function AvatarShop({
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  avatarPricesByLevel,
  tokenBalance,
  userId,
  onAvatarPurchased,
}: Pick<DashboardInventoryProps, "avatarCatalog" | "ownedAvatarLevels" | "onUnlockAvatar" | "avatarPricesByLevel" | "tokenBalance" | "userId" | "onAvatarPurchased">) {
  const [unlocking, setUnlocking] = useState<number | null>(null);

  const purchasable = avatarCatalog.filter(
    (a) =>
      a.price !== "Free" &&
      a.price !== "0" &&
      Number(a.price) > 0 &&
      !ownedAvatarLevels.has(a.level),
  );

  if (purchasable.length === 0) {
    return (
      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
        No paid avatars in catalog yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {purchasable.map((avatar) => {
        const owned = ownedAvatarLevels.has(avatar.level);
        const price = Number(avatarPricesByLevel[avatar.level] ?? avatar.price) || AVATAR_SHOP_PRICE;
        const canBuy = tokenBalance >= price;
        const rarity = avatar.rarity ?? "common";
        const rarityConfig = RARITY_CONFIG[rarity];

        return (
          <div
            key={avatar.id}
            className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-raw-border/35 bg-raw-black/45 p-3 transition-all"
            style={owned ? { borderColor: `${rarityConfig.color}40` } : {}}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

            <div className="relative">
              <AvatarFigure avatarIndex={avatar.level} size="md" selected={owned} rarity={rarity} themeOverride={avatar} />
            </div>

            <div className="relative text-center">
              <p className="text-xs font-medium text-raw-text line-clamp-1">{avatar.name}</p>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: rarityConfig.color }}
              >
                {rarityConfig.label}
              </p>
            </div>

            {owned ? (
              <span className="relative rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300">
                Owned
              </span>
            ) : (
              <button
                onClick={async () => {
                  setUnlocking(avatar.level);
                  try {
                    const balance = await spendTokens(userId, price);
                    const ok = await onUnlockAvatar(avatar.level);
                    if (ok) {
                      updateTokenBalanceCache(userId, balance);
                      onAvatarPurchased(avatar.level);
                    }
                  } catch {
                    // Keep shop state unchanged on payment or unlock failure.
                  }
                  setUnlocking(null);
                }}
                disabled={unlocking === avatar.level || !canBuy}
                className="relative flex items-center gap-1.5 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[10px] text-raw-gold transition hover:bg-raw-gold/20 disabled:opacity-50"
              >
                <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
                {unlocking === avatar.level ? "..." : `${price} tokens`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Loot Spin ───────────────────────────────────────────────────────────────

const SPIN_COST = 50;
const SPIN_PRIZES = RARITY_ORDER.map((r) => ({
  id: r,
  rarity: r,
  label: RARITY_CONFIG[r].label,
  color: RARITY_CONFIG[r].color,
  glow: RARITY_CONFIG[r].glow,
  weight: RARITY_CONFIG[r].defaultWeight,
}));

export function LootSpin({ tokenBalance }: { tokenBalance: number }) {
  const [result, setResult] = useState<(typeof SPIN_PRIZES)[number] | null>(null);

  const canSpin = tokenBalance >= SPIN_COST;
  const wheelPrizes: WheelPrize[] = SPIN_PRIZES.map((prize) => ({
    id: prize.id,
    label: `${prize.label} Drop`,
    shortLabel: prize.label.toUpperCase(),
    color: `${prize.color}26`,
    textColor: prize.color,
  }));
  const prizeWeights = SPIN_PRIZES.reduce<Partial<Record<string, number>>>((acc, prize) => {
    acc[prize.id] = prize.weight;
    return acc;
  }, {});

  const handleSpinEnd = (prize: WheelPrize) => {
    setResult(SPIN_PRIZES.find((entry) => entry.id === prize.id) ?? SPIN_PRIZES[0]);
  };

  return (
    <div className="rounded-2xl border border-raw-border/35 bg-raw-black/45 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-raw-gold/60" />
        <h3 className="font-display text-sm tracking-wide text-raw-text">Rarity Spin</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-raw-border/35 bg-raw-black/50 px-2.5 py-1 text-[10px] text-raw-silver/50">
          <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
          {SPIN_COST} per spin
        </span>
      </div>

      <div className="flex justify-center">
        <WheelOfFortune
          prizes={wheelPrizes}
          prizeWeights={prizeWeights}
          onSpinEnd={handleSpinEnd}
          disabled={!canSpin}
          radius={145}
        />
      </div>

      {result && (
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold"
          style={{ borderColor: `${result.color}50`, color: result.color, background: `${result.glow}18` }}
        >
          {result.label} Rarity Drop!
        </div>
      )}
      {!canSpin && (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-raw-border/30 bg-raw-surface/20 py-2.5 text-sm font-semibold text-raw-silver/45">
          <Lock className="h-3.5 w-3.5" />
          Need {SPIN_COST} tokens
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardInventory({
  polls,
  votedPolls,
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  avatarCatalog,
  tokenBalance,
  userId,
}: DashboardInventoryProps) {
  const pollsAnswered = votedPolls.size;

  const ownedAvatars = avatarCatalog.filter((avatar) => ownedAvatarLevels.has(avatar.level));
  const [ownedInsightIds, setOwnedInsightIds] = useState<Set<string>>(() => readOwnedInsightIds(userId));
  useEffect(() => {
    const refresh = () => setOwnedInsightIds(readOwnedInsightIds(userId));
    window.addEventListener("storage", refresh);
    window.addEventListener("raw:insights-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("raw:insights-updated", refresh);
    };
  }, [userId]);
  const ownedInsights = PERSONALITY_INSIGHTS_CATALOG.filter((i) => ownedInsightIds.has(i.id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          <Archive className="h-5 w-5 text-raw-gold/60" />
          Inventory
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Everything you've collected — avatars, insights, and rewards.
        </p>
      </header>

      {/* Owned Avatars */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Your Avatars</h2>
        {ownedAvatars.length === 0 ? (
          <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
            You don't own any avatars yet. Visit the Store to unlock some.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ownedAvatars.map((avatar) => {
              const rarity = avatar.rarity ?? "common";
              const rarityConfig = RARITY_CONFIG[rarity];
              return (
                <button
                  type="button"
                  key={avatar.id}
                  onClick={() => onAvatarChange(avatar.level)}
                  className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border bg-raw-black/45 p-3 text-center transition hover:-translate-y-0.5 hover:bg-raw-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
                  style={{
                    borderColor: avatar.level === avatarLevel ? rarityConfig.color : `${rarityConfig.color}40`,
                    boxShadow: avatar.level === avatarLevel ? `0 0 0 1px ${rarityConfig.color}55` : undefined,
                  }}
                  aria-pressed={avatar.level === avatarLevel}
                  aria-label={`Use ${avatar.name} avatar`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />
                  <AvatarFigure avatarIndex={avatar.level} size="md" selected={avatar.level === avatarLevel} rarity={rarity} />
                  <div className="relative text-center">
                    <p className="text-xs font-medium text-raw-text line-clamp-1">{avatar.name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: rarityConfig.color }}>
                      {rarityConfig.label}
                    </p>
                    <p className="mt-1 text-[10px] text-raw-silver/45">
                      {avatar.level === avatarLevel ? "Selected" : "Tap to use"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Owned Identity Reports */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Identity Reports</h2>
        {ownedInsights.length === 0 ? (
          <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
            You haven't unlocked any identity reports yet. Visit the Store to buy one.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ownedInsights.map((insight) => {
              const Icon = insight.icon;
              return (
                <article
                  key={insight.id}
                  className={`relative overflow-hidden rounded-2xl border ${insight.border} bg-gradient-to-br ${insight.accent} p-4`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-raw-black/20" />
                  <div className="relative flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 ${insight.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base leading-tight text-raw-text">{insight.name}</h3>
                        <span className="shrink-0 rounded-full border border-emerald-300/45 bg-emerald-400/15 px-2.5 py-1 text-[10px] text-emerald-200">
                          Owned
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-raw-silver/65">{insight.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {/* Placeholder for unused props to avoid TS warnings without dropping the interface */}
      <span className="hidden" data-polls={polls.length} data-polls-answered={pollsAnswered} data-balance={tokenBalance} />
    </div>
  );
}
