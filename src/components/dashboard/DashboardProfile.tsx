import { useEffect, useState } from "react";
import { Heart, MessageSquare, Mic2, Pin, Target, Users } from "lucide-react";
import { useProfileStats } from "@/hooks/useProfileStats";
import type { PinnedMessageRecord } from "@/backend/supabase/controllers/userExtrasController";
import type { Poll } from "@/store/useRawStore";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { LEVEL_THEMES, getAvatar } from "@/lib/avataridentity";
import { PersonalityInsightsInventory } from "@/components/dashboard/DashboardInventory";
import { addOwnedInsightId, readOwnedInsightIds } from "@/lib/insightsOwnership";
import { spendTokens } from "@/lib/api/tokens";
import { toast } from "@/components/ui/use-toast";

const TOKEN_BALANCE_STORAGE_PREFIX = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

function pushTokenBalance(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  const key = `${TOKEN_BALANCE_STORAGE_PREFIX}.${userId}`;
  window.localStorage.setItem(key, String(balance));
  window.dispatchEvent(new CustomEvent(TOKEN_BALANCE_UPDATED_EVENT, { detail: { storageKey: key, balance } }));
}

interface DashboardProfileProps {
  userId: string;
  username: string;
  avatarLevel: number;
  onAvatarChange: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  avatarPricesByLevel: Record<number, string>;
  pollsAnswered: number;
  xp?: number;
  xpLevel?: number;
  pinnedMessage?: PinnedMessageRecord | null;
  onLogout: () => void;
  /** Used by the Personality Insights section to compute totals. */
  polls: Poll[];
  /** Live token balance for insight purchases. */
  tokenBalance: number;
}

const STAT_ICONS = {
  polls: Target,
  comments: MessageSquare,
  likes: Heart,
  hosts: Mic2,
  communities: Users,
  pinned: Pin,
} as const;

export function DashboardProfile({
  userId,
  username,
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  pollsAnswered,
  xp = 0,
  xpLevel = 1,
  polls,
  tokenBalance,
}: DashboardProfileProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [ownedInsightIds, setOwnedInsightIds] = useState<Set<string>>(() => readOwnedInsightIds(userId));

  useEffect(() => {
    setOwnedInsightIds(readOwnedInsightIds(userId));
  }, [userId]);

  const handlePurchaseInsight = async (insightId: string, tokenPrice: number) => {
    if (tokenBalance < tokenPrice) {
      toast({ title: "Not enough tokens", description: `You need ${tokenPrice} tokens.` });
      return;
    }
    try {
      const newBalance = await spendTokens(userId, tokenPrice);
      pushTokenBalance(userId, newBalance);
      const next = addOwnedInsightId(userId, insightId);
      setOwnedInsightIds(new Set(next));
      window.dispatchEvent(new CustomEvent("raw:insights-updated"));
      toast({ title: "Report unlocked", description: `${tokenPrice} tokens spent.` });
    } catch {
      toast({ title: "Unlock failed", description: "Please try again." });
    }
  };

  const { stats: profileStats, isLoading: isLoadingStats } = useProfileStats(userId);
  // Prefer the live `pollsAnswered` prop while the RPC is hydrating —
  // it lags the cache by at most one onboarding answer.
  const statCards = [
    { key: "polls",       icon: STAT_ICONS.polls,       label: "Polls",             value: isLoadingStats ? pollsAnswered : profileStats.polls },
    { key: "comments",    icon: STAT_ICONS.comments,    label: "Comments on Polls", value: profileStats.commentsOnPolls },
    { key: "likes",       icon: STAT_ICONS.likes,       label: "Likes Received",    value: profileStats.likesReceived },
    { key: "hosts",       icon: STAT_ICONS.hosts,       label: "Hosts Made",        value: profileStats.hostsMade },
    { key: "communities", icon: STAT_ICONS.communities, label: "Communities Joined",value: profileStats.communitiesJoined },
    { key: "pinned",      icon: STAT_ICONS.pinned,      label: "Messages Pinned",   value: profileStats.messagesPinned },
  ];

  const displayIndex = hoveredIndex ?? avatarLevel;
  const theme = getAvatar(displayIndex);
  const ownedLevels = Array.from({ length: LEVEL_THEMES.length }, (_, i) => i + 1)
    .filter((lvl) => ownedAvatarLevels.has(lvl));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          Profile
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Your anonymous identity. Your progress. Your growth.
        </p>
      </div>

      {/* Avatar card */}
      <div className="flex flex-col items-center rounded-2xl border border-raw-border/40 bg-raw-surface/40 px-4 py-5 text-center sm:px-6 sm:py-6">
        <AvatarFigure avatarIndex={displayIndex} size="xl" selected />
        <p className="mt-3 font-display text-lg tracking-wide text-raw-text">
          {username}
        </p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-raw-silver/30">Public name</p>
        <p className="text-xs text-raw-gold/60">Level {displayIndex}</p>
        <p className="text-[10px] text-raw-silver/30">{theme.name}</p>

        <LevelProgressBanner xp={xp} level={xpLevel} className="mt-4 w-full" />

        {/* Level selector — flex-wrap with fixed tile size so rows
            never overlap and avatars stay aligned on every viewport. */}
        <div className="mt-4 flex w-full flex-wrap justify-center gap-1.5">
          {ownedLevels.map(
            (lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  onAvatarChange(lvl);
                }}
                onMouseEnter={() => setHoveredIndex(lvl)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(lvl)}
                onBlur={() => setHoveredIndex(null)}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/40"
                aria-label={`Preview level ${lvl}`}
                aria-pressed={lvl === avatarLevel}
              >
                <AvatarFigure
                  avatarIndex={lvl}
                  size="sm"
                  selected={lvl === avatarLevel}
                />
              </button>
            )
          )}
        </div>
      </div>

      {/* Stats grid — 6 cards in a 3x2 layout */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-3 text-center sm:p-4"
            >
              <Icon className="mx-auto mb-1.5 h-3.5 w-3.5 text-raw-gold/40" />
              <p className="text-base font-bold text-raw-text sm:text-lg">
                {Number(stat.value).toLocaleString()}
              </p>
              <p className="mt-0.5 text-[8px] uppercase leading-tight tracking-wider text-raw-silver/30 sm:text-[9px]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Personality Insights — moved here from the Store tab. Lives next to
          the profile stats since insights are part of the user's identity. */}
      <section>
        <PersonalityInsightsInventory
          pollsAnswered={profileStats.polls || pollsAnswered}
          totalPolls={polls.length}
          tokenBalance={tokenBalance}
          ownedIds={ownedInsightIds}
          onPurchase={handlePurchaseInsight}
        />
      </section>
    </div>
  );
}
