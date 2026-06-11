import { useEffect, useState } from "react";
import { Check, Heart, MessageSquare, Mic2, Pin, ShieldOff, Target, Trash2, User, Users, X } from "lucide-react";
import { useProfileStats } from "@/hooks/useProfileStats";
import type { PinnedMessageRecord } from "@/backend/supabase/controllers/userExtrasController";
import type { Poll } from "@/store/useRawStore";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { LEVEL_THEMES, getAvatar, getPrivateAvatarLevel, privateAvatarKey } from "@/lib/avataridentity";
import { PersonalityInsightsInventory } from "@/components/dashboard/PersonalityInsightsInventory";
import { addOwnedInsightId, readOwnedInsightIds } from "@/lib/insightsOwnership";
import { spendTokens } from "@/lib/api/tokens";
import { CHAT_IDENTITY_CHANGED_EVENT, readSelectedChatAlias, writeSelectedChatAlias } from "@/lib/identitySelection";
import { toast } from "@/components/ui/use-toast";
import {
  listUserAliases,
  savePrivateAlias,
  deleteUserAlias,
  setChatIdentity,
  type UserAliasRow,
} from "@/backend/supabase/controllers/userController";

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
  pinnedMessages?: PinnedMessageRecord[];
  onRemovePinnedMessage?: (messageId: string) => void;
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
  pinnedMessages = [],
  onRemovePinnedMessage,
  polls,
  tokenBalance,
}: DashboardProfileProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [ownedInsightIds, setOwnedInsightIds] = useState<Set<string>>(() => readOwnedInsightIds(userId));

  // Private identity
  const [privateAlias, setPrivateAlias] = useState<UserAliasRow | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [aliasSaving, setAliasSaving] = useState(false);
  const [editingAlias, setEditingAlias] = useState(false);
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(() => readSelectedChatAlias(userId));
  const [privateAvatarLevel, setPrivateAvatarLevel] = useState<number>(() => getPrivateAvatarLevel(userId));
  const [hoveredPrivateIndex, setHoveredPrivateIndex] = useState<number | null>(null);

  useEffect(() => {
    setOwnedInsightIds(readOwnedInsightIds(userId));
  }, [userId]);

  useEffect(() => {
    listUserAliases(userId)
      .then((rows) => {
        const priv = rows.find((r) => !r.is_public) ?? null;
        setPrivateAlias(priv);
        setAliasInput(priv?.alias ?? "");
        setSelectedChatAlias((current) => {
          if (!current) return null;
          return priv && priv.alias.toLowerCase() === current.toLowerCase() ? current : null;
        });
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    setSelectedChatAlias(readSelectedChatAlias(userId));
    if (typeof window === "undefined") return;
    const handleIdentityChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; alias?: string | null }>).detail;
      if (detail?.userId !== userId) return;
      setSelectedChatAlias(detail.alias ?? null);
      setPrivateAvatarLevel(getPrivateAvatarLevel(userId));
    };
    window.addEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
    return () => window.removeEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
  }, [userId]);

  function handlePrivateAvatarChange(lvl: number) {
    setPrivateAvatarLevel(lvl);
    window.localStorage.setItem(privateAvatarKey(userId), String(lvl));
    if (selectedChatAlias) {
      writeSelectedChatAlias(userId, selectedChatAlias);
    }
    void setChatIdentity(selectedChatAlias, lvl).catch(() => {});
  }

  function handleSelectChatAlias(alias: string | null) {
    setSelectedChatAlias(alias);
    writeSelectedChatAlias(userId, alias);
    void setChatIdentity(alias, privateAvatarLevel).catch(() => {});
  }

  async function handleSaveAlias() {
    const trimmed = aliasInput.trim();
    if (!/^[A-Za-z0-9._-]{3,24}$/.test(trimmed)) {
      toast({ title: "3–24 letters, numbers, dots, dashes, or underscores only." });
      return;
    }
    setAliasSaving(true);
    try {
      const row = await savePrivateAlias(trimmed);
      setPrivateAlias(row);
      setAliasInput(row.alias);
      setEditingAlias(false);
      handleSelectChatAlias(row.alias);
      toast({ title: "Private name saved" });
    } catch (e) {
      toast({ title: "Could not save name", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setAliasSaving(false);
    }
  }

  async function handleDeleteAlias() {
    if (!privateAlias) return;
    try {
      await deleteUserAlias(privateAlias.id);
      setPrivateAlias(null);
      setAliasInput("");
      setEditingAlias(false);
      if (selectedChatAlias?.toLowerCase() === privateAlias.alias.toLowerCase()) {
        handleSelectChatAlias(null);
      }
      toast({ title: "Private name removed" });
    } catch {
      toast({ title: "Could not remove name" });
    }
  }

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
  const avatarThemeCount = Array.isArray(LEVEL_THEMES) && LEVEL_THEMES.length > 0 ? LEVEL_THEMES.length : Math.max(avatarLevel, 1);
  const ownedLevelSet = ownedAvatarLevels instanceof Set ? ownedAvatarLevels : new Set<number>([avatarLevel]);
  const ownedLevels = Array.from({ length: avatarThemeCount }, (_, i) => i + 1)
    .filter((lvl) => ownedLevelSet.has(lvl));

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

      {/* Private identity card */}
      <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldOff className="h-4 w-4 text-raw-gold/50" />
          <p className="text-sm font-semibold text-raw-text">Private identity</p>
        </div>

        <div className="mt-4 rounded-xl border border-raw-border/30 bg-raw-black/25 p-2">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">Chat name</p>
          <button
            type="button"
            onClick={() => handleSelectChatAlias(null)}
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
              !selectedChatAlias ? "bg-raw-gold/15 text-raw-gold" : "text-raw-silver/60 hover:bg-white/5 hover:text-raw-text"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">@{username}</span>
            </span>
            {!selectedChatAlias && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          {privateAlias && (
            <button
              type="button"
              onClick={() => handleSelectChatAlias(privateAlias.alias)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                selectedChatAlias?.toLowerCase() === privateAlias.alias.toLowerCase()
                  ? "bg-raw-gold/15 text-raw-gold"
                  : "text-raw-silver/60 hover:bg-white/5 hover:text-raw-text"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ShieldOff className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">@{privateAlias.alias}</span>
              </span>
              {selectedChatAlias?.toLowerCase() === privateAlias.alias.toLowerCase() && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <AvatarFigure avatarIndex={hoveredPrivateIndex ?? privateAvatarLevel} size="lg" selected />
          <div className="min-w-0 flex-1">
            {editingAlias || !privateAlias ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value.slice(0, 24))}
                  placeholder="Private name (3–24 chars)"
                  className="flex-1 rounded-lg border border-raw-border/40 bg-raw-black/40 px-3 py-2 text-sm text-raw-text placeholder:text-raw-silver/30 focus:border-raw-gold/60 focus:outline-none"
                  disabled={aliasSaving}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleSaveAlias(); }}
                />
                <button
                  type="button"
                  onClick={() => void handleSaveAlias()}
                  disabled={aliasSaving || aliasInput.trim().length < 3}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raw-gold text-raw-ink transition-opacity disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                </button>
                {privateAlias && (
                  <button
                    type="button"
                    onClick={() => { setEditingAlias(false); setAliasInput(privateAlias.alias); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-raw-border/40 text-raw-silver/50 hover:text-raw-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-raw-text">@{privateAlias.alias}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/30">Private name</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingAlias(true)}
                    className="rounded-lg border border-raw-border/30 px-2.5 py-1 text-[11px] text-raw-silver/60 hover:border-raw-gold/30 hover:text-raw-gold"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAlias()}
                    className="rounded-lg border border-raw-border/30 px-2.5 py-1 text-[11px] text-raw-silver/40 hover:border-red-500/30 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            <p className="mt-2 text-[11px] text-raw-silver/30">
              One private alias per account. Pick an avatar below.
            </p>
          </div>
        </div>

        {/* Private avatar selector */}
        <div className="mt-4 flex w-full flex-wrap justify-center gap-1.5">
          {ownedLevels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => handlePrivateAvatarChange(lvl)}
              onMouseEnter={() => setHoveredPrivateIndex(lvl)}
              onMouseLeave={() => setHoveredPrivateIndex(null)}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/40"
              aria-label={`Use avatar ${lvl} for private identity`}
              aria-pressed={lvl === privateAvatarLevel}
            >
              <AvatarFigure avatarIndex={lvl} size="sm" selected={lvl === privateAvatarLevel} />
            </button>
          ))}
        </div>
      </div>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] text-raw-gold/50">
            <Pin className="h-3 w-3" /> Pinned messages ({pinnedMessages.length}/7)
          </p>
          {pinnedMessages.map((pinnedMessage) => (
            <div
              key={pinnedMessage.messageId}
              className="flex items-start gap-2 rounded-xl border border-raw-gold/20 bg-raw-gold/5 px-4 py-3"
            >
              <p className="flex-1 text-xs leading-relaxed text-raw-text/70">{pinnedMessage.messageText}</p>
              {onRemovePinnedMessage && (
                <button
                  type="button"
                  onClick={() => onRemovePinnedMessage(pinnedMessage.messageId)}
                  className="shrink-0 rounded-lg p-1 text-raw-silver/40 hover:text-red-400"
                  aria-label="Remove pinned message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
          totalPolls={(polls ?? []).length}
          tokenBalance={tokenBalance}
          ownedIds={ownedInsightIds}
          onPurchase={handlePurchaseInsight}
        />
      </section>
    </div>
  );
}
