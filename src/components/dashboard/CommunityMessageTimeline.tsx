import { memo } from "react";
import type { RefObject } from "react";
import { AlertTriangle, Ban, BarChart3, Heart, MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { formatChatTimestamp } from "@/lib/communityChat";
import type { CommunityChatMessageRecord } from "@/lib/communityChat.types";
import type { CommunityPollRecord } from "@/backend/supabase/models/community-poll";

interface MessageGroup {
  label: string;
  messages: CommunityChatMessageRecord[];
}

interface CommunityMessageTimelineProps {
  containerRef: RefObject<HTMLDivElement>;
  polls: CommunityPollRecord[];
  groupedMessages: MessageGroup[];
  activeMessageCount: number;
  messagesLoading: boolean;
  messagesError: boolean;
  canManagePolls: boolean;
  userId: string;
  username: string;
  senderAvatarLevels: Record<string, number>;
  onDeletePoll: (pollId: string) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onRetryMessage: (message: CommunityChatMessageRecord) => void;
  onLikeMessage: (message: CommunityChatMessageRecord) => void;
  pinnedMessageIds: Set<string>;
  onPinMessageToProfile: (message: CommunityChatMessageRecord) => void;
  onUnpinMessageFromProfile: (message: CommunityChatMessageRecord) => void;
  onOpenMessageReport: (message: CommunityChatMessageRecord) => void;
  onBlockMessageSender: (message: CommunityChatMessageRecord) => void;
  onOpenSenderProfile: (message: CommunityChatMessageRecord) => void;
}

export const CommunityMessageTimeline = memo(function CommunityMessageTimeline({
  containerRef,
  polls,
  groupedMessages,
  activeMessageCount,
  messagesLoading,
  messagesError,
  canManagePolls,
  userId,
  username,
  senderAvatarLevels,
  onDeletePoll,
  onVotePoll,
  onRetryMessage,
  onLikeMessage,
  pinnedMessageIds,
  onPinMessageToProfile,
  onUnpinMessageFromProfile,
  onOpenMessageReport,
  onBlockMessageSender,
  onOpenSenderProfile,
}: CommunityMessageTimelineProps) {
  return (
    <div ref={containerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
      {polls.map((poll) => {
        const totalVotes = poll.totalVotes;
        return (
          <div
            key={`poll-${poll.id}`}
            className="rounded-2xl border border-raw-gold/30 bg-raw-gold/5 p-4 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-raw-gold/70">
                  <BarChart3 className="mr-1 inline h-3 w-3" />
                  Poll · Pinned
                </p>
                <p className="mt-1 text-sm font-semibold text-raw-text">{poll.question}</p>
                <p className="mt-0.5 text-[10px] text-raw-silver/45">
                  by {poll.createdByUsername} · {formatChatTimestamp(poll.createdAt)}
                </p>
              </div>
              {canManagePolls && (
                <button
                  onClick={() => onDeletePoll(poll.id)}
                  className="rounded-full border border-raw-border/30 p-1.5 text-raw-silver/45 hover:border-red-400/40 hover:text-red-300"
                  aria-label="Delete poll"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {poll.options.map((option) => {
                const isSelected = poll.userVoteOptionId === option.id;
                const pct = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                return (
                  <button
                    key={option.id}
                    onClick={() => onVotePoll(poll.id, option.id)}
                    className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-raw-gold/60 bg-raw-gold/15 text-raw-text"
                        : "border-raw-border/25 bg-raw-black/30 text-raw-silver/80 hover:border-raw-gold/40"
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-raw-gold/15"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <span className="font-medium">{option.text}</span>
                      <span className="text-[11px] text-raw-silver/55">
                        {option.votes} · {pct}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-raw-silver/40">
              {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              {poll.userVoteOptionId ? " · You voted" : " · Tap an option to vote"}
            </p>
          </div>
        );
      })}

      {groupedMessages.map((group) => (
        <div key={group.label} className="space-y-3">
          <div className="sticky top-0 z-10 flex justify-center py-1">
            <span className="rounded-full border border-raw-border/20 bg-raw-black/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-silver/40 backdrop-blur">
              {group.label}
            </span>
          </div>
          {group.messages.map((message) => {
            const isOwnMessage = message.senderId === userId || message.senderName === username;
            const senderAvatarLevel = message.senderAvatarLevel ?? senderAvatarLevels[message.senderId] ?? 1;
            const likedBy = message.likedBy ?? [];
            const alreadyLiked = likedBy.includes(userId);
            const likeCount = likedBy.length;
            const isPinnedToProfile = pinnedMessageIds.has(message.id);

            return (
              <div
                key={message.id}
                className="group/msg relative w-full rounded-xl px-3.5 py-2.5 backdrop-blur-sm"
                style={isOwnMessage ? {
                  background: "rgb(var(--raw-accent) / 0.10)",
                  border: "1px solid rgb(var(--raw-accent) / 0.25)",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onOpenSenderProfile(message)}
                  className="absolute left-2.5 top-2.5 rounded-full transition-opacity hover:opacity-75"
                  aria-label={`View ${message.senderName}'s profile`}
                >
                  <AvatarFigure
                    avatarIndex={senderAvatarLevel}
                    size="sm"
                    selected={isOwnMessage}
                    className="opacity-90"
                    style={{ width: 28, height: 28 }}
                  />
                </button>
                {message.replyToText && (
                  <div className="mb-1.5 ml-9 rounded-lg border border-raw-border/20 bg-raw-black/20 px-2.5 py-1.5 text-xs text-raw-silver/55">
                    <p className="font-medium text-raw-gold/75">↩ {message.replyToSenderName}</p>
                    <p className="mt-0.5 truncate">{message.replyToText}</p>
                  </div>
                )}
                <p className={`ml-9 break-words pr-16 [overflow-wrap:anywhere] text-sm leading-snug ${message.deletedAt ? "italic text-raw-silver/45" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onOpenSenderProfile(message)}
                    className="mr-0.5 font-semibold uppercase tracking-wide text-[11px] hover:underline"
                    style={{ color: isOwnMessage ? "rgb(var(--raw-accent))" : "rgb(var(--raw-accent) / 0.65)" }}
                  >
                    {message.senderName}:
                  </button>{" "}
                  <span className={isOwnMessage ? "text-raw-text" : "text-raw-silver/75"}>
                    {message.text.split(/(@\w+)/g).map((part, i) =>
                      /^@\w+$/.test(part)
                        ? <span key={i} className="font-semibold text-raw-gold">{part}</span>
                        : part
                    )}
                  </span>
                  <span className="ml-2 text-[9px] text-raw-silver/25">{formatChatTimestamp(message.createdAt)}</span>
                  {message.pinned && <span className="ml-1 text-[9px] text-raw-gold/60">· Pinned</span>}
                  {isOwnMessage && message.moderationStatus === "hold" && (
                    <span className="ml-1 text-[9px] text-yellow-400/80">· Pending review</span>
                  )}
                  {message.deliveryStatus === "sending" && <span className="ml-1 text-[9px] text-raw-silver/35">· Sending</span>}
                  {message.deliveryStatus === "failed" && <span className="ml-1 text-[9px] text-red-300/80">· Failed</span>}
                </p>
                {message.deliveryStatus === "failed" && (
                  <button
                    onClick={() => onRetryMessage(message)}
                    className="mt-1 text-[10px] font-semibold text-red-200/90 underline-offset-2 hover:underline"
                  >
                    Retry
                  </button>
                )}
                {!message.deletedAt && !message.deliveryStatus && (
                  <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    <button
                      onClick={() => onLikeMessage(message)}
                      className={`inline-flex min-h-6 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all ${alreadyLiked ? "border-raw-gold/45 bg-raw-gold/10 text-raw-gold opacity-100" : "border-raw-border/20 text-raw-silver/40 opacity-0 group-hover/msg:opacity-100"}`}
                      aria-label={alreadyLiked ? "Unlike message" : "Like message"}
                    >
                      <Heart className={`h-2.5 w-2.5 ${alreadyLiked ? "fill-current" : ""}`} />
                      {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-raw-border/20 text-raw-silver/45 opacity-0 transition-all hover:border-raw-gold/35 hover:bg-raw-gold/10 hover:text-raw-gold group-hover/msg:opacity-100 data-[state=open]:opacity-100"
                          aria-label="Message actions"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-32 border-raw-border/30 bg-raw-black/95 text-raw-silver shadow-xl shadow-black/40">
                        {isPinnedToProfile ? (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-xs focus:bg-raw-surface/80 focus:text-raw-text"
                            onClick={() => onUnpinMessageFromProfile(message)}
                          >
                            <PinOff className="h-3.5 w-3.5 text-raw-gold/80" />
                            Unpin from profile
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-xs focus:bg-raw-surface/80 focus:text-raw-text"
                            onClick={() => onPinMessageToProfile(message)}
                          >
                            <Pin className="h-3.5 w-3.5 text-raw-gold/80" />
                            Pin to my profile
                          </DropdownMenuItem>
                        )}
                        {!isOwnMessage && (
                          <>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs focus:bg-raw-surface/80 focus:text-raw-text"
                              onClick={() => onOpenMessageReport(message)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-raw-gold/80" />
                              Report
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs text-red-200/90 focus:bg-red-500/10 focus:text-red-100"
                              onClick={() => onBlockMessageSender(message)}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Block
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {!groupedMessages.length && messagesLoading && (
        <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
          Loading messages...
        </div>
      )}
      {!groupedMessages.length && !messagesLoading && messagesError && (
        <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
          Couldn't load messages. Please try again.
        </div>
      )}
      {!groupedMessages.length && !messagesLoading && !messagesError && activeMessageCount === 0 && (
        <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
          This group is quiet right now. Join and start the first real conversation.
        </div>
      )}
      {!groupedMessages.length && !messagesLoading && !messagesError && activeMessageCount > 0 && (
        <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
          No messages match your search.
        </div>
      )}
    </div>
  );
});
