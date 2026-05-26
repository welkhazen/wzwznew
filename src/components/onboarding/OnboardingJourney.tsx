import { BrandName } from "@/components/ui/brand-name";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import isItJustMeVideo from "@/assets/itisjustme.webm";
import speakYourTruthVideo from "@/assets/speakyourheart.webm";
import lntVideo from "@/assets/2026-04-18 10_10_00.webm";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { setAvatarThemes } from "@/lib/avataridentity";
import { AvatarPhoneHomeScreen } from "@/components/ui/avatar-phone-home-screen";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { fetchSupabasePolls } from "@/utils/supabasePolls";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { saveUserAliases } from "@/backend/supabase/controllers/userAliasController";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeablePollCard } from "./SwipeablePollCard";
import { EnterRawModal } from "./EnterRawModal";
import type { OnboardingStep, Poll, User } from "@/store/useRawStore";
import { track } from "@/lib/analytics";

type OnboardingPoll = {
  id: string;
  question: string;
  options: string[];
};

interface OnboardingJourneyProps {
  user: User;
  polls: Poll[];
  avatarIndex: number;
  onAvatarChange: (index: number) => void;
  onboardingStep: OnboardingStep;
  onboardingAnsweredPollIds: Set<string>;
  onSetOnboardingStep: (step: OnboardingStep) => void;
  onMarkPollAnswered: (pollId: string) => void;
  selectedCommunityIds: string[];
  onToggleCommunity: (communityId: string) => void;
  onCompleteOnboarding: () => void;
  onLogout: () => void;
}

const STEP_ORDER: OnboardingStep[] = ["avatar", "identity", "polls", "communities"];
const STEP_LABELS: Record<OnboardingStep, string> = {
  avatar: "avatar",
  identity: "names",
  polls: "polls",
  communities: "communities",
  marketplace: "insights",
  ready: "ready",
};
const FREE_ONBOARDING_AVATAR_COUNT = 8;
const AVATAR_PAGE_SIZE = 10;
const AGE_GATE_STORAGE_PREFIX = "raw.ageGateVerified";

const LANDING_ONBOARDING_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 1, name: "Ember", price: "Free", imageSrc: "/avatars/avatar-2.svg", bg: "#0c1a24", figure: "#5ed6ff", ring: "#5ed6ff", glow: "#5ed6ff80", isActive: true, rarity: "common" },
  { id: "verdant", level: 2, name: "Verdant", price: "Free", imageSrc: "/avatars/avatar-3.svg", bg: "#0a1124", figure: "#3f8bff", ring: "#3f8bff", glow: "#3f8bff80", isActive: true, rarity: "common" },
  { id: "horned", level: 3, name: "Horned", price: "Free", imageSrc: "/avatars/avatar-5.svg", bg: "#0b1a0e", figure: "#16a34a", ring: "#16a34a", glow: "#16a34a80", isActive: true, rarity: "common" },
  { id: "pharaoh", level: 4, name: "Pharaoh", price: "Free", imageSrc: "/avatars/avatar-6.svg", bg: "#1f0d18", figure: "#ec4899", ring: "#ec4899", glow: "#ec489980", isActive: true, rarity: "common" },
  { id: "violet", level: 5, name: "Violet", price: "Free", imageSrc: "/avatars/avatar-7.svg", bg: "#150a22", figure: "#8b5cf6", ring: "#8b5cf6", glow: "#8b5cf680", isActive: true, rarity: "common" },
  { id: "rose", level: 6, name: "Rose", price: "Free", imageSrc: "/avatars/avatar-8.svg", bg: "#1f1208", figure: "#f97316", ring: "#f97316", glow: "#f9731680", isActive: true, rarity: "common" },
  { id: "black", level: 7, name: "Black", price: "Free", imageSrc: "/avatars/avatar-9.svg", bg: "#1f0a0a", figure: "#dc2626", ring: "#dc2626", glow: "#dc262680", isActive: true, rarity: "common" },
  { id: "blue", level: 8, name: "Blue", price: "Free", imageSrc: "/avatars/avatar-10.svg", bg: "#1f1705", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, rarity: "common" },
  { id: "preview-silver-void", level: 9, name: "Silver Void", price: "Preview", imageSrc: "/avatars/1.webp", bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180", isActive: true, rarity: "common" },
  { id: "preview-neon-lynx", level: 10, name: "Neon Lynx", price: "Preview", imageSrc: "/avatars/2.webp", bg: "#170f2e", figure: "#a855f7", ring: "#c084fc", glow: "#a855f780", isActive: true, rarity: "common" },
  { id: "preview-blue-signal", level: 11, name: "Blue Signal", price: "Preview", imageSrc: "/avatars/3.webp", bg: "#06131f", figure: "#22d3ee", ring: "#22d3ee", glow: "#22d3ee80", isActive: true, rarity: "common" },
  { id: "preview-violet-mask", level: 12, name: "Violet Mask", price: "Preview", imageSrc: "/avatars/4.webp", bg: "#1a1028", figure: "#d946ef", ring: "#d946ef", glow: "#d946ef80", isActive: true, rarity: "common" },
  { id: "preview-horned-iron", level: 13, name: "Horned Iron", price: "Preview", imageSrc: "/avatars/5.webp", bg: "#1f0a05", figure: "#fb923c", ring: "#fb923c", glow: "#fb923c80", isActive: true, rarity: "common" },
  { id: "preview-crimson-muse", level: 14, name: "Crimson Muse", price: "Preview", imageSrc: "/avatars/6.webp", bg: "#2a0b0b", figure: "#f97316", ring: "#f97316", glow: "#f9731680", isActive: true, rarity: "common" },
  { id: "preview-solar-flame", level: 15, name: "Solar Flame", price: "Preview", imageSrc: "/avatars/7.webp", bg: "#241005", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, rarity: "common" },
  { id: "preview-pink-circuit", level: 16, name: "Pink Circuit", price: "Preview", imageSrc: "/avatars/8.webp", bg: "#2a0b1c", figure: "#fb7185", ring: "#fb7185", glow: "#fb718580", isActive: true, rarity: "common" },
  { id: "preview-golden-muse", level: 17, name: "Golden Muse", price: "Preview", imageSrc: "/avatars/9.png", bg: "#201604", figure: "#facc15", ring: "#facc15", glow: "#facc1590", isActive: true, rarity: "common" },
];

function fallbackAvatarCatalog(): AvatarCatalogItem[] {
  return LANDING_ONBOARDING_AVATARS.map((avatar) => ({ ...avatar }));
}

function applyAvatarThemes(items: AvatarCatalogItem[]): void {
  setAvatarThemes(items.map((item) => ({
    bg: item.bg,
    figure: item.figure,
    ring: item.ring,
    glow: item.glow,
    name: item.name,
    imageSrc: item.imageSrc,
  })));
}

function getPreviewOnlyAvatarImageScale(avatarId: string): React.CSSProperties | undefined {
  switch (avatarId) {
    case "preview-neon-lynx":
    case "preview-blue-signal":
    case "preview-violet-mask":
    case "preview-horned-iron":
    case "preview-solar-flame":
      return { transform: "scale(1.45)" };
    case "preview-golden-muse":
      return { transform: "scale(1.35)" };
    case "preview-pink-circuit":
      return { transform: "scale(1.08)" };
    default:
      return undefined;
  }
}

const FALLBACK_POLLS: OnboardingPoll[] = [
  {
    id: "core-safety",
    question: "Should all high-impact content claims require visible evidence labels?",
    options: ["Always", "Only on flagged topics"],
  },
  {
    id: "core-moderation",
    question: "What should happen first when harmful content is reported?",
    options: ["Temporary freeze", "Community review"],
  },
  {
    id: "core-identity",
    question: "How should trust be built in anonymous spaces?",
    options: ["Reputation over time", "Verified circles"],
  },
];

const EXTRA_ONBOARDING_POLLS: OnboardingPoll[] = [
  {
    id: "launch-feedback-loop",
    question: "How often should raW ask members for product feedback during launch?",
    options: ["Every week", "Every 2 weeks"],
  },
  {
    id: "launch-community-priority",
    question: "What matters most in your first community?",
    options: ["Serious debate", "Constructive support"],
  },
];

const ONBOARDING_COMMUNITIES = [
  {
    id: "lnt",
    title: "Late Night Talk",
    description: "Honest conversation when the world gets quiet and people finally say what they actually mean.",
    members: "3",
    activeNow: "1 active",
    video: lntVideo,
    image: undefined,
  },
  {
    id: "syt",
    title: "Speak Your Truth",
    description: "A space to say what you've been holding back. No filters, no judgment — just real voices sharing real experiences.",
    members: "3",
    activeNow: "1 active",
    video: speakYourTruthVideo,
    image: undefined,
  },
  {
    id: "iijm",
    title: "Is It Just Me?",
    description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
    members: "3",
    activeNow: "1 active",
    video: isItJustMeVideo,
    image: undefined,
  },
  {
    id: "li",
    title: "Lebanon Initiatives",
    description: "A space for Lebanese change-makers, community builders, and people driving impact inside Lebanon and across the diaspora.",
    members: "0",
    activeNow: "Early Access",
    locked: true,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80",
  },
];

function toOnboardingPolls(polls: Poll[]): OnboardingPoll[] {
  const core = polls.slice(0, 3).map((poll) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.slice(0, 2).map((option) => option.text),
  }));

  const neededFallback = Math.max(0, 3 - core.length);
  const fallback = FALLBACK_POLLS.slice(0, neededFallback).map((poll) => ({
    ...poll,
    options: poll.options.slice(0, 2),
  }));

  return [...core, ...fallback];
}

function getNextStep(step: OnboardingStep): OnboardingStep {
  const currentIndex = STEP_ORDER.indexOf(step);
  if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
    return "ready";
  }

  return STEP_ORDER[currentIndex + 1];
}

function StepPill({ label, active, complete }: { label: string; active: boolean; complete: boolean }) {
  return (
    <div
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-all ${
        active
          ? "border-raw-gold/60 bg-raw-gold/15 text-raw-gold"
          : complete
            ? "border-raw-gold/30 bg-raw-gold/5 text-raw-gold/70"
            : "border-raw-border/40 bg-raw-surface/20 text-raw-silver/35"
      }`}
    >
      {label}
    </div>
  );
}

export function OnboardingJourney({
  user,
  polls,
  avatarIndex,
  onAvatarChange,
  onboardingStep,
  onboardingAnsweredPollIds,
  onSetOnboardingStep,
  onMarkPollAnswered,
  selectedCommunityIds,
  onToggleCommunity,
  onCompleteOnboarding,
  onLogout,
}: OnboardingJourneyProps) {
  const { data: supabasePolls } = useQuery({
    queryKey: ["onboarding-landing-polls"],
    queryFn: async () => {
      const fetched = await fetchSupabasePolls(5);
      if (fetched.length === 0) return null;
      return fetched.map((poll) => ({
        id: poll.id,
        question: poll.question,
        options: poll.options.slice(0, 2).map((opt) => opt.text),
      })) as OnboardingPoll[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const onboardingPolls = useMemo(() => {
    if (supabasePolls && supabasePolls.length > 0) return supabasePolls;
    return toOnboardingPolls(polls);
  }, [supabasePolls, polls]);
  const [pollSelections, setPollSelections] = useState<Record<string, string>>({});
  const [pollStats, setPollStats] = useState<Record<string, Record<string, number>>>({});
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [enterRawOpen, setEnterRawOpen] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [isAgeVerifiedLoaded, setIsAgeVerifiedLoaded] = useState(false);
  const [identityNames, setIdentityNames] = useState<string[]>(() => [user.username, "", ""]);
  const [publicIdentityIndex, setPublicIdentityIndex] = useState(0);
  const [identitySaveError, setIdentitySaveError] = useState<string | null>(null);
  const [isSavingIdentities, setIsSavingIdentities] = useState(false);
  const [onboardingAvatars] = useState<AvatarCatalogItem[]>(() => fallbackAvatarCatalog());
  const [isLoadingPreviewAvatars] = useState(false);
  const [previewAvatarIndex, setPreviewAvatarIndex] = useState(() => Math.min(Math.max(avatarIndex, 1), Math.max(1, onboardingAvatars.length)));
  const [avatarPage, setAvatarPage] = useState(() => Math.floor((Math.min(Math.max(avatarIndex, 1), Math.max(1, onboardingAvatars.length)) - 1) / AVATAR_PAGE_SIZE));
  const answeredCount = onboardingPolls.filter((poll) => onboardingAnsweredPollIds.has(poll.id)).length;
  const phonePreviewRef = useRef<HTMLDivElement>(null);
  const startedFiredRef = useRef(false);
  const stepStartTimeRef = useRef(Date.now());
  const currentPoll = onboardingPolls[currentPollIndex];
  const currentPollSelected = currentPoll ? pollSelections[currentPoll.id] : undefined;
  const currentPollAnswered = currentPoll ? onboardingAnsweredPollIds.has(currentPoll.id) : false;
  const currentPollStats = currentPoll ? (pollStats[currentPoll.id] || {}) : {};

  useEffect(() => {
    if (!startedFiredRef.current) {
      startedFiredRef.current = true;
      track("onboarding_started", {});
    }
  }, []);

  useEffect(() => {
    setIdentityNames([user.username, "", ""]);
    setPublicIdentityIndex(0);
    setIdentitySaveError(null);
  }, [user.id, user.username]);

  useEffect(() => {
    const stepIndex = STEP_ORDER.indexOf(onboardingStep);
    track("onboarding_step_viewed", { step: onboardingStep as "avatar" | "identity" | "polls" | "communities" | "ready", step_index: stepIndex });
    stepStartTimeRef.current = Date.now();
  }, [onboardingStep]);

  const canContinueFromAvatar = avatarIndex >= 1 && avatarIndex <= FREE_ONBOARDING_AVATAR_COUNT;
  const filledIdentityNames = identityNames.map((name) => name.trim()).filter(Boolean);
  const identityNamesAreValid = filledIdentityNames.every((name) => name.length >= 3 && name.length <= 32);
  const canContinueFromIdentity = filledIdentityNames.length >= 1 && identityNamesAreValid && !!identityNames[publicIdentityIndex]?.trim();
  const canContinueFromPolls = answeredCount >= onboardingPolls.length;
  const canContinueFromCommunities = selectedCommunityIds.length >= 1;
  const previewAvatar = onboardingAvatars[previewAvatarIndex - 1] ?? onboardingAvatars[0];
  const canContinueWithPreviewAvatar = canContinueFromAvatar && previewAvatarIndex === avatarIndex;
  const freeAvatarChoices = onboardingAvatars.slice(0, FREE_ONBOARDING_AVATAR_COUNT);
  const previewAvatarChoices = onboardingAvatars.slice(FREE_ONBOARDING_AVATAR_COUNT);
  const previewAvatarPageCount = Math.max(1, Math.ceil(previewAvatarChoices.length / AVATAR_PAGE_SIZE));
  const visiblePreviewAvatarChoices = previewAvatarChoices.slice(avatarPage * AVATAR_PAGE_SIZE, (avatarPage + 1) * AVATAR_PAGE_SIZE);


  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAgeVerified(window.localStorage.getItem(`${AGE_GATE_STORAGE_PREFIX}.${user.id}`) === "1");
    setIsAgeVerifiedLoaded(true);
  }, [user.id]);

  const confirmAgeVerified = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${AGE_GATE_STORAGE_PREFIX}.${user.id}`, "1");
    }
    setIsAgeVerified(true);
  };

  useEffect(() => {
    applyAvatarThemes(onboardingAvatars);
  }, [onboardingAvatars]);

  useEffect(() => {
    setAvatarPage((page) => Math.min(page, previewAvatarPageCount - 1));
    setPreviewAvatarIndex((index) => Math.min(Math.max(index, 1), Math.max(1, onboardingAvatars.length)));
  }, [onboardingAvatars.length, previewAvatarPageCount]);

  useEffect(() => {
    if (avatarIndex >= 1 && avatarIndex <= FREE_ONBOARDING_AVATAR_COUNT) {
      setPreviewAvatarIndex(avatarIndex);
      // Do NOT reset avatarPage here — user may be browsing preview page 5+
    }
  }, [avatarIndex]);

  // Initialize poll stats with mock data
  useEffect(() => {
    const stats: Record<string, Record<string, number>> = {};
    onboardingPolls.forEach((poll) => {
      stats[poll.id] = {};
      poll.options.forEach((option) => {
        stats[poll.id][option] = Math.floor(Math.random() * 1000) + 50;
      });
    });
    setPollStats(stats);
  }, [onboardingPolls]);

  const saveIdentityNamesForOnboarding = async () => {
    setIdentitySaveError(null);
    setIsSavingIdentities(true);

    try {
      const uniqueNames = new Set<string>();
      const usedAvatarLevels = new Set<number>();
      const aliases = identityNames
        .map((name, index) => {
          const preferredLevel = index === 0 ? avatarIndex : Math.min(FREE_ONBOARDING_AVATAR_COUNT, index + 1);
          const avatarLevel = usedAvatarLevels.has(preferredLevel)
            ? Array.from({ length: FREE_ONBOARDING_AVATAR_COUNT }, (_, levelIndex) => levelIndex + 1).find((level) => !usedAvatarLevels.has(level)) ?? preferredLevel
            : preferredLevel;
          usedAvatarLevels.add(avatarLevel);
          return {
            alias: name.trim(),
            avatarLevel,
            isPublic: index === publicIdentityIndex,
          };
        })
        .filter((item) => item.alias.length > 0)
        .filter((item) => {
          const key = item.alias.toLowerCase();
          if (uniqueNames.has(key)) return false;
          uniqueNames.add(key);
          return true;
        });

      await saveUserAliases(user.id, aliases);
      return true;
    } catch (error) {
      setIdentitySaveError(error instanceof Error ? error.message : "Could not save your names. Please try again.");
      return false;
    } finally {
      setIsSavingIdentities(false);
    }
  };

  const goToNextStep = async () => {
    if (onboardingStep === "identity") {
      const saved = await saveIdentityNamesForOnboarding();
      if (!saved) return;
    }

    track("onboarding_step_completed", {
      step: onboardingStep as "avatar" | "identity" | "polls" | "communities" | "ready",
      duration_ms: Date.now() - stepStartTimeRef.current,
    });
    onSetOnboardingStep(getNextStep(onboardingStep));
  };

  const currentStepIndex = STEP_ORDER.indexOf(onboardingStep);

  if (isAgeVerifiedLoaded && !isAgeVerified) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-raw-black">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-8 text-center">
          <div className="w-full rounded-2xl border border-raw-border/40 bg-raw-black/55 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-raw-gold/70">Age confirmation</p>
            <h2 className="mt-3 font-display text-xl tracking-wide text-raw-text sm:text-2xl">Are you over 18?</h2>
            <p className="mt-3 text-sm text-raw-silver/60">You need to confirm this before continuing to raW.</p>

            <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={confirmAgeVerified}
                className="rounded-xl bg-raw-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-raw-ink transition hover:opacity-90"
              >
                Yes, I am 18+
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-raw-border/45 bg-raw-surface/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-raw-silver/70 transition hover:border-raw-gold/35 hover:text-raw-text"
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-raw-black">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-8 md:py-10">
        <div className="mb-5 sm:mb-8">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-[10px] uppercase tracking-[0.3em] text-raw-gold/60 sm:text-xs sm:tracking-[0.35em]">Welcome to <BrandName /></p>
            <button
              onClick={onLogout}
              className="shrink-0 rounded-xl border border-raw-border/50 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-raw-silver/55 transition-colors hover:border-raw-border hover:text-raw-silver sm:px-3"
            >
              Log out
            </button>
          </div>
          <h1 className="mt-2 font-display text-xl tracking-wide text-raw-text sm:mt-3 sm:text-3xl">
            Complete your identity path, {user.username}
          </h1>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-6 sm:gap-2">
          {STEP_ORDER.map((step, index) => (
            <StepPill
              key={step}
              label={STEP_LABELS[step]}
              active={step === onboardingStep}
              complete={index < currentStepIndex}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/40 to-raw-black/90 p-3 sm:rounded-3xl sm:p-6 md:p-8">
          {onboardingStep === "avatar" && (
            <section>
              <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">1. Choose your avatar</h2>
              <p className="mt-2 text-xs text-raw-silver/45 sm:text-sm">
                Your avatar is your public signal. You can evolve it later, but choose your starting form now.
              </p>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_8.75rem] gap-3 sm:gap-6 md:mt-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-center md:gap-8">
                <div className="flex min-w-0 flex-col gap-5">
                  <div className="min-w-0">
                    <p className="mb-3 text-center font-display text-[9px] uppercase tracking-[0.2em] text-raw-gold/70">
                      Free avatars
                    </p>
                    <div className="mx-auto grid w-full max-w-[11rem] grid-cols-2 gap-x-1 gap-y-2 min-[390px]:max-w-[12rem] min-[390px]:gap-x-2 sm:max-w-[24rem] sm:grid-cols-4 sm:gap-x-3 sm:gap-y-4 md:mx-0">
                    {freeAvatarChoices.map((avatar, i) => {
                      const index = i + 1;
                      const isFree = true;
                      const isActive = index === avatarIndex && isFree;
                      const isPreviewed = index === previewAvatarIndex;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setPreviewAvatarIndex(index);
                            phonePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            if (isFree) {
                              track("onboarding_avatar_selected", { avatar_level: index, attempts: 1 });
                              onAvatarChange(index);
                            } else {
                              track("onboarding_avatar_selected", { avatar_level: index, attempts: 1 });
                            }
                          }}
                          className="group relative flex min-w-0 flex-col items-center gap-0.5 rounded-xl p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50 sm:gap-1 sm:p-1.5"
                          aria-label={`Select ${avatar.name}`}
                          aria-pressed={isActive}
                        >
                          <div className={`relative rounded-full transition-all duration-300 ${
                            isActive
                              ? "scale-105"
                              : isPreviewed
                                ? "scale-100 opacity-100"
                                : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                          }`}>
                            <AvatarFigure avatarIndex={index} size="sm" selected={isActive || isPreviewed} className="sm:hidden" rarity={avatar.rarity} themeOverride={avatar} />
                            <AvatarFigure avatarIndex={index} size="md" selected={isActive || isPreviewed} className="hidden sm:block" rarity={avatar.rarity} themeOverride={avatar} />
                          </div>
                          <span className={`max-w-full truncate text-center font-display text-[7px] leading-tight tracking-[0.08em] transition-colors sm:text-[8px] ${
                            isActive
                              ? "text-raw-text"
                              : isPreviewed
                                ? "text-raw-gold/80"
                                : "text-raw-silver/45 group-hover:text-raw-silver/80"
                          }`}>
                            {avatar.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col items-center justify-start md:justify-center">
                  <div className="h-[322px] w-[140px] overflow-visible min-[390px]:h-[360px] min-[390px]:w-[157px] md:hidden">
                    <div
                      style={{
                        width: 280,
                        transform: "scale(0.5)",
                        transformOrigin: "top left",
                      }}
                      className="min-[390px]:[transform:scale(0.56)!important]"
                    >
                      <PhoneMockup className="w-[280px]" showStatusBar={false}>
                        <AvatarPhoneHomeScreen avatarIndex={previewAvatarIndex} compact previewAvatar={previewAvatar} />
                      </PhoneMockup>
                    </div>
                  </div>
                  <div className="hidden w-full max-w-[290px] md:block">
                    <PhoneMockup className="w-full" showStatusBar={false}>
                      <AvatarPhoneHomeScreen avatarIndex={previewAvatarIndex} compact={false} previewAvatar={previewAvatar} />
                    </PhoneMockup>
                  </div>
                  <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-raw-silver/40">
                    {previewAvatarChoices.length === 0 || previewAvatarIndex <= FREE_ONBOARDING_AVATAR_COUNT ? "Pick this starter" : "Preview only"}
                  </p>
                </div>

                {previewAvatarChoices.length > 0 ? (
                    <div className="col-span-2 md:col-span-1">
                      <div className="mx-auto mb-3 flex w-full max-w-[15rem] items-center justify-between gap-3 min-[420px]:max-w-[22rem] sm:max-w-[30rem] md:mx-0">
                        <button
                          type="button"
                          onClick={() => setAvatarPage((page) => Math.max(0, page - 1))}
                          disabled={avatarPage === 0}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-border/45 bg-raw-black/70 text-raw-gold transition hover:border-raw-gold/45 disabled:cursor-not-allowed disabled:opacity-25 sm:h-10 sm:w-10"
                          aria-label="Previous preview avatars"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="text-center">
                          <p className="font-display text-[9px] uppercase tracking-[0.2em] text-raw-gold/70">
                            Preview only
                          </p>
                          <p className="mt-1 text-[10px] text-raw-silver/40">
                            Page {avatarPage + 1} / {previewAvatarPageCount}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAvatarPage((page) => Math.min(previewAvatarPageCount - 1, page + 1))}
                          disabled={avatarPage >= previewAvatarPageCount - 1}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-border/45 bg-raw-black/70 text-raw-gold transition hover:border-raw-gold/45 disabled:cursor-not-allowed disabled:opacity-25 sm:h-10 sm:w-10"
                          aria-label="Next preview avatars"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="mx-auto grid w-full max-w-[24rem] grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-3 sm:gap-y-4 md:mx-0">
                      {isLoadingPreviewAvatars && visiblePreviewAvatarChoices.length === 0
                        ? Array.from({ length: AVATAR_PAGE_SIZE }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 p-1.5">
                              <div className="h-9 w-9 animate-pulse rounded-full bg-raw-surface/40 sm:h-12 sm:w-12" />
                              <div className="h-1.5 w-8 animate-pulse rounded bg-raw-surface/30" />
                            </div>
                          ))
                        : null}
                      {visiblePreviewAvatarChoices.map((avatar, i) => {
                        const index = FREE_ONBOARDING_AVATAR_COUNT + avatarPage * AVATAR_PAGE_SIZE + i + 1;
                        const isPreviewed = index === previewAvatarIndex;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setPreviewAvatarIndex(index);
                              phonePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              track("onboarding_avatar_selected", { avatar_level: index, attempts: 1 });
                            }}
                            className="group relative flex min-w-0 flex-col items-center gap-1 rounded-xl p-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
                            aria-label={`Preview ${avatar.name}, locked until later`}
                          >
                            <div className={`relative rounded-full transition-all duration-300 ${
                              isPreviewed ? "scale-100 opacity-100" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                            }`}>
                              <AvatarFigure
                                avatarIndex={index}
                                size="sm"
                                selected={isPreviewed}
                                className="sm:hidden"
                                rarity={avatar.rarity}
                                style={getPreviewOnlyAvatarImageScale(avatar.id)}
                                themeOverride={avatar}
                              />
                              <AvatarFigure
                                avatarIndex={index}
                                size="md"
                                selected={isPreviewed}
                                className="hidden sm:block"
                                rarity={avatar.rarity}
                                style={getPreviewOnlyAvatarImageScale(avatar.id)}
                                themeOverride={avatar}
                              />
                            </div>
                            <span className={`max-w-full truncate text-center font-display text-[7px] leading-tight tracking-[0.08em] transition-colors sm:text-[8px] ${
                              isPreviewed ? "text-raw-gold/80" : "text-raw-silver/45 group-hover:text-raw-silver/80"
                            }`}>
                              {avatar.name.split(" ")[0]}
                            </span>
                            <span className="rounded-full border border-raw-border/35 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.08em] text-raw-silver/35">
                              locked
                            </span>
                          </button>
                        );
                      })}
                      </div>
                    </div>
                  ) : null}
              </div>

              <div className="mt-6 flex justify-end sm:mt-8">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueWithPreviewAvatar}
                  className="w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  Next: Names
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "identity" && (
            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">2. Create your names</h2>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-raw-silver/50 sm:text-sm">
                    Your public name is what communities see. Private names stay saved to your account so later you can switch which identity is public without changing who owns the account.
                  </p>
                </div>
                <span className="w-fit rounded-full border border-raw-gold/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-raw-gold/75">
                  1 public
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {identityNames.map((name, index) => {
                  const isPublic = index === publicIdentityIndex;

                  return (
                    <div
                      key={index}
                      className={`rounded-2xl border p-3 transition sm:p-4 ${
                        isPublic
                          ? "border-raw-gold/65 bg-raw-gold/10"
                          : "border-raw-border/35 bg-raw-black/35"
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="min-w-0 flex-1">
                          <span className="mb-1 block text-[10px] uppercase tracking-[0.16em] text-raw-silver/45">
                            {index === 0 ? "Default account name" : `Private name ${index}`}
                          </span>
                          <input
                            value={name}
                            onChange={(event) => {
                              const next = [...identityNames];
                              next[index] = event.target.value;
                              setIdentityNames(next);
                            }}
                            maxLength={32}
                            placeholder={index === 0 ? user.username : "Create another name"}
                            className="w-full rounded-xl border border-raw-border/45 bg-raw-black/60 px-3 py-2 text-sm text-raw-text outline-none transition placeholder:text-raw-silver/25 focus:border-raw-gold/60"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            if (!identityNames[index]?.trim()) return;
                            setPublicIdentityIndex(index);
                          }}
                          disabled={!identityNames[index]?.trim()}
                          className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-35 ${
                            isPublic
                              ? "border-raw-gold bg-raw-gold text-raw-ink"
                              : "border-raw-border/45 text-raw-silver/60 hover:border-raw-gold/45 hover:text-raw-gold"
                          }`}
                        >
                          {isPublic ? "Public" : "Make public"}
                        </button>
                      </div>

                      <p className="mt-2 text-[11px] text-raw-silver/40">
                        {isPublic ? "This name is visible in public spaces." : "This name stays private until you choose to make it public."}
                      </p>
                    </div>
                  );
                })}
              </div>

              {identitySaveError ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {identitySaveError}
                </p>
              ) : null}
              {!identityNamesAreValid ? (
                <p className="mt-4 rounded-xl border border-raw-border/35 bg-raw-black/35 px-3 py-2 text-xs text-raw-silver/55">
                  Each saved name needs 3-32 characters.
                </p>
              ) : null}

              <div className="mt-6 flex justify-end sm:mt-8">
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!canContinueFromIdentity || isSavingIdentities}
                  className="w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  {isSavingIdentities ? "Saving..." : "Save names"}
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "polls" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base tracking-wide text-raw-text sm:text-xl">3. Answer 3 launch polls</h2>
                </div>
                <p className="shrink-0 rounded-full border border-raw-border/40 px-2.5 py-1 text-[10px] text-raw-gold/75 sm:px-3 sm:text-xs">
                  {answeredCount}/{onboardingPolls.length} completed
                </p>
              </div>

              <div className="mt-3 flex flex-col items-center sm:mt-6">
                {onboardingPolls.length > 0 && currentPoll && (
                  <div className="w-full max-w-[330px]">
                    {/* Progress dashes */}
                    <div className="mb-4 flex flex-col items-center">
                      <div className="flex items-center gap-3">
                        <span className="h-px w-7 bg-white/35" />
                        <p className="text-[12px] font-medium tracking-[0.42em] text-white/85">
                          {currentPollIndex + 1} / {onboardingPolls.length}
                        </p>
                        <span className="h-px w-7 bg-white/35" />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        {onboardingPolls.map((_, i) => (
                          <span
                            key={i}
                            className={`h-[3px] transition-all ${i === currentPollIndex ? "w-9" : "w-6 bg-white/20"}`}
                            style={i === currentPollIndex ? { background: "rgb(var(--raw-accent))", boxShadow: "0 0 8px rgb(var(--raw-accent) / 0.7)" } : undefined}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Card with side arrows */}
                    <div className="relative flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setCurrentPollIndex((i) => Math.max(0, i - 1))}
                        disabled={currentPollIndex === 0}
                        aria-label="Previous poll"
                        className="absolute left-0 z-10 flex h-11 w-11 -translate-x-3 items-center justify-center rounded-full border border-raw-gold/55 bg-black/75 text-raw-gold transition hover:bg-raw-gold/10 disabled:cursor-not-allowed disabled:opacity-25 sm:-translate-x-7"
                        style={{ boxShadow: "0 0 18px rgb(var(--raw-accent) / 0.25)" }}
                      >
                        <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
                      </button>

                      <div className="w-full">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentPoll.id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{ duration: 0.18 }}
                          >
                            <SwipeablePollCard
                              id={currentPoll.id}
                              question={currentPoll.question}
                              options={currentPoll.options}
                              selectedOption={currentPollSelected}
                              isAnswered={currentPollAnswered}
                              responseStats={currentPollStats}
                              pollIndex={currentPollIndex}
                              totalPolls={onboardingPolls.length}
                              hideInternalNav
                              noOuterGlow
                              hideButtonGlow
                              onSwipe={(option) => {
                                track("onboarding_poll_answered", { poll_id: currentPoll.id, option_id: option, step_index: currentPollIndex });
                                setPollSelections((prev) => ({ ...prev, [currentPoll.id]: option }));
                                onMarkPollAnswered(currentPoll.id);
                              }}
                              onNavigate={(direction) => {
                                if (direction === "left") {
                                  setCurrentPollIndex((prev) => Math.max(0, prev - 1));
                                } else {
                                  setCurrentPollIndex((prev) => Math.min(onboardingPolls.length - 1, prev + 1));
                                }
                              }}
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (currentPollIndex < onboardingPolls.length - 1) {
                            setCurrentPollIndex((i) => i + 1);
                            return;
                          }
                          void goToNextStep();
                        }}
                        disabled={currentPollIndex === onboardingPolls.length - 1 && !canContinueFromPolls}
                        aria-label={currentPollIndex < onboardingPolls.length - 1 ? "Next poll" : "Complete polls"}
                        className={`absolute right-0 z-10 flex h-11 w-11 translate-x-3 items-center justify-center rounded-full border text-raw-gold transition sm:translate-x-7 ${
                          currentPollIndex < onboardingPolls.length - 1
                            ? "border-raw-gold/55 bg-black/75 hover:bg-raw-gold/10 disabled:cursor-not-allowed disabled:opacity-25"
                            : "border-raw-gold/70 bg-raw-gold/15 hover:bg-raw-gold/25 disabled:cursor-not-allowed disabled:opacity-35"
                        }`}
                        style={{ boxShadow: currentPollIndex < onboardingPolls.length - 1 ? "0 0 18px rgb(var(--raw-accent) / 0.25)" : "none" }}
                      >
                        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end sm:mt-6">
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromPolls}
                  className="w-full rounded-xl border border-raw-gold/40 bg-raw-gold/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-raw-gold transition-all hover:bg-raw-gold/25 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  Continue to communities →
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "communities" && (
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">4. Pick a community</h2>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedCommunityIds.length >= 1
                    ? "border-raw-gold/60 bg-raw-gold/10 text-raw-gold"
                    : "border-raw-border/40 text-raw-gold/75"
                }`}>
                  {selectedCommunityIds.length}/1
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {ONBOARDING_COMMUNITIES.map((community) => {
                  const isSelected = selectedCommunityIds.includes(community.id);
                  const isLocked = community.locked === true;

                  return (
                    <button
                      key={community.id}
                      onClick={() => {
                        if (isLocked) return;
                        if (!isSelected && selectedCommunityIds.length >= 1) {
                          onToggleCommunity(selectedCommunityIds[0]);
                        }
                        if (!isSelected) {
                          track("onboarding_community_selected", {
                            community_id: community.id,
                            selected_count: 1,
                          });
                        }
                        onToggleCommunity(community.id);
                      }}
                      disabled={isLocked}
                      className={`group relative overflow-hidden rounded-2xl border bg-transparent text-left transition-all duration-300 disabled:cursor-not-allowed ${
                        isSelected
                          ? "border-raw-gold/70 shadow-[0_0_0_1px_rgba(241,196,45,0.25),0_12px_28px_rgba(241,196,45,0.15)]"
                          : isLocked
                            ? "border-raw-border/25 opacity-60"
                            : "border-raw-border/35 hover:border-raw-gold/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      {/* Media */}
                      <div className="relative h-32 overflow-hidden sm:h-36">
                        {community.video ? (
                          <video
                            src={community.video}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        ) : (
                          <img
                            src={community.image}
                            alt={community.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-raw-gold shadow-lg">
                            <span className="text-[11px] font-bold text-black">✓</span>
                          </div>
                        )}

                        {isLocked && (
                          <div className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/65 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/70">
                            Locked
                          </div>
                        )}

                        {/* Active badge */}
                        <div className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 backdrop-blur-sm">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-white/70">
                            <span className="mr-1 text-raw-gold">●</span>
                            {community.activeNow}
                          </p>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 transition-colors sm:p-4">
                        <p className="font-display text-[13px] leading-tight text-raw-text sm:text-base">{community.title}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-raw-silver/50 sm:text-xs">{community.description}</p>

                        <div className="mt-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
                              isSelected
                                ? "border-raw-gold/80 bg-raw-gold/15 text-raw-gold"
                                : "border-raw-border/50 text-raw-gold/85 group-hover:border-raw-gold/45"
                            }`}
                          >
                            {isSelected ? "✓ Selected" : "Enter Circle"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end sm:mt-8">
                <button
                  onClick={() => {
                    track("onboarding_completed", {
                      total_duration_ms: Date.now() - stepStartTimeRef.current,
                      polls_answered: answeredCount,
                      communities_selected: selectedCommunityIds.length,
                      source: "complete_onboarding_button",
                    });
                    setEnterRawOpen(true);
                  }}
                  disabled={!canContinueFromCommunities}
                  className="w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                >
                  Complete onboarding
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <EnterRawModal
        open={enterRawOpen}
        onEnter={() => {
          track("onboarding_completed", {
            total_duration_ms: Date.now() - stepStartTimeRef.current,
            polls_answered: answeredCount,
            communities_selected: selectedCommunityIds.length,
            source: "enter_raw_modal",
          });
          setEnterRawOpen(false);
          onCompleteOnboarding();
        }}
        onDismiss={() => {
          setEnterRawOpen(false);
        }}
      />
    </div>
  );
}
