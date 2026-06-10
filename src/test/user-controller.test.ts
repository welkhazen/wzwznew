import { beforeEach, describe, expect, it, vi } from "vitest";

const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: { from: vi.fn() },
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: supabaseMock,
}));

vi.mock("@/backend/supabase/controllers/userExtrasController", () => ({
  getUserFavoriteCommunities: vi.fn().mockResolvedValue([]),
  getUserPinnedMessages: vi.fn().mockResolvedValue([]),
}));

import { getPublicUserProfile } from "@/backend/supabase/controllers/userController";

describe("getPublicUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("respects the stored profile_public flag instead of forcing the profile to be public", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        username: "public-name",
        role: "member",
        avatar_level: 4,
        created_at: "2024-01-01T00:00:00.000Z",
        profile_public: false,
      },
      error: null,
    });

    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    supabaseMock.from.mockReturnValue({ select } as never);

    const profile = await getPublicUserProfile("user-1");

    expect(profile).toEqual(
      expect.objectContaining({
        id: "user-1",
        username: null,
        role: null,
        createdAt: null,
        profilePublic: false,
      }),
    );
  });
});
