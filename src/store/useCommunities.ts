import { useEffect, useMemo, useState } from "react";
import { readOnboardingMap, writeOnboardingMap } from "@/store/useRawStore.storage";
import { loadOnboardingProgress, saveOnboardingProgress } from "@/backend/supabase/controllers/userController";

export function useCommunities(username?: string, userId?: string) {
  const [onboardingSelectedCommunityIds, setOnboardingSelectedCommunityIds] = useState<string[]>([]);
  const [serverLoaded, setServerLoaded] = useState(false);

  useEffect(() => {
    if (!username) {
      setServerLoaded(true);
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
    if (!username || !userId) {
      setServerLoaded(true);
      return;
    }

    let cancelled = false;
    setServerLoaded(false);
    void loadOnboardingProgress()
      .then((progress) => {
        if (cancelled || !progress) return;
        const restored = progress.selectedCommunityIds.slice(0, 2);
        setOnboardingSelectedCommunityIds(restored);
        const map = readOnboardingMap();
        map[username] = {
          ...(map[username] ?? { completed: false, step: "communities", answeredPollIds: [] }),
          selectedCommunityIds: restored,
        };
        writeOnboardingMap(map);
      })
      .catch(() => {
        // Local progress remains the offline fallback.
      })
      .finally(() => {
        if (!cancelled) setServerLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, username]);

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

  useEffect(() => {
    if (!username || !userId || !serverLoaded) {
      return;
    }

    void saveOnboardingProgress({
      selectedCommunityIds: onboardingSelectedCommunityIds,
    }).catch(() => {
      // Local storage remains the source of truth until Supabase is reachable.
    });
  }, [onboardingSelectedCommunityIds, serverLoaded, userId, username]);

  return useMemo(() => ({
    onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds,
  }), [onboardingSelectedCommunityIds]);
}
