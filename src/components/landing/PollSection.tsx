import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Poll } from "@/store/useRawStore";
import { track } from "@/lib/analytics";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";

interface PollSectionProps {
  polls: Poll[];
  votedPolls: Set<string>;
  isLoggedIn: boolean;
  freeVotesUsed: number;
  onVote: (pollId: string, optionId: string) => void;
  onSignupClick: () => void;
}

const GOLD = "rgba(241,196,45,0.85)";
const GOLD_DIM = "rgba(241,196,45,0.35)";
const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 500;

// ── Hex badge ──────────────────────────────────────────────────────────────
function HexBadge() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <div
        className="absolute rounded-full animate-pulse"
        style={{
          inset: "-8px",
          background: "radial-gradient(circle, rgba(241,196,45,0.18) 0%, transparent 70%)",
        }}
      />
      <svg viewBox="0 0 80 80" width="72" height="72" style={{ overflow: "visible" }}>
        <defs>
          <filter id="hexglow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer hexagon */}
        <polygon
          points="40,4 73,22 73,58 40,76 7,58 7,22"
          fill="rgba(241,196,45,0.04)"
          stroke={GOLD}
          strokeWidth="1.5"
          filter="url(#hexglow)"
        />
        {/* Inner hexagon */}
        <polygon
          points="40,14 65,28 65,52 40,66 15,52 15,28"
          fill="rgba(241,196,45,0.06)"
          stroke={GOLD_DIM}
          strokeWidth="1"
        />
        {/* Corner tick marks */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = ((i * 60 - 90) * Math.PI) / 180;
          const r1 = 37; const r2 = 41;
          return (
            <line
              key={i}
              x1={40 + r1 * Math.cos(angle)} y1={40 + r1 * Math.sin(angle)}
              x2={40 + r2 * Math.cos(angle)} y2={40 + r2 * Math.sin(angle)}
              stroke={GOLD} strokeWidth="1.5"
            />
          );
        })}
      </svg>
      {/* Icon inside hex */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="12" y2="16" />
        </svg>
      </div>
    </div>
  );
}

// ── Corner brackets (sci-fi) ───────────────────────────────────────────────
function CornerBrackets({ isLight }: { isLight: boolean }) {
  const color = isLight ? "rgba(180,140,20,0.7)" : GOLD;
  const glow = isLight
    ? "none"
    : "0 0 8px rgba(241,196,45,0.4)";
  const s = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 26,
    height: 26,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "transparent",
    boxShadow: glow,
    ...extra,
  });
  return (
    <>
      <div style={s({ top: -1, left: -1, borderTopColor: color, borderLeftColor: color })} />
      <div style={s({ top: -1, right: -1, borderTopColor: color, borderRightColor: color })} />
      <div style={s({ bottom: -1, left: -1, borderBottomColor: color, borderLeftColor: color })} />
      <div style={s({ bottom: -1, right: -1, borderBottomColor: color, borderRightColor: color })} />
    </>
  );
}

// ── Nav arrow button ───────────────────────────────────────────────────────
function NavArrow({
  direction,
  onClick,
  disabled,
  isLight,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
  isLight: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-200"
      style={{
        border: `1.5px solid ${disabled ? "rgba(241,196,45,0.15)" : isLight ? "rgba(180,140,20,0.6)" : "rgba(241,196,45,0.55)"}`,
        background: disabled ? "rgba(241,196,45,0.02)" : isLight ? "rgba(241,196,45,0.08)" : "rgba(241,196,45,0.06)",
        boxShadow: disabled || isLight ? "none" : "0 0 12px rgba(241,196,45,0.2)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {direction === "prev"
        ? <ChevronLeft size={18} style={{ color: isLight ? "rgba(160,120,10,0.8)" : GOLD }} />
        : <ChevronRight size={18} style={{ color: isLight ? "rgba(160,120,10,0.8)" : GOLD }} />
      }
    </button>
  );
}

// ── Draggable card ─────────────────────────────────────────────────────────
function DraggablePollCard({
  poll,
  pollIndex,
  totalPolls,
  hasVoted,
  onVoteYes,
  onVoteNo,
  exitDirection,
  isLight,
}: {
  poll: Poll;
  pollIndex: number;
  totalPolls: number;
  hasVoted: boolean;
  onVoteYes: () => void;
  onVoteNo: () => void;
  exitDirection: "yes" | "no" | null;
  isLight: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-16, 0, 16]);
  const yesOpacity = useTransform(x, [20, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, -20], [1, 0]);
  const yesBg = useTransform(x, [0, 150], ["rgba(16,185,129,0)", "rgba(16,185,129,0.14)"]);
  const noBg = useTransform(x, [-150, 0], ["rgba(239,68,68,0.14)", "rgba(239,68,68,0)"]);

  const isDragging = useRef(false);

  useEffect(() => {
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }, [poll.id, x]);

  const handleDragEnd = useCallback(
    (_e: never, info: { offset: { x: number }; velocity: { x: number } }) => {
      if (hasVoted) return;
      const { offset, velocity } = info;
      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        animate(x, 600, { type: "spring", stiffness: 180, damping: 22 }).then(onVoteYes);
      } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        animate(x, -600, { type: "spring", stiffness: 180, damping: 22 }).then(onVoteNo);
      } else {
        animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
      }
    },
    [hasVoted, onVoteYes, onVoteNo, x]
  );

  const cardBg = isLight
    ? "linear-gradient(145deg, #ffffff 0%, #f8f6f0 100%)"
    : "linear-gradient(145deg, #0d0d14 0%, #090910 100%)";

  const cardBorder = isLight
    ? "1px solid rgba(180,140,20,0.45)"
    : "1px solid rgba(241,196,45,0.35)";

  const cardShadow = isLight
    ? "0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(180,140,20,0.1)"
    : "0 0 0 1px rgba(241,196,45,0.08), 0 0 40px rgba(241,196,45,0.12), 0 20px 60px rgba(0,0,0,0.6)";

  const textPrimary = isLight ? "#1a1a1a" : "#ffffff";
  const textSecondary = isLight ? "rgba(60,50,20,0.6)" : "rgba(255,255,255,0.45)";
  const goldAccent = isLight ? "rgba(160,120,10,0.85)" : GOLD;

  const variants = {
    enter: (dir: "yes" | "no") => ({
      x: dir === "yes" ? -320 : 320,
      opacity: 0,
      rotate: dir === "yes" ? -12 : 12,
    }),
    center: { x: 0, opacity: 1, rotate: 0 },
    exit: (dir: "yes" | "no") => ({
      x: dir === "yes" ? 600 : -600,
      opacity: 0,
      rotate: dir === "yes" ? 20 : -20,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={exitDirection}>
      <motion.div
        key={poll.id}
        custom={exitDirection}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{ x, rotate, position: "relative", width: "100%" }}
        drag={hasVoted ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
      >
        {/* Drag color tint overlays */}
        <motion.div
          className="absolute inset-0 rounded-[1.5rem] pointer-events-none z-10"
          style={{ background: yesBg }}
        />
        <motion.div
          className="absolute inset-0 rounded-[1.5rem] pointer-events-none z-10"
          style={{ background: noBg }}
        />

        {/* YES indicator */}
        <motion.div
          className="absolute top-6 left-6 z-20 pointer-events-none"
          style={{ opacity: yesOpacity }}
        >
          <div
            className="rounded-lg px-3 py-1.5 font-bold text-sm tracking-widest uppercase"
            style={{
              border: "2px solid rgba(16,185,129,0.8)",
              color: "rgba(16,185,129,0.95)",
              background: "rgba(16,185,129,0.1)",
              textShadow: "0 0 12px rgba(16,185,129,0.6)",
            }}
          >
            YES ✓
          </div>
        </motion.div>

        {/* NO indicator */}
        <motion.div
          className="absolute top-6 right-6 z-20 pointer-events-none"
          style={{ opacity: noOpacity }}
        >
          <div
            className="rounded-lg px-3 py-1.5 font-bold text-sm tracking-widest uppercase"
            style={{
              border: "2px solid rgba(239,68,68,0.8)",
              color: "rgba(239,68,68,0.95)",
              background: "rgba(239,68,68,0.1)",
              textShadow: "0 0 12px rgba(239,68,68,0.6)",
            }}
          >
            NO ✗
          </div>
        </motion.div>

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-[1.5rem] select-none"
          style={{
            background: cardBg,
            border: cardBorder,
            boxShadow: cardShadow,
            color: textPrimary,
          }}
        >
          <CornerBrackets isLight={isLight} />

          {/* Dot grid */}
          {!isLight && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(241,196,45,0.12) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
          )}

          {/* Inner glow lines (sci-fi edge) */}
          {!isLight && (
            <>
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(241,196,45,0.4), transparent)" }} />
              <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(241,196,45,0.2), transparent)" }} />
            </>
          )}

          <div className="relative flex flex-col items-center px-7 pt-8 pb-7 gap-5">
            {/* Hex badge */}
            <HexBadge />

            {/* POLL QUESTION label */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent})` }} />
              <p
                className="font-display text-[9px] tracking-[0.35em] uppercase whitespace-nowrap"
                style={{ color: goldAccent }}
              >
                Poll Question
              </p>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${goldAccent}, transparent)` }} />
            </div>

            {/* Question text */}
            <h2
              className="font-display text-center leading-snug"
              style={{
                fontSize: "clamp(1.3rem, 4vw, 1.7rem)",
                color: textPrimary,
                minHeight: "5rem",
                textShadow: isLight ? "none" : "0 0 30px rgba(255,255,255,0.08)",
              }}
            >
              {poll.question}
            </h2>

            {/* Divider */}
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"})` }} />
              <div className="w-1 h-1 rounded-full" style={{ background: goldAccent }} />
              <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.1)"}, transparent)` }} />
            </div>

            {/* Swipe hint */}
            <p
              className="text-[10px] tracking-[0.18em] uppercase text-center"
              style={{ color: textSecondary }}
            >
              Swipe right for Yes, left for No
            </p>

            {/* Buttons */}
            <div className="flex w-full gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (isDragging.current) { isDragging.current = false; return; }
                  onVoteYes();
                }}
                className="flex-1 rounded-2xl py-3.5 text-base font-bold tracking-wider transition-all"
                style={{
                  background: isLight
                    ? "linear-gradient(145deg, rgba(180,140,20,0.18), rgba(180,140,20,0.08))"
                    : "linear-gradient(145deg, rgba(241,196,45,0.22), rgba(241,196,45,0.08))",
                  border: `1.5px solid ${isLight ? "rgba(180,140,20,0.6)" : "rgba(241,196,45,0.65)"}`,
                  color: goldAccent,
                  boxShadow: isLight ? "none" : "0 0 16px rgba(241,196,45,0.18), inset 0 1px 0 rgba(241,196,45,0.15)",
                }}
              >
                Yes
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  if (isDragging.current) { isDragging.current = false; return; }
                  onVoteNo();
                }}
                className="flex-1 rounded-2xl py-3.5 text-base font-medium tracking-wider transition-all"
                style={{
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)"}`,
                  color: isLight ? "rgba(30,25,10,0.65)" : "rgba(255,255,255,0.6)",
                }}
              >
                No
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Result reveal ──────────────────────────────────────────────────────────
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

function ResultCard({
  poll,
  localVotedId,
  isLight,
}: {
  poll: Poll;
  localVotedId: string | null;
  isLight: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const yesOption = poll.options.find((o) => o.text === "Yes");
  const noOption = poll.options.find((o) => o.text === "No");
  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
  const yesPct = totalVotes > 0
    ? Math.round(((yesOption?.votes ?? 0) / totalVotes) * 100)
    : localVotedId === yesOption?.id ? 100 : 0;
  const noPct = 100 - yesPct;

  const textPrimary = isLight ? "#1a1a1a" : "#ffffff";
  const goldAccent = isLight ? "rgba(160,120,10,0.85)" : GOLD;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="w-full rounded-[1.5rem] overflow-hidden relative"
      style={{
        background: isLight
          ? "linear-gradient(145deg, #ffffff, #f8f6f0)"
          : "linear-gradient(145deg, #0d0d14, #090910)",
        border: `1px solid ${isLight ? "rgba(180,140,20,0.35)" : "rgba(241,196,45,0.28)"}`,
        boxShadow: isLight
          ? "0 8px 40px rgba(0,0,0,0.15)"
          : "0 0 40px rgba(241,196,45,0.1), 0 20px 60px rgba(0,0,0,0.5)",
        color: textPrimary,
      }}
    >
      <CornerBrackets isLight={isLight} />
      {!isLight && (
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(241,196,45,0.4), transparent)" }} />
      )}
      <div className="relative flex flex-col items-center px-7 pt-8 pb-7 gap-5">
        <HexBadge />
        <p className="font-display text-sm tracking-[0.25em] uppercase" style={{ color: goldAccent }}>
          Results
        </p>
        <h2
          className="font-display text-center leading-snug text-sm opacity-60"
          style={{ color: textPrimary }}
        >
          {poll.question}
        </h2>

        {/* Result bars */}
        <div className="w-full space-y-3">
          {[
            { label: "Yes", pct: yesPct, isYes: true, votes: yesOption?.votes ?? 0 },
            { label: "No", pct: noPct, isYes: false, votes: noOption?.votes ?? 0 },
          ].map(({ label, pct, isYes, votes }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: isYes ? "rgba(110,231,183,0.9)" : (isLight ? "rgba(60,50,20,0.6)" : "rgba(255,255,255,0.5)") }}>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {votes > 0 && (
                    <span className="text-[9px]" style={{ color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.25)" }}>
                      {votes.toLocaleString()}
                    </span>
                  )}
                  <span className="font-display font-bold text-lg tabular-nums" style={{ color: isYes ? "rgba(110,231,183,0.9)" : textPrimary }}>
                    <CountUp target={pct} />%
                  </span>
                </div>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: visible ? `${pct}%` : 0 }}
                  transition={{ duration: 0.9, ease: [0.34, 1.06, 0.64, 1] }}
                  style={{
                    background: isYes
                      ? "linear-gradient(90deg, rgba(16,185,129,0.8), rgba(16,185,129,0.5))"
                      : isLight
                      ? "rgba(0,0,0,0.18)"
                      : "rgba(255,255,255,0.2)",
                    boxShadow: isYes ? "0 0 8px rgba(16,185,129,0.4)" : "none",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[9px] tracking-widest uppercase" style={{ color: isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)" }}>
          {totalVotes > 0 ? `${totalVotes.toLocaleString()} anonymous voices` : "you're among the first"}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export function PollSection({
  polls,
  votedPolls,
  isLoggedIn,
  freeVotesUsed,
  onVote,
  onSignupClick,
}: PollSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"yes" | "no">("yes");
  const [localVotedIds, setLocalVotedIds] = useState<Record<string, string>>({});
  const [advancing, setAdvancing] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const sectionRef = useTrackSectionView("polls");
  const gateFiredRef = useRef(false);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains("theme-light"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  if (polls.length === 0) return null;

  const currentPoll = polls[currentIndex];
  const currentHasVoted = votedPolls.has(currentPoll.id);
  const showSignupGate = !isLoggedIn && freeVotesUsed >= 3;

  const advance = useCallback(
    (dir: "yes" | "no") => {
      if (advancing) return;
      setAdvancing(true);
      setExitDir(dir);
      setTimeout(() => {
        if (currentIndex < polls.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          onSignupClick();
        }
        setAdvancing(false);
      }, 420);
    },
    [advancing, currentIndex, polls.length, onSignupClick]
  );

  const handleVote = useCallback(
    (answer: "yes" | "no") => {
      const yesOption = currentPoll.options.find((o) => o.text === "Yes");
      const noOption = currentPoll.options.find((o) => o.text === "No");
      const optionId = answer === "yes" ? yesOption?.id : noOption?.id;
      if (!optionId) return;

      setLocalVotedIds((prev) => ({ ...prev, [currentPoll.id]: optionId }));

      const nextVotesUsed = !isLoggedIn ? freeVotesUsed + 1 : freeVotesUsed;
      const gateReached = !isLoggedIn && nextVotesUsed >= 3;
      track("landing_poll_sampled", {
        poll_id: currentPoll.id,
        option_id: optionId,
        answer,
        votes_used: nextVotesUsed,
        gate_reached: gateReached,
      });
      if (gateReached && !gateFiredRef.current) {
        gateFiredRef.current = true;
        track("signup_gate_triggered", { trigger: "poll_gate", votes_used: nextVotesUsed });
      }
      onVote(currentPoll.id, optionId);
      setTimeout(() => advance(answer), 350);
    },
    [advance, currentPoll, freeVotesUsed, isLoggedIn, onVote]
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentHasVoted && currentIndex < polls.length - 1;

  const goldAccent = isLight ? "rgba(160,120,10,0.85)" : GOLD;
  const sectionBg = isLight ? "transparent" : "transparent";

  return (
    <LandingSectionShell
      id="polls"
      sectionRef={sectionRef as React.Ref<HTMLElement>}
      title="Start with a question."
      description={
        <>
          Answer anonymously and see live results instantly.
          {!isLoggedIn && " 3 free — then sign up to keep going."}
        </>
      }
      innerClassName="p-0 overflow-hidden"
    >
      <div
        className="relative flex flex-col items-center py-8 px-4"
        style={{ background: sectionBg, minHeight: "520px" }}
      >
        {/* Dot grid (dark mode only) */}
        {!isLight && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(241,196,45,0.07) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
        )}
        {/* Top ambient glow */}
        {!isLight && (
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(241,196,45,0.12), transparent 70%)" }}
          />
        )}

        {/* ── Progress header ── */}
        <div className="relative flex flex-col items-center gap-3 mb-6 w-full max-w-xs">
          {/* n / total */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${goldAccent})` }} />
            <span
              className="font-display text-sm tracking-[0.3em] tabular-nums"
              style={{ color: goldAccent }}
            >
              {showSignupGate ? polls.length : currentIndex + 1} / {polls.length}
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${goldAccent}, transparent)` }} />
          </div>
          {/* Progress pills */}
          <div className="flex items-center gap-2">
            {polls.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentIndex && !showSignupGate ? 28 : 10,
                  opacity: i <= currentIndex || showSignupGate ? 1 : 0.25,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="h-1.5 rounded-full"
                style={{
                  background: i === currentIndex && !showSignupGate
                    ? goldAccent
                    : i < currentIndex || showSignupGate
                    ? GOLD_DIM
                    : isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
                  boxShadow: i === currentIndex && !showSignupGate && !isLight
                    ? "0 0 8px rgba(241,196,45,0.6)"
                    : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Card + nav arrows ── */}
        <div className="relative flex items-center gap-3 w-full max-w-xs sm:max-w-sm">
          <NavArrow
            direction="prev"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={!canGoPrev}
            isLight={isLight}
          />

          <div className="flex-1 min-w-0">
            {showSignupGate ? (
              // Signup gate card
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-[1.5rem] select-none"
                style={{
                  background: isLight
                    ? "linear-gradient(145deg, #ffffff, #f8f6f0)"
                    : "linear-gradient(145deg, #0d0d14, #090910)",
                  border: `1px solid ${isLight ? "rgba(180,140,20,0.45)" : "rgba(241,196,45,0.35)"}`,
                  boxShadow: isLight
                    ? "0 8px 40px rgba(0,0,0,0.18)"
                    : "0 0 40px rgba(241,196,45,0.12), 0 20px 60px rgba(0,0,0,0.6)",
                }}
              >
                <CornerBrackets isLight={isLight} />
                {!isLight && (
                  <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(241,196,45,0.4), transparent)" }} />
                )}
                <div className="relative flex flex-col items-center px-7 pt-10 pb-8 gap-5" style={{ color: isLight ? "#1a1a1a" : "#ffffff" }}>
                  <HexBadge />
                  <div>
                    <p className="font-display text-xl tracking-wide text-center" style={{ color: isLight ? "#1a1a1a" : "#ffffff" }}>
                      All polls answered!
                    </p>
                    <p className="text-sm text-center mt-2 leading-relaxed" style={{ color: isLight ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.4)" }}>
                      Sign up to keep answering<br />and earn rewards.
                    </p>
                    <p className="text-center text-[10px] mt-2" style={{ color: goldAccent }}>
                      +3 coins per poll answered
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onSignupClick}
                    className="w-full rounded-2xl py-3.5 text-sm font-bold tracking-wider text-black"
                    style={{ background: "#F1C42D", boxShadow: isLight ? "none" : "0 0 20px rgba(241,196,45,0.35)" }}
                  >
                    Sign Up & Earn Rewards
                  </motion.button>
                </div>
              </motion.div>
            ) : currentHasVoted ? (
              <ResultCard
                poll={currentPoll}
                localVotedId={localVotedIds[currentPoll.id] ?? null}
                isLight={isLight}
              />
            ) : (
              <DraggablePollCard
                poll={currentPoll}
                pollIndex={currentIndex}
                totalPolls={polls.length}
                hasVoted={false}
                onVoteYes={() => handleVote("yes")}
                onVoteNo={() => handleVote("no")}
                exitDirection={exitDir}
                isLight={isLight}
              />
            )}
          </div>

          <NavArrow
            direction="next"
            onClick={() => setCurrentIndex((i) => Math.min(polls.length - 1, i + 1))}
            disabled={!canGoNext}
            isLight={isLight}
          />
        </div>
      </div>
    </LandingSectionShell>
  );
}
