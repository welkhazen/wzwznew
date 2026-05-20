import { useEffect, useMemo, useState } from "react";
import { readOnboardingMap, writeOnboardingMap } from "@/store/useRawStore.storage";

export function useCommunities(username?: string) {
  const [onboardingSelectedCommunityIds, setOnboardingSelectedCommunityIds] = useState<string[]>([]);

  useEffect(() => {
    if (!username) {
      return;
    }

    const entry = readOnboardingMap()[username];
    if (!entry) {
      return;
    }

    const restored = entry.selectedCommunityIds ?? (entry.selectedCommunityId ? [entry.selectedCommunityId] : []);
    setOnboardingSelectedCommunityIds(restored.slice(0, 2));
  }, [username]);

  useEffect(() => {
    if (!username) {
      return;
    }

    const map = readOnboardingMap();
    map[username] = {
      ...(map[username] ?? { completed: false, step: "avatar", answeredPollIds: [] }),
      selectedCommunityIds: onboardingSelectedCommunityIds,
    };
    writeOnboardingMap(map);
  }, [onboardingSelectedCommunityIds, username]);

  return useMemo(() => ({
    onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds,
  }), [onboardingSelectedCommunityIds]);
}
