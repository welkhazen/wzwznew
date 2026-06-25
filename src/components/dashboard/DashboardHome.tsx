import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { Dices, Zap, Users, BarChart3 } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
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
  onOpenPoll: (pollId: string) => void;
  isAdmin?: boolean;
  onAwardXP?: (amount: number) => Promise<void>;
  onAvatarWon?: (level: number) => void;
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
