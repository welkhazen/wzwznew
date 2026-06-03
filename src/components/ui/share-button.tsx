import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ShareLink {
  icon: LucideIcon;
  onClick: () => void;
  label: string;
}

interface ShareButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  links: ShareLink[];
  children: React.ReactNode;
}

export function ShareButton({ className, links, children, ...props }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="inline-flex w-full max-w-sm flex-col items-center gap-2">
      <Button
        type="button"
        className={cn(
          "relative h-10 min-w-40 rounded-3xl border border-black/10 bg-white text-black transition-all duration-300 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-gray-950",
          isOpen && "border-raw-gold/70 bg-raw-gold/15 text-raw-gold shadow-[0_0_22px_rgba(234,179,8,0.16)]",
          className,
        )}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        {...props}
      >
        <span className="flex items-center gap-2">
          {children}
          {isOpen ? <ChevronUp className="size-3" aria-hidden="true" /> : null}
        </span>
      </Button>

      <div
        className={cn(
          "grid w-full overflow-hidden rounded-2xl border border-raw-gold/25 bg-raw-black/90 shadow-[0_0_28px_rgba(234,179,8,0.14)] backdrop-blur-md transition-all duration-200",
          isOpen ? "mt-0.5 max-h-36 opacity-100" : "max-h-0 border-transparent opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-wrap justify-center gap-1.5 p-2">
          {links.map((link, index) => {
            const Icon = link.icon;
            const shortLabel = link.label
              .replace(/^Share on /, "")
              .replace(/^Copy link$/, "Copy")
              .replace(/^More apps$/, "More");

            return (
              <button
                type="button"
                key={link.label}
                onClick={() => {
                  link.onClick();
                  setIsOpen(false);
                }}
                aria-label={link.label}
                title={link.label}
                tabIndex={isOpen ? 0 : -1}
                className={cn(
                  "flex min-h-14 min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-raw-border/35 bg-raw-surface px-2 text-raw-silver transition-all duration-200 hover:-translate-y-0.5 hover:border-raw-gold/65 hover:bg-raw-gold/15 hover:text-raw-gold focus:outline-none focus:ring-2 focus:ring-raw-gold/45",
                  !isOpen && "pointer-events-none",
                )}
                style={{ transitionDelay: isOpen ? `${index * 28}ms` : "0ms" }}
              >
                <Icon className="size-4" />
                <span className="max-w-16 truncate text-[8px] font-semibold uppercase tracking-[0.08em]">
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
