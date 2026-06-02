import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage, deleteMessage, likeMessage } from "@/backend/supabase/controllers/chatController";
import {
  joinCommunity,
  leaveCommunity,
  markCommunityRead,
  setCommunityNotifications,
  updateCommunityPresentation,
} from "@/backend/supabase/controllers/communityController";
import { canManageCommunity, countUnreadMessages } from "@/lib/communityChat";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

function successfulSingle(data: unknown) {
  return {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data, error: null })),
      })),
    })),
  };
}

function successfulMutation() {
  const query = {
    upsert: vi.fn(async () => ({ error: null })),
    insert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    then: vi.fn((resolve: (value: { error: null }) => unknown) => resolve({ error: null })),
  };
  return query;
}

describe("community chat Supabase persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends community messages through Supabase only", async () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem");
    fromMock.mockReturnValueOnce(successfulSingle({
      id: "message-1",
      community_id: "community-1",
      sender_id: "user-alice",
      sender_name: "alice",
      text: "hello everyone",
      created_at: "2026-06-02T09:00:00.000Z",
      pinned: false,
      reply_to_message_id: null,
      reply_to_sender_name: null,
      reply_to_text: null,
      deleted_at: null,
      deleted_by_user_id: null,
      liked_by: null,
      sender_avatar_level: 3,
    }));

    const message = await sendMessage("community-1", {
      senderId: "user-alice",
      senderName: "alice",
      senderAvatarLevel: 3,
      text: "hello everyone",
    });

    expect(fromMock).toHaveBeenCalledWith("community_messages");
    expect(message.text).toBe("hello everyone");
    expect(message.senderAvatarLevel).toBe(3);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it("updates message deletes and likes through Supabase only", async () => {
    const deleteQuery = successfulMutation();
    fromMock.mockReturnValueOnce(deleteQuery);
    await deleteMessage("message-1", "user-alice");
    expect(fromMock).toHaveBeenCalledWith("community_messages");
    expect(deleteQuery.update).toHaveBeenCalledWith(expect.objectContaining({ deleted_by_user_id: "user-alice" }));

    rpcMock.mockResolvedValueOnce({ error: null });
    await likeMessage("message-1", "user-bob");
    expect(rpcMock).toHaveBeenCalledWith("toggle_message_like", {
      p_message_id: "message-1",
      p_user_id: "user-bob",
    });
  });

  it("stores community membership state in Supabase only", async () => {
    fromMock
      .mockReturnValueOnce(successfulMutation())
      .mockReturnValueOnce(successfulMutation())
      .mockReturnValueOnce(successfulMutation())
      .mockReturnValueOnce(successfulMutation());

    await joinCommunity("community-1", "user-alice", "alice");
    await leaveCommunity("community-1", "user-alice");
    await markCommunityRead("community-1", "user-alice");
    await setCommunityNotifications("community-1", "user-alice", false);

    expect(fromMock).toHaveBeenCalledTimes(4);
    expect(fromMock).toHaveBeenNthCalledWith(1, "community_members");
    expect(fromMock).toHaveBeenNthCalledWith(2, "community_members");
    expect(fromMock).toHaveBeenNthCalledWith(3, "community_members");
    expect(fromMock).toHaveBeenNthCalledWith(4, "community_members");
  });

  it("updates community presentation in Supabase only", async () => {
    const query = successfulMutation();
    fromMock.mockReturnValueOnce(query);

    await updateCommunityPresentation("community-1", {
      title: "Builder Signal",
      logoUrl: "https://example.com/logo.png",
    });

    expect(fromMock).toHaveBeenCalledWith("communities");
    expect(query.update).toHaveBeenCalledWith({
      title: "Builder Signal",
      abbr: "BS",
      logo_url: "https://example.com/logo.png",
    });
  });

  it("keeps unread counting as React-memory-only derived state", () => {
    const community: PersistedCommunityRecord = {
      id: "community-1",
      abbr: "C1",
      title: "Community",
      description: "Test",
      topic: "Test",
      status: "Active",
      createdAt: "2026-06-02T08:00:00.000Z",
      members: [
        {
          userId: "user-alice",
          username: "alice",
          joinedAt: "2026-06-02T08:00:00.000Z",
          lastSeenAt: "2026-06-02T08:00:00.000Z",
          lastReadAt: "2026-06-02T08:30:00.000Z",
          notificationsEnabled: true,
        },
      ],
      messages: [
        {
          id: "message-1",
          communityId: "community-1",
          senderId: "user-bob",
          senderName: "bob",
          text: "new unread message",
          createdAt: "2026-06-02T09:00:00.000Z",
        },
      ],
    };

    expect(countUnreadMessages(community, "user-alice")).toBe(1);
    expect(canManageCommunity({ ...community, createdBy: "user-alice" }, "user-alice", "alice")).toBe(true);
  });
});
