import type { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
  /** Show status bar (time, signal, battery) */
  showStatusBar?: boolean;
}

export function PhoneMockup({ children, className = "", showStatusBar = true }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto w-[280px] pointer-events-auto ${className}`}>
      {/* Outer frame */}
      <div className="rounded-[2.8rem] border-[3px] border-[#2a2a2e] bg-[#0a0a0a] p-[6px] shadow-2xl shadow-black/60">
        {/* Inner bezel */}
        <div className="rounded-[2.4rem] bg-[#111113] overflow-hidden">
          {/* Dynamic Island */}
          <div className="relative h-8 flex items-center justify-center">
            <div className="h-[22px] w-[90px] rounded-full bg-[#0a0a0a] border border-[#1a1a1e]" />
          </div>

          {/* Status bar */}
          {showStatusBar && (
            <div className="flex items-center justify-between px-6 pb-1">
              <span className="text-[9px] font-semibold text-white/70">10:35</span>
              <div className="flex items-center gap-1">
                {/* Signal bars */}
                <div className="flex items-end gap-[1px]">
                  <div className="w-[3px] h-[4px] rounded-[0.5px] bg-white/70" />
                  <div className="w-[3px] h-[6px] rounded-[0.5px] bg-white/70" />
                  <div className="w-[3px] h-[8px] rounded-[0.5px] bg-white/70" />
                  <div className="w-[3px] h-[10px] rounded-[0.5px] bg-white/70" />
                </div>
                <span className="text-[8px] text-white/50 ml-0.5">5G</span>
                {/* Battery */}
                <div className="ml-1 w-[18px] h-[8px] rounded-[2px] border border-white/40 flex items-center p-[1px]">
                  <div className="h-full w-3/4 rounded-[1px] bg-white/70" />
                </div>
              </div>
            </div>
          )}

          {/* Screen content */}
          <div className="phone-mockup-screen h-[480px] pointer-events-auto overflow-hidden">
            {children}
          </div>

          {/* Home indicator */}
          <div className="flex items-center justify-center py-2">
            <div className="h-[4px] w-[100px] rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
