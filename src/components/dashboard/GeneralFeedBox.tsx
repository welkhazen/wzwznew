import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import {
  fetchGeneralFeedPosts,
  sendGeneralFeedPost,
  type GeneralFeedPostRecord,
} from "@/backend/supabase/controllers/generalFeedController";
import { AvatarFigure } from "@/components/ui/avatar-figure";

interface GeneralFeedBoxProps {
  userId?: string;
  isLight?: boolean;
  compact?: boolean;
  showHeader?: boolean;
  fillHeight?: boolean;
  communityId?: string;
}

function formatFeedTime(value: string): string {
  const timestamp = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));

  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  return `${Math.floor(diffHours / 24)}d`;
}

export function GeneralFeedBox({
  userId,
  isLight = false,
  compact = false,
  showHeader = true,
  fillHeight = false,
  communityId,
}: GeneralFeedBoxProps) {
  const [feedPosts, setFeedPosts] = useState<GeneralFeedPostRecord[]>([]);
  const [feedText, setFeedText] = useState("");
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedSubmitting, setFeedSubmitting] = useState(false);
  const [feedError, setFeedError] = useState("");
  const feedTextLength = feedText.trim().length;

  useEffect(() => {
    let cancelled = false;
    setFeedLoading(true);
    fetchGeneralFeedPosts(compact ? 5 : 8)
      .then((posts) => {
        if (!cancelled) {
          setFeedPosts(posts);
          setFeedError("");
        }
      })
      .catch(() => {
        if (!cancelled) setFeedError("Feed could not load right now.");
      })
      .finally(() => {
        if (!cancelled) setFeedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [compact]);

  const handleSubmitFeedPost = useCallback(async () => {
    if (!userId || feedSubmitting || feedTextLength === 0 || feedTextLength > 500) return;

    setFeedSubmitting(true);
    setFeedError("");
    try {
      const post = await sendGeneralFeedPost(feedText, communityId);
      setFeedPosts((current) => [post, ...current.filter((item) => item.id !== post.id)].slice(0, compact ? 5 : 8));
      setFeedText("");
    } catch {
      setFeedError("Post could not be saved right now.");
    } finally {
      setFeedSubmitting(false);
    }
  }, [communityId, compact, feedSubmitting, feedText, feedTextLength, userId]);

  return (
    <div className={`${fillHeight ? "flex h-full min-h-0 flex-col" : "space-y-5"}`}>
      {showHeader && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-raw-gold" />
              <h2 className="text-xl font-bold tracking-tight text-raw-text">General Feed</h2>
            </div>
            <p className="text-[13px] text-raw-silver/50">A shared space for quick thoughts from everyone.</p>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-raw-silver/45">
            {feedTextLength}/500
          </span>
        </div>
      )}

      <div className={`rounded-[1.5rem] border border-raw-border/25 bg-raw-surface/60 p-4 backdrop-blur-sm ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""} ${compact ? "sm:p-4" : "sm:p-5"}`}>
        {!showHeader && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-raw-gold" />
              <h2 className="text-sm font-bold tracking-tight text-raw-text">General Feed</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-raw-silver/45">
              {feedTextLength}/500
            </span>
          </div>
        )}

        <div className={`${fillHeight ? "min-h-0 flex-1" : compact ? "max-h-[360px]" : "max-h-[600px]"} divide-y divide-raw-border/20 overflow-y-auto pr-1`}>
          {feedLoading ? (
            <p className="py-6 text-center text-sm text-raw-silver/50">Loading feed...</p>
          ) : feedPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-raw-silver/50">No posts yet.</p>
          ) : (
            feedPosts.map((post) => (
              <article key={post.id} className={`${compact ? "py-3" : "py-4"} first:pt-0 last:pb-0`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <AvatarFigure avatarIndex={post.senderAvatarLevel ?? 1} size="sm" selected />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-raw-text">{post.senderName}</p>
                        {post.communityName && (
                          <span className="shrink-0 rounded-md bg-raw-gold/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-raw-gold/75">
                            {post.communityName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <time className="shrink-0 text-[11px] font-semibold text-raw-silver/45" dateTime={post.createdAt}>
                    {formatFeedTime(post.createdAt)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-raw-silver/80">{post.text}</p>
              </article>
            ))
          )}
        </div>

        <div className={`mt-4 flex flex-col gap-3 border-t border-raw-border/20 pt-4 ${compact ? "" : "sm:flex-row"}`}>
          <textarea
            value={feedText}
            onChange={(event) => setFeedText(event.target.value.slice(0, 500))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmitFeedPost();
              }
            }}
            placeholder={userId ? "Write something..." : "Log in to write"}
            disabled={!userId || feedSubmitting}
            rows={1}
            className="min-h-12 flex-1 resize-none rounded-xl border border-raw-border/25 bg-raw-surface/40 px-4 py-3 text-sm text-raw-text outline-none placeholder:text-raw-silver/35 transition-colors focus:border-raw-gold/50"
          />
          <button
            onClick={handleSubmitFeedPost}
            disabled={!userId || feedSubmitting || feedTextLength === 0 || feedTextLength > 500}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-raw-gold px-5 text-xs font-black uppercase tracking-[0.18em] text-raw-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 ${compact ? "w-full" : "sm:h-auto"}`}
          >
            <Send className="size-4" />
            {feedSubmitting ? "Posting" : "Post"}
          </button>
        </div>

        {feedError ? (
          <p className="mt-3 text-xs font-medium text-red-400">{feedError}</p>
        ) : null}
      </div>
    </div>
  );
}
