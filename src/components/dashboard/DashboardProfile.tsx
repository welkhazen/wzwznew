import { useEffect, useState } from "react";
import { Check, Copy, Heart, MessageSquare, Mic2, Share2, Target, Ticket, Users, X } from "lucide-react";
import { useProfileStats } from "@/hooks/useProfileStats";
import { fetchFoundingInviteCodes, registerFoundingInviteCodes, getFoundingInviteRedemptions } from "@/backend/supabase/controllers/userExtrasController";
import type { Poll } from "@/store/useRawStore";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LEVEL_THEMES, getAvatar, getPrivateAvatarLevel, privateAvatarKey } from "@/lib/avataridentity";
import { PersonalityInsightsInventory } from "@/components/dashboard/PersonalityInsightsInventory";
import { addOwnedInsightId, readOwnedInsightIds } from "@/lib/insightsOwnership";
import { spendTokens } from "@/lib/api/tokens";
import { CHAT_IDENTITY_CHANGED_EVENT, readSelectedChatAlias, writeSelectedChatAlias } from "@/lib/identitySelection";
import { toast } from "@/hooks/use-toast";
import {
  listUserAliases,
  savePrivateAlias,
  deleteUserAlias,
  setChatIdentity,
  type UserAliasRow,
} from "@/backend/supabase/controllers/userController";

const TOKEN_BALANCE_STORAGE_PREFIX = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

import {
  readFoundingInviteCodes,
  persistFoundingInviteCodes,
  buildInviteShareText,
  getOrSyncInviteCodes,
  FOUNDING_INVITE_COUNT,
  createInviteCode,
} from "@/lib/foundingInvites";

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
} as const;

interface AvatarGridProps {
  levels: number[];
  activeLevel: number;
  activeIdentity: "public" | "private";
  onSelect: (level: number) => void;
  onPreview: (level: number | null) => void;
}

function AvatarGrid({ levels, activeLevel, activeIdentity, onSelect, onPreview }: AvatarGridProps) {
  return (
    <div className="mt-5 flex w-full flex-wrap justify-center gap-1.5">
      {levels.map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onSelect(lvl)}
          onMouseEnter={() => onPreview(lvl)}
          onMouseLeave={() => onPreview(null)}
          onFocus={() => onPreview(lvl)}
          onBlur={() => onPreview(null)}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/40"
          aria-label={`Use avatar ${lvl} for ${activeIdentity} identity`}
          aria-pressed={lvl === activeLevel}
        >
          <AvatarFigure avatarIndex={lvl} size="sm" selected={lvl === activeLevel} />
        </button>
      ))}
    </div>
  );
}

export function DashboardProfile({
  userId,
  username,
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  pollsAnswered,
  polls,
  tokenBalance,
}: DashboardProfileProps) {
  const [hoveredAvatarLevel, setHoveredAvatarLevel] = useState<number | null>(null);
  const [activeIdentity, setActiveIdentity] = useState<"public" | "private">("public");
  const [ownedInsightIds, setOwnedInsightIds] = useState<Set<string>>(() => readOwnedInsightIds(userId));
  const [inviteCodes, setInviteCodes] = useState<string[]>(() => readFoundingInviteCodes(userId));
  const [openInviteIndex, setOpenInviteIndex] = useState<number | null>(null);
  const [redeemedCodes, setRedeemedCodes] = useState<Set<string>>(new Set());

  // Private identity
  const [privateAlias, setPrivateAlias] = useState<UserAliasRow | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [aliasSaving, setAliasSaving] = useState(false);
  const [editingAlias, setEditingAlias] = useState(false);
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(() => readSelectedChatAlias(userId));
  const [privateAvatarLevel, setPrivateAvatarLevel] = useState<number>(() => getPrivateAvatarLevel(userId));

  useEffect(() => {
    setOwnedInsightIds(readOwnedInsightIds(userId));
    // Load from localStorage immediately so UI isn't blank, then sync from Supabase.
    setInviteCodes(readFoundingInviteCodes(userId));
    setOpenInviteIndex(null);
    getOrSyncInviteCodes(userId, fetchFoundingInviteCodes, registerFoundingInviteCodes)
      .then((codes) => setInviteCodes(codes))
      .catch(() => {});
    getFoundingInviteRedemptions(userId)
      .then((redemptions) => {
        setRedeemedCodes(new Set(redemptions.map((r) => r.referralCode.toUpperCase())));
      })
      .catch(() => {});
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

  async function handleCopyInvite(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Invite code copied", description: code });
    } catch {
      toast({ title: "Could not copy invite", description: "Select the code and copy it manually." });
    }
  }

  async function handleShareInvite(code: string) {
    const shareText = buildInviteShareText(code);
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        // Fall back to copying below if native share is cancelled or unavailable.
      }
    }
    await handleCopyInvite(shareText);
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
  ].filter((stat) => stat.key !== "hosts" || Number(stat.value) > 0);

  const isPublicActive = activeIdentity === "public";
  const activeLevel = isPublicActive ? avatarLevel : privateAvatarLevel;
  const displayIndex = hoveredAvatarLevel ?? activeLevel;
  const theme = getAvatar(displayIndex);
  const avatarThemeCount = Array.isArray(LEVEL_THEMES) && LEVEL_THEMES.length > 0 ? LEVEL_THEMES.length : Math.max(avatarLevel, 1);
  const ownedLevelSet = ownedAvatarLevels instanceof Set ? ownedAvatarLevels : new Set<number>([avatarLevel]);
  const ownedLevels = Array.from({ length: avatarThemeCount }, (_, i) => i + 1)
    .filter((lvl) => ownedLevelSet.has(lvl));

  const handleInventorySelect = (lvl: number) => {
    if (isPublicActive) {
      onAvatarChange(lvl);
    } else {
      handlePrivateAvatarChange(lvl);
    }
  };

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

      {/* Unified Identity card */}
      <div className="rounded-2xl border border-raw-border/40 bg-raw-surface/40 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4 text-center sm:text-left">
          <p className="text-sm font-semibold text-raw-text">Identity</p>
          <p className="mt-1 text-[11px] text-raw-silver/40">
            Your public and private identity. Click one to edit.
          </p>
        </div>

        {/* Public + Private selector row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveIdentity("public")}
            aria-pressed={isPublicActive}
            className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
              isPublicActive
                ? "border-raw-gold/60 bg-raw-gold/[0.08] shadow-[0_0_24px_rgba(241,196,45,0.12)]"
                : "border-raw-border/40 bg-raw-black/20 hover:border-raw-gold/30"
            }`}
          >
            <AvatarFigure avatarIndex={avatarLevel} size="lg" selected={isPublicActive} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">Public</span>
            <span className="w-full truncate text-sm font-bold text-raw-text">{username}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveIdentity("private")}
            aria-pressed={!isPublicActive}
            className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all ${
              !isPublicActive
                ? "border-raw-gold/60 bg-raw-gold/[0.08] shadow-[0_0_24px_rgba(241,196,45,0.12)]"
                : "border-raw-border/40 bg-raw-black/20 hover:border-raw-gold/30"
            }`}
          >
            <AvatarFigure avatarIndex={privateAvatarLevel} size="lg" selected={!isPublicActive} />
            <span className="text-[10px] uppercase tracking-[0.18em] text-raw-silver/45">Private</span>
            <span className="w-full truncate text-sm font-bold text-raw-text">
              {privateAlias ? `@${privateAlias.alias}` : "Not set"}
            </span>
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-raw-gold/70">
          Currently editing: {isPublicActive ? "Public Identity" : "Private Identity"}
        </p>

        {/* Identity-specific details */}
        {isPublicActive ? (
          <div className="mt-4 flex flex-col items-center text-center">
            <p className="font-display text-lg tracking-wide text-raw-text">{username}</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-raw-silver/30">Public name</p>
            <p className="text-xs text-raw-gold/60">Level {displayIndex}</p>
            <p className="text-[10px] text-raw-silver/30">{theme.name}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-raw-border/30 bg-raw-black/25 p-3">
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
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-raw-text">@{privateAlias.alias}</p>
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
        )}

        <AvatarGrid
          levels={ownedLevels}
          activeLevel={activeLevel}
          activeIdentity={activeIdentity}
          onSelect={handleInventorySelect}
          onPreview={setHoveredAvatarLevel}
        />
      </div>

      {/* Founding invitation tickets */}
      <section className="rounded-2xl border border-raw-gold/20 bg-raw-surface/40 px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-raw-text">
              <Ticket className="h-4 w-4 text-raw-gold/60" /> Founding invitations
            </p>
            <p className="mt-1 text-xs leading-relaxed text-raw-silver/40">
              You get two founding invite codes. Reveal one, copy it, or share it with a friend.
            </p>
          </div>
          <span className="rounded-full border border-raw-gold/25 bg-raw-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-raw-gold/70">
            2 total
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {inviteCodes.map((code, index) => {
            const isOpen = openInviteIndex === index;
            const isUsed = redeemedCodes.has(code.toUpperCase());
            return (
              <div
                key={code}
                role="button"
                tabIndex={0}
                onClick={() => !isUsed && setOpenInviteIndex(isOpen ? null : index)}
                onKeyDown={(event) => {
                  if (!isUsed && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    setOpenInviteIndex(isOpen ? null : index);
                  }
                }}
                className={`group relative overflow-hidden rounded-2xl border border-dashed p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/45 ${
                  isUsed
                    ? "cursor-default border-raw-border/20 bg-raw-black/15 opacity-60"
                    : "border-raw-gold/30 bg-raw-black/25 hover:-translate-y-0.5 hover:border-raw-gold/55 hover:bg-raw-gold/10"
                }`}
                aria-expanded={isOpen}
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-raw-gold/10 blur-xl transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-raw-gold/55">Invitation {index + 1}</p>
                    <p className="mt-1 text-xs text-raw-silver/35">
                      {isUsed ? "Code has been used" : `Tap ticket to ${isOpen ? "hide" : "reveal"}`}
                    </p>
                  </div>
                  {isUsed ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raw-gold/15">
                      <Check className="h-4 w-4 text-raw-gold" />
                    </span>
                  ) : (
                    <Ticket className="h-7 w-7 text-raw-gold/50" />
                  )}
                </div>

                {isOpen && !isUsed && (
                  <div className="relative mt-4 space-y-3 rounded-xl border border-raw-border/35 bg-raw-black/35 p-3">
                    <code className="block select-all break-all font-mono text-sm font-bold tracking-[0.12em] text-raw-gold">
                      {code}
                    </code>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCopyInvite(code);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-raw-border/40 px-3 py-2 text-[11px] font-semibold text-raw-silver/65 transition-colors hover:border-raw-gold/40 hover:text-raw-gold"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleShareInvite(code);
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-raw-gold px-3 py-2 text-[11px] font-bold text-raw-ink transition-opacity hover:opacity-90"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>



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
