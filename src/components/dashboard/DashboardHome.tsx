import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { ChevronRight, Dices, Zap, Users, BarChart3 } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import { COMMUNITY_COVER_IMAGES, COMMUNITY_COVER_VIDEOS } from "@/lib/communityConstants";
import { getTodayKey } from "@/store/useRawStore.storage";
import { useTheme } from "@/providers/useTheme";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { WheelOfFortune } from "@/components/wheel/WheelOfFortune";
import { buildSpinPrizes } from "@/lib/spin-prizes";
import { TrendingPollsBox } from "@/components/dashboard/TrendingPollsBox";

const DashboardDailySpin = lazy(() =>
  import("@/components/dashboard/DashboardDailySpin").then((m) => ({ default: m.DashboardDailySpin }))
);

interface DashboardHomeProps {
  username: string;
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
  onOpenPoll: (pollId: string) => void;
  isAdmin?: boolean;
  onAwardXP?: (amount: number) => Promise<void>;
  onAvatarWon?: (level: number) => void;
}

function CommunityCard({
  community,
  rank,
  isLight,
  onOpenCommunity,
}: {
  community: PersistedCommunityRecord;
  rank?: number;
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
        {rank !== undefined && (
          <div className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black border ${
            rank === 0
              ? "bg-raw-gold/20 text-raw-gold border-raw-gold/30"
              : isLight
                ? "bg-white/80 text-slate-500 border-slate-200"
                : "bg-black/50 text-white/50 border-white/10"
          }`}>
            #{rank + 1}
          </div>
        )}
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
  userId,
  polls,
  dailyAnsweredCount,
  dailyPollLimit,
  xp,
  xpLevel,
  communities,
  onNavigate,
  onOpenCommunity,
  onOpenPoll,
  isAdmin,
  onAwardXP,
  onAvatarWon,
}: DashboardHomeProps) {
  const { mode, accent, accentPresets } = useTheme();
  const accentRgb = useMemo(
    () => accentPresets.find((preset) => preset.id === accent)?.rgb ?? "241 196 45",
    [accent, accentPresets],
  );
  const spinPrizes = useMemo(
    () => buildSpinPrizes(mode === "light" ? "light" : "dark", accentRgb),
    [mode, accentRgb],
  );
  const isLight = mode === "light";
  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = communities;

  const spinStorageKey = userId ? `raw.daily-spin.${userId}` : null;
  const hasSpunToday = useMemo(() => {
    if (!spinStorageKey) return false;
    try {
      const stored = localStorage.getItem(spinStorageKey);
      if (!stored) return false;
      return (JSON.parse(stored) as { date: string }).date === getTodayKey();
    } catch { return false; }
  }, [spinStorageKey]);

  const [spinCountdown, setSpinCountdown] = useState("");
  const spinTimerRef = useRef<number | null>(null);
  const updateSpinCountdown = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setSpinCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
  }, []);
  useEffect(() => {
    if (!hasSpunToday) { setSpinCountdown(""); return; }
    updateSpinCountdown();
    spinTimerRef.current = window.setInterval(updateSpinCountdown, 1000);
    return () => { if (spinTimerRef.current) window.clearInterval(spinTimerRef.current); };
  }, [hasSpunToday, updateSpinCountdown]);

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
            Welcome to <span className="text-raw-gold">raW</span>.
          </h1>
          <div className="mt-6 flex items-center gap-3">
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
      {joinedCommunities.length > 0 && (
        <section className="space-y-5">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-raw-gold" />
                <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Your Communities</h2>
              </div>
              <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>Anonymous circles you've joined.</p>
            </div>
            <button
              onClick={() => onNavigate("communities")}
              className="text-sm text-raw-gold hover:underline flex items-center gap-1 font-bold"
            >
              View All <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {joinedCommunities.slice(0, 4).map((community) => (
              <CommunityCard key={community.id} community={community} isLight={isLight} onOpenCommunity={onOpenCommunity} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Polls */}
      <section className={`space-y-5 border-t pt-10 ${isLight ? "border-slate-200" : "border-white/5"}`}>
        <TrendingPollsBox
          isLight={isLight}
          polls={polls}
          userId={userId}
          onOpenPoll={onOpenPoll}
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
