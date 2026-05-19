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
const FEATURED_AVATAR_COUNT = 10;
const EXPANDED_AVATAR_BATCH_SIZE = 8;
const MOBILE_PHONE_SCALE = 0.5;
const CHOOSER_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "avatar-2", level: 2, name: "Chrome Ghost", price: "Free", imageSrc: "/avatars/avatar-2.svg", bg: "#0c1a24", figure: "#5ed6ff", ring: "#2ea6d6", glow: "#5ed6ff80", isActive: true, rarity: "common" },
  { id: "avatar-7", level: 7, name: "Void Phantom", price: "0", imageSrc: "/avatars/avatar-7.svg", bg: "#150a22", figure: "#8b5cf6", ring: "#5b2aa8", glow: "#8b5cf680", isActive: true, rarity: "common" },
  { id: "avatar-3", level: 3, name: "Iron Specter", price: "0", imageSrc: "/avatars/avatar-3.svg", bg: "#0a1124", figure: "#3f8bff", ring: "#2557c4", glow: "#3f8bff80", isActive: true, rarity: "common" },
  { id: "avatar-8", level: 8, name: "Copper Wraith", price: "0", imageSrc: "/avatars/avatar-8.svg", bg: "#1f1208", figure: "#f97316", ring: "#b0550f", glow: "#f9731680", isActive: true, rarity: "common" },
  { id: "avatar-5", level: 5, name: "Solar Enforcer", price: "0", imageSrc: "/avatars/avatar-5.svg", bg: "#0b1a0e", figure: "#16a34a", ring: "#0f7a36", glow: "#16a34a80", isActive: true, rarity: "common" },
  { id: "avatar-9", level: 9, name: "Inferno Shade", price: "0", imageSrc: "/avatars/avatar-9.svg", bg: "#1f0a0a", figure: "#dc2626", ring: "#8a1515", glow: "#dc262680", isActive: true, rarity: "common" },
  { id: "avatar-6", level: 6, name: "Neon Oracle", price: "0", imageSrc: "/avatars/avatar-6.svg", bg: "#1f0d18", figure: "#ec4899", ring: "#a6235f", glow: "#ec489980", isActive: true, rarity: "common" },
  { id: "avatar-10", level: 10, name: "Golden Reaper", price: "0", imageSrc: "/avatars/avatar-10.svg", bg: "#1f1705", figure: "#facc15", ring: "#b8900b", glow: "#facc1590", isActive: true, rarity: "common" },
];
const EXPANDED_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "shadow-lynx", level: 11, name: "Shadow Lynx", price: "0", imageSrc: "/avatars/kling_20260513_IMAGE_A_circular_2794_0_2.png", bg: "#12091d", figure: "#d946ef", ring: "#9333ea", glow: "none", isActive: true, rarity: "common" },
  { id: "ember-helm", level: 12, name: "Ember Helm", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_01.png", bg: "#17110a", figure: "#f97316", ring: "#c2410c", glow: "none", isActive: true, rarity: "common" },
  { id: "verdant-skull", level: 13, name: "Verdant Skull", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_02.png", bg: "#0f1a08", figure: "#84cc16", ring: "#4d7c0f", glow: "none", isActive: true, rarity: "common" },
  { id: "ice-crown", level: 14, name: "Ice Crown", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_03.png", bg: "#06131f", figure: "#38bdf8", ring: "#0284c7", glow: "none", isActive: true, rarity: "common" },
  { id: "horned-skull", level: 15, name: "Horned Skull", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_04.png", bg: "#1f0a05", figure: "#fb923c", ring: "#ea580c", glow: "none", isActive: true, rarity: "common" },
  { id: "pharaoh-skull", level: 16, name: "Pharaoh Skull", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_05.png", bg: "#161507", figure: "#fde047", ring: "#ca8a04", glow: "none", isActive: true, rarity: "common" },
  { id: "violet-hood", level: 17, name: "Violet Hood", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_06.png", bg: "#150a22", figure: "#a855f7", ring: "#7e22ce", glow: "none", isActive: true, rarity: "common" },
  { id: "rose-agent", level: 18, name: "Rose Agent", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_07.png", bg: "#1f0d18", figure: "#ec4899", ring: "#be185d", glow: "none", isActive: true, rarity: "common" },
  { id: "black-visor", level: 19, name: "Black Visor", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_08.png", bg: "#17110a", figure: "#f97316", ring: "#c2410c", glow: "none", isActive: true, rarity: "common" },
  { id: "blue-warden", level: 20, name: "Blue Warden", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_09.png", bg: "#06131f", figure: "#38bdf8", ring: "#0284c7", glow: "none", isActive: true, rarity: "common" },
  { id: "star-suit", level: 21, name: "Star Suit", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_10.png", bg: "#12091d", figure: "#d946ef", ring: "#9333ea", glow: "none", isActive: true, rarity: "common" },
  { id: "fire-matron", level: 22, name: "Fire Matron", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_11.png", bg: "#1f0a05", figure: "#fb923c", ring: "#ea580c", glow: "none", isActive: true, rarity: "common" },
  { id: "night-violet", level: 23, name: "Night Violet", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_12.png", bg: "#150a22", figure: "#a855f7", ring: "#7e22ce", glow: "none", isActive: true, rarity: "common" },
  { id: "lava-skull", level: 24, name: "Lava Skull", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_13.png", bg: "#1f0a05", figure: "#fb923c", ring: "#ea580c", glow: "none", isActive: true, rarity: "common" },
  { id: "pink-crown", level: 25, name: "Pink Crown", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_15.png", bg: "#1f0d18", figure: "#ec4899", ring: "#be185d", glow: "none", isActive: true, rarity: "common" },
  { id: "gold-samurai", level: 26, name: "Gold Samurai", price: "0", imageSrc: "/avatars/sheet2_helmeted_avatars_16.png", bg: "#1f1705", figure: "#facc15", ring: "#b8900b", glow: "none", isActive: true, rarity: "common" },
];
const LANDING_AVATARS: readonly AvatarCatalogItem[] = [...CHOOSER_AVATARS, ...EXPANDED_AVATARS];

export function AvatarShowcaseSection() {
  const sectionRef = useTrackSectionView("avatar");
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [desktopStart, setDesktopStart] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showExpandGrid, setShowExpandGrid] = useState(false);
  const [expandedVisibleCount, setExpandedVisibleCount] = useState(EXPANDED_AVATAR_BATCH_SIZE);
  const [showMore, setShowMore] = useState(false);
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
  }, []);

  const chooserAvatars = CHOOSER_AVATARS;
  const mobileChooserColumns = [
    chooserAvatars.slice(0, 4),
    chooserAvatars.slice(4, 8),
  ];
  const chooserTotal = chooserAvatars.length;
  const expandedAvatarSource = EXPANDED_AVATARS;
  const expandedAvatarTotal = expandedAvatarSource.length;
  const visibleExtendedAvatars = expandedAvatarSource
    .slice(0, expandedVisibleCount)
    .map((avatar) => ({ avatar, themeIndex: avatar.level }));
  // previewAvatar must come from chooserAvatars so the phone preview matches
  // the selected chooser item (previewIndex is 1-based position in chooserAvatars).
  const previewAvatar = useMemo(
    () => extraPreviewAvatar ?? chooserAvatars[previewIndex - 1] ?? LANDING_AVATARS.find((avatar) => avatar.level === previewIndex) ?? chooserAvatars[0] ?? null,
    [chooserAvatars, extraPreviewAvatar, previewIndex]
  );

  const canPrev = true;
  const canNext = true;

  useEffect(() => {
    if (!showExpandGrid) {
      setExpandedVisibleCount(EXPANDED_AVATAR_BATCH_SIZE);
      return;
    }

    setExpandedVisibleCount(EXPANDED_AVATAR_BATCH_SIZE);
    let cancelled = false;
    let timer: number | undefined;

    const loadNextBatch = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setExpandedVisibleCount((current) => {
          const next = Math.min(current + EXPANDED_AVATAR_BATCH_SIZE, expandedAvatarTotal);
          if (next < expandedAvatarTotal) {
            loadNextBatch();
          }
          return next;
        });
      }, 40);
    };

    if (expandedAvatarTotal > EXPANDED_AVATAR_BATCH_SIZE) {
      loadNextBatch();
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [expandedAvatarTotal, showExpandGrid]);

  function handleToggleExpandGrid() {
    setShowExpandGrid((open) => !open);
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
    return { avatar: chooserAvatars[idx], index: idx + 1 };
  });

  const desktopAvatars = Array.from({ length: DESKTOP_COUNT }, (_, i) => {
    const idx = (desktopStart + i) % chooserTotal;
    return { avatar: chooserAvatars[idx], index: idx + 1 };
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
          className={`relative rounded-full transition-all duration-300 ${
            isActive ? "scale-110" : "scale-100 group-hover:scale-105"
          }`}
          style={{ transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <AvatarFigure avatarIndex={avatar.level} size="md" selected={isSelected || isActive} />
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
            className="grid flex-1 grid-cols-2 gap-x-1"
          >
            {mobileChooserColumns.map((column, columnIndex) => (
              <div key={`mobile-avatar-column-${columnIndex}`} className="flex min-w-0 flex-col items-center justify-around">
                {column.map((avatar) => {
                  const index = chooserAvatars.indexOf(avatar) + 1;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(index); setPreviewIndex(index); }}
                      className="flex min-w-0 flex-col items-center gap-0.5 outline-none"
                      aria-label={`Select ${avatar.name}`}
                      aria-pressed={avatarIndex === index}
                    >
                      <div
                        className={`rounded-full transition-all duration-200 scale-[0.72] ${avatarIndex === index ? "scale-[0.82]" : ""}`}
                      >
                        <AvatarFigure avatarIndex={avatar.level} size="sm" selected={avatarIndex === index} />
                      </div>
                      <span
                        className="max-w-[44px] text-center font-display uppercase leading-tight transition-colors duration-200"
                        style={{
                          fontSize: "0.4rem",
                          letterSpacing: "0.04em",
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
            ))}
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

      {/* ── Desktop (lg+): large phone left + 2×4 grid right ── */}
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
                className="grid flex-1 grid-cols-2 grid-rows-4 grid-flow-col place-items-center gap-x-4 gap-y-2"
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
          label={showExpandGrid ? "HIDE" : "CLICK TO REVEAL MORE"}
          onClick={handleToggleExpandGrid}
          className="animate-[cta-breath_3.4s_ease-in-out_infinite]"
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
                    <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-4 sm:gap-x-5 sm:gap-y-5">
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
                                style={{ objectPosition: "center 35%" }}
                              />
                            ) : (
                              <AvatarFigure avatarIndex={themeIndex} size="sm" selected={avatarIndex === themeIndex} />
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
