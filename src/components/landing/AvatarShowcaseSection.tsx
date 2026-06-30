import { useEffect, useMemo, useRef, useState } from "react";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
import { ChevronDown, Sparkles } from "lucide-react";
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
import { WheelRewardInline } from "@/components/landing/WheelReward";

const DESKTOP_COUNT = 8;
const FEATURED_UNLOCKABLE_COUNT = 8;
const CHOOSER_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 2, name: "Ember", price: "0", imageSrc: "/avatars/avatar-3.svg", bg: "#1f0a05", figure: "#ff8a1f", ring: "#ff8a1f", glow: "#ff8a1f80", isActive: true, rarity: "common" },
  { id: "verdant", level: 3, name: "Verdant", price: "0", imageSrc: "/avatars/avatar-1.svg", bg: "#08160b", figure: "#22c55e", ring: "#22c55e", glow: "#22c55e80", isActive: true, rarity: "common" },
  { id: "horned", level: 5, name: "Horned", price: "0", imageSrc: "/avatars/avatar-5.svg", bg: "#1f0808", figure: "#ff2d3d", ring: "#ff2d3d", glow: "#ff2d3d80", isActive: true, rarity: "common" },
  { id: "pharaoh", level: 6, name: "Pharaoh", price: "0", imageSrc: "/avatars/avatar-6.svg", bg: "#1f1605", figure: "#f2d21a", ring: "#f2d21a", glow: "#f2d21a80", isActive: true, rarity: "common" },
  { id: "violet", level: 7, name: "Violet", price: "0", imageSrc: "/avatars/avatar-2.svg", bg: "#150a22", figure: "#b84dff", ring: "#b84dff", glow: "#b84dff80", isActive: true, rarity: "common" },
  { id: "rose", level: 8, name: "Rose", price: "0", imageSrc: "/avatars/avatar-4.svg", bg: "#1f0a14", figure: "#f43f5e", ring: "#f43f5e", glow: "#f43f5e80", isActive: true, rarity: "common" },
  { id: "black", level: 9, name: "Black", price: "0", imageSrc: "/avatars/avatar-7.svg", bg: "#0a0a0a", figure: "#cfd3da", ring: "#cfd3da", glow: "#cfd3da80", isActive: true, rarity: "common" },
  { id: "blue", level: 10, name: "Blue", price: "0", imageSrc: "/avatars/avatar-10.svg", bg: "#0a1424", figure: "#3b82f6", ring: "#3b82f6", glow: "#3b82f680", isActive: true, rarity: "common" },
];
// "Spin pool" + "early-signup pool" sourced from the shared config so
// landing, onboarding, and wheel stay in lockstep.
import {
  SPIN_POOL,
  EARLY_SIGNUP_POOL,
} from "@/backend/supabase/controllers/avatarRewardsController";
import { avatarDisplayName } from "@/config/avatarNames";

const REVEAL_AVATARS: readonly AvatarCatalogItem[] = [
  ...SPIN_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `reveal-spin-${i + 1}`,
    level: 11 + i,
    name: avatarDisplayName(entry.imageId),
    price: "0",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
  ...EARLY_SIGNUP_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `reveal-signup-${i + 1}`,
    level: 11 + SPIN_POOL.length + i,
    name: avatarDisplayName(entry.imageId),
    price: "0",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
];
const LANDING_AVATARS: readonly AvatarCatalogItem[] = [...CHOOSER_AVATARS, ...REVEAL_AVATARS];

// Featured 8 shown upfront (lowest tier first). Rainbow Pulse, White Mirage, Gold Specter
// appear in "Show More" as the higher-tier entries.
const UNLOCKABLE_FEATURE_ORDER = [
  "Grey Sentinel",
  "Blue Cipher",
  "Green Relic",
  "Orange Vortex",
  "Purple Oracle",
  "Red Phantom",
  "Pink Nova",
  "Rose Warden",
] as const;

interface AvatarShowcaseSectionProps {
  onSignupClick?: () => void;
}

export function AvatarShowcaseSection({ onSignupClick = () => undefined }: AvatarShowcaseSectionProps) {
  const sectionRef = useTrackSectionView("avatar");
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [avatarIndex, setAvatarIndex] = useState(CHOOSER_AVATARS[0].level);
  const [previewIndex, setPreviewIndex] = useState(CHOOSER_AVATARS[0].level);
  const [desktopStart] = useState(0);
  const [showUnlockableAvatars, setShowUnlockableAvatars] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [extraPreviewAvatar, setExtraPreviewAvatar] = useState<LandingNewAvatar | null>(null);
  const [newAvatars] = useState<LandingNewAvatar[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  const featuredUnlockableNames = new Set<string>(UNLOCKABLE_FEATURE_ORDER);
  // Not showcased in the landing grid (Bronze Herald has duplicate art and is
  // no longer in any reward pool, but stays out of the grid for consistency).
  const hiddenUnlockableNames = new Set(["Bronze Herald"]);
  const unlockableAvatars = [
    ...UNLOCKABLE_FEATURE_ORDER
      .map((name) => REVEAL_AVATARS.find((avatar) => avatar.name === name))
      .filter((avatar): avatar is AvatarCatalogItem => Boolean(avatar)),
    ...REVEAL_AVATARS.filter(
      (avatar) => !featuredUnlockableNames.has(avatar.name) && !hiddenUnlockableNames.has(avatar.name),
    ),
  ];
  const visibleUnlockableAvatars = (showUnlockableAvatars
    ? unlockableAvatars
    : unlockableAvatars.slice(0, FEATURED_UNLOCKABLE_COUNT)
  ).map((avatar) => ({ avatar, themeIndex: avatar.level }));
  const hasMoreUnlockableAvatars = unlockableAvatars.length > FEATURED_UNLOCKABLE_COUNT;
  const previewAvatar = useMemo(
    () => extraPreviewAvatar ?? LANDING_AVATARS.find((avatar) => avatar.level === previewIndex) ?? chooserAvatars[0] ?? null,
    [chooserAvatars, extraPreviewAvatar, previewIndex]
  );

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
          <AvatarFigure key={`${avatar.level}-${themeVersion}`} avatarIndex={avatar.level} size="md" selected={isSelected || isActive} themeOverride={avatar} />
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


  function UnlockableAvatarButton({
    avatar,
    themeIndex,
  }: {
    avatar: AvatarCatalogItem;
    themeIndex: number;
  }) {
    const isActive = themeIndex === previewIndex;
    const isSelected = themeIndex === avatarIndex;

    return (
      <button
        type="button"
        onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(themeIndex); setPreviewIndex(themeIndex); }}
        onMouseEnter={() => { setExtraPreviewAvatar(null); setPreviewIndex(themeIndex); }}
        onMouseLeave={() => setPreviewIndex(avatarIndex)}
        onFocus={() => { setExtraPreviewAvatar(null); setPreviewIndex(themeIndex); }}
        onBlur={() => setPreviewIndex(avatarIndex)}
        className="group flex min-w-0 flex-col items-center gap-1.5 outline-none"
        aria-label={`Select unlockable avatar ${avatar.name}`}
        aria-pressed={isSelected}
      >
        <div
          className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 sm:h-14 sm:w-14 ${
            isActive ? "scale-110" : "scale-100 group-hover:scale-105"
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
              className={`h-full w-full rounded-full object-contain transition-all duration-300 ${
                isSelected || isActive ? "drop-shadow-[0_0_12px_rgba(241,196,45,0.45)]" : "opacity-80 group-hover:opacity-100"
              }`}
            />
          ) : (
            <AvatarFigure key={`${themeIndex}-${themeVersion}`} avatarIndex={themeIndex} size="sm" selected={isSelected || isActive} themeOverride={avatar} />
          )}
        </div>
        <span
          className={`min-h-[1.4rem] max-w-16 text-center font-display text-[6px] uppercase leading-[1.15] tracking-[0.12em] transition-colors duration-200 sm:text-[7px] ${
            isActive ? "text-raw-gold" : "text-raw-silver/40 group-hover:text-raw-silver/75"
          }`}
        >
          {avatar.name}
        </span>
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
          <span className="text-[0.6em]">Your Story.</span>
        </span>
      }
      description={
        <span className="block whitespace-pre-line">
          {highlightRawWordmark(`Your username is your constant identity. Your avatar is your evolving one.\n\nIn real life you are born with a name, a face, and a personality underneath. On raW, your username is your name, your avatar is your face — and your answers reveal the personality behind them.`)}
        </span>
      }
    >
      {/* ── Mobile (<sm): stacked sections — phone / chooser / unlockable ── */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 sm:hidden">

        {/* 1 — Phone mockup */}
        <div className="flex justify-center py-2">
          <PhoneMockup className="w-[260px]" showStatusBar={false}>
            <AvatarPhoneHomeScreen avatarIndex={previewIndex} compact previewAvatar={previewAvatar} />
          </PhoneMockup>
        </div>

        {/* 2 — Avatar chooser */}
        <div className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-4"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
          <p className="mb-3 text-center font-display text-[8px] uppercase tracking-[0.18em] text-raw-gold/70">
            Choose your avatar
          </p>
          <div ref={scrollRef} className="grid grid-cols-4 place-items-center gap-x-2 gap-y-3">
            {chooserAvatars.map((avatar) => {
              const index = avatar.level;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => { setExtraPreviewAvatar(null); setAvatarIndex(index); setPreviewIndex(index); }}
                  className="flex min-w-0 flex-col items-center gap-1 outline-none"
                  aria-label={`Select ${avatar.name}`}
                  aria-pressed={avatarIndex === index}
                >
                  <div className={`rounded-full transition-all duration-200 ${avatarIndex === index ? "scale-110" : "scale-100"}`}>
                    <AvatarFigure key={`${avatar.level}-${themeVersion}`} avatarIndex={avatar.level} size="sm" selected={avatarIndex === index} themeOverride={avatar} />
                  </div>
                  <span
                    className="max-w-[46px] text-center font-display uppercase leading-tight transition-colors duration-200"
                    style={{
                      fontSize: "0.42rem",
                      letterSpacing: "0.04em",
                      color: avatarIndex === index ? "#F1C42D" : isLight ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.42)",
                    }}
                  >
                    {avatar.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 — Unlockable avatars */}
        {unlockableAvatars.length > 0 && (
          <div className="relative w-full overflow-hidden rounded-2xl border border-raw-border/40 bg-raw-surface/20 p-4"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px rgba(0,0,0,0.3)" }}>
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/30 to-transparent" />
            <p className="mb-3 text-center font-display text-[8px] uppercase tracking-[0.18em] text-raw-gold/65">
              Unlockable Avatars
            </p>
            <div className="grid grid-cols-4 place-items-center justify-items-center gap-x-2 gap-y-2">
              {visibleUnlockableAvatars.slice(0, 4).map(({ avatar, themeIndex }) => (
                <UnlockableAvatarButton key={avatar.id} avatar={avatar} themeIndex={themeIndex} />
              ))}
            </div>
            {hasMoreUnlockableAvatars && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowUnlockableAvatars((open) => !open)}
                  className="group relative flex items-center gap-1.5 rounded-full border border-raw-border/40 bg-raw-black/60 px-3 py-1.5 text-[7px] uppercase tracking-[0.16em] text-raw-silver/50 transition-all duration-300 hover:border-raw-gold/50 hover:text-raw-gold"
                  aria-expanded={showUnlockableAvatars}
                >
                  <span className="relative">{showUnlockableAvatars ? "Less" : "More"}</span>
                  <span className="relative transition-transform duration-300" style={{ transform: showUnlockableAvatars ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                </button>
              </div>
            )}
            {showUnlockableAvatars && visibleUnlockableAvatars.length > 4 && (
              <div className="mt-3 grid grid-cols-4 place-items-center justify-items-center gap-x-2 gap-y-2">
                {visibleUnlockableAvatars.slice(4).map(({ avatar, themeIndex }) => (
                  <UnlockableAvatarButton key={avatar.id} avatar={avatar} themeIndex={themeIndex} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Tablet + Desktop (sm+): phone left + chooser grid right ── */}
      <div className="mx-auto hidden w-full max-w-5xl flex-row items-stretch gap-8 sm:flex lg:gap-10">

        <div className="flex shrink-0 justify-center">
          <PhoneMockup className="w-[260px] lg:w-[310px]" showStatusBar={false}>
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
          <div className="flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={desktopStart}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="grid grid-cols-4 grid-rows-2 place-items-start justify-items-center content-start gap-x-4 gap-y-0"
              >
                {desktopAvatars.map(({ avatar, index }) => (
                  <AvatarButton key={`${desktopStart}-${index}`} index={index} avatar={avatar} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {unlockableAvatars.length > 0 && (
            <div className="mt-8 border-t border-raw-border/25 pt-5">
              <p className="mb-4 text-center font-display text-[10px] uppercase tracking-[0.25em] text-raw-gold/65">
                Unlockable Avatars
              </p>
              <div className="grid grid-cols-4 place-items-start justify-items-center gap-x-4 gap-y-3">
                {visibleUnlockableAvatars.map(({ avatar, themeIndex }) => (
                  <UnlockableAvatarButton key={avatar.id} avatar={avatar} themeIndex={themeIndex} />
                ))}
              </div>
              {hasMoreUnlockableAvatars && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowUnlockableAvatars((open) => !open)}
                    className="group relative flex items-center gap-2 rounded-full border border-raw-border/40 bg-raw-black/60 px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-raw-silver/50 transition-all duration-300 hover:border-raw-gold/50 hover:text-raw-gold"
                    aria-expanded={showUnlockableAvatars}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: "0 0 14px rgba(241,196,45,0.2), inset 0 0 10px rgba(241,196,45,0.05)" }}
                    />
                    <span className="relative">{showUnlockableAvatars ? "Show Less" : "Show More"}</span>
                    <span className="relative transition-transform duration-300" style={{ transform: showUnlockableAvatars ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </button>
                </div>
              )}
            </div>
          )}
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

        <div className="mt-10 border-t border-raw-border/20 pt-10 sm:mt-14 sm:pt-14">
          <WheelRewardInline onSignupClick={onSignupClick} />
        </div>
      </div>
    </LandingSectionShell>
  );
}
