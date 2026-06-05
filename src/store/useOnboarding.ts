import { useCallback, useEffect, useMemo, useState } from "react";
import type { OnboardingStep, User } from "@/store/types";
import { readOnboardingMap, writeOnboardingMap } from "@/store/useRawStore.storage";
import { LANDING_WHEEL_SPIN_KEY } from "@/lib/avatarCatalog";
import { completeUserOnboarding } from "@/backend/supabase/controllers/authController";

function defaultInitialStep(): OnboardingStep {
  if (typeof window === "undefined") return "spin";
  return window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY) ? "avatar" : "spin";
}

export function useOnboarding(isLoggedIn: boolean, user?: User | null) {
  const username = user?.isGuest ? user.id : user?.username;
  const storageKey = username ? `raw.onboarding.completed.${username}` : null;

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(defaultInitialStep);
  const [onboardingAnsweredPollIds, setOnboardingAnsweredPollIds] = useState<Set<string>>(new Set());
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  useEffect(() => {
    if (!username || !storageKey) {
      setOnboardingLoaded(true);
      return;
    }

    const entry = readOnboardingMap()[username];
    if (entry) {
      const restoredStep = entry.step === "spin" && window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY)
        ? "avatar"
        : entry.step;
      setOnboardingStep(restoredStep);
      setOnboardingAnsweredPollIds(new Set(entry.answeredPollIds));
      setOnboardingCompleted(user?.onboardingCompleted ?? entry.completed);
      setOnboardingLoaded(true);
      return;
    }

    setOnboardingCompleted(user?.onboardingCompleted ?? window.localStorage.getItem(storageKey) === "1");
    setOnboardingLoaded(true);
  }, [storageKey, user?.onboardingCompleted, username]);

  const markOnboardingPollAnswered = useCallback((pollId: string) => {
    setOnboardingAnsweredPollIds((previous) => new Set(previous).add(pollId));
  }, []);

  useEffect(() => {
    if (!username || !onboardingLoaded) {
      return;
    }

    const map = readOnboardingMap();
    map[username] = {
      ...(map[username] ?? { selectedCommunityIds: [] }),
      completed: onboardingCompleted,
      step: onboardingStep,
      answeredPollIds: Array.from(onboardingAnsweredPollIds),
    };
    writeOnboardingMap(map);
  }, [onboardingAnsweredPollIds, onboardingCompleted, onboardingLoaded, onboardingStep, username]);

  const resetOnboardingProgress = useCallback(() => {
    setOnboardingStep(defaultInitialStep());
    setOnboardingAnsweredPollIds(new Set());
    setOnboardingCompleted(false);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [storageKey]);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    setOnboardingStep("communities");
    if (storageKey) localStorage.setItem(storageKey, "1");
    if (user?.id && !user.isGuest) void completeUserOnboarding(user.id);
  }, [storageKey, user?.id, user?.isGuest]);

  const isOnboardingResolved = !isLoggedIn || onboardingLoaded;

  return useMemo(() => ({
    onboardingStep,
    setOnboardingStep,
    onboardingAnsweredPollIds,
    markOnboardingPollAnswered,
    onboardingCompleted,
    completeOnboarding,
    resetOnboardingProgress,
    isOnboardingResolved,
  }), [
    completeOnboarding,
    isOnboardingResolved,
    markOnboardingPollAnswered,
    onboardingAnsweredPollIds,
    onboardingCompleted,
    onboardingStep,
    resetOnboardingProgress,
  ]);
}
