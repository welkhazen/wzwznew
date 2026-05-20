import { useCallback, useEffect, useMemo, useState } from "react";
import type { OnboardingStep } from "@/store/types";
import { readOnboardingMap, writeOnboardingMap } from "@/store/useRawStore.storage";

export function useOnboarding(isLoggedIn: boolean, username?: string) {
  const storageKey = username ? `raw.onboarding.completed.${username}` : null;

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("avatar");
  const [onboardingAnsweredPollIds, setOnboardingAnsweredPollIds] = useState<Set<string>>(new Set());
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  useEffect(() => {
    if (!username) {
      return;
    }

    const entry = readOnboardingMap()[username];
    if (!entry) {
      return;
    }

    setOnboardingStep(entry.step);
    setOnboardingAnsweredPollIds(new Set(entry.answeredPollIds));
    setOnboardingCompleted(entry.completed);
  }, [username]);

  useEffect(() => {
    if (!storageKey) {
      setOnboardingLoaded(true);
      return;
    }
    setOnboardingCompleted(localStorage.getItem(storageKey) === "1");
    setOnboardingLoaded(true);
  }, [storageKey]);

  const markOnboardingPollAnswered = useCallback((pollId: string) => {
    setOnboardingAnsweredPollIds((previous) => new Set(previous).add(pollId));
  }, []);

  useEffect(() => {
    if (!username) {
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
  }, [onboardingAnsweredPollIds, onboardingCompleted, onboardingStep, username]);

  const resetOnboardingProgress = useCallback(() => {
    setOnboardingStep("avatar");
    setOnboardingAnsweredPollIds(new Set());
    setOnboardingCompleted(false);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [storageKey]);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true);
    setOnboardingStep("communities");
    if (storageKey) localStorage.setItem(storageKey, "1");
  }, [storageKey]);

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
