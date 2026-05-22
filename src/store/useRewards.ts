import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import {
  type AvatarCatalogItem,
  equipAvatarForUser,
  getDefaultAvatarCatalog,
  loadAvatarCatalog,
  loadUserAvatarState,
  purchaseAvatarForUser,
  readAvatarCatalogLocal,
} from "@/lib/avatarCatalog";
import { setAvatarThemes } from "@/lib/avataridentity";
import type { User } from "@/store/types";

export function useRewards(user: User | null) {
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);
  const [avatarCatalog, setAvatarCatalog] = useState<AvatarCatalogItem[]>(() => getDefaultAvatarCatalog());
  const [ownedAvatarIds, setOwnedAvatarIds] = useState<string[]>([]);
  const [avatarLevel, setAvatarLevelState] = useState(1);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  useEffect(() => {
    const apply = (catalog: AvatarCatalogItem[]) => {
      setAvatarCatalog(catalog);
      setAvatarThemes(catalog.map((item) => ({
        bg: item.bg,
        figure: item.figure,
        ring: item.ring,
        glow: item.glow,
        name: item.name,
        imageSrc: item.imageSrc,
      })));
    };

    loadAvatarCatalog().then(apply).catch(() => {});
    const handler = () => apply(readAvatarCatalogLocal());
    window.addEventListener("raw:avatar-catalog-updated", handler);
    return () => window.removeEventListener("raw:avatar-catalog-updated", handler);
  }, []);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    if (!user || avatarCatalog.length === 0) {
      setOwnedAvatarIds([]);
      setAvatarLevelState(1);
      setInventoryLoaded(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const requestUserId = user.id;
      const state = await loadUserAvatarState(requestUserId, avatarCatalog);
      if (cancelled || requestUserId !== activeUserIdRef.current) return;

      const ownedIds = user.role === "admin"
        ? avatarCatalog.map((item) => item.id)
        : state.ownedAvatarIds;
      setOwnedAvatarIds(ownedIds);
      const index = avatarCatalog.findIndex((item) => item.id === state.selectedAvatarId);
      setAvatarLevelState(index >= 0 ? index + 1 : 1);
      setInventoryLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [avatarCatalog, user]);

  const setAvatarLevel = useCallback((toLevel: number) => {
    const maxLevel = avatarCatalog.length;
    const clamped = Math.min(Math.max(1, toLevel), Math.max(1, maxLevel));
    const candidate = avatarCatalog[clamped - 1];
    if (!candidate) return;

    if (user && !inventoryLoaded) return;

    if (user && !ownedAvatarIds.includes(candidate.id)) {
      return;
    }

    setAvatarLevelState((previous) => {
      if (previous !== clamped) {
        track("avatar_level_up", { from_level: previous, to_level: clamped, trigger: "manual" });
      }
      return clamped;
    });

    if (user) {
      void equipAvatarForUser(user.id, candidate.id);
    }
  }, [avatarCatalog, inventoryLoaded, ownedAvatarIds, user]);

  const unlockAvatarLevel = useCallback(async (level: number) => {
    if (!user) return false;
    if (!inventoryLoaded) return false;
    const candidate = avatarCatalog[level - 1];
    if (!candidate) return false;
    if (ownedAvatarIds.includes(candidate.id)) return true;

    try {
      await purchaseAvatarForUser(user.id, candidate.id);
      setOwnedAvatarIds((previous) => (previous.includes(candidate.id) ? previous : [...previous, candidate.id]));
      return true;
    } catch {
      return false;
    }
  }, [avatarCatalog, inventoryLoaded, ownedAvatarIds, user]);

  const markAvatarOwned = useCallback((level: number) => {
    const candidate = avatarCatalog[level - 1];
    if (!candidate) return;
    setOwnedAvatarIds((previous) => (previous.includes(candidate.id) ? previous : [...previous, candidate.id]));
  }, [avatarCatalog]);

  const ownedAvatarLevels = useMemo(() => {
    if (ownedAvatarIds.length === 0) {
      return new Set<number>(avatarCatalog.length > 0 ? [1] : []);
    }

    const levels = new Set<number>();
    avatarCatalog.forEach((item, index) => {
      if (ownedAvatarIds.includes(item.id)) {
        levels.add(index + 1);
      }
    });
    return levels;
  }, [avatarCatalog, ownedAvatarIds]);

  const avatarPricesByLevel = useMemo(() => {
    return avatarCatalog.reduce<Record<number, string>>((acc, item, index) => {
      acc[index + 1] = item.price;
      return acc;
    }, {});
  }, [avatarCatalog]);

  const changeAvatarLevel = setAvatarLevel;

  const selectAvatarForOnboarding = useCallback((toLevel: number) => {
    const maxLevel = avatarCatalog.length;
    const clamped = Math.min(Math.max(1, toLevel), Math.max(1, maxLevel));
    if (!avatarCatalog[clamped - 1]) return;
    setAvatarLevelState(clamped);
  }, [avatarCatalog]);

  return useMemo(() => ({
    avatarLevel,
    setAvatarLevel,
    changeAvatarLevel,
    selectAvatarForOnboarding,
    avatarCatalog,
    ownedAvatarLevels,
    unlockAvatarLevel,
    markAvatarOwned,
    avatarPricesByLevel,
  }), [avatarCatalog, avatarLevel, avatarPricesByLevel, changeAvatarLevel, markAvatarOwned, ownedAvatarLevels, selectAvatarForOnboarding, setAvatarLevel, unlockAvatarLevel]);
}
