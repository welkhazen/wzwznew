import { useState } from "react";
import { ChevronDown, SendIcon } from "lucide-react";
import { getUserTextModerationMessage, moderateUserText } from "@/lib/inputSecurity";

export interface Comment {
  id: string;
  author: string;
  avatar: number;
  content: string;
  timestamp: string;
  likes: number;
  replies: Comment[];
  isAnonymous: boolean;
}

interface PollCommentsProps {
  pollId: string;
  pollQuestion: string;
  comments: Comment[];
  onAddComment: (content: string, parentCommentId?: string) => void;
  onLikeComment: (commentId: string) => void;
}

function CommentThread({
  comment,
  level = 0,
  onReply,
  onLike,
  onAddReply,
}: {
  comment: Comment;
  level?: number;
  onReply: (id: string) => void;
  onLike: (id: string) => void;
  onAddReply: (content: string, parentId: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyError, setReplyError] = useState("");
  const [showReplies, setShowReplies] = useState(level === 0);

  const handleSubmitReply = () => {
    const moderation = moderateUserText(replyContent);
    if (moderation.text) {
      if (!moderation.allowed) {
        setReplyError(getUserTextModerationMessage(moderation));
        return;
      }
      onAddReply(moderation.text, comment.id);
      setReplyContent("");
      setReplyError("");
      setIsReplying(false);
    }
  };

  return (
    <div className={`space-y-3 ${level > 0 ? "ml-4 border-l border-raw-border/20 pl-4 py-2" : ""}`}>
      {/* Comment */}
      <div className={`rounded-lg backdrop-blur transition-all ${
        level === 0 
          ? "border border-raw-border/30 bg-raw-black/30 p-4" 
          : "border border-raw-border/20 bg-raw-black/15 p-3"
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-raw-gold to-raw-gold/60 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {comment.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-raw-silver/80 truncate">
                {comment.isAnonymous ? "Anonymous" : comment.author}
              </p>
              <p className="text-[9px] text-raw-silver/35">{comment.timestamp}</p>
            </div>
          </div>
          {comment.isAnonymous && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-raw-gold/10 text-raw-gold/70 flex-shrink-0">
              Anon
            </span>
          )}
        </div>

        {/* Content */}
        <p className={`text-xs text-raw-silver/75 leading-relaxed mb-3 ${level > 0 ? "text-xs" : "text-xs"}`}>
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLike(comment.id)}
            className="text-[10px] text-raw-silver/40 hover:text-raw-gold/60 transition-colors flex items-center gap-1"
          >
            👍 {comment.likes > 0 ? comment.likes : "Like"}
          </button>
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="text-[10px] text-raw-silver/40 hover:text-raw-gold/60 transition-colors"
          >
            💬 Reply
          </button>
        </div>

        {/* Reply Input */}
        {isReplying && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Add a reply..."
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value);
                setReplyError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
              }}
              className="flex-1 rounded-lg bg-raw-black/40 border border-raw-border/30 px-3 py-1.5 text-xs text-raw-text placeholder-raw-silver/35 focus:outline-none focus:border-raw-gold/40 focus:bg-raw-black/50 transition-all"
            />
            <button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim()}
              className="rounded-lg bg-raw-gold/20 border border-raw-gold/30 p-1.5 text-raw-gold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-raw-gold/30 transition-all"
            >
              <SendIcon className="w-3 h-3" />
            </button>
          </div>
        )}
        {replyError && <p className="mt-2 text-[10px] text-red-300">{replyError}</p>}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-[10px] text-raw-gold/60 hover:text-raw-gold font-medium flex items-center gap-1 mb-2 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showReplies ? "" : "-rotate-90"}`} />
            {comment.replies.length} repl{comment.replies.length === 1 ? "y" : "ies"}
          </button>

          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map((reply) => (
                <CommentThread
                  key={reply.id}
                  comment={reply}
                  level={level + 1}
                  onReply={onReply}
                  onLike={onLike}
                  onAddReply={onAddReply}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PollComments({
  pollQuestion,
  comments,
  onAddComment,
  onLikeComment,
}: PollCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const handleSubmitComment = () => {
    const moderation = moderateUserText(newComment);
    if (moderation.text) {
      if (!moderation.allowed) {
        setCommentError(getUserTextModerationMessage(moderation));
        return;
      }
      onAddComment(moderation.text);
      setNewComment("");
      setCommentError("");
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="space-y-4">
      {/* Modal Header */}
      <div className="border-b border-raw-border/30 pb-4">
        <h3 className="font-display text-lg text-raw-text">Community Discussion</h3>
        <p className="text-xs text-raw-silver/45 mt-1">{pollQuestion}</p>
      </div>

      {/* Add Comment */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Share your perspective..."
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              setCommentError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitComment();
              }
            }}
            className="flex-1 rounded-lg bg-raw-black/40 border border-raw-border/30 px-4 py-2.5 text-xs text-raw-text placeholder-raw-silver/35 focus:outline-none focus:border-raw-gold/40 focus:bg-raw-black/50 transition-all"
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className="rounded-lg bg-raw-gold px-4 py-2.5 text-xs font-semibold text-raw-ink disabled:opacity-40 disabled:cursor-not-allowed hover:bg-raw-gold/90 transition-all"
          >
            Post
          </button>
        </div>
        {commentError && <p className="text-[10px] text-red-300">{commentError}</p>}
        <p className="text-[9px] text-raw-silver/35">💡 Keep comments constructive and respectful</p>
      </div>

      {/* Sort Options */}
      {comments.length > 0 && (
        <div className="flex gap-2 border-b border-raw-border/30 pb-4">
          <button
            onClick={() => setSortBy("recent")}
            className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded border transition-all ${
              sortBy === "recent"
                ? "border-raw-gold/55 bg-raw-gold/10 text-raw-gold"
                : "border-raw-border/30 bg-raw-black/20 text-raw-silver/55 hover:border-raw-gold/25"
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy("popular")}
            className={`text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded border transition-all ${
              sortBy === "popular"
                ? "border-raw-gold/55 bg-raw-gold/10 text-raw-gold"
                : "border-raw-border/30 bg-raw-black/20 text-raw-silver/55 hover:border-raw-gold/25"
            }`}
          >
            Popular
          </button>
          <span className="text-[10px] text-raw-silver/35 ml-auto flex items-center">
            {comments.length} comment{comments.length === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {sortedComments.length === 0 ? (
          <div className="rounded-lg border border-raw-border/20 bg-raw-black/20 p-4 text-center">
            <p className="text-xs text-raw-silver/35">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={() => {}}
              onLike={onLikeComment}
              onAddReply={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
