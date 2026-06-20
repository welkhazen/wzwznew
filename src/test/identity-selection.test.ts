import { beforeEach, describe, expect, it, vi } from "vitest";
import { privateAvatarKey } from "@/lib/avataridentity";

const mocks = vi.hoisted(() => ({
  getChatIdentity: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/userController", () => ({
  getChatIdentity: mocks.getChatIdentity,
}));

import {
  CHAT_IDENTITY_PREFIX,
  hydrateChatIdentityFromServer,
  readSelectedChatAlias,
  writeSelectedChatAlias,
} from "@/lib/identitySelection";

describe("chat identity hydration", () => {
  const userId = "user-1";

  beforeEach(() => {
    window.localStorage.clear();
    mocks.getChatIdentity.mockReset();
  });

  it("leaves the local alias untouched when the server read fails", async () => {
    writeSelectedChatAlias(userId, "Local Mirror");
    mocks.getChatIdentity.mockRejectedValue(new Error("network unavailable"));

    await hydrateChatIdentityFromServer(userId);

    expect(readSelectedChatAlias(userId)).toBe("Local Mirror");
  });

  it("leaves the local alias untouched when no server row is confirmed", async () => {
    writeSelectedChatAlias(userId, "Local Mirror");
    mocks.getChatIdentity.mockResolvedValue(null);

    await hydrateChatIdentityFromServer(userId);

    expect(window.localStorage.getItem(`${CHAT_IDENTITY_PREFIX}${userId}`)).toBe("Local Mirror");
  });

  it("syncs confirmed server identity preferences", async () => {
    writeSelectedChatAlias(userId, "Local Mirror");
    mocks.getChatIdentity.mockResolvedValue({ alias: "Server Mirror", avatarLevel: 4 });

    await hydrateChatIdentityFromServer(userId);

    expect(readSelectedChatAlias(userId)).toBe("Server Mirror");
    expect(window.localStorage.getItem(privateAvatarKey(userId))).toBe("4");
  });
});
