import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claimFreeSpinAvatar: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/avatarRewardsController", () => ({
  claimFreeSpinAvatar: mocks.claimFreeSpinAvatar,
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: {
    from: mocks.from,
    rpc: vi.fn(),
  },
}));

import {
  LANDING_WHEEL_SPIN_KEY,
  claimPendingLandingWheelAvatarForUser,
  readAvatarCatalogLocal,
  readOwnedAvatarIdsLocal,
} from "@/lib/avatarCatalog";

describe("landing wheel claim", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.claimFreeSpinAvatar.mockReset();
    mocks.upsert.mockReset();
    mocks.from.mockReset();
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ upsert: mocks.upsert });
  });

  it("does not grant a refreshed wheel prize when the server already has a spin claim", async () => {
    const userId = "user-alice";
    window.localStorage.setItem(
      LANDING_WHEEL_SPIN_KEY,
      JSON.stringify({ prizeId: "wheel-avatar-2", avatarId: "neon-lynx", spunAt: Date.now() }),
    );
    mocks.claimFreeSpinAvatar.mockResolvedValue({
      ok: true,
      avatarId: "silver-void",
      alreadyClaimed: true,
    });

    const result = await claimPendingLandingWheelAvatarForUser(userId);

    expect(result).toEqual({ status: "already_claimed", avatarId: "silver-void", level: 9 });
    expect(mocks.claimFreeSpinAvatar).toHaveBeenCalledWith(userId, "neon-lynx");
    expect(window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY)).toBeNull();
    expect(readOwnedAvatarIdsLocal(userId, readAvatarCatalogLocal())).toContain("silver-void");
    expect(readOwnedAvatarIdsLocal(userId, readAvatarCatalogLocal())).not.toContain("neon-lynx");
  });
});
