import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { ChevronRight, Dices, Zap, Flame, Users, BarChart3, Sparkles } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import { readCommunityChats } from "@/lib/communityChat";
import { COMMUNITY_COVER_IMAGES, COMMUNITY_COVER_VIDEOS, FEATURED_COMMUNITY_IDS } from "@/lib/communityConstants";
import { getTodayKey } from "@/store/useRawStore.storage";
import { useTheme } from "@/providers/useTheme";

interface DashboardHomeProps {
  username: string;
  userId?: string;
  avatarLevel: number;
  polls: Poll[];
  votedPolls: Set<string>;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  onNavigate: (tab: DashboardTab) => void;
  onOpenCommunity: (communityId: string) => void;
}

function CommunityCard({
  community,
  rank,
  isLight,
  onOpenCommunity,
}: {
  community: ReturnType<typeof readCommunityChats>[number];
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
  dailyAnsweredCount,
  dailyPollLimit,
  onNavigate,
  onOpenCommunity,
}: DashboardHomeProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = useMemo(() => readCommunityChats(), []);

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

  const trending = useMemo(
    () => [...allCommunities].sort((a, b) => b.members.length - a.members.length).slice(0, 4),
    [allCommunities],
  );

  // Always show featured communities as picks regardless of trending overlap
  const picks = useMemo(
    () => FEATURED_COMMUNITY_IDS.map((id) => allCommunities.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c),
    [allCommunities],
  );

  const pollProgress = Math.min(100, (dailyAnsweredCount / dailyPollLimit) * 100);

  return (
    <div className="space-y-10 pb-6">

      {/* ── Hero ── */}
      <section className="relative">
        <div className="relative z-10">
          <h1 className={`font-display text-3xl md:text-4xl max-w-2xl leading-[1.15] ${isLight ? "text-slate-950" : "text-white"}`}>
            Stay{" "}
            <Suspense fallback={<span className="text-raw-gold italic">anonymous</span>}>
              <ContainerTextFlipLazy
                words={["anonymous", "connected", "growing", "raW"]}
                interval={2800}
                className="!text-3xl md:!text-4xl"
              />
            </Suspense>
            . Speak your truth without identity.
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
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

      {/* ── Trending ── */}
      <section className="space-y-5">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-raw-gold" />
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Trending</h2>
            </div>
            <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>Most active anonymous circles.</p>
          </div>
          <button
            onClick={() => onNavigate("communities")}
            className="text-sm text-raw-gold hover:underline flex items-center gap-1 font-bold"
          >
            View All <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {trending.map((community, i) => (
            <CommunityCard key={community.id} community={community} rank={i} isLight={isLight} onOpenCommunity={onOpenCommunity} />
          ))}
        </div>
      </section>

      {/* ── Personalized Picks ── */}
      {picks.length > 0 && (
        <section className={`space-y-5 border-t pt-10 ${isLight ? "border-slate-200" : "border-white/5"}`}>
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-raw-gold" />
                <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Personalized Picks</h2>
              </div>
              <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>Based on your recent activity.</p>
            </div>
            <button
              onClick={() => onNavigate("communities")}
              className="text-sm text-raw-gold hover:underline flex items-center gap-1 font-bold"
            >
              View All <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 pointer-events-none select-none opacity-40 blur-[2px]" aria-hidden="true" inert={true}>
              {picks.map((community) => (
                <CommunityCard key={community.id} community={community} isLight={isLight} onOpenCommunity={onOpenCommunity} />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
              <span className={`rounded-full border border-raw-gold/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-raw-gold backdrop-blur-sm ${isLight ? "bg-white/90" : "bg-raw-black/80"}`}>
                Coming Soon
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── Daily Poll Progress ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-raw-gold" />
          <h2 className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Daily Poll Progress</h2>
        </div>
        <div className={`rounded-2xl p-5 flex flex-wrap items-center gap-4 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/20">
              <BarChart3 className="size-5 text-raw-gold" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Voice Your Opinion</p>
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/40"}`}>50 XP per poll · anonymous</p>
            </div>
          </div>
          <div className="flex-1 min-w-[140px] space-y-1.5">
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
            className="shrink-0 px-5 py-2.5 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.18em] hover:bg-raw-gold/5 transition-all"
          >
            Answer Now
          </button>
        </div>
      </section>

      {/* ── Challenges ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-raw-gold" />
          <h2 className={`text-xl font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Challenges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Spin */}
          <div className={`p-6 rounded-[1.5rem] space-y-5 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Daily Spin</h3>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>Luck of the anonymous</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                <Dices className="size-5 text-raw-gold" />
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-white/50"}`}>Spin the wheel once a day for a chance to earn XP, badges, and avatar themes.</p>
            {hasSpunToday && spinCountdown ? (
              <div className={`rounded-xl border p-4 text-center ${isLight ? "border-slate-200 bg-slate-50" : "border-white/5 bg-white/[0.03]"}`}>
                <p className={`text-[10px] uppercase tracking-[0.16em] ${isLight ? "text-slate-500" : "text-white/30"}`}>Next spin in</p>
                <p className="mt-1.5 font-display text-2xl tracking-widest text-raw-gold/90">{spinCountdown}</p>
              </div>
            ) : (
              <button
                onClick={() => onNavigate("challenges")}
                className="w-full py-3 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
              >
                Spin Now
              </button>
            )}
          </div>

          {/* Level Up */}
          <div className={`p-6 rounded-[1.5rem] space-y-6 ${isLight ? "border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)]" : "border border-white/10 bg-[#1a1a1a]"}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Level Up</h3>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/40"}`}>Complete interactions to earn XP</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                <Zap className="size-5 text-raw-gold" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className={`text-xs font-bold ${isLight ? "text-slate-950" : "text-white"}`}>Polls Answered</span>
                <span className="text-base font-bold text-raw-gold">{dailyAnsweredCount} / {dailyPollLimit}</span>
              </div>
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLight ? "bg-slate-200" : "bg-white/5"}`}>
                <div
                  className="h-full bg-raw-gold rounded-full shadow-[0_0_10px_rgba(241,196,45,0.4)] transition-all duration-500"
                  style={{ width: `${pollProgress}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => onNavigate("challenges")}
              className="w-full py-4 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
            >
              View Missions
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
