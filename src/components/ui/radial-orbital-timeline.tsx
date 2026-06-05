'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTheme } from "@/providers/useTheme";
import centerLogo from "@/assets/favicon2.png";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: readonly TimelineItem[];
}

export default function RadialOrbitalTimeline({ timelineData }: RadialOrbitalTimelineProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [activeNodePos, setActiveNodePos] = useState<{ x: number; y: number } | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isTinyPhone, setIsTinyPhone] = useState(false);

  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const autoRotateRef = useRef(true);
  const targetRotationRef = useRef<number | null>(null);

  const isCompactRef = useRef(isCompact);
  const isTinyPhoneRef = useRef(isTinyPhone);
  const expandedItemsRef = useRef(expandedItems);
  const timelineDataRef = useRef(timelineData);
  isCompactRef.current = isCompact;
  isTinyPhoneRef.current = isTinyPhone;
  expandedItemsRef.current = expandedItems;
  timelineDataRef.current = timelineData;

  useEffect(() => {
    const compactQ = window.matchMedia("(max-width: 640px)");
    const tinyQ = window.matchMedia("(max-width: 380px)");
    const syncC = () => setIsCompact(compactQ.matches);
    const syncT = () => setIsTinyPhone(tinyQ.matches);
    syncC(); syncT();
    compactQ.addEventListener("change", syncC);
    tinyQ.addEventListener("change", syncT);
    return () => { compactQ.removeEventListener("change", syncC); tinyQ.removeEventListener("change", syncT); };
  }, []);

  const calculateNodePosition = useCallback((index: number, total: number, rotation: number) => {
    const tiny = isTinyPhoneRef.current;
    const compact = isCompactRef.current;
    const angle = ((index / total) * 360 + rotation) % 360;
    const radius = tiny ? 92 : compact ? 115 : 170;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.78, Math.min(1, 0.78 + 0.22 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, zIndex, opacity };
  }, []);

  const updateNodePositions = useCallback(() => {
    const data = timelineDataRef.current;
    data.forEach((item, index) => {
      const el = nodeRefs.current[item.id];
      if (!el) return;
      const { x, y, zIndex, opacity } = calculateNodePosition(index, data.length, rotationRef.current);
      el.style.transform = `translate(${x}px, ${y}px)`;
      // Keep expanded node on top visually
      el.style.zIndex = expandedItemsRef.current[item.id] ? "200" : String(zIndex);
      el.style.opacity = expandedItemsRef.current[item.id] ? "1" : String(opacity);
    });
  }, [calculateNodePosition]);

  useEffect(() => {
    const tick = (ts: number) => {
      const delta = lastTimeRef.current ? ts - lastTimeRef.current : 16;
      lastTimeRef.current = ts;

      if (targetRotationRef.current !== null) {
        // Smooth rotation toward target (ease-out)
        let diff = targetRotationRef.current - rotationRef.current;
        diff = ((diff % 360) + 360) % 360;
        if (diff > 180) diff -= 360;
        if (Math.abs(diff) < 0.15) {
          rotationRef.current = ((targetRotationRef.current % 360) + 360) % 360;
          targetRotationRef.current = null;
        } else {
          rotationRef.current = ((rotationRef.current + diff * 0.09) + 360) % 360;
        }
        updateNodePositions();
      } else if (autoRotateRef.current) {
        const speed = isTinyPhoneRef.current ? 0.005 : isCompactRef.current ? 0.007 : 0.010;
        rotationRef.current = (rotationRef.current + speed * delta) % 360;
        updateNodePositions();
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [updateNodePositions]);

  useEffect(() => { updateNodePositions(); }, [isCompact, isTinyPhone, updateNodePositions]);

  const getRelatedItems = (itemId: number) =>
    timelineData.find((i) => i.id === itemId)?.relatedIds ?? [];

  const closeAll = () => {
    setExpandedItems({});
    setActiveNodeId(null);
    setActiveNodePos(null);
    setPulseEffect({});
    autoRotateRef.current = true;
    targetRotationRef.current = null;
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const isOpening = !prev[id];
      const next: Record<number, boolean> = {};
      if (isOpening) {
        next[id] = true;
        setActiveNodeId(id);
        autoRotateRef.current = false;
        // Rotate the clicked node to the top (270° = top in cos/sin coords)
        const nodeIndex = timelineData.findIndex((i) => i.id === id);
        const baseAngle = (nodeIndex / timelineData.length) * 360;
        targetRotationRef.current = ((270 - baseAngle) % 360 + 360) % 360;
        // Card always anchors from the top position after rotation
        const radius = isTinyPhoneRef.current ? 92 : isCompactRef.current ? 115 : 170;
        setActiveNodePos({ x: 0, y: -radius });
        const pulse: Record<number, boolean> = {};
        getRelatedItems(id).forEach((r) => { pulse[r] = true; });
        setPulseEffect(pulse);
      } else {
        setActiveNodeId(null);
        setActiveNodePos(null);
        autoRotateRef.current = true;
        setPulseEffect({});
      }
      return next;
    });
  };

  const isRelatedToActive = (itemId: number) =>
    activeNodeId ? getRelatedItems(activeNodeId).includes(itemId) : false;

  const activeItem = activeNodeId != null ? timelineData.find((i) => i.id === activeNodeId) ?? null : null;

  const glowSize     = isTinyPhone ? 210 : isCompact ? 260 : 390;
  const outerRing    = isTinyPhone ? 192 : isCompact ? 238 : 352;
  const innerRing    = isTinyPhone ? 136 : isCompact ? 168 : 252;
  const orbitHeightPx = isTinyPhone ? 400 : isCompact ? 440 : 520;
  const orbitHClass  = isTinyPhone ? "h-[400px]" : isCompact ? "h-[440px]" : "h-[520px]";
  const radius       = isTinyPhone ? 92 : isCompact ? 115 : 170;
  // Card sits just below the top node, outside the overflow-hidden orbit div
  const cardTopPx    = orbitHeightPx / 2 - radius + 50; // 50 = icon(40) + gap(10)

  return (
    <div className="relative w-full" onClick={closeAll}>
      {/* ── Orbit area — overflow-hidden clips rings but not the card ── */}
      <div className={`relative w-full overflow-hidden ${orbitHClass}`}>

      {/* Backdrop glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full opacity-20"
          style={{
            width: glowSize, height: glowSize,
            background: "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.05) 45%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <div className="absolute flex h-full w-full items-center justify-center" ref={orbitRef}>

          {/* Outer ring */}
          <div className="absolute rounded-full" style={{ width: outerRing, height: outerRing, border: "1px solid hsl(var(--primary) / 0.2)", boxShadow: "0 0 18px hsl(var(--primary) / 0.04)" }} />
          {/* Inner dashed ring */}
          <div className="absolute rounded-full" style={{ width: innerRing, height: innerRing, border: "1px dashed hsl(var(--primary) / 0.1)" }} />

          {/* Center orb */}
          <div className={`absolute z-10 flex items-center justify-center ${isCompact ? "h-[72px] w-[72px]" : "h-[106px] w-[106px]"}`}>
            <div className="absolute animate-ping rounded-full" style={{ width: isCompact ? 96 : 136, height: isCompact ? 96 : 136, border: "1px solid hsl(var(--primary) / 0.16)", animationDuration: "3s" }} />
            <img
              src={centerLogo}
              alt="raW"
              className={`object-contain ${isCompact ? "h-[72px] w-[72px]" : "h-[106px] w-[106px]"}`}
              style={{ animation: "logoFlip 3s ease-in-out infinite", filter: "drop-shadow(0 0 16px hsl(var(--primary) / 0.35))" }}
            />
          </div>

          {/* Orbit nodes */}
          {timelineData.map((item, index) => {
            const init = calculateNodePosition(index, timelineData.length, rotationRef.current);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute cursor-pointer"
                style={{
                  transform: `translate(${init.x}px, ${init.y}px)`,
                  zIndex: isExpanded ? 200 : init.zIndex,
                  opacity: isExpanded ? 1 : init.opacity,
                  willChange: "transform, opacity",
                }}
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
              >
                {(isExpanded || isRelated) && (
                  <div className="absolute -inset-4 rounded-full animate-pulse" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)" }} />
                )}

                {/* Icon circle */}
                <div
                  className={`${isTinyPhone ? "h-8 w-8" : "h-10 w-10"} rounded-full flex items-center justify-center ${isPulsing ? "animate-pulse" : ""}`}
                  style={{
                    background: isExpanded
                      ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))"
                      : isRelated
                        ? "hsl(var(--primary) / 0.18)"
                        : (isLight ? "rgba(255,255,255,0.92)" : "rgba(8,8,8,0.88)"),
                    border: isExpanded
                      ? "2px solid hsl(var(--primary))"
                      : isRelated
                        ? "2px solid hsl(var(--primary) / 0.55)"
                        : "1px solid hsl(var(--primary) / 0.35)",
                    boxShadow: isExpanded
                      ? "0 0 18px hsl(var(--primary) / 0.55), 0 0 36px hsl(var(--primary) / 0.2)"
                      : isRelated
                        ? "0 0 12px hsl(var(--primary) / 0.3)"
                        : "0 0 6px hsl(var(--primary) / 0.15)",
                    transform: isExpanded ? "scale(1.4)" : "scale(1)",
                    transition: "transform 0.3s, background 0.3s, border 0.3s, box-shadow 0.3s",
                    color: isExpanded ? "#0a0a0a" : (isLight ? "rgba(80,80,80,0.7)" : "hsl(var(--primary) / 0.65)"),
                  }}
                >
                  <Icon size={isTinyPhone ? 13 : 15} />
                </div>

                {/* Label */}
                <div
                  className="absolute left-1/2 top-11 -translate-x-1/2 text-center font-display uppercase tracking-[0.08em] pointer-events-none"
                  style={{
                    maxWidth: isTinyPhone ? 70 : isCompact ? 84 : 120,
                    whiteSpace: "normal",
                    fontSize: isTinyPhone ? "0.6rem" : isCompact ? "0.6rem" : "0.66rem",
                    lineHeight: 1.25,
                    fontWeight: 800,
                    color: isLight
                      ? (isExpanded ? "#000000" : "rgba(0,0,0,0.82)")
                      : "hsl(var(--primary))",
                    backgroundImage: isLight
                      ? "none"
                      : "linear-gradient(180deg, #fff8d8 0%, hsl(var(--primary)) 42%, hsl(var(--primary) / 0.82) 100%)",
                    backgroundClip: isLight ? "border-box" : "text",
                    WebkitBackgroundClip: isLight ? "border-box" : "text",
                    WebkitTextFillColor: isLight ? "currentColor" : "transparent",
                    WebkitTextStroke: isLight
                      ? "0.15px rgba(0,0,0,0.5)"
                      : "0.2px hsl(var(--primary) / 0.9)",
                    textShadow: isLight
                      ? "0 1px 1px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.7)"
                      : (isExpanded
                          ? "0 1px 2px rgba(0,0,0,1), 0 0 8px hsl(var(--primary) / 0.95), 0 0 18px hsl(var(--primary) / 0.72), 0 0 32px hsl(var(--primary) / 0.42)"
                          : "0 1px 2px rgba(0,0,0,1), 0 0 6px hsl(var(--primary) / 0.92), 0 0 14px hsl(var(--primary) / 0.62), 0 0 24px hsl(var(--primary) / 0.32)"),
                  }}
                >
                  {item.title}
                </div>
              </div>
            );
          })}

          {/* Expanded card — anchored to the selected node, horizontally centered */}
        </div>
      </div>

      {/* ── End orbit area ── */}
      </div>

      {/* ── Card ── */}
      {activeItem && (() => {
        const cardInner = (
          <div
            className="relative rounded-xl border border-raw-gold/30 p-4 text-left backdrop-blur-xl"
            style={{
              background: isLight ? "#fffbf0" : "#080808",
              boxShadow: isLight
                ? "0 0 0 1px rgba(180,140,20,0.18), 0 12px 40px rgba(0,0,0,0.12)"
                : "0 0 0 1px hsl(var(--primary) / 0.12), 0 12px 40px rgba(0,0,0,0.9), 0 0 24px hsl(var(--primary) / 0.06)",
            }}
          >
            <button
              type="button"
              className="absolute right-2.5 top-2.5 rounded-full p-1 text-raw-gold/40 transition-colors hover:text-raw-gold/80"
              onClick={closeAll}
              aria-label="Close"
            >
              <X size={13} />
            </button>

            <div className="mb-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                isLight
                  ? "border border-raw-ink/30 bg-raw-ink/5 text-raw-ink"
                  : "border border-white/35 bg-white/8 text-white"
              }`}>
                {activeItem.category}
              </span>
            </div>

            <p className={`mb-2 font-display text-sm uppercase tracking-[0.06em] ${isLight ? "text-raw-ink" : "text-white"}`}>
              {activeItem.title}
            </p>

            <p className={`text-[13px] leading-relaxed ${isLight ? "text-stone-700" : "text-white/75"}`}>{activeItem.content}</p>

            {timelineData.length > 1 && <div className="mt-3 border-t border-raw-gold/10 pt-3 flex justify-between gap-2">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8 text-raw-gold/70 transition-colors hover:bg-raw-gold/20"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = timelineData.findIndex((i) => i.id === activeItem.id);
                  const prev = timelineData[(idx - 1 + timelineData.length) % timelineData.length];
                  toggleItem(prev.id);
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8 text-raw-gold/70 transition-colors hover:bg-raw-gold/20"
                onClick={(e) => {
                  e.stopPropagation();
                  const idx = timelineData.findIndex((i) => i.id === activeItem.id);
                  const next = timelineData[(idx + 1) % timelineData.length];
                  toggleItem(next.id);
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>}
          </div>
        );

        // Mobile: portal to body so ancestor filter/transform containing blocks can't trap it
        if (isCompact || isTinyPhone) {
          return createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
              onClick={closeAll}
            >
              <div className="absolute inset-0 bg-black/65" />
              <div
                className="relative z-10 w-[min(300px,90vw)] max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {cardInner}
              </div>
            </div>,
            document.body
          );
        }

        // Desktop: absolute, anchored below the top node
        return (
          <div
            className="absolute left-1/2 z-[300] w-[min(260px,88vw)] -translate-x-1/2"
            style={{ top: cardTopPx }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-1 h-3 w-px bg-raw-gold/35" />
            {cardInner}
          </div>
        );
      })()}
    </div>
  );
}

export type { TimelineItem };
