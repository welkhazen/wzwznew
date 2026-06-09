import { UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatChatTimestamp } from "@/lib/communityChat";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

interface CommunityMembersDialogProps {
  open: boolean;
  members: PersistedCommunityRecord["members"];
  currentUserId: string;
  canManagePolls: boolean;
  onOpenChange: (open: boolean) => void;
  onKickMember: (userId: string, username: string) => void;
}

export function CommunityMembersDialog({
  open,
  members,
  currentUserId,
  canManagePolls,
  onOpenChange,
  onKickMember,
}: CommunityMembersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-raw-border/40 bg-raw-black p-0 text-raw-text sm:max-w-lg sm:rounded-3xl">
        <div className="border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-6 py-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl tracking-wide text-raw-text">Group members</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-raw-silver/45">
              Admin and group owners can remove members. Poll answers stay anonymous.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-5">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-3 rounded-xl border border-raw-border/20 bg-raw-surface/20 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-raw-text">@{member.username}</p>
                <p className="text-[10px] text-raw-silver/40">Joined {formatChatTimestamp(member.joinedAt)}</p>
              </div>
              {canManagePolls && member.userId !== currentUserId && (
                <button
                  type="button"
                  onClick={() => { onKickMember(member.userId, member.username); }}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-400/25 px-2.5 py-1 text-[10px] font-semibold text-red-200/80 hover:bg-red-500/10"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Kick
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
