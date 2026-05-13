import { useRef, useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import { useTheme } from "@/providers/useTheme";

const CARD_CLIP =
  "polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)";
const CARD_INNER_CLIP =
  "polygon(17px 0, calc(100% - 17px) 0, 100% 17px, 100% calc(100% - 17px), calc(100% - 17px) 100%, 17px 100%, 0 calc(100% - 17px), 0 17px)";
const BUTTON_CLIP =
  "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const COMMENT_CLIP =
  "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 400;

function CountUp({ target, duration = 900 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{val}</>;
}

function GoldIcosahedron({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 0 12px rgba(241,196,45,0.55))" }}
    >
      <defs>
        <linearGradient id="opcd-goldFaceA" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="55%" stopColor="#F1C42D" />
          <stop offset="100%" stopColor="#7a5e0a" />
        </linearGradient>
        <linearGradient id="opcd-goldFaceB" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a4708" />
          <stop offset="50%" stopColor="#d6a322" />
          <stop offset="100%" stopColor="#fff2a8" />
        </linearGradient>
        <linearGradient id="opcd-goldFaceC" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fff8c8" />
          <stop offset="100%" stopColor="#a37f10" />
        </linearGradient>
        <radialGradient id="opcd-goldCore" cx="50%" cy="42%" r="50%">
          <stop offset="0%" stopColor="#fff8d2" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#F1C42D" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5a4708" stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="url(#opcd-goldFaceA)" opacity="0.92" />
      <polygon points="50,4 92,28 50,52 8,28" fill="url(#opcd-goldFaceC)" opacity="0.95" />
      <polygon points="8,28 50,52 8,72" fill="url(#opcd-goldFaceB)" opacity="0.85" />
      <polygon points="92,28 92,72 50,52" fill="url(#opcd-goldFaceB)" opacity="0.82" />
      <polygon points="50,52 92,72 50,96 8,72" fill="url(#opcd-goldFaceA)" opacity="0.7" />
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="url(#opcd-goldCore)" />
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

interface OnboardingPollCardProps {
  question: string;
  /** Exactly 2 options: [0] = left, [1] = right */
  options: string[];
  selectedOption?: string;
  responseStats: Record<string, number>;
  comments: string[];
  onVote: (option: string) => void;
  onAddComment: (text: string) => void;
}

export function OnboardingPollCard({
  question,
  options,
  selectedOption,
  responseStats,
  comments,
  onVote,
  onAddComment,
}: OnboardingPollCardProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const isDragging = useRef(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const opt1Opacity = useTransform(x, [20, 90], [0, 1]);
  const opt0Opacity = useTransform(x, [-90, -20], [1, 0]);
  const opt1Bg = useTransform(x, [0, 120], ["rgba(16,185,129,0)", "rgba(16,185,129,0.18)"]);
  const opt0Bg = useTransform(x, [-120, 0], ["rgba(239,68,68,0.18)", "rgba(239,68,68,0)"]);

  const [commentInput, setCommentInput] = useState("");
  const [waterFilled, setWaterFilled] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const opt0 = options[0] ?? "";
  const opt1 = options[1] ?? "";

  const totalVotes = (responseStats[opt0] ?? 0) + (responseStats[opt1] ?? 0);
  const opt0Percent = totalVotes > 0 ? Math.round(((responseStats[opt0] ?? 0) / totalVotes) * 100) : 50;
  const opt1Percent = totalVotes > 0 ? Math.round(((responseStats[opt1] ?? 0) / totalVotes) * 100) : 50;

  useEffect(() => {
    if (!selectedOption) { setWaterFilled(false); return; }
    setWaterFilled(false);
    const t = setTimeout(() => setWaterFilled(true), 60);
    return () => clearTimeout(t);
  }, [selectedOption]);

  const handleVote = useCallback(
    (option: string) => {
      if (selectedOption) return;
      onVote(option);
    },
    [selectedOption, onVote]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const { offset, velocity } = info;
      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        animate(x, 600, { type: "spring", stiffness: 180, damping: 22 }).then(() => {
          handleVote(opt1);
          x.set(0);
        });
      } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        animate(x, -600, { type: "spring", stiffness: 180, damping: 22 }).then(() => {
          handleVote(opt0);
          x.set(0);
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
      }
      isDragging.current = false;
    },
    [handleVote, opt0, opt1, x]
  );

  const handleSubmitComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    onAddComment(text);
    setCommentInput("");
    commentInputRef.current?.blur();
  };

  return (
    <div className="w-full">
      <motion.div
        style={{ x, rotate, position: "relative", width: "100%" }}
        drag={selectedOption ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={handleDragEnd}
      >
        <div
          className="relative w-full p-[1.5px]"
          style={{
            clipPath: CARD_CLIP,
            background:
              "linear-gradient(160deg, rgba(241,196,45,0.95) 0%, rgba(241,196,45,0.35) 35%, rgba(241,196,45,0.15) 60%, rgba(241,196,45,0.7) 100%)",
            boxShadow: "0 0 60px rgba(241,196,45,0.18), 0 0 24px rgba(241,196,45,0.22)",
          }}
        >
          {/* Swipe bg tints */}
          <motion.div
            className="absolute inset-0 rounded-[1px] pointer-events-none z-10"
            style={{ background: opt1Bg, clipPath: CARD_CLIP }}
          />
          <motion.div
            className="absolute inset-0 rounded-[1px] pointer-events-none z-10"
            style={{ background: opt0Bg, clipPath: CARD_CLIP }}
          />

          {/* Right option swipe indicator */}
          <motion.div className="absolute top-5 right-5 z-20 pointer-events-none" style={{ opacity: opt1Opacity }}>
            <div
              className="rounded-md px-2.5 py-1 font-bold text-xs tracking-widest uppercase"
              style={{
                border: "2px solid rgba(16,185,129,0.8)",
                color: "rgba(16,185,129,0.95)",
                background: "rgba(16,185,129,0.1)",
                textShadow: "0 0 10px rgba(16,185,129,0.55)",
              }}
            >
              {opt1} ✓
            </div>
          </motion.div>

          {/* Left option swipe indicator */}
          <motion.div className="absolute top-5 left-5 z-20 pointer-events-none" style={{ opacity: opt0Opacity }}>
            <div
              className="rounded-md px-2.5 py-1 font-bold text-xs tracking-widest uppercase"
              style={{
                border: "2px solid rgba(239,68,68,0.8)",
                color: "rgba(239,68,68,0.95)",
                background: "rgba(239,68,68,0.1)",
                textShadow: "0 0 10px rgba(239,68,68,0.55)",
              }}
            >
              {opt0} ✗
            </div>
          </motion.div>

          <div
            className="relative px-7 pt-7 pb-7"
            style={{
              clipPath: CARD_INNER_CLIP,
              background: isLight
                ? "linear-gradient(165deg, #fffdf5 0%, #fdf8e8 60%, #faf4d8 100%)"
                : "linear-gradient(165deg, #161616 0%, #0a0a0a 60%, #050505 100%)",
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
                Instantly See What Everyone Else Thinks.
              </p>

              <p
                className="mt-5 font-display text-[22px] font-medium leading-[1.18] tracking-wide"
                style={{
                  fontFamily: 'var(--font-display, "Orbitron", "Inter", system-ui, sans-serif)',
                  color: isLight ? "#1a1a1a" : "#EBEBEB",
                }}
              >
                {question}
              </p>

              <div className="mt-6 h-px w-16 bg-white/20" />

              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                {/* Left option */}
                <button
                  type="button"
                  disabled={!!selectedOption}
                  onClick={() => {
                    if (isDragging.current) { isDragging.current = false; return; }
                    handleVote(opt0);
                  }}
                  aria-label={`Vote ${opt0}`}
                  className="group relative h-12 overflow-hidden transition active:scale-95 disabled:cursor-not-allowed"
                  style={{ clipPath: BUTTON_CLIP }}
                >
                  <span
                    className="absolute inset-0"
                    style={{ clipPath: BUTTON_CLIP, background: "rgba(180,180,180,0.6)" }}
                  />
                  <span
                    className="absolute inset-[1.5px]"
                    style={{
                      clipPath: BUTTON_CLIP,
                      background: "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(10,10,10,0.95))",
                    }}
                  />
                  {selectedOption && (
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0"
                      style={{
                        width: waterFilled ? `${opt0Percent}%` : "0%",
                        transition: waterFilled ? "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                        background: "linear-gradient(to right, rgba(200,200,200,0.85), rgba(140,140,140,0.65))",
                      }}
                    >
                      {selectedOption === opt0 && (
                        <div
                          className="absolute inset-y-0 right-0 w-1.5 origin-right"
                          style={{
                            background: "rgba(230,230,230,0.95)",
                            boxShadow: "0 0 10px 3px rgba(200,200,200,0.7)",
                            animation: "water-edge-pulse 1s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>
                  )}
                  <span
                    className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-sm font-semibold tracking-wide"
                    style={{
                      color: selectedOption ? (selectedOption === opt0 ? "#FFFFFF" : "rgba(255,255,255,0.55)") : "#EBEBEB",
                      textShadow: selectedOption === opt0 ? "0 0 10px rgba(255,255,255,0.9)" : undefined,
                      transition: "color 0.4s ease",
                    }}
                  >
                    <span className="truncate max-w-[70px]">{opt0}</span>
                    {selectedOption && <span className="shrink-0 text-sm font-bold opacity-90"><CountUp target={opt0Percent} />%</span>}
                  </span>
                </button>

                {/* Right option */}
                <button
                  type="button"
                  disabled={!!selectedOption}
                  onClick={() => {
                    if (isDragging.current) { isDragging.current = false; return; }
                    handleVote(opt1);
                  }}
                  aria-label={`Vote ${opt1}`}
                  className="group relative h-12 overflow-hidden transition active:scale-95 disabled:cursor-not-allowed"
                  style={{ clipPath: BUTTON_CLIP }}
                >
                  <span
                    className="absolute inset-0"
                    style={{ clipPath: BUTTON_CLIP, background: "rgba(241,196,45,0.85)" }}
                  />
                  <span
                    className="absolute inset-[1.5px]"
                    style={{
                      clipPath: BUTTON_CLIP,
                      background: "linear-gradient(155deg, rgba(241,196,45,0.18), rgba(20,14,2,0.95))",
                    }}
                  />
                  {selectedOption && (
                    <div
                      className="pointer-events-none absolute inset-y-0 right-0"
                      style={{
                        width: waterFilled ? `${opt1Percent}%` : "0%",
                        transition: waterFilled ? "width 1.2s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                        background: "linear-gradient(to left, rgba(247,213,87,0.92), rgba(210,155,18,0.75))",
                      }}
                    >
                      {selectedOption === opt1 && (
                        <div
                          className="absolute inset-y-0 left-0 w-1.5 origin-left"
                          style={{
                            background: "rgba(255,236,120,0.95)",
                            boxShadow: "0 0 10px 3px rgba(247,213,87,0.7)",
                            animation: "water-edge-pulse 1s ease-in-out infinite",
                          }}
                        />
                      )}
                    </div>
                  )}
                  <span
                    className="relative z-10 flex h-full w-full items-center justify-center gap-1.5 text-sm font-semibold tracking-wide"
                    style={{
                      color: selectedOption ? (selectedOption === opt1 ? "#FFFFFF" : "rgba(255,255,255,0.55)") : "#F1C42D",
                      textShadow: selectedOption === opt1 ? "0 0 10px rgba(241,196,45,1)" : undefined,
                      transition: "color 0.4s ease",
                    }}
                  >
                    <span className="truncate max-w-[70px]">{opt1}</span>
                    {selectedOption && <span className="shrink-0 text-sm font-bold opacity-90"><CountUp target={opt1Percent} />%</span>}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Comments — slides down after voting */}
      <AnimatePresence>
        {selectedOption && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
              className="h-px origin-left bg-gradient-to-r from-transparent via-[#F1C42D]/55 to-transparent"
              style={{ boxShadow: "0 0 8px rgba(241,196,45,0.4)" }}
            />
            <div
              className="p-[1px]"
              style={{
                clipPath: COMMENT_CLIP,
                background:
                  "linear-gradient(160deg, rgba(241,196,45,0.35) 0%, rgba(241,196,45,0.08) 50%, rgba(241,196,45,0.25) 100%)",
                boxShadow: "0 8px 32px rgba(241,196,45,0.1)",
              }}
            >
              <div
                className="px-4 py-4"
                style={{
                  clipPath: COMMENT_CLIP,
                  background: "linear-gradient(165deg, #111111 0%, #070707 100%)",
                }}
              >
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#F1C42D]/60">
                  Anonymous Comments
                </p>
                <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                  {comments.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#F1C42D]/12 text-[9px] font-bold text-[#F1C42D]/55">
                        ?
                      </span>
                      <p className="text-[12px] leading-[1.4] text-white/55">{c}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex w-full min-w-0 gap-2 overflow-hidden">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder="Add anonymous comment…"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      handleSubmitComment();
                    }}
                    enterKeyHint="send"
                    className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-base text-white/70 outline-none placeholder:text-white/25 transition focus:border-[#F1C42D]/40 sm:text-[12px]"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
