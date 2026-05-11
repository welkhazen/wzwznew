import { Suspense, useMemo } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { Target, ChevronRight, Dices, Zap, Flame, Users, Sparkles } from "lucide-react";
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

const RANK_COLORS = [
  "bg-amber-500 text-white",
  "bg-zinc-500 text-white",
  "bg-orange-700 text-white",
];

export function DashboardHome({
  dailyAnsweredCount,
  dailyPollLimit,
  onNavigate,
  onOpenCommunity,
}: DashboardHomeProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";

  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = useMemo(() => readCommunityChats(), []);

  // Top 3 by member count → Trending
  const trending = useMemo(
    () => [...allCommunities].sort((a, b) => b.members.length - a.members.length).slice(0, 3),
    [allCommunities],
  );

  const trendingIds = useMemo(() => new Set(trending.map((c) => c.id)), [trending]);

  // Featured communities not already in trending → For You
  const forYou = useMemo(() => {
    const featuredNotTrending = FEATURED_COMMUNITY_IDS
      .map((id) => allCommunities.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => !!c && !trendingIds.has(c.id));

    const extraNotTrending = allCommunities.filter(
      (c) => !trendingIds.has(c.id) && !(FEATURED_COMMUNITY_IDS as readonly string[]).includes(c.id),
    );

    return [...featuredNotTrending, ...extraNotTrending].slice(0, 4);
  }, [allCommunities, trendingIds]);

  const h2 = `font-display text-base tracking-wide sm:text-lg ${isLight ? "text-slate-900" : "text-raw-text"}`;
  const silver = isLight ? "text-slate-500" : "text-raw-silver/45";

  return (
    <div className="space-y-10 pb-6">
      {/* ── Hero ── */}
      <div>
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
        <div className={`mt-3 flex flex-wrap gap-4 text-xs ${silver}`}>
          <span className="flex items-center gap-1.5">
            <Target className="size-3.5 text-raw-gold/60" />
            <span><span className={`font-bold ${isLight ? "text-slate-700" : "text-raw-text"}`}>{dailyAnsweredCount}</span> polls answered today</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-raw-gold/60" />
            <span><span className={`font-bold ${isLight ? "text-slate-700" : "text-raw-text"}`}>{allCommunities.length}</span> communities</span>
          </span>
        </div>
      </div>

      {/* ── Trending Communities ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-orange-400" />
            <h2 className={h2}>Trending Communities</h2>
          </div>
          <button
            onClick={() => onNavigate("communities")}
            className={`flex items-center gap-1 text-xs transition-colors ${isLight ? "text-amber-600 hover:text-amber-700" : "text-raw-gold/60 hover:text-raw-gold"}`}
          >
            View All <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {trending.map((community, i) => {
            const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];
            const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
            return (
              <button
                key={community.id}
                onClick={() => onOpenCommunity(community.id)}
                className={`group w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${
                  isLight
                    ? "border-slate-200 bg-white shadow-sm hover:border-amber-300 hover:shadow-md"
                    : "border-raw-border/40 bg-raw-surface/40 hover:border-raw-gold/30 hover:shadow-[0_0_24px_rgba(241,196,45,0.08)]"
                }`}
              >
                {/* Cover */}
                <div className="relative h-32 overflow-hidden">
                  {coverVideo ? (
                    <video src={coverVideo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" autoPlay loop muted playsInline />
                  ) : coverImage ? (
                    <img src={coverImage} alt={community.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${isLight ? "bg-amber-50" : "bg-raw-gold/5"}`}>
                      <span className="font-display text-4xl text-raw-gold/20">{community.abbr}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {/* Rank badge */}
                  <span className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${RANK_COLORS[i] ?? RANK_COLORS[2]}`}>
                    #{i + 1} Trending
                  </span>
                </div>

                {/* Content */}
                <div className="p-3.5">
                  <h3 className={`font-display text-sm leading-snug tracking-wide ${isLight ? "text-slate-900" : "text-raw-text"}`}>{community.title}</h3>
                  <p className={`mt-1.5 line-clamp-2 text-[11px] leading-relaxed ${silver}`}>{community.description}</p>
                  <p className={`mt-2.5 flex items-center gap-1 text-[10px] ${isLight ? "text-amber-600" : "text-raw-gold/60"}`}>
                    <Users className="size-3" />{community.members.length} members
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
            <h2 className={h2}>Communities for You</h2>
          </div>
          <div className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200" : "border-raw-border/30"}`}>
            {forYou.map((community, i) => {
              const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
              const isActive = (community.status ?? "").toLowerCase() === "active";
              return (
                <button
                  key={community.id}
                  onClick={() => onOpenCommunity(community.id)}
                  className={`group flex w-full items-center gap-3.5 p-3.5 text-left transition-colors ${
                    i > 0 ? (isLight ? "border-t border-slate-100" : "border-t border-raw-border/20") : ""
                  } ${isLight ? "bg-white hover:bg-amber-50/60" : "bg-raw-surface/20 hover:bg-raw-surface/40"}`}
                >
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-xl">
                    {coverImage ? (
                      <img src={coverImage} alt={community.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${isLight ? "bg-amber-50" : "bg-raw-gold/8"}`}>
                        <span className="font-display text-base text-raw-gold/40">{community.abbr}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isLight ? "text-slate-900" : "text-raw-text"}`}>{community.title}</p>
                    <p className={`mt-0.5 line-clamp-1 text-[11px] ${silver}`}>{community.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                      isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-raw-gold/10 text-raw-gold/70"
                    }`}>
                      {community.status ?? "active"}
                    </span>
                    <ChevronRight className={`size-3.5 transition-transform group-hover:translate-x-0.5 ${isLight ? "text-slate-300" : "text-raw-silver/25"}`} />
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
          <h2 className={h2}>Answer Your Daily Polls</h2>
        </div>
        <div className={`rounded-2xl border p-5 ${isLight ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white" : "border-raw-gold/20 bg-gradient-to-br from-raw-gold/[0.06] to-transparent"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-raw-text"}`}>Daily Poll</p>
              <p className={`mt-0.5 text-xs ${silver}`}>Answer today's anonymous questions</p>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wide ${silver}`}>Progress</span>
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
              <p className={`mt-1 text-[10px] uppercase tracking-wide ${silver}`}>left</p>
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
          <h2 className={h2}>Complete Challenges</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Daily Spin", desc: "Spin once and claim your reward", action: "Spin", Icon: Dices },
            { title: "Level Up", desc: "Complete 3 interactions to earn XP", action: "Start", Icon: Zap },
          ].map(({ title, desc, action, Icon }) => (
            <button
              key={title}
              onClick={() => onNavigate("challenges")}
              className={`group flex flex-col rounded-2xl border p-4 text-left transition-all ${
                isLight
                  ? "border-slate-200 bg-white shadow-sm hover:border-amber-300 hover:shadow-md"
                  : "border-raw-border/35 bg-raw-surface/30 hover:border-raw-border/60"
              }`}
            >
              <div className={`mb-3 flex size-9 items-center justify-center rounded-xl ${isLight ? "bg-amber-50" : "bg-raw-gold/[0.07]"}`}>
                <Icon className="size-4 text-raw-gold/70" />
              </div>
              <p className={`text-sm font-semibold leading-snug ${isLight ? "text-slate-900" : "text-raw-text"}`}>{title}</p>
              <p className={`mt-1 text-[11px] leading-snug ${silver}`}>{desc}</p>
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
