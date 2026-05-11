import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BrandNameProps = {
  className?: string;
  wClassName?: string;
};

export function BrandName({ className, wClassName }: BrandNameProps) {
  return (
    <span className={cn("inline-flex items-baseline", className)} aria-label="raW">
      <span>ra</span>
      <span className={cn("text-[hsl(var(--accent))]", wClassName)}>W</span>
    </span>
  );
}

export function highlightRawWordmark(content: ReactNode): ReactNode {
  if (typeof content === "string") {
    const parts = content.split(/(raW)/g);
    return parts.map((part, index) =>
      part === "raW" ? <BrandName key={`raw-${index}`} /> : <span key={`txt-${index}`}>{part}</span>
    );
  }

  if (Array.isArray(content)) {
    return content.map((child, index) => <span key={`node-${index}`}>{highlightRawWordmark(child)}</span>);
  }

  return content;
}
