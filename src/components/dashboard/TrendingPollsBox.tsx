import { useEffect, useState } from "react";
import { Flame, MessageCircle } from "lucide-react";
import { fetchTrendingPolls, type TrendingPoll } from "@/lib/api/polls";

interface TrendingPollsBoxProps {
  isLight?: boolean;
  onOpenPolls: () => void;
}

export function TrendingPollsBox({ isLight = false, onOpenPolls }: TrendingPollsBoxProps) {
  const [polls, setPolls] = useState<TrendingPoll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrendingPolls(6)
      .then((rows) => {
        if (!cancelled) setPolls(rows);
      })
      .catch(() => {
        if (!cancelled) setPolls([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white/80" : "border-white/10 bg-raw-black/40"}`}>
      <div className="mb-1 flex items-center gap-2">
        <Flame className="size-4 text-raw-gold" />
        <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-950" : "text-white"}`}>Trending Polls</h2>
      </div>
      <p className={`text-[13px] ${isLight ? "text-slate-500" : "text-white/40"}`}>
        Polls the community is talking about right now.
      </p>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>Loading…</p>
        ) : polls.length === 0 ? (
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-white/40"}`}>
            No discussions yet. Be the first to drop a take in Polls.
          </p>
        ) : (
          polls.map((poll, idx) => (
            <button
              key={poll.id}
              type="button"
              onClick={onOpenPolls}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                isLight
                  ? "border-slate-200 bg-slate-50 hover:border-amber-400 hover:bg-amber-50"
                  : "border-raw-border/30 bg-raw-surface/20 hover:border-raw-gold/45 hover:bg-raw-gold/[0.06]"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  isLight ? "bg-amber-100 text-amber-700" : "bg-raw-gold/15 text-raw-gold"
                }`}>
                  {idx + 1}
                </span>
                <span className={`truncate text-sm ${isLight ? "text-slate-800" : "text-raw-text"}`}>
                  {poll.question}
                </span>
              </span>
              <span className={`flex shrink-0 items-center gap-1 text-[11px] ${
                isLight ? "text-slate-500" : "text-raw-silver/55"
              }`}>
                <MessageCircle className="size-3.5" />
                {poll.commentCount}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
