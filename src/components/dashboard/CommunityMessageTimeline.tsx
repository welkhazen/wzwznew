import { memo } from "react";
import type { RefObject } from "react";
import { AlertTriangle, Ban, BarChart3, Heart, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatChatTimestamp } from "@/lib/communityChat";
import type { CommunityChatMessageRecord } from "@/lib/communityChat.types";
import { LEVEL_THEMES } from "@/lib/avataridentity";
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
  isLoading?: boolean;
  canManagePolls: boolean;
  userId: string;
  username: string;
  senderAvatarLevels: Record<string, number>;
  onDeletePoll: (pollId: string) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
  onRetryMessage: (message: CommunityChatMessageRecord) => void;
  onLikeMessage: (message: CommunityChatMessageRecord) => void;
  onOpenMessageReport: (message: CommunityChatMessageRecord) => void;
  onBlockMessageSender: (message: CommunityChatMessageRecord) => void;
  onOpenSenderProfile: (message: CommunityChatMessageRecord) => void;
}

function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[80, 120, 60, 100, 70].map((w, i) => (
        <div key={i} className="border border-raw-border/25 bg-raw-black/40 px-3.5 py-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="h-2.5 animate-pulse rounded bg-raw-surface/50" style={{ width: w }} />
            <div className="h-2 w-8 animate-pulse rounded bg-raw-surface/35" />
          </div>
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-raw-surface/30" />
        </div>
      ))}
    </div>
  );
}

interface MessageRowProps {
  message: CommunityChatMessageRecord;
  avatarLevel: number;
  userId: string;
  username: string;
  onRetryMessage: (msg: CommunityChatMessageRecord) => void;
  onLikeMessage: (msg: CommunityChatMessageRecord) => void;
  onOpenMessageReport: (msg: CommunityChatMessageRecord) => void;
  onBlockMessageSender: (msg: CommunityChatMessageRecord) => void;
  onOpenSenderProfile: (msg: CommunityChatMessageRecord) => void;
}

const MessageRow = memo(function MessageRow({
  message,
  avatarLevel,
  userId,
  username,
  onRetryMessage,
  onLikeMessage,
  onOpenMessageReport,
  onBlockMessageSender,
  onOpenSenderProfile,
}: MessageRowProps) {
  const isOwnMessage = message.senderId === userId || message.senderName === username;
  const likedBy = message.likedBy ?? [];
  const alreadyLiked = likedBy.includes(userId);
  const likeCount = likedBy.length;
  const avatarTheme = LEVEL_THEMES[avatarLevel - 1] ?? LEVEL_THEMES[0];

  return (
    <article
      className={`group/msg w-full border px-3 py-2 ${
        isOwnMessage
          ? "border-raw-gold/25 bg-raw-gold/[0.04]"
          : "border-raw-border/35 bg-raw-black/50"
      }`}
    >
      {message.replyToText && (
        <div className="mb-1.5 border border-raw-border/20 bg-raw-black/20 px-2.5 py-1.5 text-xs text-raw-silver/55">
          <p className="font-medium text-raw-gold/75">↩ {message.replyToSenderName}</p>
          <p className="truncate">{message.replyToText}</p>
        </div>
      )}

      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenSenderProfile(message)}
          className="shrink-0 overflow-hidden rounded-full"
          style={{ width: 24, height: 24, background: avatarTheme.bg }}
          aria-label={`View ${message.senderName}'s profile`}
        >
          {avatarTheme.imageSrc ? (
            <img
              src={avatarTheme.imageSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{ objectPosition: "center 35%" }}
            />
          ) : (
            <svg width={24} height={24} viewBox="0 0 24 24">
              <circle cx={12} cy={12} r={10} fill={avatarTheme.figure} opacity={0.85} />
            </svg>
          )}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenSenderProfile(message)}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-wide hover:underline"
            style={{ color: isOwnMessage ? "rgb(var(--raw-accent))" : "rgb(var(--raw-accent) / 0.65)" }}
          >
            @{message.senderName}:
          </button>
          <span className={`truncate text-sm ${
            message.deletedAt ? "italic text-raw-silver/45" : isOwnMessage ? "text-raw-text" : "text-raw-silver/85"
          }`}>
            {message.text.split(/(@\w+)/g).map((part, i) =>
              /^@\w+$/.test(part)
                ? <span key={i} className="font-semibold text-raw-gold">{part}</span>
                : part
            )}
          </span>
          <span className="shrink-0 text-[10px] text-raw-silver/40">
            {formatChatTimestamp(message.createdAt)}
            {likeCount > 0 && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-raw-gold/70">
                <Heart className="inline h-2 w-2 fill-current" />{likeCount}
              </span>
            )}
            {message.deliveryStatus === "sending" && <span className="ml-1 text-raw-silver/35">Sending…</span>}
            {message.deliveryStatus === "failed" && <span className="ml-1 text-red-300/80">Failed</span>}
          </span>
        </div>

        {!message.deletedAt && !message.deliveryStatus && (
          <div className="ml-auto flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/msg:opacity-100">
            <button
              onClick={() => onLikeMessage(message)}
              className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] transition-all ${
                alreadyLiked
                  ? "border-raw-gold/45 bg-raw-gold/10 text-raw-gold"
                  : "border-raw-border/20 text-raw-silver/40 hover:border-raw-gold/30"
              }`}
              aria-label={alreadyLiked ? "Unlike" : "Like"}
            >
              <Heart className={`h-2.5 w-2.5 ${alreadyLiked ? "fill-current" : ""}`} />
              Like
            </button>
            {!isOwnMessage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 border border-raw-border/20 px-2 py-0.5 text-[10px] text-raw-silver/45 hover:border-raw-gold/30 hover:text-raw-gold"
                    aria-label="Message actions"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-32 border-raw-border/30 bg-raw-black/95 text-raw-silver shadow-xl shadow-black/40">
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {message.deliveryStatus === "failed" && (
        <button
          onClick={() => onRetryMessage(message)}
          className="mt-1 text-[10px] font-semibold text-red-200/90 underline-offset-2 hover:underline"
        >
          Retry
        </button>
      )}
    </article>
  );
});

export const CommunityMessageTimeline = memo(function CommunityMessageTimeline({
  containerRef,
  polls,
  groupedMessages,
  activeMessageCount,
  isLoading = false,
  canManagePolls,
  userId,
  username,
  senderAvatarLevels,
  onDeletePoll,
  onVotePoll,
  onRetryMessage,
  onLikeMessage,
  onOpenMessageReport,
  onBlockMessageSender,
  onOpenSenderProfile,
}: CommunityMessageTimelineProps) {
  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {polls.map((poll) => {
        const totalVotes = poll.totalVotes;
        return (
          <div
            key={`poll-${poll.id}`}
            className="border border-raw-gold/30 bg-raw-gold/5 p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-raw-gold/70">
                  <BarChart3 className="mr-1 inline h-3 w-3" />
                  Poll
                </p>
                <p className="mt-1 text-sm font-semibold text-raw-text">{poll.question}</p>
                <p className="mt-0.5 text-[10px] text-raw-silver/45">
                  by {poll.createdByUsername} · {formatChatTimestamp(poll.createdAt)}
                </p>
              </div>
              {canManagePolls && (
                <button
                  onClick={() => onDeletePoll(poll.id)}
                  className="border border-raw-border/30 p-1.5 text-raw-silver/45 hover:border-red-400/40 hover:text-red-300"
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
                    className={`relative w-full overflow-hidden border px-3 py-2 text-left text-sm transition-colors ${
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
        <div key={group.label} className="flex flex-col gap-2.5">
          <div className="flex justify-center py-1">
            <span className="border border-raw-border/20 bg-raw-black/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-silver/40">
              {group.label}
            </span>
          </div>
          {group.messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              avatarLevel={message.senderAvatarLevel ?? senderAvatarLevels[message.senderId] ?? 1}
              userId={userId}
              username={username}
              onRetryMessage={onRetryMessage}
              onLikeMessage={onLikeMessage}
              onOpenMessageReport={onOpenMessageReport}
              onBlockMessageSender={onBlockMessageSender}
              onOpenSenderProfile={onOpenSenderProfile}
            />
          ))}
        </div>
      ))}

      {isLoading && !groupedMessages.length && <MessageSkeleton />}
      {!isLoading && !groupedMessages.length && activeMessageCount === 0 && (
        <p className="text-center text-xs text-raw-silver/45 py-6">
          This group is quiet right now. Join and start the first real conversation.
        </p>
      )}
      {!isLoading && !groupedMessages.length && activeMessageCount > 0 && (
        <p className="text-center text-xs text-raw-silver/45 py-6">
          No messages match your search.
        </p>
      )}
    </div>
  );
});
