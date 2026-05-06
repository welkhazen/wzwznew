'use client'

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";

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
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const syncCompact = () => setIsCompact(mediaQuery.matches);
    syncCompact();
    mediaQuery.addEventListener("change", syncCompact);
    return () => mediaQuery.removeEventListener("change", syncCompact);
  }, []);

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key, 10) !== id) newState[parseInt(key, 10)] = false;
      });
      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => { newPulseEffect[relId] = true; });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => Number(((prev + 0.25) % 360).toFixed(3)));
      }, 50);
    }
    return () => { if (rotationTimer) clearInterval(rotationTimer); };
  }, [autoRotate]);

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = isCompact ? 132 : 190;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, zIndex, opacity };
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const glowSize = isCompact ? 340 : 420;
  const outerRingSize = isCompact ? 300 : 380;
  const innerRingSize = isCompact ? 220 : 280;

  return (
    <div
      className={`relative w-full overflow-hidden ${isCompact ? "h-[470px]" : "h-[560px]"}`}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      {/* Radial backdrop glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full opacity-25"
          style={{
            width: glowSize,
            height: glowSize,
            background:
              "radial-gradient(circle at center, rgba(241,196,45,0.18) 0%, rgba(241,196,45,0.06) 40%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-4xl items-center justify-center">
        <div
          className="absolute flex h-full w-full items-center justify-center"
          ref={orbitRef}
          style={{ perspective: "1000px" }}
        >
          {/* Outer orbit ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: outerRingSize,
              height: outerRingSize,
              border: "1px solid rgba(241,196,45,0.2)",
              boxShadow: "0 0 30px rgba(241,196,45,0.06), inset 0 0 30px rgba(241,196,45,0.03)",
            }}
          />

          {/* Dashed inner accent ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: innerRingSize,
              height: innerRingSize,
              border: "1px dashed rgba(241,196,45,0.1)",
            }}
          />

          {/* Center orb */}
          <div className="absolute z-10 flex h-[72px] w-[72px] items-center justify-center">
            {/* Ping rings */}
            <div className="absolute h-[84px] w-[84px] animate-ping rounded-full"
              style={{ border: "1px solid rgba(241,196,45,0.2)", animationDuration: "2.5s" }} />
            <div className="absolute h-[99px] w-[99px] animate-ping rounded-full"
              style={{ border: "1px solid rgba(241,196,45,0.1)", animationDuration: "2.5s", animationDelay: "0.8s" }} />
            <img
              src="/raw-logo-96.png"
              alt="raW"
              className="h-[72px] w-[72px] object-contain drop-shadow-[0_0_20px_rgba(241,196,45,0.4)]"
              style={{ animation: "logoFlip 3s ease-in-out infinite" }}
            />
          </div>

          {/* Orbit nodes */}
          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute cursor-pointer transition-all duration-700"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
              >
                {/* Energy aura */}
                {(isExpanded || isRelated) && (
                  <div
                    className="absolute -inset-4 rounded-full animate-pulse"
                    style={{
                      background: "radial-gradient(circle, rgba(241,196,45,0.15) 0%, transparent 70%)",
                    }}
                  />
                )}

                {/* Node icon circle */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${isPulsing ? "animate-pulse" : ""}`}
                  style={{
                    background: isExpanded
                      ? "linear-gradient(135deg, #F1C42D, #d4a017)"
                      : isRelated
                        ? "rgba(241,196,45,0.2)"
                        : "rgba(10,10,10,0.85)",
                    border: isExpanded
                      ? "2px solid #F1C42D"
                      : isRelated
                        ? "2px solid rgba(241,196,45,0.6)"
                        : "1px solid rgba(241,196,45,0.25)",
                    boxShadow: isExpanded
                      ? "0 0 20px rgba(241,196,45,0.5), 0 0 40px rgba(241,196,45,0.2)"
                      : isRelated
                        ? "0 0 14px rgba(241,196,45,0.35)"
                        : "0 0 8px rgba(241,196,45,0.08)",
                    transform: isExpanded ? "scale(1.5)" : "scale(1)",
                    color: isExpanded ? "#0a0a0a" : "rgba(241,196,45,0.8)",
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Label */}
                <div
                  className="absolute left-1/2 top-12 -translate-x-1/2 text-center font-display text-[0.62rem] uppercase tracking-[0.1em] transition-all duration-300"
                  style={{
                    maxWidth: isCompact ? 110 : 180,
                    whiteSpace: isCompact ? "normal" : "nowrap",
                    lineHeight: isCompact ? 1.15 : 1.2,
                    color: isExpanded ? "#F1C42D" : "rgba(241,196,45,0.75)",
                    textShadow: isExpanded
                      ? "0 0 10px rgba(241,196,45,0.6), 0 0 22px rgba(241,196,45,0.3)"
                      : "0 0 8px rgba(241,196,45,0.25)",
                    transform: isExpanded ? "scale(1.1)" : "scale(1)",
                    transformOrigin: "center top",
                  }}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <div
                    className="absolute left-1/2 top-20 w-64 -translate-x-1/2 rounded-2xl border border-raw-gold/25 bg-background/95 p-4 text-left shadow-2xl backdrop-blur-xl"
                    style={{ boxShadow: "0 0 0 1px rgba(241,196,45,0.1), 0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(241,196,45,0.06)" }}
                  >
                    {/* Connector line */}
                    <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-raw-gold/40" />

                    <div className="mb-2">
                      <span className="rounded-full border border-raw-gold/30 bg-raw-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-raw-gold">
                        {item.category}
                      </span>
                    </div>

                    <p
                      className="mb-2 font-display text-xs uppercase tracking-[0.06em] text-raw-gold"
                      style={{ textShadow: "0 0 8px rgba(241,196,45,0.3)" }}
                    >
                      {item.title}
                    </p>

                    <p className="text-[11px] leading-relaxed text-foreground/65">{item.content}</p>

                    {/* Energy bar */}
                    <div className="mt-3 border-t border-raw-gold/10 pt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-foreground/40">
                        <span className="flex items-center gap-1">
                          <Zap size={9} className="text-raw-gold/60" />
                          Energy
                        </span>
                        <span className="font-mono text-raw-gold/60">{item.energy}%</span>
                      </div>
                      <div className="h-[3px] w-full overflow-hidden rounded-full bg-foreground/10">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.energy}%`,
                            background: "linear-gradient(to right, #3b82f6, #F1C42D)",
                            boxShadow: "0 0 6px rgba(241,196,45,0.4)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Related nodes */}
                    {item.relatedIds.length > 0 && (
                      <div className="mt-3 border-t border-raw-gold/10 pt-3">
                        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-foreground/35">Connected</p>
                        <div className="flex flex-wrap gap-1">
                          {item.relatedIds.map((relatedId) => {
                            const relatedItem = timelineData.find((i) => i.id === relatedId);
                            return (
                              <button
                                key={relatedId}
                                type="button"
                                className="flex items-center gap-1 rounded-full border border-raw-gold/20 bg-raw-gold/8 px-2 py-0.5 text-[10px] text-raw-gold/70 transition-all hover:bg-raw-gold/15"
                                onClick={(e) => { e.stopPropagation(); toggleItem(relatedId); }}
                              >
                                {relatedItem?.title}
                                <ArrowRight size={8} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { TimelineItem };
