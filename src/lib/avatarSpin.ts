import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { avatarImageKey, catalogLevelAt, ownedAvatarImageKeys } from "@/lib/avatarOwnership";
import { getAvatarRank, hasAvatarRank } from "@/lib/avatarRank";

export function getEligibleSpinAvatars(
  avatarCatalog: AvatarCatalogItem[],
  rank: number,
  ownedAvatarLevels: Set<number>,
): AvatarCatalogItem[] {
  const ownedImageKeys = ownedAvatarImageKeys(avatarCatalog, ownedAvatarLevels);
  const seenPrizeImageKeys = new Set<string>();

  return avatarCatalog.filter((avatar, index) => {
    const imageKey = avatarImageKey(avatar);
    if (
      !hasAvatarRank(avatar) ||
      getAvatarRank(avatar) !== rank ||
      ownedAvatarLevels.has(catalogLevelAt(index)) ||
      ownedImageKeys.has(imageKey) ||
      seenPrizeImageKeys.has(imageKey)
    ) {
      return false;
    }
    seenPrizeImageKeys.add(imageKey);
    return true;
  });
}

export function resolveAvatarCatalogLevel(avatarCatalog: AvatarCatalogItem[], avatarId: string): number | null {
  const index = avatarCatalog.findIndex((avatar) => avatar.id === avatarId);
  return index >= 0 ? index + 1 : null;
}
