import type { OnboardingStep } from "./types";

const DAILY_POLL_PROGRESS_STORAGE_KEY = "raw.poll-daily-progress.v1";
const ONBOARDING_STATE_STORAGE_KEY = "raw.onboarding.v1";

interface PersistedDailyPollProgressEntry {
  date: string;
  pollIds: string[];
}

type PersistedDailyPollProgressMap = Record<string, PersistedDailyPollProgressEntry>;

interface PersistedOnboardingEntry {
  completed: boolean;
  step: OnboardingStep;
  answeredPollIds: string[];
  selectedCommunityIds?: string[];
  selectedCommunityId?: string | null;
  publicUsername?: string;
  privateUsername?: string;
}

type PersistedOnboardingMap = Record<string, PersistedOnboardingEntry>;

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function readDailyPollProgressMap(): PersistedDailyPollProgressMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(DAILY_POLL_PROGRESS_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as PersistedDailyPollProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeDailyPollProgressMap(map: PersistedDailyPollProgressMap): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DAILY_POLL_PROGRESS_STORAGE_KEY, JSON.stringify(map));
}

export function readOnboardingMap(): PersistedOnboardingMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(ONBOARDING_STATE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as PersistedOnboardingMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeOnboardingMap(map: PersistedOnboardingMap): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDING_STATE_STORAGE_KEY, JSON.stringify(map));
}
