import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  MAX_FAVORITE_COMMUNITIES,
  getUserFavoriteCommunities,
  setUserFavoriteCommunities,
} from "@/backend/supabase/controllers/userExtrasController";
import {
  fetchWaitlistSummary,
  joinCommunityWaitlist,
} from "@/backend/supabase/controllers/waitlistController";
import { loadCommunityAccess, type CommunityAccess } from "@/lib/communityAccess";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

const WAITLIST_UNLOCK_THRESHOLD = 200;

export interface CommunityAccessState {
  communityAccess: CommunityAccess;
  setCommunityAccess: React.Dispatch<React.SetStateAction<CommunityAccess>>;
  waitlistCounts: Record<string, number>;
  waitlistJoinedIds: Set<string>;
  waitlistJoiningId: string | null;
  favoriteCommunityIds: string[];
  setFavoriteCommunityIds: React.Dispatch<React.SetStateAction<string[]>>;
  reload: () => Promise<void>;
  joinWaitlist: (community: PersistedCommunityRecord) => Promise<void>;
  toggleFavorite: (communityId: string) => Promise<void>;
  optimisticAddUnlock: (communityId: string) => void;
}

export function useCommunityAccess(userId: string): CommunityAccessState {
  const [communityAccess, setCommunityAccess] = useState<CommunityAccess>({
    hasSubscription: false,
    unlockedIds: new Set<string>(),
  });
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [waitlistJoinedIds, setWaitlistJoinedIds] = useState<Set<string>>(new Set());
  const [waitlistJoiningId, setWaitlistJoiningId] = useState<string | null>(null);
  const [favoriteCommunityIds, setFavoriteCommunityIds] = useState<string[]>([]);

  const reload = useCallback(async () => {
    try {
      const [waitlistData, accessData, favIds] = await Promise.all([
        fetchWaitlistSummary(userId).catch(() => ({ counts: {}, joinedCommunityIds: new Set<string>() })),
        loadCommunityAccess(userId).catch(() => ({ hasSubscription: false, unlockedIds: new Set<string>() })),
        getUserFavoriteCommunities(userId).catch(() => [] as string[]),
      ]);
      setWaitlistCounts(waitlistData.counts);
      setWaitlistJoinedIds(waitlistData.joinedCommunityIds);
      setCommunityAccess(accessData);
      setFavoriteCommunityIds(favIds);
    } catch {
      // best-effort
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const optimisticAddUnlock = useCallback((communityId: string) => {
    setCommunityAccess((prev) => ({
      ...prev,
      unlockedIds: new Set([...prev.unlockedIds, communityId]),
    }));
  }, []);

  const joinWaitlist = useCallback(
    async (community: PersistedCommunityRecord) => {
      if (waitlistJoinedIds.has(community.id) || waitlistJoiningId === community.id) return;
      setWaitlistJoiningId(community.id);
      const previousCount = waitlistCounts[community.id] ?? 0;
      setWaitlistCounts((prev) => ({ ...prev, [community.id]: previousCount + 1 }));
      setWaitlistJoinedIds((prev) => { const next = new Set(prev); next.add(community.id); return next; });
      try {
        const newCount = await joinCommunityWaitlist(community.id, userId, community.title ?? "");
        setWaitlistCounts((prev) => ({ ...prev, [community.id]: newCount }));
        toast({
          title: "You're on the waitlist",
          description: `${newCount}/${WAITLIST_UNLOCK_THRESHOLD} signed up to unlock ${community.title}.`,
        });
      } catch {
        setWaitlistCounts((prev) => ({ ...prev, [community.id]: previousCount }));
        setWaitlistJoinedIds((prev) => { const next = new Set(prev); next.delete(community.id); return next; });
        toast({ title: "Failed to join waitlist", description: "Please try again." });
      } finally {
        setWaitlistJoiningId((current) => (current === community.id ? null : current));
      }
    },
    [userId, waitlistCounts, waitlistJoinedIds, waitlistJoiningId],
  );

  const broadcastFavoritesUpdated = useCallback(
    (ids: string[]) => {
      window.dispatchEvent(new CustomEvent("raw:favorite-communities-updated", { detail: { userId, ids } }));
    },
    [userId],
  );

  const toggleFavorite = useCallback(
    async (communityId: string) => {
      const isFavorite = favoriteCommunityIds.includes(communityId);
      let next: string[];
      if (isFavorite) {
        next = favoriteCommunityIds.filter((id) => id !== communityId);
      } else {
        if (favoriteCommunityIds.length >= MAX_FAVORITE_COMMUNITIES) {
          toast({ title: "Favorites full", description: `You can pick up to ${MAX_FAVORITE_COMMUNITIES} favorite communities.` });
          return;
        }
        next = [...favoriteCommunityIds, communityId];
      }
      const previous = favoriteCommunityIds;
      setFavoriteCommunityIds(next);
      broadcastFavoritesUpdated(next);
      try {
        await setUserFavoriteCommunities(userId, next);
      } catch {
        setFavoriteCommunityIds(previous);
        broadcastFavoritesUpdated(previous);
        toast({ title: "Could not update favorites", description: "Please try again." });
      }
    },
    [broadcastFavoritesUpdated, favoriteCommunityIds, userId],
  );

  return {
    communityAccess,
    setCommunityAccess,
    waitlistCounts,
    waitlistJoinedIds,
    waitlistJoiningId,
    favoriteCommunityIds,
    setFavoriteCommunityIds,
    reload,
    joinWaitlist,
    toggleFavorite,
    optimisticAddUnlock,
  };
}
