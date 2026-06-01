import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

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
    <div ref={containerRef} className="relative inline-flex h-10">
      <div
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+0.7rem)] left-1/2 z-30 flex -translate-x-1/2 items-end justify-center gap-1.5 rounded-2xl border border-raw-gold/25 bg-raw-black/90 px-2.5 py-2 shadow-[0_0_28px_rgba(234,179,8,0.18)] backdrop-blur-md transition-all duration-200",
          "before:absolute before:-bottom-1.5 before:left-1/2 before:h-3 before:w-3 before:-translate-x-1/2 before:rotate-45 before:border-b before:border-r before:border-raw-gold/25 before:bg-raw-black/90",
          isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0",
        )}
        aria-hidden={!isOpen}
      >
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
                "pointer-events-auto relative flex h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-xl border border-raw-border/35 bg-raw-surface px-2 text-raw-silver transition-all duration-200 hover:-translate-y-1 hover:border-raw-gold/65 hover:bg-raw-gold/15 hover:text-raw-gold focus:outline-none focus:ring-2 focus:ring-raw-gold/45",
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
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close share options"
          tabIndex={isOpen ? 0 : -1}
          className={cn(
            "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-raw-border/30 bg-raw-black/80 text-raw-silver/55 transition hover:border-raw-gold/45 hover:text-raw-gold focus:outline-none focus:ring-2 focus:ring-raw-gold/45",
            !isOpen && "pointer-events-none",
          )}
        >
          <X className="size-3.5" />
        </button>
      </div>

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
        <span className="flex items-center gap-2">{children}</span>
      </Button>
    </div>
  );
}
