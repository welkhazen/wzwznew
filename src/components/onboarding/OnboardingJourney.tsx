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
import { fetchPolls } from "@/lib/api/polls";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { LANDING_WHEEL_SPIN_KEY } from "@/lib/avatarCatalog";
import { avatarDisplayName } from "@/config/avatarNames";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { SpinWheelClaimBanner } from "@/components/wheel/SpinWheelClaimBanner";

import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SwipeablePollCard } from "./SwipeablePollCard";
import { EnterRawModal } from "./EnterRawModal";
import type { OnboardingStep, Poll, User } from "@/store/useRawStore";
import { track } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { isValidUsername, sanitizeUsernameInput } from "@/lib/inputSecurity";
import { getAvatarRank, hasAvatarRank, imageIdFromCatalogId } from "@/lib/avatarRank";

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
  ownedAvatarLevels: Set<number>;
  ownedAvatarIds: Set<string>;
  avatarCatalog: AvatarCatalogItem[];
  onboardingStep: OnboardingStep;
  onboardingAnsweredPollIds: Set<string>;
  publicUsername: string;
  privateUsername: string;
  onSaveUsernames: (publicUsername: string, privateUsername: string) => void | Promise<void>;
  onSetOnboardingStep: (step: OnboardingStep) => void;
  onMarkPollAnswered: (pollId: string) => void;
  selectedCommunityIds: string[];
  onToggleCommunity: (communityId: string) => void;
  profilePublic?: boolean | null;
  onSetProfilePublic?: (value: boolean) => void;
  onCompleteOnboarding: () => void | Promise<void>;
  onLogout: () => void;
  onClaimLandingWheelAvatar: () => Promise<void>;
  markAvatarOwnedById: (avatarId: string) => void;
}

type WheelPoolEntry = { id: string; avatarId: string; name: string; imageSrc: string };

// Ordered spin pool sourced from the shared config.
import { SPIN_POOL, EARLY_SIGNUP_POOL } from "@/backend/supabase/controllers/avatarRewardsController";

const SPIN_WHEEL_POOL: readonly WheelPoolEntry[] = SPIN_POOL.map((entry, i) => ({
  id: `wheel-avatar-${i + 1}`,
  avatarId: entry.catalogId,
  name: avatarDisplayName(entry.imageId),
  imageSrc: entry.imageSrc,
}));

const WHEEL_AVATAR_SEGMENT_COLORS: Array<{ segment: string; text: string }> = [
  { segment: "#101520", text: "#cbd5e1" },
  { segment: "#071527", text: "#60a5fa" },
  { segment: "#160926", text: "#c084fc" },
  { segment: "#261208", text: "#fb923c" },
  { segment: "#260812", text: "#f87171" },
  { segment: "#250814", text: "#f472b6" },
  { segment: "#1f1604", text: "#F1C42D" },
  { segment: "#101820", text: "#93c5fd" },
  { segment: "#0c0c10", text: "#f1f5f9" },
  { segment: "#0b0f1f", text: "#a78bfa" },
];

function buildSpinPrizes(): WheelPrize[] {
  return SPIN_WHEEL_POOL.map((entry, index) => {
    const theme = WHEEL_AVATAR_SEGMENT_COLORS[index % WHEEL_AVATAR_SEGMENT_COLORS.length];
    return {
      id: entry.id,
      label: entry.name,
      shortLabel: entry.name,
      color: theme.segment,
      textColor: theme.text,
      imageSrc: entry.imageSrc,
    };
  });
}

function readStoredSpinResult(): WheelPoolEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prizeId?: unknown; avatarId?: unknown };
    if (typeof parsed.prizeId === "string") {
      const byPrize = SPIN_WHEEL_POOL.find((entry) => entry.id === parsed.prizeId);
      if (byPrize) return byPrize;
    }
    if (typeof parsed.avatarId === "string") {
      return SPIN_WHEEL_POOL.find((entry) => entry.avatarId === parsed.avatarId) ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function findOwnedSpinResult(ownedAvatarIds: Set<string>): WheelPoolEntry | null {
  for (const entry of SPIN_WHEEL_POOL) {
    if (ownedAvatarIds.has(entry.avatarId)) {
      return entry;
    }
  }

  return null;
}

const STEP_ORDER: OnboardingStep[] = ["spin", "username", "voucher", "avatar", "polls", "communities"];
const STEP_LABELS: Record<OnboardingStep, string> = {
  spin: "spin",
  username: "username",
  voucher: "voucher",
  "early-signup-reward": "reward",
  avatar: "avatar",
  polls: "polls",
  profile: "profile",
  communities: "communities",
  marketplace: "insights",
  ready: "ready",
};
const FREE_ONBOARDING_AVATAR_COUNT = 8;
const AVATAR_PAGE_SIZE = 8;
const AGE_GATE_STORAGE_PREFIX = "raw.ageGateVerified";
const ONBOARDING_VOUCHER_STORAGE_PREFIX = "raw.onboarding.voucher";

const LANDING_ONBOARDING_AVATARS: readonly AvatarCatalogItem[] = [
  { id: "ember", level: 1, name: "Ember", price: "Free", imageSrc: "/avatars/avatar-3.svg", bg: "#1f0a05", figure: "#ff8a1f", ring: "#ff8a1f", glow: "#ff8a1f80", isActive: true, rarity: "common" },
  { id: "verdant", level: 2, name: "Verdant", price: "Free", imageSrc: "/avatars/avatar-1.svg", bg: "#08160b", figure: "#22c55e", ring: "#22c55e", glow: "#22c55e80", isActive: true, rarity: "common" },
  { id: "horned", level: 3, name: "Horned", price: "Free", imageSrc: "/avatars/avatar-5.svg", bg: "#1f0808", figure: "#ff2d3d", ring: "#ff2d3d", glow: "#ff2d3d80", isActive: true, rarity: "common" },
  { id: "pharaoh", level: 4, name: "Pharaoh", price: "Free", imageSrc: "/avatars/avatar-6.svg", bg: "#1f1605", figure: "#f2d21a", ring: "#f2d21a", glow: "#f2d21a80", isActive: true, rarity: "common" },
  { id: "violet", level: 5, name: "Violet", price: "Free", imageSrc: "/avatars/avatar-2.svg", bg: "#150a22", figure: "#b84dff", ring: "#b84dff", glow: "#b84dff80", isActive: true, rarity: "common" },
  { id: "rose", level: 6, name: "Rose", price: "Free", imageSrc: "/avatars/avatar-4.svg", bg: "#1f0a14", figure: "#f43f5e", ring: "#f43f5e", glow: "#f43f5e80", isActive: true, rarity: "common" },
  { id: "black", level: 7, name: "Black", price: "Free", imageSrc: "/avatars/avatar-7.svg", bg: "#0a0a0a", figure: "#cfd3da", ring: "#cfd3da", glow: "#cfd3da80", isActive: true, rarity: "common" },
  { id: "blue", level: 8, name: "Blue", price: "Free", imageSrc: "/avatars/avatar-10.svg", bg: "#0a1424", figure: "#3b82f6", ring: "#3b82f6", glow: "#3b82f680", isActive: true, rarity: "common" },
  // Preview-only tier: 8 free-spin avatars + 4 early-signup avatars,
  // sourced from the shared config so order matches landing + wheel.
  ...SPIN_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `preview-spin-${i + 1}`,
    level: FREE_ONBOARDING_AVATAR_COUNT + 1 + i,
    name: avatarDisplayName(entry.imageId),
    price: "50",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
  ...EARLY_SIGNUP_POOL.map((entry, i): AvatarCatalogItem => ({
    id: `preview-signup-${i + 1}`,
    level: FREE_ONBOARDING_AVATAR_COUNT + 1 + SPIN_POOL.length + i,
    name: avatarDisplayName(entry.imageId),
    price: "50",
    imageSrc: entry.imageSrc,
    bg: "#111827", figure: "#cbd5e1", ring: "#cbd5e1", glow: "#cbd5e180",
    isActive: true, rarity: "common",
  })),
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
  // Uniform sizing for all preview-only avatars so none look smaller than others.
  if (avatarId.startsWith("preview-")) {
    return { transform: "scale(1.45)" };
  }
  return undefined;
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
  const core = polls.slice(0, 4).map((poll) => ({
    id: poll.id,
    question: poll.question,
    options: poll.options.slice(0, 2).map((option) => option.text),
  }));

  const neededFallback = Math.max(0, 4 - core.length);
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

function getPreviousStep(step: OnboardingStep): OnboardingStep | null {
  const currentIndex = STEP_ORDER.indexOf(step);
  if (currentIndex <= 0) return null;
  return STEP_ORDER[currentIndex - 1];
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-raw-border/50 px-5 py-3 text-sm font-semibold text-raw-silver/75 transition hover:border-raw-gold/40 hover:text-raw-gold sm:py-2.5"
    >
      ← Back
    </button>
  );
}

function readSavedVoucherCode(userId: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`${ONBOARDING_VOUCHER_STORAGE_PREFIX}.${userId}`) ?? "";
}

function saveVoucherCode(userId: string, code: string): void {
  if (typeof window === "undefined") return;
  const key = `${ONBOARDING_VOUCHER_STORAGE_PREFIX}.${userId}`;
  if (code) {
    window.localStorage.setItem(key, code);
  } else {
    window.localStorage.removeItem(key);
  }
  window.dispatchEvent(new CustomEvent("raw:voucher-used", { detail: { userId, code } }));
}

function StepPill({ label, active, complete, onClick }: { label: string; active: boolean; complete: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] transition-all hover:border-raw-gold/60 hover:text-raw-gold ${
        active
          ? "border-raw-gold/60 bg-raw-gold/15 text-raw-gold"
          : complete
            ? "border-raw-gold/30 bg-raw-gold/5 text-raw-gold/70"
            : "border-raw-border/40 bg-raw-surface/20 text-raw-silver/35"
      }`}
    >
      {label}
    </button>
  );
}

export function OnboardingJourney({
  user,
  polls,
  avatarIndex,
  onAvatarChange,
  ownedAvatarLevels,
  ownedAvatarIds,
  avatarCatalog,
  onboardingStep,
  onboardingAnsweredPollIds,
  publicUsername,
  privateUsername,
  onSaveUsernames,
  onSetOnboardingStep,
  onMarkPollAnswered,
  selectedCommunityIds,
  onToggleCommunity,
  profilePublic = null,
  onSetProfilePublic = () => undefined,
  onCompleteOnboarding,
  onLogout,
  onClaimLandingWheelAvatar,
  markAvatarOwnedById,
}: OnboardingJourneyProps) {
  const { data: supabasePolls } = useQuery({
    queryKey: ["onboarding-landing-polls"],
    queryFn: async () => {
      const fetched = await fetchPolls(4);
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
  const [communitySaveError, setCommunitySaveError] = useState<string | null>(null);
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false);
  const [spinPrizes] = useState<WheelPrize[]>(() => buildSpinPrizes());
  const [spinResult, setSpinResult] = useState<WheelPoolEntry | null>(readStoredSpinResult);
  const [spinClaimError, setSpinClaimError] = useState<string | null>(null);
  const [isClaimingSpin, setIsClaimingSpin] = useState(false);
  const [publicUsernameDraft, setPublicUsernameDraft] = useState(publicUsername || user.username);
  const [privateUsernameDraft, setPrivateUsernameDraft] = useState(privateUsername);
  const [usernameSaveError, setUsernameSaveError] = useState("");
  const [isSavingUsernames, setIsSavingUsernames] = useState(false);
  const [voucherCodeDraft, setVoucherCodeDraft] = useState(() => readSavedVoucherCode(user.id));
  const [voucherError, setVoucherError] = useState("");
  const onboardingAvatars = useMemo(() => fallbackAvatarCatalog(), []);
  const [isLoadingPreviewAvatars] = useState(false);
  const isMobile = useIsMobile();
  const avatarTileSize: "sm" | "md" = isMobile ? "sm" : "md";
  const [previewAvatarIndex, setPreviewAvatarIndex] = useState(() => Math.min(Math.max(avatarIndex, 1), Math.max(1, onboardingAvatars.length)));
  const [avatarPage, setAvatarPage] = useState(() => Math.floor((Math.min(Math.max(avatarIndex, 1), Math.max(1, onboardingAvatars.length)) - 1) / AVATAR_PAGE_SIZE));
  const [showPollsWhy, setShowPollsWhy] = useState(false);
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
    setCommunitySaveError(null);
  }, [user.id]);

  useEffect(() => {
    setVoucherCodeDraft(readSavedVoucherCode(user.id));
    setVoucherError("");
  }, [user.id]);

  useEffect(() => {
    if (!spinResult) return;
    markAvatarOwnedById(spinResult.avatarId);
  }, [spinResult, markAvatarOwnedById]);

  useEffect(() => {
    const stepIndex = STEP_ORDER.indexOf(onboardingStep);
    track("onboarding_step_viewed", { step: onboardingStep as "spin" | "username" | "voucher" | "avatar" | "polls" | "communities" | "ready", step_index: stepIndex });
    stepStartTimeRef.current = Date.now();
  }, [onboardingStep]);

  const canContinueFromAvatar = avatarIndex >= 1 && (avatarIndex <= FREE_ONBOARDING_AVATAR_COUNT || ownedAvatarLevels.has(avatarIndex));
  const canContinueFromPolls = true;
  const canContinueFromProfile = profilePublic !== null;
  const canContinueFromCommunities = selectedCommunityIds.length >= 1;
  const canCompleteOnboarding = canContinueFromAvatar && canContinueFromPolls && canContinueFromCommunities;
  const previewAvatar = onboardingAvatars[previewAvatarIndex - 1] ?? onboardingAvatars[0];
  const trimmedPrivateUsernameDraft = privateUsernameDraft.trim();
  const canContinueFromUsername =
    isValidUsername(publicUsernameDraft) &&
    (trimmedPrivateUsernameDraft.length === 0 || isValidUsername(trimmedPrivateUsernameDraft));
  const normalizedVoucherCode = voucherCodeDraft.trim().toUpperCase();
  const freeAvatarChoices = onboardingAvatars.slice(0, FREE_ONBOARDING_AVATAR_COUNT);
  const previewAvatarChoices: AvatarCatalogItem[] = onboardingAvatars.slice(FREE_ONBOARDING_AVATAR_COUNT);
  // Reward catalog ids on the server are `spin-<imageId>` / `signup-<imageId>`.
  // Translate those to the set of owned image ids so the preview grid can mark
  // ownership without needing a matching level mapping in DEFAULT_AVATAR_CATALOG.
  const ownedRewardImageIds = useMemo(() => {
    const ids = new Set<number>();
    ownedAvatarIds.forEach((id) => {
      const imageId = imageIdFromCatalogId(id);
      if (imageId !== null) ids.add(imageId);
    });
    return ids;
  }, [ownedAvatarIds]);
  const isPreviewAvatarOwned = (avatar: AvatarCatalogItem): boolean => {
    if (avatar.imageSrc) {
      const match = /(\d+)\.(?:png|webp|jpg|jpeg|svg)$/.exec(avatar.imageSrc);
      if (match) {
        const imageId = Number(match[1]);
        if (ownedRewardImageIds.has(imageId)) return true;
      }
    }
    return false;
  };
  const canSelectPreviewAvatar = previewAvatarIndex <= FREE_ONBOARDING_AVATAR_COUNT || isPreviewAvatarOwned(previewAvatar);
  const claimedSpinResult = spinResult ?? findOwnedSpinResult(ownedAvatarIds);
  const claimedSpinAvatarChoice = claimedSpinResult
    ? previewAvatarChoices.find((avatar) => avatar.imageSrc === claimedSpinResult.imageSrc) ?? null
    : null;
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

  const goToNextStep = async () => {
    if (onboardingStep === "username") {
      if (!canContinueFromUsername) return;
      setIsSavingUsernames(true);
      setUsernameSaveError("");
      try {
        await onSaveUsernames(publicUsernameDraft, trimmedPrivateUsernameDraft);
      } catch (error) {
        setUsernameSaveError(error instanceof Error ? error.message : "Could not save usernames.");
        setIsSavingUsernames(false);
        return;
      }
      setIsSavingUsernames(false);
    }

    if (onboardingStep === "avatar" && previewAvatarIndex <= FREE_ONBOARDING_AVATAR_COUNT && previewAvatarIndex !== avatarIndex) {
      track("onboarding_avatar_selected", { avatar_level: previewAvatarIndex, attempts: 1 });
      onAvatarChange(previewAvatarIndex);
    }

    track("onboarding_step_completed", {
      step: onboardingStep as "spin" | "username" | "voucher" | "avatar" | "polls" | "communities" | "ready",
      duration_ms: Date.now() - stepStartTimeRef.current,
    });
    onSetOnboardingStep(getNextStep(onboardingStep));
  };

  const goToPreviousStep = () => {
    const previous = getPreviousStep(onboardingStep);
    if (previous) onSetOnboardingStep(previous);
  };

  const continueWithVoucher = () => {
    if (!normalizedVoucherCode) {
      setVoucherError("Enter a voucher code or tap I don't have a voucher.");
      return;
    }

    if (!normalizedVoucherCode.startsWith("RAW-")) {
      setVoucherError("Voucher codes should start with RAW-.");
      return;
    }

    saveVoucherCode(user.id, normalizedVoucherCode);
    setVoucherError("");
    void goToNextStep();
  };

  const skipVoucher = () => {
    saveVoucherCode(user.id, "");
    setVoucherCodeDraft("");
    setVoucherError("");
    void goToNextStep();
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
              onClick={() => onSetOnboardingStep(step)}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/40 to-raw-black/90 p-3 sm:rounded-3xl sm:p-6 md:p-8">
          {onboardingStep === "spin" && (
            <section>
              <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">I. Spin for your free avatar</h2>

              <div className="mt-6 flex flex-col items-center gap-5 sm:gap-7">
                <WheelOfFortune
                  prizes={spinPrizes}
                  disabled={!!claimedSpinResult || isClaimingSpin}
                  onSpinEnd={async (prize) => {
                    if (claimedSpinResult) return;
                    const entry = SPIN_WHEEL_POOL.find((item) => item.id === prize.id) ?? SPIN_WHEEL_POOL[0];
                    setSpinResult(entry);
                    setSpinClaimError(null);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem(
                        LANDING_WHEEL_SPIN_KEY,
                        JSON.stringify({ prizeId: entry.id, avatarId: entry.avatarId, spunAt: Date.now() }),
                      );
                    }
                    setIsClaimingSpin(true);
                    try {
                      await onClaimLandingWheelAvatar();
                    } catch {
                      setSpinClaimError("Could not save your reward. We'll retry when you continue.");
                    } finally {
                      setIsClaimingSpin(false);
                    }
                    markAvatarOwnedById(entry.avatarId);
                    track("onboarding_step_completed", {
                      step: "spin" as never,
                      step_index: STEP_ORDER.indexOf("spin"),
                      time_in_step: Date.now() - stepStartTimeRef.current,
                    });
                  }}
                />

                {claimedSpinResult ? (
                  <div className="w-full max-w-md rounded-2xl border border-raw-gold/30 bg-gradient-to-b from-raw-gold/[0.08] to-raw-gold/[0.02] p-4 text-center sm:p-5">
                    {claimedSpinResult.imageSrc ? (
                      <span className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border border-raw-gold/45 bg-raw-black/45 shadow-[0_0_18px_rgba(241,196,45,0.18)] sm:h-24 sm:w-24">
                        <img
                          src={claimedSpinResult.imageSrc}
                          alt={claimedSpinResult.name}
                          className="h-[92%] w-[92%] rounded-full object-contain"
                          loading="eager"
                          decoding="async"
                        />
                      </span>
                    ) : null}
                    <p className="font-display text-sm tracking-wide text-raw-gold">
                      You won {claimedSpinResult.name}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-raw-text/75">
                      Added to your inventory. Pick it on the next step.
                    </p>
                    {spinClaimError ? (
                      <p className="mt-2 text-[11px] text-red-300/80">{spinClaimError}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-center text-[11px] uppercase tracking-[0.2em] text-raw-silver/45">
                    Tap Spin to claim your free avatar
                  </p>
                )}

                <div className="flex w-full max-w-md items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSetOnboardingStep("username")}
                    className="rounded-full border border-raw-border/50 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-silver/70 transition hover:border-raw-gold/40 hover:text-raw-gold"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    disabled={isClaimingSpin}
                    onClick={() => onSetOnboardingStep("username")}
                    className={`rounded-full px-6 py-2 font-display text-xs uppercase tracking-[0.2em] transition ${
                      isClaimingSpin
                        ? "cursor-not-allowed border border-raw-border/40 bg-raw-surface/40 text-raw-silver/35"
                        : "border border-raw-gold/50 bg-raw-gold/15 text-raw-gold hover:bg-raw-gold/25"
                    }`}
                  >
                    {isClaimingSpin ? "Saving…" : claimedSpinResult ? "Continue" : "Next: Username"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {onboardingStep === "username" && (
            <section>
              <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">Choose your usernames</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-raw-silver/55">Your public username is how people know you across raW. Your private username is only for you.</p>
              <div className="mx-auto mt-8 max-w-xl space-y-5">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-raw-gold/75">Public username</span>
                  <input value={publicUsernameDraft} onChange={(event) => setPublicUsernameDraft(sanitizeUsernameInput(event.target.value))} autoComplete="username" className="mt-2 w-full rounded-2xl border border-raw-gold/25 bg-raw-black/65 px-4 py-3 font-display text-base tracking-wide text-raw-text outline-none transition focus:border-raw-gold/65 focus:shadow-[0_0_24px_rgba(242,210,26,0.12)]" placeholder="Your public username" />
                  <span className="mt-2 block text-xs text-raw-silver/45">Pre-filled from your login name. You can change it here.</span>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-raw-silver/60">Private username</span>
                  <input value={privateUsernameDraft} onChange={(event) => setPrivateUsernameDraft(sanitizeUsernameInput(event.target.value))} autoComplete="off" className="mt-2 w-full rounded-2xl border border-raw-border/50 bg-raw-black/65 px-4 py-3 font-display text-base tracking-wide text-raw-text outline-none transition focus:border-raw-gold/45" placeholder="Choose a private username" />
                  <span className="mt-2 block text-xs text-raw-silver/45">Not displayed to other people. Use 3-24 letters, numbers, dots, dashes, or underscores.</span>
                </label>
                {usernameSaveError ? (
                  <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{usernameSaveError}</p>
                ) : null}
                <div className="flex items-center justify-between gap-3 pt-3">
                  <button type="button" onClick={goToPreviousStep} className="rounded-full border border-raw-border/50 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-silver/70 transition hover:border-raw-gold/40 hover:text-raw-gold">← Back</button>
                  <button type="button" disabled={!canContinueFromUsername || isSavingUsernames} onClick={() => void goToNextStep()} className={`rounded-full border px-6 py-2 font-display text-xs uppercase tracking-[0.2em] transition ${canContinueFromUsername && !isSavingUsernames ? "border-raw-gold/50 bg-raw-gold/15 text-raw-gold hover:bg-raw-gold/25" : "cursor-not-allowed border-raw-border/40 text-raw-silver/30"}`}>{isSavingUsernames ? "Saving..." : "Continue"}</button>
                </div>
              </div>
            </section>
          )}

          {onboardingStep === "voucher" && (
            <section>
              <div className="mx-auto max-w-xl">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-raw-gold/25 bg-raw-gold/10 text-raw-gold">
                    <Ticket className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">Do you have a voucher?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-raw-silver/55">
                      If a friend shared a founding invite with you, enter it here. You can also skip this step.
                    </p>
                  </div>
                </div>

                <div className="mt-7 rounded-2xl border border-raw-border/35 bg-raw-black/45 p-4 sm:p-5">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-raw-gold/75">Voucher code</span>
                    <input
                      value={voucherCodeDraft}
                      onChange={(event) => {
                        setVoucherCodeDraft(event.target.value.toUpperCase());
                        setVoucherError("");
                      }}
                      autoComplete="off"
                      className="mt-2 w-full rounded-2xl border border-raw-gold/25 bg-raw-black/65 px-4 py-3 font-display text-base tracking-wide text-raw-text outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-raw-silver/25 focus:border-raw-gold/65 focus:shadow-[0_0_24px_rgba(242,210,26,0.12)]"
                      placeholder="RAW-1-XXXXXXXX"
                    />
                  </label>
                  <p className="mt-3 text-xs leading-relaxed text-raw-silver/45">
                    Voucher redemption will be verified when invite codes are connected to the backend.
                  </p>
                  {voucherError ? (
                    <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{voucherError}</p>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <BackButton onClick={goToPreviousStep} />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={skipVoucher}
                      className="rounded-full border border-raw-border/50 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-silver/70 transition hover:border-raw-gold/40 hover:text-raw-gold"
                    >
                      I don't have a voucher
                    </button>
                    <button
                      type="button"
                      onClick={continueWithVoucher}
                      className="rounded-full border border-raw-gold/50 bg-raw-gold/15 px-6 py-2 font-display text-xs uppercase tracking-[0.2em] text-raw-gold transition hover:bg-raw-gold/25"
                    >
                      Save voucher
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {onboardingStep === "avatar" && (
            <section>
              <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">II. Choose your avatar</h2>
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
                            <AvatarFigure avatarIndex={index} size={avatarTileSize} selected={isActive || isPreviewed} rarity={avatar.rarity} themeOverride={avatar} loading="eager" />
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
                          {hasAvatarRank(avatar) ? (
                            <span className="text-[7px] uppercase tracking-[0.08em] text-raw-silver/55 sm:text-[8px]">
                              Rank: R{getAvatarRank(avatar)}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                    </div>
                    {claimedSpinAvatarChoice ? (
                      <div className="mx-auto mt-5 w-full max-w-[11rem] min-[390px]:max-w-[12rem] sm:max-w-[24rem] md:mx-0">
                        <p className="mb-3 text-center font-display text-[9px] uppercase tracking-[0.2em] text-raw-gold/70">
                          Won avatar
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewAvatarIndex(claimedSpinAvatarChoice.level);
                            phonePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            track("onboarding_avatar_selected", { avatar_level: claimedSpinAvatarChoice.level, attempts: 1 });
                          }}
                          className="group mx-auto flex min-w-0 flex-col items-center gap-2 rounded-xl border border-raw-gold/35 bg-raw-gold/[0.04] p-3 transition hover:border-raw-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
                          aria-label={`Preview won avatar ${claimedSpinAvatarChoice.name}`}
                        >
                          <AvatarFigure
                            avatarIndex={claimedSpinAvatarChoice.level}
                            size={avatarTileSize}
                            selected={previewAvatarIndex === claimedSpinAvatarChoice.level}
                            rarity={claimedSpinAvatarChoice.rarity}
                            style={getPreviewOnlyAvatarImageScale(claimedSpinAvatarChoice.id)}
                            themeOverride={claimedSpinAvatarChoice}
                            loading="eager"
                          />
                          <span className="max-w-full truncate text-center font-display text-[9px] leading-tight tracking-[0.08em] text-raw-gold/90 sm:text-[10px]">
                            {claimedSpinAvatarChoice.name}
                          </span>
                          <span className="rounded-full border border-raw-gold/45 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-raw-gold/70">
                            owned
                          </span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                </div>

                <div className="order-first flex flex-col items-center justify-start md:order-none md:justify-center">
                  <div className="h-[360px] w-[157px] overflow-visible md:hidden">
                    <div
                      style={{
                        width: 280,
                        transform: "scale(0.56)",
                        transformOrigin: "top left",
                      }}
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
                  {previewAvatarChoices.length > 0 && previewAvatarIndex > FREE_ONBOARDING_AVATAR_COUNT ? (
                    <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-raw-silver/40">
                      Preview only
                    </p>
                  ) : null}
                </div>
              </div>

              {previewAvatarChoices.length > 0 ? (
                <div className="mt-8 w-full">
                  <div className="mx-auto mb-3 flex w-full max-w-[15rem] items-center justify-between gap-3 min-[420px]:max-w-[22rem] sm:max-w-[30rem]">
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
                      <p className="font-display text-[9px] uppercase tracking-[0.2em] text-raw-gold/70">Preview only</p>
                      <p className="mt-1 text-[10px] text-raw-silver/40">Page {avatarPage + 1} / {previewAvatarPageCount}</p>
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

                  <div className="grid w-full grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-3 sm:gap-y-4 md:grid-cols-8">
                    {isLoadingPreviewAvatars && visiblePreviewAvatarChoices.length === 0
                      ? Array.from({ length: AVATAR_PAGE_SIZE }).map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 p-1.5">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-raw-surface/40 sm:h-12 sm:w-12" />
                            <div className="h-1.5 w-8 animate-pulse rounded bg-raw-surface/30" />
                          </div>
                        ))
                      : null}
                    {visiblePreviewAvatarChoices.map((avatar) => {
                      const index = avatar.level;
                      const isPreviewed = index === previewAvatarIndex;
                      const isOwned = isPreviewAvatarOwned(avatar);
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setPreviewAvatarIndex(index);
                            phonePreviewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            track("onboarding_avatar_selected", { avatar_level: index, attempts: 1 });
                          }}
                          className={`group relative flex min-w-0 flex-col items-center gap-2 rounded-xl p-2 pb-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50 ${
                            isOwned ? "" : "cursor-help"
                          }`}
                          aria-label={isOwned ? `Select claimed reward ${avatar.name}` : `Preview ${avatar.name}, locked until later`}
                        >
                          <div className={`relative rounded-full transition-all duration-300 ${
                            isPreviewed ? "scale-100 opacity-100" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                          }`}>
                            <AvatarFigure
                              avatarIndex={index}
                              size={avatarTileSize}
                              selected={isPreviewed}
                              rarity={avatar.rarity}
                              style={getPreviewOnlyAvatarImageScale(avatar.id)}
                              themeOverride={avatar}
                              loading="lazy"
                            />
                          </div>
                          <span className={`relative z-10 mt-0.5 max-w-full truncate text-center font-display text-[9px] leading-tight tracking-[0.08em] transition-colors sm:text-[10px] ${
                            isPreviewed ? "text-raw-gold/90" : "text-raw-silver/65 group-hover:text-raw-silver/90"
                          }`}>
                            {avatar.name.split(" ")[0]}
                          </span>
                          {hasAvatarRank(avatar) ? (
                            <span className="relative z-10 text-[8px] uppercase tracking-[0.08em] text-raw-silver/55 sm:text-[9px]">
                              Rank: R{getAvatarRank(avatar)}
                            </span>
                          ) : null}
                          <span className={`relative z-10 rounded-full border px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] ${
                            isOwned ? "border-raw-gold/45 text-raw-gold/70" : "border-raw-border/35 text-raw-silver/35"
                          }`}>
                            {isOwned ? "owned" : "locked"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
                <BackButton onClick={goToPreviousStep} />
                {(() => {
                  const lockedPreview = previewAvatarIndex !== avatarIndex && !canSelectPreviewAvatar;
                  const blocked = lockedPreview || !canContinueFromAvatar;
                  return (
                    <button
                      onClick={goToNextStep}
                      disabled={blocked}
                      className="rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:bg-raw-border/40 disabled:text-raw-silver/40 sm:py-2.5"
                    >
                      Next: Polls
                    </button>
                  );
                })()}
              </div>
            </section>
          )}

          {onboardingStep === "polls" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 sm:items-end sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base tracking-wide text-raw-text sm:text-xl">III. Answer 4 launch polls</h2>
                    <button
                      type="button"
                      onClick={() => setShowPollsWhy((v) => !v)}
                      aria-expanded={showPollsWhy}
                      aria-controls="polls-why-popover"
                      className="sm:hidden inline-flex h-5 items-center justify-center rounded-full border border-raw-border/40 px-2 text-[10px] uppercase tracking-wider text-raw-silver/70 hover:text-raw-gold hover:border-raw-gold/60 transition"
                    >
                      why?
                    </button>
                  </div>
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-raw-silver/55 sm:text-sm hidden sm:block">
                    We collect a few answers to understand you better, then use that signal to work our matching magic
                    and connect you with the right people, communities, and interests.
                  </p>
                  {showPollsWhy && (
                    <div
                      id="polls-why-popover"
                      role="dialog"
                      className="sm:hidden mt-2 rounded-lg border border-raw-border/40 bg-raw-surface/95 p-3 text-[11px] leading-relaxed text-raw-silver/80 shadow-lg"
                    >
                      We collect a few answers to understand you better, then use that signal to work our matching magic
                      and connect you with the right people, communities, and interests.
                    </div>
                  )}
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

              <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
                <BackButton onClick={goToPreviousStep} />
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromPolls}
                  className="rounded-xl border border-raw-gold/40 bg-raw-gold/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-raw-gold transition-all hover:bg-raw-gold/25 disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5"
                >
                  Continue to communities →
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "profile" && STEP_ORDER.includes("profile") && (
            <section>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">
                    IV. Choose your profile visibility
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-raw-silver/55 sm:text-sm">
                    This sets whether other members can open your profile. You can change it later from your settings.
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  canContinueFromProfile
                    ? "border-raw-gold/60 bg-raw-gold/10 text-raw-gold"
                    : "border-raw-border/40 text-raw-gold/75"
                }`}>
                  {canContinueFromProfile ? "1/1" : "0/1"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {([
                  {
                    value: true,
                    title: "Public profile",
                    blurb: "Anyone in the community can tap your avatar to see your username, level, and join date.",
                    detail: "Recommended if you want to be discoverable and join more conversations.",
                  },
                  {
                    value: false,
                    title: "Private profile",
                    blurb: "Only you see your profile details. Other members see your avatar and messages but cannot open your profile card.",
                    detail: "Each account can be private — pick this if you prefer to keep things low-key.",
                  },
                ] as const).map((option) => {
                  const isSelected = profilePublic === option.value;
                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => onSetProfilePublic(option.value)}
                      className={`group relative overflow-hidden rounded-2xl border bg-transparent p-4 text-left transition-all duration-300 sm:p-5 ${
                        isSelected
                          ? "border-raw-gold/70 shadow-[0_0_0_1px_rgba(241,196,45,0.25),0_12px_28px_rgba(241,196,45,0.15)]"
                          : "border-raw-border/35 hover:border-raw-gold/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-raw-gold shadow-lg">
                          <span className="text-[11px] font-bold text-black">✓</span>
                        </div>
                      )}
                      <p className="font-display text-base text-raw-text sm:text-lg">{option.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-raw-silver/65 sm:text-sm">{option.blurb}</p>
                      <p className="mt-3 text-[11px] leading-relaxed text-raw-silver/40">{option.detail}</p>
                      <div className="mt-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors sm:px-3 ${
                            isSelected
                              ? "border-raw-gold/80 bg-raw-gold/15 text-raw-gold"
                              : "border-raw-border/50 text-raw-gold/85 group-hover:border-raw-gold/45"
                          }`}
                        >
                          {isSelected ? "✓ Selected" : "Choose"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
                <BackButton onClick={goToPreviousStep} />
                <button
                  onClick={goToNextStep}
                  disabled={!canContinueFromProfile}
                  className="rounded-xl border border-raw-gold/40 bg-raw-gold/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-raw-gold transition-all hover:bg-raw-gold/25 disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5"
                >
                  Continue to communities →
                </button>
              </div>
            </section>
          )}

          {onboardingStep === "communities" && (
            <section>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">
                    V. Pick 1 community as your favorite
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-raw-silver/55 sm:text-sm">
                    Start with the community that feels right for you now. You can discover the rest later.
                  </p>
                </div>
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

              {!canCompleteOnboarding ? (
                <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-raw-silver/50 sm:text-right">
                  Finish every step to enter raW
                </p>
              ) : null}
              {communitySaveError ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {communitySaveError}
                </p>
              ) : null}
              <div className="mt-6 flex items-center justify-between gap-3 sm:mt-8">
                <BackButton onClick={goToPreviousStep} />
                <button
                  onClick={() => {
                    setCommunitySaveError(null);
                    track("onboarding_completed", {
                      total_duration_ms: Date.now() - stepStartTimeRef.current,
                      polls_answered: answeredCount,
                      communities_selected: selectedCommunityIds.length,
                      source: "complete_onboarding_button",
                    });
                    setEnterRawOpen(true);
                  }}
                  disabled={!canCompleteOnboarding}
                  className="rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5"
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
        onEnter={async () => {
          if (isCompletingOnboarding) return;
          track("onboarding_completed", {
            total_duration_ms: Date.now() - stepStartTimeRef.current,
            polls_answered: answeredCount,
            communities_selected: selectedCommunityIds.length,
            source: "enter_raw_modal",
          });
          setIsCompletingOnboarding(true);
          setCommunitySaveError(null);
          try {
            await onCompleteOnboarding();
            setEnterRawOpen(false);
          } catch (error) {
            setEnterRawOpen(false);
            setCommunitySaveError(error instanceof Error ? error.message : "Could not save your community. Please try again.");
          } finally {
            setIsCompletingOnboarding(false);
          }
        }}
        onDismiss={() => {
          setEnterRawOpen(false);
        }}
      />
    </div>
  );
}
