import { Suspense, useMemo } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { Target, ChevronRight, Dices, Zap, TrendingUp, Flame, Users, Sparkles } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import { readCommunityChats } from "@/lib/communityChat";
import { COMMUNITY_COVER_IMAGES, COMMUNITY_COVER_VIDEOS, FEATURED_COMMUNITY_IDS } from "@/lib/communityConstants";
import { useTheme } from "@/providers/useTheme";

interface DashboardHomeProps {
  username: string;
  avatarLevel: number;
  polls: Poll[];
  votedPolls: Set<string>;
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  onNavigate: (tab: DashboardTab) => void;
  onOpenCommunity: (communityId: string) => void;
}

export function DashboardHome({
  username,
  polls,
  votedPolls,
  dailyAnsweredCount,
  dailyPollLimit,
  onNavigate,
  onOpenCommunity,
}: DashboardHomeProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";

  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = useMemo(() => readCommunityChats(), []);

  const trending = useMemo(
    () => [...allCommunities].sort((a, b) => b.members.length - a.members.length).slice(0, 4),
    [allCommunities],
  );

  const trendingIds = useMemo(() => new Set(trending.map((c) => c.id)), [trending]);

  const forYou = useMemo(
    () =>
      FEATURED_COMMUNITY_IDS.map((id) => allCommunities.find((c) => c.id === id))
        .filter(Boolean)
        .filter((c) => !trendingIds.has(c!.id))
        .concat(allCommunities.filter((c) => !trendingIds.has(c.id) && !FEATURED_COMMUNITY_IDS.includes(c.id as never)))
        .slice(0, 4) as typeof allCommunities,
    [allCommunities, trendingIds],
  );

  const sectionLabel = isLight
    ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
    : "text-xs font-semibold uppercase tracking-[0.18em] text-raw-silver/45";

  const cardBase = isLight
    ? "border border-slate-200 bg-white/80 shadow-sm"
    : "border border-raw-border/35 bg-raw-surface/30";

  return (
    <div className="space-y-10 pb-6">
      {/* ── Hero ── */}
      <div className={`rounded-2xl p-5 sm:p-7 ${isLight ? "bg-gradient-to-br from-amber-50 to-white border border-amber-100" : "bg-gradient-to-br from-raw-gold/[0.07] to-raw-black/0 border border-raw-gold/10"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={`font-display text-2xl tracking-wide sm:text-3xl md:text-4xl ${isLight ? "text-slate-900" : "text-raw-text"}`}>
            Stay
          </h1>
          <Suspense fallback={null}>
            <ContainerTextFlipLazy
              words={["anonymous", "connected", "growing", "raW"]}
              interval={2800}
              className="!text-xl sm:!text-2xl md:!text-3xl"
            />
          </Suspense>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>
            <Target className="size-3.5 text-raw-gold/60" />
            <span><span className={`font-bold ${isLight ? "text-slate-700" : "text-raw-text"}`}>{dailyAnsweredCount}</span> polls answered today</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>
            <Users className="size-3.5 text-raw-gold/60" />
            <span><span className={`font-bold ${isLight ? "text-slate-700" : "text-raw-text"}`}>{allCommunities.length}</span> communities</span>
          </div>
        </div>
      </div>

      {/* ── Trending Communities ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-orange-400" />
            <h2 className={`font-display text-base tracking-wide sm:text-lg ${isLight ? "text-slate-900" : "text-raw-text"}`}>
              Trending Communities
            </h2>
          </div>
          <button
            onClick={() => onNavigate("communities")}
            className={`flex items-center gap-1 text-xs transition-colors ${isLight ? "text-amber-600 hover:text-amber-700" : "text-raw-gold/60 hover:text-raw-gold"}`}
          >
            View All <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {trending.map((community, i) => {
            const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];
            const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
            return (
              <button
                key={community.id}
                onClick={() => onOpenCommunity(community.id)}
                className="group relative min-w-[200px] snap-start overflow-hidden rounded-2xl text-left sm:min-w-[220px]"
                style={{ aspectRatio: "3/4", flex: "0 0 auto" }}
              >
                {coverVideo ? (
                  <video src={coverVideo} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" autoPlay loop muted playsInline />
                ) : coverImage ? (
                  <img src={coverImage} alt={community.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-raw-gold/20 to-raw-black flex items-center justify-center">
                    <span className="font-display text-5xl text-raw-gold/30">{community.abbr}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5">
                  <TrendingUp className="size-2.5 text-white" />
                  <span className="text-[9px] font-bold uppercase tracking-wide text-white">#{i + 1}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p className="font-display text-sm font-semibold leading-tight text-white sm:text-base">{community.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-white/55">
                    <Users className="size-3" />
                    {community.members.length} members
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Communities for You ── */}
      {forYou.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-raw-gold/70" />
            <h2 className={`font-display text-base tracking-wide sm:text-lg ${isLight ? "text-slate-900" : "text-raw-text"}`}>
              Communities for You
            </h2>
          </div>
          <div className="flex flex-col divide-y divide-raw-border/20 overflow-hidden rounded-2xl border border-raw-border/30">
            {forYou.map((community) => {
              const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
              const isActive = community.status?.toLowerCase() === "active";
              return (
                <button
                  key={community.id}
                  onClick={() => onOpenCommunity(community.id)}
                  className={`group flex w-full items-center gap-3.5 p-3.5 text-left transition-colors ${isLight ? "bg-white hover:bg-amber-50/60" : "bg-raw-surface/20 hover:bg-raw-surface/40"}`}
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
                    {coverImage ? (
                      <img src={coverImage} alt={community.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-raw-gold/10">
                        <span className="font-display text-lg text-raw-gold/40">{community.abbr}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium leading-snug ${isLight ? "text-slate-900" : "text-raw-text"}`}>{community.title}</p>
                    <p className={`mt-0.5 line-clamp-1 text-[11px] ${isLight ? "text-slate-500" : "text-raw-silver/40"}`}>{community.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-raw-gold/10 text-raw-gold/70"}`}>
                      {community.status ?? "active"}
                    </span>
                    <ChevronRight className={`size-3.5 transition-transform group-hover:translate-x-0.5 ${isLight ? "text-slate-400" : "text-raw-silver/30"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Daily Polls ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Target className="size-4 text-raw-gold/70" />
          <h2 className={`font-display text-base tracking-wide sm:text-lg ${isLight ? "text-slate-900" : "text-raw-text"}`}>
            Answer Your Daily Polls
          </h2>
        </div>
        <div
          className={`relative overflow-hidden rounded-2xl p-5 ${isLight ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-white" : "border border-raw-gold/20 bg-gradient-to-br from-raw-gold/[0.06] to-raw-black/0"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-raw-text"}`}>Daily Poll</p>
              <p className={`mt-0.5 text-xs ${isLight ? "text-slate-500" : "text-raw-silver/45"}`}>Answer today's anonymous questions</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={sectionLabel}>Progress</span>
                  <span className={`text-xs font-bold ${isLight ? "text-amber-600" : "text-raw-gold/80"}`}>{dailyAnsweredCount} / {dailyPollLimit}</span>
                </div>
                <div className={`h-1.5 w-full overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-raw-border/30"}`}>
                  <div
                    className="h-full rounded-full bg-raw-gold transition-all duration-500"
                    style={{ width: `${Math.min(100, (dailyAnsweredCount / dailyPollLimit) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <p className={`text-3xl font-bold leading-none ${isLight ? "text-amber-600" : "text-raw-gold"}`}>{dailyItemsLeft}</p>
              <p className={`mt-1 text-[10px] uppercase tracking-wide ${isLight ? "text-slate-400" : "text-raw-silver/40"}`}>left</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("polls")}
            className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${isLight ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-raw-gold text-raw-ink hover:bg-raw-gold/90"}`}
          >
            Answer Now →
          </button>
        </div>
      </div>

      {/* ── Challenges ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Zap className="size-4 text-raw-gold/70" />
          <h2 className={`font-display text-base tracking-wide sm:text-lg ${isLight ? "text-slate-900" : "text-raw-text"}`}>
            Complete Challenges
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Daily Spin", desc: "Spin once and claim your reward", action: "Spin", Icon: Dices, color: "from-violet-500/10" },
            { title: "Level Up", desc: "Complete 3 interactions to earn XP", action: "Start", Icon: Zap, color: "from-sky-500/10" },
          ].map(({ title, desc, action, Icon, color }) => (
            <button
              key={title}
              onClick={() => onNavigate("challenges")}
              className={`group flex flex-col rounded-2xl border p-4 text-left transition-all ${isLight ? `border-slate-200 bg-gradient-to-br ${color} to-white hover:border-slate-300` : `border-raw-border/35 bg-gradient-to-br ${color} to-raw-black/0 hover:border-raw-border/60`}`}
            >
              <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${isLight ? "bg-slate-100" : "bg-raw-surface/50"}`}>
                <Icon className="size-4 text-raw-gold/60" />
              </div>
              <p className={`text-sm font-semibold leading-snug ${isLight ? "text-slate-900" : "text-raw-text"}`}>{title}</p>
              <p className={`mt-1 text-[11px] leading-snug ${isLight ? "text-slate-500" : "text-raw-silver/40"}`}>{desc}</p>
              <span className={`mt-3 text-[11px] font-semibold transition-colors ${isLight ? "text-amber-600 group-hover:text-amber-700" : "text-raw-gold/70 group-hover:text-raw-gold"}`}>
                {action} →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
