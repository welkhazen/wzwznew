import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { LEVEL_THEMES, setAvatarThemes } from "@/lib/avataridentity";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import type { LandingNewAvatar } from "@/lib/landingNewAvatars";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { useTheme } from "@/providers/useTheme";
import { RawRevealButton } from "../../../components/raw-reveal-button";

const VISIBLE_COUNT = 4;
const DESKTOP_COUNT = 8;
const MOBILE_PHONE_SCALE = 0.5;
const CHOOSER_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 2, name: "Ember", price: "0", imageSrc: "/avatars/avatar-2.svg", bg: "#0c1a24", figure: "#5ed6ff", ring: "#5ed6ff", glow: "#5ed6ff80", isActive: true, rarity: "common" },
  { id: "verdant", level: 3, name: "Verdant", price: "0", imageSrc: "/avatars/avatar-3.svg", bg: "#0a1124", figure: "#3f8bff", ring: "#3f8bff", glow: "#3f8bff80", isActive: true, rarity: "common" },
  { id: "horned", level: 5, name: "Horned", price: "0", imageSrc: "/avatars/avatar-5.svg", bg: "#0b1a0e", figure: "#16a34a", ring: "#16a34a", glow: "#16a34a80", isActive: true, rarity: "common" },
  { id: "pharaoh", level: 6, name: "Pharaoh", price: "0", imageSrc: "/avatars/avatar-6.svg", bg: "#1f0d18", figure: "#ec4899", ring: "#ec4899", glow: "#ec489980", isActive: true, rarity: "common" },
  { id: "violet", level: 7, name: "Violet", price: "0", imageSrc: "/avatars/avatar-7.svg", bg: "#150a22", figure: "#8b5cf6", ring: "#8b5cf6", glow: "#8b5cf680", isActive: true, rarity: "common" },
  { id: "rose", level: 8, name: "Rose", price: "0", imageSrc: "/avatars/avatar-8.svg", bg: "#1f1208", figure: "#f97316", ring: "#f97316", glow: "#f9731680", isActive: true, rarity: "common" },
  { id: "black", level: 9, name: "Black", price: "0", imageSrc: "/avatars/avatar-9.svg", bg: "#1f0a0a", figure: "#dc2626", ring: "#dc2626", glow: "#dc262680", isActive: true, rarity: "common" },
  { id: "blue", level: 10, name: "Blue", price: "0", imageSrc: "/avatars/avatar-10.svg", bg: "#1f1705", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, rarity: "common" },
];
const REVEAL_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "reveal-1", level: 11, name: "Silver Void", price: "0", imageSrc: "/avatars/1.png", bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", isActive: true, rarity: "common" },
  { id: "reveal-2", level: 12, name: "Neon Lynx", price: "0", imageSrc: "/avatars/2.png", bg: "#170f2e", figure: "#a855f7", ring: "#c084fc", glow: "#a855f780", isActive: true, rarity: "common" },
  { id: "reveal-3", level: 13, name: "Blue Signal", price: "0", imageSrc: "/avatars/3.png", bg: "#06131f", figure: "#22d3ee", ring: "#22d3ee", glow: "#22d3ee80", isActive: true, rarity: "common" },
  { id: "reveal-4", level: 14, name: "Violet Mask", price: "0", imageSrc: "/avatars/4.png", bg: "#1a1028", figure: "#d946ef", ring: "#d946ef", glow: "#d946ef80", isActive: true, rarity: "common" },
  { id: "reveal-5", level: 15, name: "Horned Iron", price: "0", imageSrc: "/avatars/5.png", bg: "#1f0a05", figure: "#fb923c", ring: "#fb923c", glow: "#fb923c80", isActive: true, rarity: "common" },
  { id: "reveal-6", level: 16, name: "Crimson Muse", price: "0", imageSrc: "/avatars/6.png", bg: "#2a0b0b", figure: "#f97316", ring: "#f97316", glow: "#f9731680", isActive: true, rarity: "common" },
  { id: "reveal-7", level: 17, name: "Solar Flame", price: "0", imageSrc: "/avatars/7.png", bg: "#241005", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, rarity: "common" },
  { id: "reveal-8", level: 18, name: "Pink Circuit", price: "0", imageSrc: "/avatars/8.png", bg: "#2a0b1c", figure: "#fb7185", ring: "#fb7185", glow: "#fb718580", isActive: true, rarity: "common" },
];
const LANDING_AVATARS: readonly AvatarCatalogItem[] = [...CHOOSER_AVATARS, ...REVEAL_AVATARS];

export function AvatarShowcaseSection() {
  const sectionRef = useTrackSectionView("avatar");
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [avatarIndex, setAvatarIndex] = useState(CHOOSER_AVATARS[0].level);
  const [previewIndex, setPreviewIndex] = useState(CHOOSER_AVATARS[0].level);
  const [startIndex, setStartIndex] = useState(0);
  const [desktopStart, setDesktopStart] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showExpandGrid, setShowExpandGrid] = useState(false);
  const [expandedVisibleCount, setExpandedVisibleCount] = useState(CHOOSER_AVATARS.length);
  const [showMore, setShowMore] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [extraPreviewAvatar, setExtraPreviewAvatar] = useState<LandingNewAvatar | null>(null);
  const [newAvatars] = useState<LandingNewAvatar[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nextThemes = [...LEVEL_THEMES];
    LANDING_AVATARS.forEach((item) => {
      nextThemes[item.level - 1] = {
        bg: item.bg,
        figure: item.figure,
        ring: item.ring,
        glow: item.glow,
        name: item.name,
        imageSrc: item.imageSrc,
      };
    });
    setAvatarThemes(nextThemes);
    setThemeVersion((version) => version + 1);
  }, []);

  const chooserAvatars = CHOOSER_AVATARS;
  const chooserTotal = chooserAvatars.length;
  const expandedAvatarSource = REVEAL_AVATARS;
  const expandedAvatarTotal = expandedAvatarSource.length;
  const visibleExtendedAvatars = expandedAvatarSource
    .slice(0, expandedVisibleCount)
    .map((avatar) => ({ avatar, themeIndex: avatar.level }));
  const previewAvatar = useMemo(
    () => extraPreviewAvatar ?? LANDING_AVATARS.find((avatar) => avatar.level === previewIndex) ?? chooserAvatars[0] ?? null,
    [chooserAvatars, extraPreviewAvatar, previewIndex]
  );

  const canPrev = true;
  const canNext = true;

  useEffect(() => {
    setExpandedVisibleCount(expandedAvatarTotal);
  }, [expandedAvatarTotal, showExpandGrid]);

  function handleToggleExpandGrid() {
    setShowExpandGrid((open) => !open);
  }

  // Per-image scale to normalise inner-circle size — each source PNG has
  // different transparent padding around the avatar circle.
  function getRevealAvatarImageStyle(avatarId?: string): React.CSSProperties {
    switch (avatarId) {
      case "reveal-2": // Neon Lynx
      case "reveal-3": // Blue Signal
      case "reveal-4": // Violet Mask
      case "reveal-5": // Horned Iron
      case "reveal-7": // Solar Flame
        return { transform: "scale(1.45)" };
      case "reveal-8": // Pink Circuit
        return { transform: "scale(1.05)" };
      default: // reveal-1 (Silver Void) and reveal-6 (Crimson Muse) already fill
        return undefined as unknown as React.CSSProperties;
    }
  }

  function prev() {
    setStartIndex((i) => (i - 1 + chooserTotal) % chooserTotal);
  }

  function next() {
    setStartIndex((i) => (i + 1) % chooserTotal);
  }

  function prevDesktop() {
    setDesktopStart((i) => (i - DESKTOP_COUNT + chooserTotal) % chooserTotal);
  }

  function nextDesktop() {
    setDesktopStart((i) => (i + DESKTOP_COUNT) % chooserTotal);
  }

  const visibleAvatars = Array.from({ length: VISIBLE_COUNT }, (_, i) => {
    const idx = (startIndex + i) % chooserTotal;
    return { avatar: chooserAvatars[idx], index: chooserAvatars[idx].level };
  });

  const desktopAvatars = Array.from({ length: DESKTOP_COUNT }, (_, i) => {
    const idx = (desktopStart + i) % chooserTotal;
    return { avatar: chooserAvatars[idx], index: chooserAvatars[idx].level };
  });

  function AvatarButton({
    index,
    avatar,
    mobile,
  }: {
    index: number;
    avatar: AvatarCatalogItem;
    mobile?: boolean;
  }) {
    const isActive = index === previewIndex;
    const isSelected = index === avatarIndex;
    const scaleClass = !avatar.imageSrc
      ? isActive
        ? "scale-[1.22]"
        : "scale-[1.12] group-hover:scale-[1.17]"
      : isActive
        ? "scale-110"
        : "scale-100 group-hover:scale-105";

    return (
      <button
        key={index}
        type="button"
        onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(index); setPreviewIndex(index); }}
        onTouchStart={mobile ? () => { setExtraPreviewAvatar(null); setPreviewIndex(index); } : undefined}
        onTouchEnd={mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onTouchCancel={mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onMouseEnter={!mobile ? () => { setExtraPreviewAvatar(null); setPreviewIndex(index); } : undefined}
        onMouseLeave={!mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        onFocus={!mobile ? () => { setExtraPreviewAvatar(null); setPreviewIndex(index); } : undefined}
        onBlur={!mobile ? () => setPreviewIndex(avatarIndex) : undefined}
        className="group relative flex flex-col items-center gap-3 outline-none"
        aria-label={`Select ${avatar.name}`}
        aria-pressed={isSelected}
      >
        <div
          className={`relative rounded-full transition-all duration-300 ${scaleClass}`}
          style={{ transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <AvatarFigure key={`${avatar.level}-${themeVersion}`} avatarIndex={avatar.level} size="md" selected={isSelected || isActive} />
        </div>

        {/* Name */}
        <span
          className={`font-display text-[9px] tracking-[0.18em] uppercase transition-all duration-300 ${
            isActive ? "text-raw-gold" : "text-raw-silver/45 group-hover:text-raw-silver/80"
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
      <div ref={phoneRef} className="mx-auto flex w-full max-w-5xl flex-row items-start gap-3 sm:hidden">

        {/* Phone: scaled to fit the left half while keeping the full home screen intact. */}
        <div
          className="w-[43%] shrink-0 overflow-visible pt-1"
          style={{ height: 646 * MOBILE_PHONE_SCALE }}
        >
          {/* Transform scaling avoids mobile browser zoom side effects. */}
          <div
            style={{
              width: 280,
              transform: `scale(${MOBILE_PHONE_SCALE})`,
              transformOrigin: "top left",
            }}
          >
            <PhoneMockup className="w-[280px]" showStatusBar={false}>
              <AvatarPhoneHomeScreen avatarIndex={previewIndex} compact previewAvatar={previewAvatar} />
            </PhoneMockup>
          </div>
        </div>

        {/* Avatar grid — right half, same height as phone */}
        <div className="flex flex-1 flex-col min-w-0 pt-1 overflow-hidden" style={{ height: 646 * MOBILE_PHONE_SCALE }}>
          <p className="mb-1 text-center font-display text-[8px] uppercase tracking-[0.14em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div
            ref={scrollRef}
            className="grid flex-1 grid-cols-2 grid-rows-5 place-items-center gap-x-1 gap-y-0"
          >
            {chooserAvatars.map((avatar) => {
              const index = avatar.level;
              const scaleClass = !avatar.imageSrc
                ? avatarIndex === index
                  ? "scale-[0.82]"
                  : "scale-[0.72]"
                : avatarIndex === index
                  ? "scale-[0.7]"
                  : "scale-[0.6]";
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(index); setPreviewIndex(index); }}
                  className="flex min-w-0 flex-col items-center gap-0 outline-none"
                  aria-label={`Select ${avatar.name}`}
                  aria-pressed={avatarIndex === index}
                >
                  <div
                    className={`rounded-full transition-all duration-200 ${scaleClass}`}
                  >
                    <AvatarFigure key={`${avatar.level}-${themeVersion}`} avatarIndex={avatar.level} size="sm" selected={avatarIndex === index} />
                  </div>
                  <span
                    className="max-w-[46px] text-center font-display uppercase leading-tight transition-colors duration-200"
                    style={{
                      fontSize: "0.38rem",
                      letterSpacing: "0.02em",
                      color: avatarIndex === index
                        ? "#F1C42D"
                        : isLight
                          ? "rgba(30,41,59,0.6)"
                          : "rgba(255,255,255,0.42)",
                    }}
                  >
                    {avatar.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tablet (sm–lg): phone on top, windowed avatar strip below ── */}
      <div className="mx-auto hidden w-full max-w-5xl flex-col items-center gap-8 sm:flex lg:hidden">
        <PhoneMockup className="w-[310px]" showStatusBar={false}>
          <AvatarPhoneHomeScreen avatarIndex={previewIndex} previewAvatar={previewAvatar} />
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
                ? chooserAvatars.map((avatar, i) => (
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

      {/* ── Desktop (lg+): large phone left + 4x2 chooser grid right ── */}
      <div className="mx-auto hidden w-full max-w-5xl flex-row items-stretch gap-10 lg:flex">

        <div className="flex shrink-0 justify-center">
          <PhoneMockup className="w-[310px]" showStatusBar={false}>
          <AvatarPhoneHomeScreen avatarIndex={previewIndex} previewAvatar={previewAvatar} />
          </PhoneMockup>
        </div>

        <div
          className="relative flex flex-1 min-w-0 flex-col overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-6"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
          <p className="mb-5 text-center font-display text-xs uppercase tracking-[0.25em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div className="flex flex-1 flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={desktopStart}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="grid flex-1 grid-cols-4 grid-rows-2 place-items-center gap-x-4 gap-y-2"
              >
                {desktopAvatars.map(({ avatar, index }) => (
                  <AvatarButton key={`${desktopStart}-${index}`} index={index} avatar={avatar} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Expand: full avatar grid ── */}
      <div className="mx-auto mt-6 w-full max-w-5xl flex flex-col items-center">
        <RawRevealButton
          size="default"
          state={showExpandGrid ? "hover" : "scroll"}
          label={showExpandGrid ? "HIDE" : "EXPLORE MORE"}
          onClick={handleToggleExpandGrid}
          className="animate-[cta-breath_3.4s_ease-in-out_infinite] !text-white"
        />

        <AnimatePresence>
          {showExpandGrid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden w-full"
            >
              <div
                className="relative mt-5 rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-6 sm:p-8"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
                <p className="mb-5 text-center font-display text-[10px] uppercase tracking-[0.28em] text-raw-gold/60 sm:mb-6">
                  All Avatars
                </p>
                {visibleExtendedAvatars.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 place-items-start justify-items-center gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-5">
                      {visibleExtendedAvatars.map(({ avatar, themeIndex }) => (
                        <button
                          key={avatar.id ?? themeIndex}
                          type="button"
                          onClick={() => {
                            setExtraPreviewAvatar(null);
                            setAvatarIndex(themeIndex);
                            setPreviewIndex(themeIndex);
                            phoneRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          onMouseEnter={() => setPreviewIndex(themeIndex)}
                          onMouseLeave={() => setPreviewIndex(avatarIndex)}
                          className="group flex w-12 flex-col items-center gap-1 outline-none sm:w-16 sm:gap-1.5 [content-visibility:auto] [contain-intrinsic-size:76px]"
                          aria-label={`Select ${avatar.name}`}
                        >
                          <div
                            className={`relative h-11 w-11 overflow-hidden rounded-full transition-all duration-300 group-hover:scale-105 sm:h-14 sm:w-14 ${
                              avatarIndex === themeIndex ? "ring-1 ring-raw-gold/80" : "ring-1 ring-white/10"
                            }`}
                            style={{ transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
                          >
                            {avatar.imageSrc ? (
                              <img
                                src={avatar.imageSrc}
                                alt={avatar.name}
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                className="h-full w-full object-cover"
                                style={getRevealAvatarImageStyle(avatar.id)}
                              />
                            ) : (
                              <AvatarFigure key={`${themeIndex}-${themeVersion}`} avatarIndex={themeIndex} size="sm" selected={avatarIndex === themeIndex} />
                            )}
                          </div>
                          <span
                            className="min-h-[1.35rem] text-center font-display text-[6px] uppercase leading-[1.15] tracking-wide transition-colors duration-200 sm:min-h-[1.5rem] sm:text-[7px]"
                            style={{
                              color: avatarIndex === themeIndex
                                ? "#F1C42D"
                                : isLight
                                  ? "rgba(30,41,59,0.62)"
                                  : "rgba(255,255,255,0.3)",
                            }}
                          >
                            {avatar.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    {expandedVisibleCount < expandedAvatarTotal && (
                      <p className="mt-5 text-center font-display text-[8px] uppercase tracking-[0.22em] text-raw-silver/35">
                        Loading more avatars...
                      </p>
                    )}
                  </>
                ) : (
                  <div
                    className="flex min-h-24 items-center justify-center rounded-xl border border-raw-border/30 bg-raw-black/30 px-4 text-center"
                    aria-live="polite"
                  >
                    <p className="font-display text-[9px] uppercase tracking-[0.2em] text-white/45">
                      More avatars are coming soon.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setExtraPreviewAvatar(avatar)}
                      className="relative flex flex-col items-center gap-3 outline-none transition-transform active:scale-95"
                      aria-label={`Preview ${avatar.name}`}
                    >
                      <span
                        className="absolute -top-1 -right-1 z-10 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-raw-black"
                        style={{
                          background: "linear-gradient(135deg, #F1C42D, #ffed8a)",
                          boxShadow: "0 0 10px rgba(241,196,45,0.7)",
                        }}
                      >
                        NEW
                      </span>
                      <div className={`h-20 w-20 overflow-hidden rounded-full border-2 bg-raw-surface/40 transition-colors ${
                        extraPreviewAvatar?.id === avatar.id ? "border-raw-gold" : "border-raw-gold/40"
                      }`}>
                        {avatar.imageSrc
                          ? <img src={avatar.imageSrc} alt={avatar.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          : <div className="h-full w-full" />
                        }
                      </div>
                      <p className="text-center text-xs text-raw-silver/70">{avatar.name}</p>
                    </button>
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
