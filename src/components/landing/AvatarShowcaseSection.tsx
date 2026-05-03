import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { AVATARS } from "@/lib/avataridentity";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const VISIBLE_COUNT = 4;

export function AvatarShowcaseSection() {
  const sectionRef = useTrackSectionView("avatar");
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canPrev = true;
  const canNext = true;

  function prev() {
    setStartIndex((i) => (i - 1 + AVATARS.length) % AVATARS.length);
  }

  function next() {
    setStartIndex((i) => (i + 1) % AVATARS.length);
  }

  const visibleAvatars = Array.from({ length: VISIBLE_COUNT }, (_, i) => {
    const idx = (startIndex + i) % AVATARS.length;
    return { avatar: AVATARS[idx], index: idx + 1 };
  });

  function AvatarButton({
    index,
    avatar,
    mobile,
  }: {
    index: number;
    avatar: (typeof AVATARS)[0];
    mobile?: boolean;
  }) {
    const isActive = index === previewIndex;
    const isSelected = index === avatarIndex;

    return (
      <button
        key={index}
        type="button"
        onClick={() => { setAvatarIndex(index); setPreviewIndex(index); }}
        onTouchStart={mobile ? () => setPreviewIndex(index) : undefined}
        onTouchEnd={mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onTouchCancel={mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onMouseEnter={!mobile ? () => setPreviewIndex(index) : undefined}
        onMouseLeave={!mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onFocus={!mobile ? () => setPreviewIndex(index) : undefined}
        onBlur={!mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        className="group relative flex flex-col items-center gap-3 outline-none"
        aria-label={`Select ${avatar.name}`}
        aria-pressed={isSelected}
      >
        {/* Outer glow ring */}
        <div className="relative">
          {/* Animated glow behind avatar */}
          <div
            className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
              isActive
                ? "opacity-80 scale-125"
                : "opacity-0 scale-100 group-hover:opacity-40 group-hover:scale-110"
            }`}
            style={{
              background: isSelected || isActive
                ? "radial-gradient(circle, rgba(241,196,45,0.6) 0%, rgba(241,196,45,0.1) 70%)"
                : "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
            }}
          />

          {/* Spinning ring for selected */}
          {isSelected && (
            <div
              className="absolute inset-[-6px] rounded-full border-2 border-transparent animate-spin"
              style={{
                background: "linear-gradient(135deg, rgba(241,196,45,0.9), rgba(241,196,45,0.1), rgba(241,196,45,0.9)) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                maskComposite: "exclude",
                animationDuration: "3s",
              }}
            />
          )}

          {/* Pulse ring on hover */}
          <div
            className={`absolute inset-[-4px] rounded-full border transition-all duration-300 ${
              isActive
                ? "border-raw-gold/60 scale-100 opacity-100"
                : "border-raw-silver/20 scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            }`}
          />

          <div
            className={`relative rounded-full transition-all duration-300 ${
              isActive ? "scale-115 drop-shadow-[0_0_16px_rgba(241,196,45,0.5)]" : "scale-100 group-hover:scale-108"
            }`}
            style={{
              transform: isActive ? "scale(1.15)" : undefined,
              filter: isActive ? "drop-shadow(0 0 14px rgba(241,196,45,0.45))" : undefined,
              transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease",
            }}
          >
            <AvatarFigure avatarIndex={index} size="md" selected={isSelected || isActive} />
          </div>
        </div>

        {/* Name */}
        <span
          className={`font-display text-[9px] tracking-[0.18em] uppercase transition-all duration-300 ${
            isActive
              ? "text-raw-gold drop-shadow-[0_0_8px_rgba(241,196,45,0.6)]"
              : "text-raw-silver/45 group-hover:text-raw-silver/80"
          }`}
        >
          {avatar.name}
        </span>
      </button>
    );
  }

  function NavButton({
    direction,
    onClick,
    disabled,
  }: {
    direction: "prev" | "next";
    onClick: () => void;
    disabled: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          disabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
        }`}
        aria-label={direction === "prev" ? "Previous avatars" : "Next avatars"}
      >
        {/* Background layers */}
        <div className="absolute inset-0 rounded-full border border-raw-border/40 bg-raw-black/60 transition-all duration-300 group-hover:border-raw-gold/50 group-hover:bg-raw-black/80" />
        <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: "0 0 16px rgba(241,196,45,0.25), inset 0 0 12px rgba(241,196,45,0.06)" }}
        />
        {/* Gold shimmer on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-raw-gold/10 via-transparent to-transparent" />
        </div>

        <div className={`relative transition-transform duration-300 ${
          direction === "prev"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        }`}>
          {direction === "prev"
            ? <ChevronLeft className="h-5 w-5 text-raw-silver/60 transition-colors duration-300 group-hover:text-raw-gold" />
            : <ChevronRight className="h-5 w-5 text-raw-silver/60 transition-colors duration-300 group-hover:text-raw-gold" />
          }
        </div>
      </button>
    );
  }

  return (
    <LandingSectionShell
      id="avatar"
      sectionRef={sectionRef as React.Ref<HTMLElement>}
      title="Your avatar is your identity"
      description="Tap any avatar to preview how it appears on the phone."
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8">
        <PhoneMockup className="w-full max-w-[360px]" showStatusBar={false}>
          <AvatarPhoneHomeScreen avatarIndex={previewIndex} />
        </PhoneMockup>

        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-5 sm:p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          {/* Subtle top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />

          <p className="text-center font-display text-xs uppercase tracking-[0.25em] text-raw-gold/70 mb-6">
            Choose your avatar
          </p>

          {/* Mobile: free scroll */}
          <div
            ref={scrollRef}
            className="flex items-center justify-start gap-8 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
          >
            {AVATARS.map((avatar, i) => (
              <AvatarButton key={i + 1} index={i + 1} avatar={avatar} mobile />
            ))}
          </div>

          {/* Desktop: windowed with prev/next arrows */}
          <div className="hidden sm:flex items-center gap-4">
            {!showAll && <NavButton direction="prev" onClick={prev} disabled={!canPrev} />}

            <div className={`flex flex-1 items-center justify-center flex-wrap gap-8 transition-all duration-500`}>
              {showAll
                ? AVATARS.map((avatar, i) => (
                    <AvatarButton key={i + 1} index={i + 1} avatar={avatar} />
                  ))
                : visibleAvatars.map(({ avatar, index }) => (
                    <AvatarButton key={`${startIndex}-${index}`} index={index} avatar={avatar} />
                  ))
              }
            </div>

            {!showAll && <NavButton direction="next" onClick={next} disabled={!canNext} />}
          </div>

          {/* Show All / Show Less toggle */}
          <div className="hidden sm:flex justify-center mt-5">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="group relative flex items-center gap-2 rounded-full border border-raw-border/40 bg-raw-black/60 px-5 py-2 text-xs tracking-[0.18em] uppercase text-raw-silver/50 transition-all duration-300 hover:border-raw-gold/50 hover:text-raw-gold"
            >
              <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "0 0 14px rgba(241,196,45,0.2), inset 0 0 10px rgba(241,196,45,0.05)" }}
              />
              <span className="relative">{showAll ? "Show Less" : "Show All Avatars"}</span>
              <span className="relative transition-transform duration-300" style={{ transform: showAll ? "rotate(180deg)" : "rotate(0deg)" }}>
                ▾
              </span>
            </button>
          </div>
        </div>
      </div>
    </LandingSectionShell>
  );
}
