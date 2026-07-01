import { avatarIdFromImageSrc, canonicalAvatarImageId } from "@/config/avatarNames";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { getAvatarRank, hasAvatarRank } from "@/lib/avatarRank";

function avatarImageKey(avatar: AvatarCatalogItem): string {
  const imageId = avatarIdFromImageSrc(avatar.imageSrc);
  return imageId === null ? String(avatar.imageSrc ?? avatar.id) : String(canonicalAvatarImageId(imageId));
}

function ownedAvatarImageKeys(avatarCatalog: AvatarCatalogItem[], ownedAvatarLevels: Set<number>): Set<string> {
  return new Set(
    avatarCatalog
      .filter((avatar) => ownedAvatarLevels.has(avatar.level))
      .map(avatarImageKey),
  );
}

export function getEligibleSpinAvatars(
  avatarCatalog: AvatarCatalogItem[],
  rank: number,
  ownedAvatarLevels: Set<number>,
): AvatarCatalogItem[] {
  const ownedImageKeys = ownedAvatarImageKeys(avatarCatalog, ownedAvatarLevels);
  const seenPrizeImageKeys = new Set<string>();

  return avatarCatalog.filter((avatar) => {
    const imageKey = avatarImageKey(avatar);
    if (
      !hasAvatarRank(avatar) ||
      getAvatarRank(avatar) !== rank ||
      ownedAvatarLevels.has(avatar.level) ||
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
