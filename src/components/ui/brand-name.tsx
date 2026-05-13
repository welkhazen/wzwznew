import { cn } from "@/lib/utils";

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

