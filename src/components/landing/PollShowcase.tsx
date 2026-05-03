import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Send } from "lucide-react";

interface PollData {
  question: string;
  yesPercent: number;
  noPercent: number;
  comments: string[];
}

const POLLS: PollData[] = [
  {
    question: "Have you ever cheated on someone?",
    yesPercent: 40,
    noPercent: 60,
    comments: [
      "Once, years ago. Still regret it.",
      "Never. Couldn't live with myself.",
      "Emotional cheating counts too and more people do it than admit.",
    ],
  },
  {
    question: "Do you think social media does more harm than good?",
    yesPercent: 67,
    noPercent: 33,
    comments: [
      "It's a tool. The harm is in how we use it.",
      "Absolutely — anxiety and comparison culture are real.",
      "Depends on the platform honestly.",
    ],
  },
  {
    question: "Would you sacrifice comfort for personal growth?",
    yesPercent: 82,
    noPercent: 18,
    comments: [
      "Growth lives outside the comfort zone. Always.",
      "Easier said than done when bills are due.",
      "Done it twice. Worth it both times.",
    ],
  },
];

function GoldIcosahedron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 12px rgba(241,196,45,0.55))" }}
    >
      <defs>
        <linearGradient id="goldFaceA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="55%" stopColor="#F1C42D" />
          <stop offset="100%" stopColor="#7a5e0a" />
        </linearGradient>
        <linearGradient id="goldFaceB" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a4708" />
          <stop offset="50%" stopColor="#d6a322" />
          <stop offset="100%" stopColor="#fff2a8" />
        </linearGradient>
        <linearGradient id="goldFaceC" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fff8c8" />
          <stop offset="100%" stopColor="#a37f10" />
        </linearGradient>
        <radialGradient id="goldCore" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fff8d2" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F1C42D" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5a4708" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="url(#goldFaceA)" opacity="0.92" />
      <polygon points="50,4 92,28 50,52 8,28" fill="url(#goldFaceC)" opacity="0.95" />
      <polygon points="8,28 50,52 8,72" fill="url(#goldFaceB)" opacity="0.85" />
      <polygon points="92,28 92,72 50,52" fill="url(#goldFaceB)" opacity="0.82" />
      <polygon points="50,52 92,72 50,96 8,72" fill="url(#goldFaceA)" opacity="0.7" />
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="url(#goldCore)" />
      <g stroke="#fff3a8" strokeWidth="0.9" fill="none" opacity="0.95">
        <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" />
        <line x1="50" y1="4" x2="50" y2="96" />
        <line x1="8" y1="28" x2="92" y2="72" />
        <line x1="92" y1="28" x2="8" y2="72" />
        <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" />
        <line x1="50" y1="18" x2="50" y2="82" />
        <line x1="22" y1="34" x2="78" y2="66" />
        <line x1="78" y1="34" x2="22" y2="66" />
      </g>
      <g stroke="#7a5e0a" strokeWidth="0.5" fill="none" opacity="0.85">
        <line x1="50" y1="4" x2="22" y2="34" />
        <line x1="50" y1="4" x2="78" y2="34" />
        <line x1="50" y1="96" x2="22" y2="66" />
        <line x1="50" y1="96" x2="78" y2="66" />
        <line x1="8" y1="28" x2="22" y2="34" />
        <line x1="8" y1="72" x2="22" y2="66" />
        <line x1="92" y1="28" x2="78" y2="34" />
        <line x1="92" y1="72" x2="78" y2="66" />
      </g>
    </svg>
  );
}

const CARD_CLIP =
  "polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)";
const CARD_INNER_CLIP =
  "polygon(17px 0, calc(100% - 17px) 0, 100% 17px, 100% calc(100% - 17px), calc(100% - 17px) 100%, 17px 100%, 0 calc(100% - 17px), 0 17px)";
const BUTTON_CLIP =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const COMMENT_CLIP =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

export function PollShowcase() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "yes" | "no">>({});
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [extraComments, setExtraComments] = useState<Record<number, string[]>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const total = POLLS.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const selected = answers[index];
  const poll = POLLS[index];
  const showComments = !!selected;
  const allComments = [...poll.comments, ...(extraComments[index] ?? [])];

  const handleAnswer = (choice: "yes" | "no") => {
    setAnswers((prev) => ({ ...prev, [index]: choice }));
  };

  const handleSubmitComment = () => {
    const text = (commentInputs[index] ?? "").trim();
    if (!text) return;
    setExtraComments((prev) => ({
      ...prev,
      [index]: [...(prev[index] ?? []), text],
    }));
    setCommentInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 px-4 backdrop-blur-md overflow-y-auto py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(217,217,217,0.06) 1px, transparent 0)",
        backgroundSize: "14px 14px",
      }}
    >
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close poll preview"
          className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Counter and progress dashes */}
        <div className="mb-4 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-white/35" />
            <p className="text-[12px] font-medium tracking-[0.42em] text-white/85">
              {index + 1} / {total}
            </p>
            <span className="h-px w-7 bg-white/35" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-[3px] transition-all ${
                  i === index
                    ? "w-9 bg-[#F1C42D] shadow-[0_0_8px_rgba(241,196,45,0.7)]"
                    : "w-6 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => canPrev && setIndex((i) => i - 1)}
            disabled={!canPrev}
            aria-label="Previous question"
            className="absolute left-0 z-10 flex h-11 w-11 -translate-x-3 items-center justify-center rounded-full border border-[#F1C42D]/55 bg-black/75 text-[#F1C42D] shadow-[0_0_18px_rgba(241,196,45,0.25)] transition hover:bg-[#F1C42D]/10 disabled:cursor-not-allowed disabled:opacity-25 sm:-translate-x-7"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>

          {/* Card */}
          <div
            className="relative w-full max-w-[330px] p-[1.5px]"
            style={{
              clipPath: CARD_CLIP,
              background:
                "linear-gradient(160deg, rgba(241,196,45,0.95) 0%, rgba(241,196,45,0.35) 35%, rgba(241,196,45,0.15) 60%, rgba(241,196,45,0.7) 100%)",
              boxShadow:
                "0 0 60px rgba(241,196,45,0.18), 0 0 24px rgba(241,196,45,0.22)",
            }}
          >
            <div
              className="relative px-7 pt-7 pb-7"
              style={{
                clipPath: CARD_INNER_CLIP,
                background:
                  "linear-gradient(165deg, #161616 0%, #0a0a0a 60%, #050505 100%)",
              }}
            >
              {/* Corner accents */}
              <span className="pointer-events-none absolute left-[6px] top-[6px] h-[6px] w-[6px] border-l border-t border-[#F1C42D]" />
              <span className="pointer-events-none absolute right-[6px] top-[6px] h-[6px] w-[6px] border-r border-t border-[#F1C42D]" />
              <span className="pointer-events-none absolute bottom-[6px] left-[6px] h-[6px] w-[6px] border-b border-l border-[#F1C42D]" />
              <span className="pointer-events-none absolute bottom-[6px] right-[6px] h-[6px] w-[6px] border-b border-r border-[#F1C42D]" />
              <span className="pointer-events-none absolute left-[10px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#F1C42D]/55" />
              <span className="pointer-events-none absolute right-[10px] top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-[#F1C42D]/55" />

              <div className="flex flex-col items-center text-center">
                <GoldIcosahedron className="mb-5 h-20 w-20" />

                <p className="text-[11px] font-bold uppercase tracking-[0.36em] text-[#F1C42D] [text-shadow:0_0_8px_rgba(241,196,45,0.45)]">
                  Poll Question
                </p>

                <p
                  className="mt-5 font-display text-[26px] font-medium leading-[1.18] tracking-wide text-[#EBEBEB]"
                  style={{
                    fontFamily:
                      'var(--font-display, "Orbitron", "Inter", system-ui, sans-serif)',
                  }}
                >
                  {poll.question}
                </p>

                <div className="mt-6 h-px w-16 bg-white/20" />

                <p className="mt-4 text-[11px] tracking-[0.05em] text-white/45">
                  {selected ? `You answered: ${selected.toUpperCase()}` : "Cast your vote"}
                </p>

                <div className="mt-5 grid w-full grid-cols-2 gap-3">
                  {/* Yes button */}
                  <button
                    type="button"
                    onClick={() => handleAnswer("yes")}
                    aria-label="Vote yes"
                    className="group relative h-12 transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(241,196,45,0.85)",
                      }}
                    />
                    <span
                      className="absolute inset-[1.5px]"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background:
                          selected === "yes"
                            ? "linear-gradient(155deg, rgba(241,196,45,0.45), rgba(40,28,4,0.95))"
                            : "linear-gradient(155deg, rgba(241,196,45,0.18), rgba(20,14,2,0.95))",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-base font-semibold tracking-wide text-[#F1C42D]">
                      Yes
                      {selected && (
                        <span className="text-sm font-bold opacity-90">{poll.yesPercent}%</span>
                      )}
                    </span>
                  </button>

                  {/* No button */}
                  <button
                    type="button"
                    onClick={() => handleAnswer("no")}
                    aria-label="Vote no"
                    className="group relative h-12 transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(180,180,180,0.6)",
                      }}
                    />
                    <span
                      className="absolute inset-[1.5px]"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background:
                          selected === "no"
                            ? "linear-gradient(155deg, rgba(220,220,220,0.25), rgba(10,10,10,0.95))"
                            : "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(10,10,10,0.95))",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-base font-semibold tracking-wide text-[#EBEBEB]">
                      No
                      {selected && (
                        <span className="text-sm font-bold opacity-90">{poll.noPercent}%</span>
                      )}
                    </span>
                  </button>
                </div>

                {/* Next button */}
                {selected && canNext && (
                  <button
                    type="button"
                    onClick={() => setIndex((i) => i + 1)}
                    className="mt-4 w-full h-10 relative transition active:scale-95"
                    style={{ clipPath: BUTTON_CLIP }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        clipPath: BUTTON_CLIP,
                        background: "rgba(241,196,45,0.3)",
                      }}
                    />
                    <span className="relative z-10 flex h-full w-full items-center justify-center gap-1 text-sm font-semibold tracking-widest text-[#F1C42D]/80 uppercase">
                      Next <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => canNext && setIndex((i) => i + 1)}
            disabled={!canNext}
            aria-label="Next question"
            className="absolute right-0 z-10 flex h-11 w-11 translate-x-3 items-center justify-center rounded-full border border-[#F1C42D]/55 bg-black/75 text-[#F1C42D] shadow-[0_0_18px_rgba(241,196,45,0.25)] transition hover:bg-[#F1C42D]/10 disabled:cursor-not-allowed disabled:opacity-25 sm:translate-x-7"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className="mt-4 w-full max-w-[330px] mx-auto">
            <div
              className="p-[1px]"
              style={{
                clipPath: COMMENT_CLIP,
                background:
                  "linear-gradient(160deg, rgba(241,196,45,0.4) 0%, rgba(241,196,45,0.1) 50%, rgba(241,196,45,0.3) 100%)",
              }}
            >
              <div
                className="px-4 py-4"
                style={{
                  clipPath: COMMENT_CLIP,
                  background: "linear-gradient(165deg, #131313 0%, #080808 100%)",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#F1C42D]/70 mb-3">
                  Anonymous Comments
                </p>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {allComments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-[#F1C42D]/15 flex items-center justify-center text-[9px] text-[#F1C42D]/60 font-bold">
                        ?
                      </span>
                      <p className="text-[12px] text-white/60 leading-[1.4]">{c}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add anonymous comment…"
                    value={commentInputs[index] ?? ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [index]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-[12px] text-white/70 placeholder:text-white/25 outline-none focus:border-[#F1C42D]/40 transition"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#F1C42D]/30 bg-[#F1C42D]/10 text-[#F1C42D]/70 transition hover:bg-[#F1C42D]/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
