import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link2 } from "lucide-react";

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
      <Button
        type="button"
        className={cn(
          "relative h-10 min-w-40 rounded-3xl border border-black/10 bg-white text-black transition-all duration-300 hover:bg-gray-50 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-gray-950",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
          className,
        )}
        onClick={() => setIsOpen(true)}
        {...props}
      >
        <span className="flex items-center gap-2">{children}</span>
      </Button>

      <div className="absolute left-0 top-0 flex h-10">
        {links.map((link, index) => {
          const Icon = link.icon;
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
              className={cn(
                "flex h-10 w-10 items-center justify-center bg-black text-white transition-all duration-200 hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100",
                index === 0 && "rounded-l-3xl",
                index === links.length - 1 && "rounded-r-3xl",
                "border-r border-white/10 last:border-r-0 dark:border-black/10",
                isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0",
              )}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close share options"
          className={cn(
            "ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-raw-border/35 bg-raw-black/80 text-raw-silver/80 transition-all duration-200 hover:border-raw-gold/45 hover:text-raw-gold",
            isOpen ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 pointer-events-none",
          )}
        >
          <Link2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
