import { useCallback, useEffect, useMemo, useState } from "react";
import type { OnboardingStep, User } from "@/store/types";
import { readOnboardingMap, writeOnboardingMap } from "@/store/useRawStore.storage";
import { LANDING_WHEEL_SPIN_KEY } from "@/lib/avatarCatalog";
import { completeUserOnboarding } from "@/backend/supabase/controllers/authController";
import { loadOnboardingProgress, saveOnboardingProgress } from "@/backend/supabase/controllers/userController";

function defaultInitialStep(): OnboardingStep {
  if (typeof window === "undefined") return "spin";
  return window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY) ? "username" : "spin";
}

function normalizeRestoredStep(step: OnboardingStep): OnboardingStep {
  if (step === "profile") return "communities";
  if (step === "voucher") return "avatar";
  if (step === "spin" && window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY)) return "username";
  return step;
}

export function useOnboarding(isLoggedIn: boolean, user?: User | null) {
  const username = user?.username;
  const storageKey = username ? `raw.onboarding.completed.${username}` : null;

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(defaultInitialStep);
  const [onboardingAnsweredPollIds, setOnboardingAnsweredPollIds] = useState<Set<string>>(new Set());
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [onboardingServerLoaded, setOnboardingServerLoaded] = useState(false);
  const [onboardingPublicUsername, setOnboardingPublicUsername] = useState(username ?? "");
  const [onboardingPrivateUsername, setOnboardingPrivateUsername] = useState("");

  useEffect(() => {
    if (!username || !storageKey) {
      setOnboardingLoaded(true);
      setOnboardingServerLoaded(true);
      return;
    }

    let cancelled = false;
    const entry = readOnboardingMap()[username];
    if (entry) {
      setOnboardingStep(normalizeRestoredStep(entry.step));
      setOnboardingAnsweredPollIds(new Set(entry.answeredPollIds));
      setOnboardingPublicUsername(entry.publicUsername ?? username);
      setOnboardingPrivateUsername(entry.privateUsername ?? "");
      setOnboardingCompleted(user?.onboardingCompleted ?? entry.completed);
      setOnboardingLoaded(true);
    } else {
      setOnboardingCompleted(user?.onboardingCompleted ?? window.localStorage.getItem(storageKey) === "1");
      setOnboardingPublicUsername(username);
      setOnboardingLoaded(true);
    }

    setOnboardingServerLoaded(false);
    if (!isLoggedIn || !user?.id) {
      setOnboardingServerLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    void loadOnboardingProgress()
      .then((progress) => {
        if (cancelled || !progress) return;
        setOnboardingStep(normalizeRestoredStep(progress.step));
        setOnboardingAnsweredPollIds(new Set(progress.answeredPollIds));
        setOnboardingCompleted(user.onboardingCompleted ?? progress.completed);
        const map = readOnboardingMap();
        map[username] = {
          ...(map[username] ?? { publicUsername: username, privateUsername: "" }),
          completed: user.onboardingCompleted ?? progress.completed,
          step: normalizeRestoredStep(progress.step),
          answeredPollIds: progress.answeredPollIds,
          selectedCommunityIds: progress.selectedCommunityIds,
        };
        writeOnboardingMap(map);
      })
      .catch(() => {
        // Local progress remains the offline fallback.
      })
      .finally(() => {
        if (!cancelled) setOnboardingServerLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, storageKey, user?.id, user?.onboardingCompleted, username]);

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
      publicUsername: onboardingPublicUsername,
      privateUsername: onboardingPrivateUsername,
    };
    writeOnboardingMap(map);
  }, [onboardingAnsweredPollIds, onboardingCompleted, onboardingLoaded, onboardingPrivateUsername, onboardingPublicUsername, onboardingStep, username]);

  useEffect(() => {
    if (!username || !onboardingLoaded || !onboardingServerLoaded || !user?.id) {
      return;
    }

    void saveOnboardingProgress({
      step: onboardingStep,
      answeredPollIds: Array.from(onboardingAnsweredPollIds),
    }).catch(() => {
      // Local storage remains the source of truth until Supabase is reachable.
    });
  }, [onboardingAnsweredPollIds, onboardingLoaded, onboardingServerLoaded, onboardingStep, user?.id, username]);

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
    if (user?.id) void completeUserOnboarding(user.id);
  }, [storageKey, user?.id]);

  const isOnboardingResolved = !isLoggedIn || onboardingLoaded;

  return useMemo(() => ({
    onboardingStep,
    setOnboardingStep,
    onboardingAnsweredPollIds,
    onboardingPublicUsername,
    onboardingPrivateUsername,
    setOnboardingPublicUsername,
    setOnboardingPrivateUsername,
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
    onboardingPrivateUsername,
    onboardingPublicUsername,
    onboardingCompleted,
    onboardingStep,
    resetOnboardingProgress,
  ]);
}
