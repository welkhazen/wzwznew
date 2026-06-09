import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { COMMUNITY_COVER_IMAGES } from "@/lib/communityConstants";
import { formatChatTimestamp } from "@/lib/communityChat";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";
import type { PublicUserProfile } from "@/backend/supabase/controllers/userController";

interface ProfileTarget {
  message: CommunityChatMessageRecord;
  profile: PublicUserProfile | null;
  loading: boolean;
}

interface CommunityProfileDialogProps {
  open: boolean;
  target: ProfileTarget | null;
  communities: PersistedCommunityRecord[];
  logoUrlsByCommunityId: Record<string, string>;
  senderAvatarLevels: Record<string, number>;
  onOpenChange: (open: boolean) => void;
  onOpenCommunity: (communityId: string) => void;
}

export function CommunityProfileDialog({
  open,
  target,
  communities,
  logoUrlsByCommunityId,
  senderAvatarLevels,
  onOpenChange,
  onOpenCommunity,
}: CommunityProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-raw-border/40 bg-raw-black p-0 text-raw-text sm:max-w-sm sm:rounded-3xl">
        <div className="border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-6 py-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl tracking-wide text-raw-text">Chat profile</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-raw-silver/45">
              People choose how much of their profile appears in community chat.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-6">
          {target?.loading ? (
            <p className="text-sm text-raw-silver/50">Loading profile...</p>
          ) : target?.profile?.profilePublic ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <AvatarFigure avatarIndex={target.profile.avatarLevel} size="lg" selected />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg tracking-wide text-raw-text">
                    @{target.profile.username ?? target.message.senderName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-raw-silver/40">
                    {target.profile.role ?? "member"}
                  </p>
                  {target.profile.createdAt && (
                    <p className="mt-2 text-xs text-raw-silver/45">
                      Joined {formatChatTimestamp(target.profile.createdAt)}
                    </p>
                  )}
                </div>
              </div>

              {target.profile.pinnedMessage && (
                <div className="rounded-2xl border border-raw-gold/25 bg-raw-gold/[0.06] p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-raw-gold/70">Pinned message</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-raw-text/85">
                    {target.profile.pinnedMessage.messageText}
                  </p>
                  <p className="mt-2 text-[10px] text-raw-silver/45">
                    {target.profile.pinnedMessage.communityTitle ?? "Community"}
                    {target.profile.pinnedMessage.messageCreatedAt
                      ? ` Â· ${formatChatTimestamp(target.profile.pinnedMessage.messageCreatedAt)}`
                      : ""}
                  </p>
                </div>
              )}

              {target.profile.favoriteCommunityIds.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/45">Favorite communities</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {target.profile.favoriteCommunityIds.map((id) => {
                      const community = communities.find((c) => c.id === id);
                      const logo = logoUrlsByCommunityId[id] ?? community?.logoUrl ?? COMMUNITY_COVER_IMAGES[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onOpenChange(false);
                            onOpenCommunity(id);
                          }}
                          title={community?.title ?? id}
                          className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-raw-border/35 bg-raw-surface/40 text-[10px] font-semibold text-raw-text transition hover:border-raw-gold/55"
                        >
                          {logo ? (
                            <img src={logo} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <span>{community?.abbr ?? id.slice(0, 2).toUpperCase()}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <AvatarFigure
                avatarIndex={
                  target?.message.senderAvatarLevel
                  ?? (target ? senderAvatarLevels[target.message.senderId] : undefined)
                  ?? 1
                }
                size="lg"
                selected
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg tracking-wide text-raw-text">@{target?.message.senderName ?? "Private user"}</p>
                <p className="mt-1 text-sm text-raw-silver/45">Private names do not have public profiles.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
