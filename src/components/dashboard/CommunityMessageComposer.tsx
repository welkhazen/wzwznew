import { memo } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { BarChart3, Send } from "lucide-react";
import type { CommunityChatMemberRecord } from "@/lib/communityChat.types";

interface CommunityMessageComposerProps {
  inputRef: RefObject<HTMLInputElement>;
  draft: string;
  maxLength: number;
  members: CommunityChatMemberRecord[];
  mentionQuery: string | null;
  mentionIndex: number;
  canManagePolls: boolean;
  disabled: boolean;
  onDraftChange: (value: string) => void;
  onMentionQueryChange: (value: string | null) => void;
  onMentionIndexChange: Dispatch<SetStateAction<number>>;
  onOpenPollComposer: () => void;
  onSendMessage: () => void;
}

export const CommunityMessageComposer = memo(function CommunityMessageComposer({
  inputRef,
  draft,
  maxLength,
  members,
  mentionQuery,
  mentionIndex,
  canManagePolls,
  disabled,
  onDraftChange,
  onMentionQueryChange,
  onMentionIndexChange,
  onOpenPollComposer,
  onSendMessage,
}: CommunityMessageComposerProps) {
  const mentionMatches = mentionQuery === null
    ? []
    : members.filter((member) => member.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6);

  const selectMention = (username: string) => {
    const atIdx = draft.lastIndexOf("@");
    onDraftChange(`${draft.slice(0, atIdx)}@${username} `);
    onMentionQueryChange(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="border-t border-raw-border/15 px-3 py-3">
      {disabled && (
        <div className="mb-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          Chat posting is disabled for this account.
        </div>
      )}
      {mentionQuery !== null && mentionMatches.length > 0 && (
        <div className="mb-2 overflow-hidden rounded-xl border border-raw-border/30 bg-raw-black/90">
          {mentionMatches.map((member, index) => (
            <button
              key={member.userId}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectMention(member.username);
              }}
              className={`w-full px-4 py-2 text-left text-sm text-raw-text hover:bg-raw-surface/40 ${index === mentionIndex ? "bg-raw-surface/30" : ""}`}
            >
              @{member.username}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        {canManagePolls && (
          <button
            onClick={onOpenPollComposer}
            disabled={disabled}
            title="Post a poll"
            aria-label="Post a poll"
            className="flex items-center justify-center rounded-xl border border-raw-border/30 bg-raw-surface/30 px-3 py-2.5 text-raw-silver/70 hover:border-raw-gold/40 hover:text-raw-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          value={draft}
          maxLength={maxLength}
          onChange={(event) => {
            const nextDraft = event.target.value;
            onDraftChange(nextDraft);
            const atIdx = nextDraft.lastIndexOf("@");
            if (atIdx !== -1 && (atIdx === 0 || nextDraft[atIdx - 1] === " ")) {
              onMentionQueryChange(nextDraft.slice(atIdx + 1));
              onMentionIndexChange(0);
            } else {
              onMentionQueryChange(null);
            }
          }}
          onKeyDown={(event) => {
            if (mentionQuery !== null) {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                onMentionIndexChange((index) => Math.min(index + 1, mentionMatches.length - 1));
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                onMentionIndexChange((index) => Math.max(index - 1, 0));
                return;
              }
              if ((event.key === "Enter" || event.key === "Tab") && mentionMatches[mentionIndex]) {
                event.preventDefault();
                selectMention(mentionMatches[mentionIndex].username);
                return;
              }
              if (event.key === "Escape") {
                onMentionQueryChange(null);
                return;
              }
            }
            if (event.key === "Enter") onSendMessage();
          }}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 rounded-xl border border-raw-border/30 bg-raw-surface/30 px-4 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          onClick={onSendMessage}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-xl bg-raw-gold px-4 py-2.5 text-sm font-semibold text-raw-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
