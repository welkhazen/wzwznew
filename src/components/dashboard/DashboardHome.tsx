import { Suspense, lazy, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Dices, Zap, Flame, ShieldOff, UserRound, Users, BarChart3 } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import { COMMUNITY_COVER_IMAGES, COMMUNITY_COVER_VIDEOS } from "@/lib/communityConstants";
import { useTheme } from "@/providers/useTheme";
import { BrandName } from "@/components/ui/brand-name";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { TrendingPollsBox } from "@/components/dashboard/TrendingPollsBox";

const DashboardDailySpin = lazy(() =>
  import("@/components/dashboard/DashboardDailySpin").then((m) => ({ default: m.DashboardDailySpin }))
);

interface DashboardHomeProps {
  username: string;
  identityName?: string;
  identityMode?: "public" | "private";
  identityOptions?: Array<{ label: string; mode: "public" | "private"; value: string | null }>;
  onIdentityChange?: (alias: string | null) => void;
  userId?: string;
  avatarLevel: number;
  polls: Poll[];
  votedPolls: Set<string>;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  xp: number;
  xpLevel: number;
  communities: PersistedCommunityRecord[];
  onNavigate: (tab: DashboardTab) => void;
  onOpenCommunity: (communityId: string) => void;
  isAdmin?: boolean;
  onAwardXP?: (amount: number) => Promise<void>;
  onAvatarWon?: (level: number) => void;
}

function CommunityCard({
  community,
  isLight,
  onOpenCommunity,
}: {
  community: PersistedCommunityRecord;
  isLight: boolean;
  onOpenCommunity: (id: string) => void;
}) {
  const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
  const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];

  return (
    <button
      onClick={() => onOpenCommunity(community.id)}
      className={`group relative rounded-2xl text-left w-full cursor-pointer transition-all duration-200 overflow-hidden ${
        isLight
          ? "border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)] hover:border-raw-gold/40"
          : "border border-white/5 bg-[#1a1a1a] hover:border-raw-gold/30"
      }`}
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden">
        {coverVideo ? (
          <video src={coverVideo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" autoPlay loop muted playsInline preload="auto" />
        ) : coverImage ? (
          <img src={coverImage} alt={community.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-raw-gold/5 flex items-center justify-center">
            <span className="font-display text-4xl text-raw-gold/20">{community.abbr}</span>
          </div>
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${isLight ? "from-white/88 via-white/20 to-transparent" : "from-[#1a1a1a]/80 to-transparent"}`} />
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className={`text-sm font-bold leading-snug mb-1 ${isLight ? "text-slate-950" : "text-white"}`}>{community.title}</h3>
        <p className={`text-[10px] uppercase tracking-[0.1em] font-bold flex items-center gap-1 ${isLight ? "text-slate-500" : "text-white/40"}`}>
          <Users className="size-2.5" />{community.members.length} members
        </p>
      </div>
    </button>
  );
}

export function DashboardHome({
  username,
  identityName = username,
  identityMode = "public",
  identityOptions,
  onIdentityChange,
  userId,
  polls,
  dailyAnsweredCount,
  dailyPollLimit,
  xp,
  xpLevel,
  communities,
  onNavigate,
  onOpenCommunity,
  isAdmin,
  onAwardXP,
  onAvatarWon,
}: DashboardHomeProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [identityMenuOpen, setIdentityMenuOpen] = useState(false);
  const allCommunities = communities;
  const switcherOptions = identityOptions ?? [{ label: username, mode: "public" as const, value: null }];

  const joinedCommunities = useMemo(() => {
    if (!userId) return [];
    return allCommunities.filter((community) =>
      community.members.some((member) => member.userId === userId),
    );
  }, [allCommunities, userId]);

  const hasReachedDailyPollLimit = dailyAnsweredCount >= dailyPollLimit;
  const pollProgress = dailyPollLimit > 0 ? Math.min(100, (dailyAnsweredCount / dailyPollLimit) * 100) : 0;

  return (
    <div className="space-y-10 pb-6">

      {/* ── Hero ── */}
      <section className="relative">
        <div className="relative z-10">
          <h1 className={`font-display max-w-2xl text-2xl leading-[1.08] sm:text-3xl md:text-4xl md:leading-[1.15] ${isLight ? "text-slate-950" : "text-white"}`}>
            Feeling <BrandName />,{" "}
            <span className="relative inline-flex align-baseline">
              <button
                type="button"
                onClick={() => setIdentityMenuOpen((open) => !open)}
                className={`inline-flex max-w-[11rem] items-center gap-1 rounded-xl px-1.5 text-left transition-colors sm:max-w-[18rem] ${
                  isLight ? "hover:bg-slate-100" : "hover:bg-white/5"
                }`}
                aria-expanded={identityMenuOpen}
                aria-haspopup="menu"
              >
                <span className="truncate">{identityName}</span>
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-raw-gold" />
              </button>
              {identityMenuOpen && (
                <div
                  role="menu"
                  className={`absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border p-1.5 text-sm shadow-xl ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-950 shadow-slate-900/10"
                      : "border-white/10 bg-[#151515] text-white shadow-black/40"
                  }`}
                >
                  {switcherOptions.map((option) => {
                    const isSelected = option.mode === identityMode && option.label === identityName;
                    const Icon = option.mode === "public" ? UserRound : ShieldOff;
                    return (
                      <button
                        key={`${option.mode}-${option.value ?? "public"}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => {
                          onIdentityChange?.(option.value);
                          setIdentityMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? "bg-raw-gold/15 text-raw-gold"
                            : isLight
                              ? "text-slate-700 hover:bg-slate-100"
                              : "text-white/75 hover:bg-white/5"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">@{option.label}</span>
                        </span>
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </span>
            ?
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${isLight ? "border-slate-200 bg-white/85" : "border-white/10 bg-white/5"}`}>
              <Flame className="size-3.5 text-raw-gold" />
              <span className={`text-xs font-medium capitalize tracking-wide ${isLight ? "text-slate-600" : "text-white/60"}`}>
                {identityMode} identity
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isLight ? "border-slate-200 bg-white/85" : "border-white/10 bg-white/5"}`}>
              <BarChart3 className="size-3.5 text-raw-gold" />
              <span className={`text-xs font-medium tracking-wide ${isLight ? "text-slate-600" : "text-white/60"}`}>{dailyAnsweredCount} polls answered</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isLight ? "border-slate-200 bg-white/85" : "border-white/10 bg-white/5"}`}>
              <Users className={`size-3.5 ${isLight ? "text-slate-500" : "text-white/60"}`} />
              <span className={`text-xs font-medium tracking-wide ${isLight ? "text-slate-600" : "text-white/60"}`}>{allCommunities.length} communities</span>
            </div>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-raw-gold/5 blur-[80px] rounded-full pointer-events-none" />
      </section>

      {/* ── Your Communities ── */}
      <section className="space-y-5">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-raw-gold" />
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Your Communities</h2>
            </div>
            <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>
              {joinedCommunities.length > 0
                ? "Anonymous circles you've joined."
                : "You haven't joined any communities yet."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("communities")}
            className="text-sm text-raw-gold hover:underline flex items-center gap-1 font-bold"
          >
            {joinedCommunities.length > 0 ? "View All" : "Browse"} <ChevronRight className="size-4" />
          </button>
        </div>
        {joinedCommunities.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {joinedCommunities.slice(0, 4).map((community) => (
              <CommunityCard key={community.id} community={community} isLight={isLight} onOpenCommunity={onOpenCommunity} />
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate("communities")}
            className={`flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-8 text-center transition ${
              isLight
                ? "border-slate-300 bg-white/60 text-slate-600 hover:border-amber-400 hover:text-amber-700"
                : "border-white/15 bg-raw-black/30 text-white/55 hover:border-raw-gold/40 hover:text-raw-gold"
            }`}
          >
            <Users className="size-6 text-raw-gold" />
            <p className="text-sm font-semibold">Find your people</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>
              Tap to browse the {allCommunities.length} anonymous communities and join the ones that fit.
            </p>
          </button>
        )}
      </section>

      {/* Trending Polls */}
      <section className={`space-y-5 border-t pt-10 ${isLight ? "border-slate-200" : "border-white/5"}`}>
        <TrendingPollsBox
          isLight={isLight}
          polls={polls}
          userId={userId}
        />
      </section>

      {/* ── Challenges ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-raw-gold" />
          <h2 className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Challenges</h2>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:items-stretch md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {/* Daily Spin */}
          <div className={`flex aspect-square w-[90vw] max-w-[22rem] shrink-0 flex-col overflow-visible p-4 rounded-[1.5rem] md:aspect-auto md:w-auto md:max-w-none md:p-6 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className={`text-lg font-bold tracking-tight md:text-xl ${isLight ? "text-slate-950" : "text-white"}`}>Daily Spin</h3>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>Luck of the anonymous</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                <Dices className="size-5 text-raw-gold" />
              </div>
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-visible md:mt-5">
              {userId ? (
                <Suspense fallback={null}>
                  <DashboardDailySpin
                    userId={userId}
                    isAdmin={isAdmin ?? false}
                    onAwardXP={onAwardXP}
                    onAvatarWon={onAvatarWon}
                  />
                </Suspense>
              ) : null}
            </div>
          </div>

          {/* Right column: Daily Poll Progress on top, Level Up below */}
          <div className="flex w-[78vw] max-w-[18rem] shrink-0 flex-col gap-4 md:w-auto md:max-w-none md:flex-1 md:gap-6">
            {/* Daily Poll Progress */}
            <div className={`flex min-h-[15.5rem] flex-col space-y-4 p-4 rounded-[1.5rem] md:min-h-0 md:flex-1 md:space-y-5 md:p-6 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h3 className={`text-lg font-bold tracking-tight md:text-xl ${isLight ? "text-slate-950" : "text-white"}`}>Daily Poll Progress</h3>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>50 XP per poll · anonymous</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                  <BarChart3 className="size-5 text-raw-gold" />
                </div>
              </div>
              <div className="space-y-2">
                <div className={`flex justify-between text-[11px] ${isLight ? "text-slate-500" : "text-white/40"}`}>
                  <span>Progress</span>
                  <span className="text-raw-gold font-bold">{dailyAnsweredCount} / {dailyPollLimit}</span>
                </div>
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? "bg-slate-200" : "bg-white/5"}`}>
                  <div className="h-full bg-raw-gold rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(241,196,45,0.4)]" style={{ width: `${pollProgress}%` }} />
                </div>
              </div>
              <button
                onClick={() => onNavigate("polls")}
                className="mt-auto w-full py-4 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
              >
                {hasReachedDailyPollLimit ? "Buy More - 10 Tokens" : "Answer Now"}
              </button>
            </div>

            {/* Level Up */}
            <div className={`flex min-h-[15.5rem] flex-col space-y-4 p-4 rounded-[1.5rem] md:min-h-0 md:flex-1 md:space-y-6 md:p-6 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h3 className={`text-lg font-bold tracking-tight md:text-xl ${isLight ? "text-slate-950" : "text-white"}`}>Level Up</h3>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>Complete interactions to earn XP</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                  <Zap className="size-5 text-raw-gold" />
                </div>
              </div>
              <LevelProgressBanner xp={xp} level={xpLevel} />
              <button
                onClick={() => onNavigate("challenges")}
                className="mt-auto w-full py-4 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
              >
                View Missions
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
