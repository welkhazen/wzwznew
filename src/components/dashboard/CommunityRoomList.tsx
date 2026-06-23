import { memo } from "react";
import { Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommunityBadge } from "@/components/dashboard/CommunityBadge";
import { cn } from "@/lib/utils";
import { countOnlineMembers, countUnreadMessages } from "@/lib/communityChat";
import type { CommunityJoinRequestRecord } from "@/lib/adminData";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

interface CommunityRoomListProps {
  communities: PersistedCommunityRecord[];
  userId: string;
  logoUrlsByCommunityId: Record<string, string>;
  coverImagesByCommunityId: Record<string, string>;
  coverVideosByCommunityId: Record<string, string>;
  expandedDescriptionIds: Set<string>;
  joinRequests: CommunityJoinRequestRecord[];
  waitlistJoinedIds: Set<string>;
  waitlistCounts: Record<string, number>;
  waitlistJoiningId: string | null;
  waitlistUnlockThreshold: number;
  hasSubscriptionAccess: boolean;
  unlockedCommunityIds: Set<string>;
  freeCommunitySlotsRemaining: number;
  unlockingId: string | null;
  unlockTokenCost: number;
  onToggleDescription: (communityId: string) => void;
  onPaidJoinCommunity: (communityId: string, shouldOpenPage: boolean) => void;
  onJoinWaitlist: (community: PersistedCommunityRecord) => void;
  onOpenCommunity: (communityId: string) => void;
  onUnlockCommunity: (communityId: string) => void;
}

export const CommunityRoomList = memo(function CommunityRoomList({
  communities,
  userId,
  logoUrlsByCommunityId,
  coverImagesByCommunityId,
  coverVideosByCommunityId,
  expandedDescriptionIds,
  joinRequests,
  waitlistJoinedIds,
  waitlistCounts,
  waitlistJoiningId,
  waitlistUnlockThreshold,
  hasSubscriptionAccess,
  unlockedCommunityIds,
  freeCommunitySlotsRemaining,
  unlockingId,
  unlockTokenCost,
  onToggleDescription,
  onPaidJoinCommunity,
  onJoinWaitlist,
  onOpenCommunity,
  onUnlockCommunity,
}: CommunityRoomListProps) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {communities.map((community) => {
        const joined = community.members.some((member) => member.userId === userId);
        const communityUnreadCount = joined ? countUnreadMessages(community, userId) : 0;
        const coverImage = coverImagesByCommunityId[community.id] ?? community.logoUrl;
        const coverVideo = coverVideosByCommunityId[community.id];
        const isExpanded = expandedDescriptionIds.has(community.id);
        const descLong = community.description.length > 120;

        return (
          <div key={community.id} className="group flex flex-col overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/35 shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-all duration-300 hover:border-raw-gold/35 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(241,196,45,0.12)]">
            <div className="relative h-36 shrink-0 overflow-hidden border-b border-raw-border/25 sm:h-48">
              {coverVideo ? (
                <video src={coverVideo} className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04]" autoPlay loop muted playsInline preload="auto" />
              ) : coverImage ? (
                <img src={coverImage} alt={`${community.title} cover`} className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.04]" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-raw-gold/12 via-raw-surface/30 to-raw-black/70" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-raw-black/85 via-raw-black/25 to-transparent" />
              <div className={`absolute bottom-2 right-2 rounded-full border px-2 py-0.5 text-[9px] backdrop-blur-sm transition-colors duration-300 ${
                joined
                  ? "border-emerald-400/40 bg-emerald-950/70 text-emerald-300/90"
                  : "border-raw-border/40 bg-raw-black/60 text-raw-silver/70"
              }`}>
                {joined ? "● Joined" : community.locked ? "Locked" : "Not joined"}
              </div>
            </div>

            <div className="flex flex-1 flex-col p-3 sm:p-5">
              <div className="flex items-center gap-2">
                <CommunityBadge abbr={community.abbr} title={community.title} logoUrl={logoUrlsByCommunityId[community.id] ?? community.logoUrl} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-display text-xs leading-tight tracking-wide text-raw-text sm:text-base">{community.title}</p>
                    {communityUnreadCount > 0 && (
                      <span className="rounded-full bg-raw-gold px-1.5 py-0.5 text-[9px] font-semibold text-raw-ink">
                        {communityUnreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] uppercase tracking-[0.14em] text-raw-gold/65">{community.status}</p>
                </div>
              </div>

              <div className="mt-2">
                <p className={cn("text-[11px] leading-relaxed text-raw-silver/50 line-clamp-2", !isExpanded && descLong && "sm:line-clamp-3")}>
                  {community.description}
                </p>
                {descLong && (
                  <button
                    onClick={() => onToggleDescription(community.id)}
                    className="mt-0.5 hidden text-xs text-raw-gold/60 hover:text-raw-gold sm:block"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-raw-silver/35 sm:mt-4">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {community.members.length}
                </span>
                {!community.locked && (
                  <span className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" /> {countOnlineMembers(community)}
                  </span>
                )}
              </div>

              <div className="mt-auto pt-3">
                {community.locked && !joined ? (() => {
                  const joinReq = joinRequests.find(
                    (request) => request.communityId === community.id && request.requesterId === userId,
                  );
                  if (joinReq?.status === "approved") {
                    return (
                      <Button
                        onClick={() => onPaidJoinCommunity(community.id, true)}
                        className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90"
                      >
                        Join Group - {unlockTokenCost} tokens
                      </Button>
                    );
                  }
                  const onWaitlist = waitlistJoinedIds.has(community.id);
                  const waitlistCount = waitlistCounts[community.id] ?? 0;
                  const isJoining = waitlistJoiningId === community.id;
                  return (
                    <div className="space-y-1.5">
                      <Button
                        onClick={() => onJoinWaitlist(community)}
                        disabled={onWaitlist || isJoining}
                        className="w-full rounded-xl border border-raw-gold/30 bg-transparent px-2 py-2 text-xs text-raw-gold hover:bg-raw-gold/10 disabled:opacity-70"
                      >
                        <Lock className="h-3 w-3" /> {onWaitlist ? "On Waitlist" : "Join Waitlist"}
                      </Button>
                      <p className="text-center text-[10px] text-raw-silver/45">
                        <span className="text-raw-gold/80">{waitlistCount}</span>
                        <span className="text-raw-silver/35">/{waitlistUnlockThreshold}</span>
                        <span className="ml-1">to unlock</span>
                      </p>
                    </div>
                  );
                })() : (() => {
                  const isUnlocked = joined || hasSubscriptionAccess || unlockedCommunityIds.has(community.id);
                  const canGetFree = freeCommunitySlotsRemaining > 0;
                  const isUnlocking = unlockingId === community.id;
                  if (isUnlocked) {
                    return (
                      <Button
                        onClick={() => onOpenCommunity(community.id)}
                        className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90"
                      >
                        Open Chat
                      </Button>
                    );
                  }
                  if (canGetFree) {
                    return (
                      <div className="space-y-1.5">
                        <Button
                          onClick={() => onUnlockCommunity(community.id)}
                          disabled={isUnlocking}
                          className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90 disabled:opacity-70"
                        >
                          {isUnlocking ? "Opening…" : "Open Chat — Free"}
                        </Button>
                        <p className="text-center text-[10px] text-raw-silver/40">
                          {freeCommunitySlotsRemaining} free slot{freeCommunitySlotsRemaining === 1 ? "" : "s"} remaining
                        </p>
                      </div>
                    );
                  }
                  // Non-locked community with no free slots — show a plain Join button.
                  return (
                    <Button
                      onClick={() => onPaidJoinCommunity(community.id, true)}
                      className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90"
                    >
                      Join
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
