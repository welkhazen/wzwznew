import { Suspense, useMemo } from "react";
import { ContainerTextFlipLazy } from "@/components/ui/container-text-flip.lazy";
import {
  Target,
  ChevronRight,
  Dices,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import type { DashboardTab } from "./DashboardNav";
import { readCommunityChats } from "@/lib/communityChat";
import {
  COMMUNITY_COVER_IMAGES,
  COMMUNITY_COVER_VIDEOS,
  FEATURED_COMMUNITY_IDS,
} from "@/lib/communityConstants";

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

interface ActivityCardProps {
  title: string;
  desc: string;
  action: string;
  tab: DashboardTab;
  icon: LucideIcon;
  onNavigate: (tab: DashboardTab) => void;
}

function ActivityCard({
  title,
  desc,
  action,
  tab,
  icon: Icon,
  onNavigate,
}: ActivityCardProps) {
  return (
    <div className="dashboard-activity-card rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-3 sm:p-4">
      <div className="flex items-start gap-2.5">
        <div className="dashboard-activity-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raw-gold/[0.06]">
          <Icon className="h-3.5 w-3.5 text-raw-gold/50" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-raw-text">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-raw-silver/35 line-clamp-2">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => onNavigate(tab)}
        className="dashboard-activity-action mt-3 w-full rounded-full border border-raw-gold/25 py-1.5 text-[11px] font-medium text-raw-gold/70 transition-all hover:border-raw-gold/40 hover:bg-raw-gold/5"
      >
        {action}
      </button>
    </div>
  );
}

export function DashboardHome({
  username,
  avatarLevel,
  polls,
  votedPolls,
  dailyAnsweredCount,
  dailyPollLimit,
  onNavigate,
  onOpenCommunity,
}: DashboardHomeProps) {
  const dailyItemsLeft = Math.max(0, dailyPollLimit - dailyAnsweredCount);
  const allCommunities = useMemo(() => readCommunityChats(), []);
  const previewCommunities = useMemo(
    () => FEATURED_COMMUNITY_IDS.map((id) => allCommunities.find((c) => c.id === id)).filter(Boolean) as typeof allCommunities,
    [allCommunities],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Welcome Hero */}
      <div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">
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
      </div>

      {/* Explore Communities */}
      <div>
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="font-display text-base tracking-wide text-raw-text sm:text-lg">Explore Communities</h2>
          <button
            onClick={() => onNavigate("communities")}
            className="flex items-center gap-1 text-xs text-raw-gold/60 transition-colors hover:text-raw-gold"
          >
            View All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {previewCommunities.map((community) => {
            const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];
            const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
            const isActive = community.status === "active";
            return (
              <button key={community.id} onClick={() => onOpenCommunity(community.id)} className="text-left w-full">
                <div className="flex flex-col rounded-2xl border border-raw-border/40 bg-raw-surface/40 h-full overflow-hidden">
                  <div className="relative h-32 shrink-0 overflow-hidden">
                    {coverVideo ? (
                      <video src={coverVideo} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                    ) : coverImage ? (
                      <img src={coverImage} alt={`${community.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-raw-gold/10 to-raw-surface flex items-center justify-center">
                        <span className="font-display text-3xl text-raw-gold/20">{community.abbr}</span>
                      </div>
                    )}
                    {!coverVideo && <div className="absolute inset-0 bg-gradient-to-t from-raw-black/70 via-raw-black/20 to-transparent" />}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 inline-block rounded-full border px-2.5 py-0.5 border-raw-gold/20 bg-raw-gold/5">
                      <span className={`text-[9px] font-medium tracking-wider uppercase ${isActive ? "text-raw-gold/70" : "text-raw-silver/40"}`}>
                        {community.status}
                      </span>
                    </div>
                    <h3 className="font-display text-sm tracking-wide text-raw-text">{community.title}</h3>
                    <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed line-clamp-2">{community.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Your Daily Polls */}
      <div>
        <h2 className="font-display text-lg tracking-wide text-raw-text mb-4">Answer Your Daily Polls</h2>
        <div className="dashboard-activity-card rounded-2xl border border-raw-border/40 bg-raw-surface/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="dashboard-activity-icon h-9 w-9 rounded-xl bg-raw-gold/[0.06] flex items-center justify-center shrink-0">
              <Target className="h-4 w-4 text-raw-gold/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-raw-text">Daily Poll</p>
              <p className="mt-0.5 text-xs text-raw-silver/35">Answer today's anonymous question</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-raw-silver/40">Dailies left</p>
              <p className="text-xl font-bold text-raw-gold/80">{dailyItemsLeft}</p>
            </div>
            <button
              onClick={() => onNavigate("polls")}
              className="dashboard-activity-action rounded-full border border-raw-gold/25 px-4 py-2 text-[11px] font-medium text-raw-gold/70 hover:bg-raw-gold/5 hover:border-raw-gold/40 transition-all min-h-[36px]"
            >
              Answer
            </button>
          </div>
        </div>
      </div>

      {/* Earn More By Completing The Challenges */}
      <div>
        <h2 className="mb-4 font-display text-base tracking-wide text-raw-text sm:text-lg">Complete Challenges</h2>
        <div className="grid grid-cols-2 gap-3">
          <ActivityCard
            title="Daily Spin"
            desc="Spin once and claim your reward"
            action="Spin"
            tab="challenges"
            icon={Dices}
            onNavigate={onNavigate}
          />
          <ActivityCard
            title="Level Up"
            desc="Complete 3 interactions to earn XP"
            action="Start"
            tab="challenges"
            icon={Zap}
            onNavigate={onNavigate}
          />
        </div>
      </div>

    </div>
  );
}
