import { avatarIdFromImageSrc, canonicalAvatarImageId } from "@/config/avatarNames";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";

export function avatarImageKey(avatar: AvatarCatalogItem): string {
  const imageId = avatarIdFromImageSrc(avatar.imageSrc);
  return imageId === null ? String(avatar.imageSrc ?? avatar.id) : String(canonicalAvatarImageId(imageId));
}

export function catalogLevelAt(index: number): number {
  return index + 1;
}

export function isCatalogAvatarOwned(index: number, ownedAvatarLevels: Set<number>): boolean {
  return ownedAvatarLevels.has(catalogLevelAt(index));
}

export function ownedAvatarImageKeys(avatarCatalog: AvatarCatalogItem[], ownedAvatarLevels: Set<number>): Set<string> {
  return new Set(
    avatarCatalog
      .filter((_, index) => isCatalogAvatarOwned(index, ownedAvatarLevels))
      .map(avatarImageKey),
  );
}
