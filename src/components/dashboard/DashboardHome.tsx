import { Suspense, useMemo } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import { ChevronRight, Dices, Zap, Flame, Users, BarChart3, Sparkles } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import { readCommunityChats } from "@/lib/communityChat";
import { COMMUNITY_COVER_IMAGES, COMMUNITY_COVER_VIDEOS } from "@/lib/communityConstants";

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

function CommunityCard({
  community,
  rank,
  onOpenCommunity,
}: {
  community: ReturnType<typeof readCommunityChats>[number];
  rank?: number;
  onOpenCommunity: (id: string) => void;
}) {
  const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
  const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];

  return (
    <button
      onClick={() => onOpenCommunity(community.id)}
      className="group relative bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl text-left w-full cursor-pointer hover:border-raw-gold/30 transition-all duration-200"
    >
      {rank !== undefined && (
        <div className={`absolute top-3 right-3 px-1.5 py-0.5 rounded-lg text-[9px] font-black border ${
          rank === 0
            ? "bg-raw-gold/20 text-raw-gold border-raw-gold/30"
            : "bg-white/5 text-white/40 border-white/10"
        }`}>
          #{rank + 1}
        </div>
      )}
      <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 border border-white/10 shrink-0">
        {coverVideo ? (
          <video src={coverVideo} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : coverImage ? (
          <img src={coverImage} alt={community.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-raw-gold/5 flex items-center justify-center">
            <span className="font-display text-lg text-raw-gold/30">{community.abbr}</span>
          </div>
        )}
      </div>
      <h3 className="text-base font-bold text-white leading-snug mb-0.5">{community.title}</h3>
      <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-bold flex items-center gap-1">
        <Users className="size-2.5" />{community.members.length} members
      </p>
    </button>
  );
}

export function DashboardHome({
  dailyAnsweredCount,
  dailyPollLimit,
  onNavigate,
  onOpenCommunity,
}: DashboardHomeProps) {
  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = useMemo(() => readCommunityChats(), []);

  const trending = useMemo(
    () => [...allCommunities].sort((a, b) => b.members.length - a.members.length).slice(0, 4),
    [allCommunities],
  );

  const trendingIds = useMemo(() => new Set(trending.map((c) => c.id)), [trending]);

  const picks = useMemo(
    () => allCommunities.filter((c) => !trendingIds.has(c.id)).slice(0, 4),
    [allCommunities, trendingIds],
  );

  const pollProgress = Math.min(100, (dailyAnsweredCount / dailyPollLimit) * 100);

  return (
    <div className="space-y-10 pb-6">

      {/* ── Hero ── */}
      <section className="relative">
        <div className="relative z-10">
          <h1 className="font-display text-3xl md:text-4xl max-w-2xl leading-[1.15] text-white">
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
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <BarChart3 className="size-3.5 text-raw-gold" />
              <span className="text-xs text-white/60 font-medium tracking-wide">{dailyAnsweredCount} polls answered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Users className="size-3.5 text-white/60" />
              <span className="text-xs text-white/60 font-medium tracking-wide">{allCommunities.length} communities</span>
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
              <h2 className="text-xl font-bold text-white tracking-tight">Trending</h2>
            </div>
            <p className="text-[13px] text-white/40">Most active anonymous circles.</p>
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
            <CommunityCard key={community.id} community={community} rank={i} onOpenCommunity={onOpenCommunity} />
          ))}
        </div>
      </section>

      {/* ── Personalized Picks ── */}
      {picks.length > 0 && (
        <section className="space-y-5 border-t border-white/5 pt-10">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-raw-gold" />
                <h2 className="text-xl font-bold text-white tracking-tight">Personalized Picks</h2>
              </div>
              <p className="text-[13px] text-white/40">Based on your recent activity.</p>
            </div>
            <button
              onClick={() => onNavigate("communities")}
              className="text-sm text-raw-gold hover:underline flex items-center gap-1 font-bold"
            >
              View All <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {picks.map((community) => (
              <CommunityCard key={community.id} community={community} onOpenCommunity={onOpenCommunity} />
            ))}
          </div>
        </section>
      )}

      {/* ── Daily Poll Progress ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-raw-gold" />
          <h2 className="text-xl font-bold text-white">Daily Poll Progress</h2>
        </div>
        <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-6 right-8 text-raw-gold font-bold text-xs tracking-widest">{dailyItemsLeft} LEFT</div>
          <div className="flex flex-col items-center text-center space-y-6 max-w-xl mx-auto py-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Voice Your Opinion</h3>
            <div className="w-12 h-12 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/20">
              <BarChart3 className="size-6 text-raw-gold" />
            </div>
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-white/40">
                <span>Progress</span>
                <span className="text-raw-gold font-bold">{dailyAnsweredCount} / {dailyPollLimit}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-raw-gold rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(241,196,45,0.4)]" style={{ width: `${pollProgress}%` }} />
              </div>
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Earn 50 XP for every poll. Your opinion remains completely anonymous.
            </p>
            <button
              onClick={() => onNavigate("polls")}
              className="w-full max-w-xs py-4 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
            >
              Answer Now
            </button>
          </div>
        </div>
      </section>

      {/* ── Challenges ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-raw-gold" />
          <h2 className="text-xl font-bold text-white">Challenges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Spin */}
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[1.5rem] space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-white tracking-tight">Daily Spin</h3>
                <p className="text-xs text-white/40">Luck of the anonymous</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                <Dices className="size-5 text-raw-gold" />
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">Spin the wheel once a day for a chance to earn XP, badges, and avatar themes.</p>
            <button
              onClick={() => onNavigate("challenges")}
              className="w-full py-3 rounded-xl border border-raw-gold/30 text-raw-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-raw-gold/5 transition-all"
            >
              Spin Now
            </button>
          </div>

          {/* Level Up */}
          <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[1.5rem] space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold text-white tracking-tight">Level Up</h3>
                <p className="text-xs text-white/40">Complete interactions to earn XP</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-raw-gold/5 flex items-center justify-center border border-raw-gold/10">
                <Zap className="size-5 text-raw-gold" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-white">Polls Answered</span>
                <span className="text-base font-bold text-raw-gold">{dailyAnsweredCount} / {dailyPollLimit}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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
