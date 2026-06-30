import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCommunityChat } from "@/hooks/useCommunityChat";

const mocks = vi.hoisted(() => ({
  fetchCommunities: vi.fn(async () => ([])),
  fetchCommunityRequests: vi.fn(async () => ([])),
  fetchCommunityMessages: vi.fn(async () => ([])),
  markCommunityRead: vi.fn(),
  setCommunityNotifications: vi.fn(),
  touchMemberActivity: vi.fn(),
  sendMessage: vi.fn(),
  likeMessage: vi.fn(),
  joinCommunity: vi.fn(),
  getPublicUserProfile: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/communityController", () => ({
  fetchCommunities: mocks.fetchCommunities,
  fetchCommunityMessages: mocks.fetchCommunityMessages,
  joinCommunity: mocks.joinCommunity,
  markCommunityRead: mocks.markCommunityRead,
  setCommunityNotifications: mocks.setCommunityNotifications,
  touchMemberActivity: mocks.touchMemberActivity,
}));

vi.mock("@/backend/supabase/controllers/communityRequestController", () => ({
  fetchCommunityRequests: mocks.fetchCommunityRequests,
}));

vi.mock("@/backend/supabase/controllers/chatController", () => ({
  likeMessage: mocks.likeMessage,
  sendMessage: mocks.sendMessage,
}));

vi.mock("@/backend/supabase/controllers/userController", () => ({
  getPublicUserProfile: mocks.getPublicUserProfile,
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(async () => undefined),
  },
}));

vi.mock("@/hooks/useCommunityMessagesRealtime", () => ({
  useCommunityMessagesRealtime: vi.fn(),
}));

vi.mock("@/components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/communityChat.seed", () => ({
  buildDefaultCommunities: vi.fn(() => []),
}));

vi.mock("@/lib/communityCache", () => ({
  readCachedCommunities: vi.fn(() => null),
  readCachedMessages: vi.fn(() => null),
  writeCachedCommunities: vi.fn(),
  writeCachedMessages: vi.fn(),
}));

vi.mock("@/lib/blockedCommunitySenders", () => ({
  readBlockedCommunitySenders: vi.fn(() => []),
  writeBlockedCommunitySenders: vi.fn(),
}));

vi.mock("@/lib/adminData", () => ({
  readCommunityJoinRequests: vi.fn(() => []),
}));

vi.mock("@/lib/avatarCatalog", () => ({
  buildAvatarIdToLevelMap: vi.fn(() => ({})),
  readAvatarCatalogLocal: vi.fn(() => []),
}));

vi.mock("@/lib/avataridentity", () => ({
  getPrivateAvatarLevel: vi.fn(() => 0),
}));

vi.mock("@/lib/identitySelection", () => ({
  CHAT_IDENTITY_CHANGED_EVENT: "chat-identity-changed",
  readSelectedChatAlias: vi.fn(() => null),
}));

vi.mock("@/lib/communityChat", () => ({
  canManageCommunity: vi.fn(() => false),
  countOnlineMembers: vi.fn(() => 0),
  countUnreadMessages: vi.fn(() => 0),
  formatChatDayLabel: vi.fn(() => "Today"),
}));

vi.mock("@/lib/inputSecurity", () => ({
  getUserTextModerationMessage: vi.fn(() => ""),
  moderateUserText: vi.fn((text: string) => ({ allowed: true, text })),
}));

vi.mock("@/lib/chatSendError", () => ({
  getChatSendErrorInfo: vi.fn(() => ({ title: "Failed", description: "Try again" })),
}));

vi.mock("@/lib/communityPushNotifications", () => ({
  sendCommunityPushNotification: vi.fn(),
}));

describe("useCommunityChat reload debounce", () => {
  beforeEach(() => {
    mocks.fetchCommunities.mockClear();
    mocks.fetchCommunityRequests.mockClear();
    mocks.fetchCommunityMessages.mockClear();
  });

  it("debounces focus and storage reloads", async () => {
    const { unmount } = renderHook(() =>
      useCommunityChat(null, "user-1", "user", 0, ""),
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.fetchCommunities).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new StorageEvent("storage", { key: "raw.community.test" }));
      window.dispatchEvent(new Event("focus"));
    });

    expect(mocks.fetchCommunities).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.fetchCommunities).toHaveBeenCalledTimes(2);

    unmount();
    vi.useRealTimers();
  });
});
