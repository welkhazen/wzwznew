import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { LEVEL_THEMES, setAvatarThemes } from "@/lib/avataridentity";
import { DEFAULT_AVATAR_CATALOG, loadAvatarCatalogRange, readFullAvatarCatalogLocal } from "@/lib/avatarCatalog";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { loadLandingNewAvatars } from "@/lib/landingNewAvatars";
import type { LandingNewAvatar } from "@/lib/landingNewAvatars";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";

const VISIBLE_COUNT = 4;
const DESKTOP_COUNT = 8;
const FEATURED_AVATAR_COUNT = 10;
const EXPANDED_AVATAR_START_LEVEL = 11;
const EXPANDED_AVATAR_END_LEVEL = 30;
const EXPANDED_AVATAR_BATCH_SIZE = 8;
const MOBILE_PHONE_SCALE = 0.5;

export function AvatarShowcaseSection() {
  const sectionRef = useTrackSectionView("avatar");
  const [avatarIndex, setAvatarIndex] = useState(1);
  const [previewIndex, setPreviewIndex] = useState(1);
  const [startIndex, setStartIndex] = useState(0);
  const [desktopStart, setDesktopStart] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [showExpandGrid, setShowExpandGrid] = useState(false);
  const [expandedVisibleCount, setExpandedVisibleCount] = useState(EXPANDED_AVATAR_BATCH_SIZE);
  const [showMore, setShowMore] = useState(false);
  const [extraPreviewAvatar, setExtraPreviewAvatar] = useState<LandingNewAvatar | null>(null);
  const [fullCatalog, setFullCatalog] = useState<AvatarCatalogItem[]>(() => readFullAvatarCatalogLocal());
  const [expandedCatalog, setExpandedCatalog] = useState<AvatarCatalogItem[]>([]);
  const [isLoadingExpandedAvatars, setIsLoadingExpandedAvatars] = useState(false);
  const [newAvatars, setNewAvatars] = useState<LandingNewAvatar[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  const applyFullThemes = (items: AvatarCatalogItem[]) => {
    setFullCatalog(items);
    setAvatarThemes(items.map((item) => ({
      bg: item.bg, figure: item.figure, ring: item.ring,
      glow: item.glow, name: item.name, imageSrc: item.imageSrc,
    })));
  };

  const applyRangedThemes = (items: AvatarCatalogItem[]) => {
    setExpandedCatalog(items);
    if (items.length === 0) return;

    const nextThemes = [...LEVEL_THEMES];
    items.forEach((item) => {
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
  };

  useEffect(() => {
    const cached = readFullAvatarCatalogLocal();
    if (cached.length > 0) applyFullThemes(cached);
    loadLandingNewAvatars().then(setNewAvatars).catch(() => {});
  }, []);

  const baseAvatars = fullCatalog.length > 0 ? fullCatalog : DEFAULT_AVATAR_CATALOG;
  const chooserAvatars = DEFAULT_AVATAR_CATALOG;
  const chooserTotal = chooserAvatars.length;
  const expandedAvatarSource = expandedCatalog.length > 0
    ? expandedCatalog
    : baseAvatars.filter((avatar) => avatar.level >= EXPANDED_AVATAR_START_LEVEL && avatar.level <= EXPANDED_AVATAR_END_LEVEL);
  const expandedAvatarTotal = expandedAvatarSource.length;
  const visibleExtendedAvatars = expandedAvatarSource
    .slice(0, expandedVisibleCount)
    .map((avatar) => ({ avatar, themeIndex: avatar.level }));
  // previewAvatar must come from chooserAvatars so the phone preview matches
  // the selected chooser item (previewIndex is 1-based position in chooserAvatars).
  const previewAvatar = useMemo(
    () => extraPreviewAvatar ?? chooserAvatars[previewIndex - 1] ?? chooserAvatars[0] ?? null,
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
    const shouldOpen = !showExpandGrid;
    setShowExpandGrid(shouldOpen);

    if (!shouldOpen || expandedCatalog.length > 0 || isLoadingExpandedAvatars) return;

    setIsLoadingExpandedAvatars(true);
    loadAvatarCatalogRange(EXPANDED_AVATAR_START_LEVEL, EXPANDED_AVATAR_END_LEVEL)
      .then(applyRangedThemes)
      .catch(() => {})
      .finally(() => setIsLoadingExpandedAvatars(false));
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
    avatar: (typeof baseAvatars)[0];
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

        {/* Avatar grid — right half */}
        <div className="flex flex-1 flex-col min-w-0 pt-1">
          <p className="mb-3 text-center font-display text-[8px] uppercase tracking-[0.14em] text-raw-gold/70 min-[380px]:text-[9px] min-[380px]:tracking-[0.18em]">
            Choose your avatar
          </p>
          <div
            ref={scrollRef}
            className="grid grid-cols-4 gap-x-1 gap-y-3"
          >
            {chooserAvatars.map((avatar, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(i + 1); setPreviewIndex(i + 1); }}
                className="flex flex-col items-center gap-0.5 outline-none"
                aria-label={`Select ${avatar.name}`}
                aria-pressed={avatarIndex === i + 1}
              >
                <div
                  className={`rounded-full transition-all duration-200 scale-[0.72] ${avatarIndex === i + 1 ? "scale-[0.82]" : ""}`}
                >
                  <AvatarFigure avatarIndex={avatar.level} size="sm" selected={avatarIndex === i + 1} />
                </div>
                <span
                  className="text-center font-display uppercase leading-tight transition-colors duration-200"
                  style={{
                    fontSize: "0.44rem",
                    letterSpacing: "0.08em",
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
        <button
          type="button"
          onClick={handleToggleExpandGrid}
          className="group flex flex-col items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-5 py-3 text-raw-silver/40 outline-none backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/20 hover:bg-white/[0.045] hover:text-raw-silver/70 focus-visible:border-white/25"
          aria-label={showExpandGrid ? "Collapse avatar grid" : "Expand avatar grid"}
        >
          <span className="text-[10px] uppercase tracking-[0.22em] transition-opacity duration-300 group-hover:opacity-100">
            {showExpandGrid ? "hide" : "explore all"}
          </span>
          <motion.div
            animate={{ y: showExpandGrid ? 0 : 2 }}
            whileHover={{ y: showExpandGrid ? 0 : 5 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.div animate={{ rotate: showExpandGrid ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="h-5 w-5 text-current opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
            </motion.div>
          </motion.div>
        </button>

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
                <p className="mb-6 text-center font-display text-[10px] uppercase tracking-[0.28em] text-raw-gold/60">
                  All Avatars
                </p>
                {visibleExtendedAvatars.length > 0 ? (
                  <>
                    <div className="grid grid-cols-4 gap-4 place-items-center sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
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
                          className="group flex flex-col items-center gap-1.5 outline-none [content-visibility:auto] [contain-intrinsic-size:72px]"
                          aria-label={`Select ${avatar.name}`}
                        >
                          <div
                            className="rounded-full transition-all duration-300 group-hover:scale-110"
                            style={{ transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
                          >
                            <AvatarFigure avatarIndex={themeIndex} size="sm" selected={avatarIndex === themeIndex} />
                          </div>
                          <span
                            className="text-center font-display text-[8px] uppercase tracking-wide transition-colors duration-200"
                            style={{ color: avatarIndex === themeIndex ? "#F1C42D" : "rgba(255,255,255,0.3)" }}
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
                    <p
                      className="font-display text-[9px] uppercase tracking-[0.2em]"
                      style={{ color: isLoadingExpandedAvatars ? "rgba(241,196,45,0.75)" : "rgba(255,255,255,0.42)" }}
                    >
                      {isLoadingExpandedAvatars ? "Loading avatars..." : "More avatars are loading. Tap again in a moment."}
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
