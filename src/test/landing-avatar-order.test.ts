import { describe, expect, it } from "vitest";
import {
  LANDING_CHOOSER_AVATARS,
  LANDING_UNLOCKABLE_FEATURE_ORDER,
  getLandingUnlockableAvatars,
} from "@/lib/landingAvatarOrder";

describe("landing avatar order", () => {
  it("keeps featured unlockables first in landing order", () => {
    expect(getLandingUnlockableAvatars().slice(0, LANDING_UNLOCKABLE_FEATURE_ORDER.length).map((avatar) => avatar.name)).toEqual([
      ...LANDING_UNLOCKABLE_FEATURE_ORDER,
    ]);
  });

  it("keeps the free chooser order stable for onboarding", () => {
    expect(LANDING_CHOOSER_AVATARS.map((avatar) => avatar.imageSrc)).toEqual([
      "/avatars/avatar-3.svg",
      "/avatars/avatar-1.svg",
      "/avatars/avatar-5.svg",
      "/avatars/avatar-6.svg",
      "/avatars/avatar-2.svg",
      "/avatars/avatar-4.svg",
      "/avatars/avatar-7.svg",
      "/avatars/avatar-10.svg",
    ]);
  });
});
