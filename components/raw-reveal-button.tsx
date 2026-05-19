"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

type RawRevealState = "idle" | "scroll" | "hover";
type RawRevealSize = "hero" | "default" | "mini";

type RawRevealButtonProps = {
  label?: string;
  state?: RawRevealState;
  size?: RawRevealSize;
  className?: string;
  autoScrollTargetId?: string;
  onClick?: () => void;
};

export function RawRevealButton({
  label = "CLICK TO REVEAL MORE",
  state = "idle",
  size = "default",
  className = "",
  autoScrollTargetId,
  onClick,
}: RawRevealButtonProps) {
  const handleClick = React.useCallback(() => {
    onClick?.();

    if (autoScrollTargetId) {
      const target = document.getElementById(autoScrollTargetId);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [autoScrollTargetId, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      data-raw-state={state}
      data-raw-size={size}
      className={`raw-reveal-button ${className}`}
      aria-label={label}
    >
      <span className="raw-reveal-button__chrome" />
      <span className="raw-reveal-button__grain" />
      <span className="raw-reveal-button__energy raw-reveal-button__energy--left" />
      <span className="raw-reveal-button__energy raw-reveal-button__energy--right" />
      <span className="raw-reveal-button__flare" />

      <span className="raw-reveal-button__content">
        <span className="raw-reveal-button__label">{label}</span>
        <ChevronDown className="raw-reveal-button__icon" strokeWidth={2.2} />
      </span>
    </button>
  );
}

export function RawRevealButtonShowcase() {
  return (
    <section className="raw-reveal-showcase">
      <div className="raw-reveal-showcase__hero">
        <RawRevealButton size="hero" state="scroll" autoScrollTargetId="reveal-more" />
      </div>

      <div className="raw-reveal-showcase__states">
        <div className="raw-reveal-showcase__state">
          <p>IDLE STATE</p>
          <RawRevealButton size="mini" state="idle" />
        </div>

        <div className="raw-reveal-showcase__divider" />

        <div className="raw-reveal-showcase__state">
          <p>SCROLL-ACTIVATED STATE</p>
          <RawRevealButton size="mini" state="scroll" />
        </div>

        <div className="raw-reveal-showcase__divider" />

        <div className="raw-reveal-showcase__state">
          <p>HOVER / PRESS STATE</p>
          <RawRevealButton size="mini" state="hover" />
        </div>
      </div>
    </section>
  );
}
