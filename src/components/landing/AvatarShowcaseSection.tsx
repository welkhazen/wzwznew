import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { AVATARS } from "@/lib/avataridentity";
import { loadAvatarCatalog } from "@/lib/avatarCatalog";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { loadLandingNewAvatars } from "@/lib/landingNewAvatars";
import type { LandingNewAvatar } from "@/lib/landingNewAvatars";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const VISIBLE_COUNT = 4;
const DESKTOP_COUNT = 8;

export function AvatarShowcaseSection() {
  const sectionRef = useTrackSectionView("avatar");
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [desktopStart, setDesktopStart] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [catalog, setCatalog] = useState<AvatarCatalogItem[]>([]);
  const [newAvatars, setNewAvatars] = useState<LandingNewAvatar[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAvatarCatalog().then(setCatalog).catch(() => {});
    loadLandingNewAvatars().then(setNewAvatars).catch(() => {});
  }, []);

  const avatarList = catalog.length > 0 ? catalog : AVATARS;
  const total = avatarList.length || 1;

  const canPrev = true;
  const canNext = true;

  function prev() {
    setStartIndex((i) => (i - 1 + total) % total);
  }

  function next() {
    setStartIndex((i) => (i + 1) % total);
  }

  function prevDesktop() {
    setDesktopStart((i) => (i - 4 + total) % total);
  }

  function nextDesktop() {
    setDesktopStart((i) => (i + 4) % total);
  }

  const visibleAvatars = Array.from({ length: VISIBLE_COUNT }, (_, i) => {
    const idx = (startIndex + i) % total;
    return { avatar: avatarList[idx], index: idx + 1 };
  });

  const desktopAvatars = Array.from({ length: DESKTOP_COUNT }, (_, i) => {
    const idx = (desktopStart + i) % total;
    return { avatar: avatarList[idx], index: idx + 1 };
  });

  function AvatarButton({
    index,
    avatar,
    mobile,
  }: {
    index: number;
    avatar: (typeof avatarList)[0];
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
      title={
        <span className="inline-flex flex-col items-center leading-[1.05]">
          <span className="text-[1em]">Your Avatar.</span>
          <span className="text-[0.8em]">Your Identity.</span>
          <span className="text-[0.6em]">Your App.</span>
        </span>
      }
      description={
        <span className="block whitespace-pre-line">
          {`On raW, your username is your constant identity.

Your avatar is your evolving identity.

Just like in real life, every person is born with a name, an appearance, and an inner personality. On raW, your username is your name, your avatar is your appearance, and your answers, choices, and interactions reveal the deeper personality behind it.`}
        </span>
      }
    >
      {/* ── Mobile (<sm): phone left + 2-col avatar grid right, 50/50 ── */}
      <div className="mx-auto flex w-full max-w-5xl flex-row items-start gap-3 sm:hidden">

        {/* Phone — zoomed to fit the left half */}
        <div className="w-[46%] shrink-0 overflow-hidden">
          {/* zoom shrinks layout footprint; 280 × 0.54 ≈ 151px fits in ~172px half */}
          <div style={{ zoom: 0.54 }}>
            <PhoneMockup className="w-[280px]" showStatusBar={false}>
              <AvatarPhoneHomeScreen avatarIndex={previewIndex} />
            </PhoneMockup>
          </div>
        </div>

        {/* Avatar grid — right half */}
        <div className="flex flex-1 flex-col min-w-0 pt-1">
          <p className="mb-3 text-center font-display text-[9px] uppercase tracking-[0.18em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div
            ref={scrollRef}
            className="grid grid-cols-2 gap-x-2 gap-y-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: `${646 * 0.54 - 24}px` }}
          >
            {avatarList.map((avatar, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => { setAvatarIndex(i + 1); setPreviewIndex(i + 1); }}
                className="flex flex-col items-center gap-1 outline-none"
                aria-label={`Select ${avatar.name}`}
                aria-pressed={avatarIndex === i + 1}
              >
                <div
                  className="rounded-full transition-all duration-200"
                  style={{
                    outline: avatarIndex === i + 1
                      ? "2px solid #F1C42D"
                      : "1px solid rgba(241,196,45,0.15)",
                    outlineOffset: 2,
                    filter: avatarIndex === i + 1
                      ? "drop-shadow(0 0 8px rgba(241,196,45,0.55))"
                      : undefined,
                  }}
                >
                  <AvatarFigure avatarIndex={i + 1} size="sm" selected={avatarIndex === i + 1} />
                </div>
                <span
                  className="text-center font-display uppercase leading-tight transition-colors duration-200"
                  style={{
                    fontSize: "0.52rem",
                    letterSpacing: "0.1em",
                    color: avatarIndex === i + 1 ? "#F1C42D" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {avatar.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tablet (sm–lg): phone on top, windowed avatar strip below ── */}
      <div className="mx-auto hidden w-full max-w-5xl flex-col items-center gap-8 sm:flex lg:hidden">
        <PhoneMockup className="w-[280px]" showStatusBar={false}>
          <AvatarPhoneHomeScreen avatarIndex={previewIndex} />
        </PhoneMockup>

        <div
          className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-5 sm:p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
          <p className="mb-6 text-center font-display text-xs uppercase tracking-[0.25em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div className="flex items-center gap-4">
            <NavButton direction="prev" onClick={prev} disabled={!canPrev} />
            <div className="flex flex-1 flex-wrap items-center justify-center gap-6 transition-all duration-500">
              {showAll
                ? avatarList.map((avatar, i) => (
                    <AvatarButton key={i + 1} index={i + 1} avatar={avatar} />
                  ))
                : visibleAvatars.map(({ avatar, index }) => (
                    <AvatarButton key={`${startIndex}-${index}`} index={index} avatar={avatar} />
                  ))
              }
            </div>
            <NavButton direction="next" onClick={next} disabled={!canNext} />
          </div>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="group relative flex items-center gap-2 rounded-full border border-raw-border/40 bg-raw-black/60 px-5 py-2 text-xs uppercase tracking-[0.18em] text-raw-silver/50 transition-all duration-300 hover:border-raw-gold/50 hover:text-raw-gold"
            >
              <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "0 0 14px rgba(241,196,45,0.2), inset 0 0 10px rgba(241,196,45,0.05)" }} />
              <span className="relative">{showAll ? "Show Less" : "Show All Avatars"}</span>
              <span className="relative transition-transform duration-300" style={{ transform: showAll ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop (lg+): large phone left + 2×4 grid right ── */}
      <div className="mx-auto hidden w-full max-w-5xl flex-row items-start gap-10 lg:flex">

        <div className="flex shrink-0 justify-center">
          <PhoneMockup className="w-[280px]" showStatusBar={false}>
            <AvatarPhoneHomeScreen avatarIndex={previewIndex} />
          </PhoneMockup>
        </div>

        <div
          className="relative flex h-[646px] flex-1 min-w-0 flex-col overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
          <p className="mb-5 text-center font-display text-xs uppercase tracking-[0.25em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div className="flex flex-1 flex-col">
            <div className="grid flex-1 grid-cols-2 grid-rows-4 place-items-center gap-x-4 gap-y-2">
              {desktopAvatars.map(({ avatar, index }) => (
                <AvatarButton key={`${desktopStart}-${index}`} index={index} avatar={avatar} />
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 pt-3">
              <NavButton direction="prev" onClick={prevDesktop} disabled={false} />
              <NavButton direction="next" onClick={nextDesktop} disabled={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Show More: new avatars drop-down ── */}
      <div className="mx-auto mt-6 w-full max-w-5xl">
        {/* Button — only shows if there are new avatars */}
        {newAvatars.length > 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="group relative flex items-center gap-2.5 rounded-full border border-raw-gold/40 bg-raw-black/70 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-raw-gold/80 transition-all duration-300 hover:border-raw-gold/70 hover:text-raw-gold"
              style={{ boxShadow: showMore ? "0 0 20px rgba(241,196,45,0.25), inset 0 0 12px rgba(241,196,45,0.07)" : undefined }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showMore ? "Show Less" : "Show More"}
              <motion.span
                animate={{ rotate: showMore ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
          </div>
        )}

        {/* Drop-down panel */}
        <AnimatePresence>
          {showMore && newAvatars.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 relative rounded-2xl border border-raw-gold/25 bg-raw-surface/20 p-6 sm:p-8"
                style={{ boxShadow: "0 0 40px rgba(241,196,45,0.08), inset 0 1px 0 rgba(241,196,45,0.12)" }}
              >
                {/* Top shimmer */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/50 to-transparent" />

                <p className="mb-6 text-center font-display text-[10px] uppercase tracking-[0.28em] text-raw-gold/60">
                  New Arrivals
                </p>

                <div className="flex flex-wrap justify-center gap-8">
                  {newAvatars.map((avatar) => (
                    <div key={avatar.id} className="relative flex flex-col items-center gap-3">
                      <span
                        className="absolute -top-1 -right-1 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-raw-black"
                        style={{
                          background: "linear-gradient(135deg, #F1C42D, #ffed8a)",
                          boxShadow: "0 0 10px rgba(241,196,45,0.7)",
                        }}
                      >
                        NEW
                      </span>
                      <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-raw-gold/40 bg-raw-surface/40">
                        {avatar.imageSrc
                          ? <img src={avatar.imageSrc} alt={avatar.name} className="h-full w-full object-cover" />
                          : <div className="h-full w-full" />
                        }
                      </div>
                      <p className="text-center text-xs text-raw-silver/70">{avatar.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LandingSectionShell>
  );
}
