import { useState } from "react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AVATARS } from "@/lib/avataridentity";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";

export function AvatarProgression() {
  const sectionRef = useTrackSectionView("avatar");
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [previewIndex, setPreviewIndex] = useState(1);

  return (
    <LandingSectionShell
      id="avatar-progression"
      sectionRef={sectionRef as React.Ref<HTMLElement>}
      eyebrow="Avatar Progression"
      title="Choose your avatar."
      description="Tap any avatar to preview it."
    >
      <div
        className="grid gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 md:gap-x-6"
        style={{ gridTemplateColumns: `repeat(${Math.ceil(AVATARS.length / 2)}, minmax(0, 1fr))` }}
      >
        {AVATARS.map((avatar, i) => {
          const index = i + 1;
          const isActive = index === previewIndex;
          const isSelected = index === avatarIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setAvatarIndex(index)}
              onMouseEnter={() => setPreviewIndex(index)}
              onMouseLeave={() => setPreviewIndex(avatarIndex)}
              onFocus={() => setPreviewIndex(index)}
              onBlur={() => setPreviewIndex(avatarIndex)}
              className="group flex flex-col items-center gap-2 focus:outline-none"
              aria-label={`Select ${avatar.name}`}
              aria-pressed={isSelected}
            >
              <div className={`rounded-full transition-all duration-300 ${
                isActive ? "scale-115" : "opacity-90 group-hover:opacity-100 group-hover:scale-105"
              }`}>
                <AvatarFigure avatarIndex={index} size="md" selected={isSelected || isActive} className="sm:hidden" />
                <AvatarFigure avatarIndex={index} size="lg" selected={isSelected || isActive} className="hidden sm:block" />
              </div>
              <span className={`font-display text-[9px] sm:text-[10px] tracking-[0.12em] text-center leading-tight transition-colors ${
                isActive ? "text-raw-text" : "text-raw-silver/60 group-hover:text-raw-silver/90"
              }`}>
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>
    </LandingSectionShell>
  );
}
