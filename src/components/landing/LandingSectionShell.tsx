import type { ReactNode } from "react";

interface LandingSectionShellProps {
  id?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  sectionRef?: React.Ref<HTMLElement>;
}

export function LandingSectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  innerClassName = "",
  sectionRef,
}: LandingSectionShellProps) {
  return (
    <section
      ref={sectionRef}
      id={id}
      className={`landing-section relative px-3 py-8 sm:px-6 sm:py-16 md:py-20 ${className}`}
    >
      <div
        className={`mx-auto w-full max-w-3xl rounded-[1.75rem] border border-raw-border/30 bg-raw-surface/[0.14] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-[2px] sm:rounded-[2rem] sm:p-8 ${innerClassName}`}
      >
        {(eyebrow || title || description) && (
          <header className="mb-6 text-center sm:mb-10">
            {eyebrow && (
              <div className="mb-2 flex items-center justify-center gap-2 sm:mb-3">
                <div className="h-px w-6 bg-raw-gold/30 sm:w-8" />
                <p className="font-display text-[10px] uppercase tracking-[0.28em] text-raw-gold/60 sm:tracking-[0.3em]">
                  {eyebrow}
                </p>
                <div className="h-px w-6 bg-raw-gold/30 sm:w-8" />
              </div>
            )}
            {title && (
              <h2 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mx-auto mt-3 max-w-xl text-sm text-raw-silver/55 sm:mt-4 sm:text-base">
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
