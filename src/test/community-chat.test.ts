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

  it("sends community messages through the send_community_message RPC", async () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem");
    rpcMock.mockResolvedValueOnce({
      data: {
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
      },
      error: null,
    });

    const message = await sendMessage("community-1", {
      text: "hello everyone",
    });

    // Identity fields are not even part of the input type now — the SECURITY
    // DEFINER RPC derives sender from current_user_id().
    expect(rpcMock).toHaveBeenCalledWith("send_community_message", {
      p_community_id: "community-1",
      p_text: "hello everyone",
      p_reply_to_message_id: null,
    });
    expect(message.text).toBe("hello everyone");
    expect(message.senderAvatarLevel).toBe(3);
    expect(setItemSpy).not.toHaveBeenCalled();
  });

<<<<<<< Updated upstream
  it("deletes messages through delete_community_message and likes through toggle_message_like", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await deleteMessage("message-1", "user-alice");
    expect(rpcMock).toHaveBeenCalledWith("delete_community_message", {
      p_message_id: "message-1",
    });
    // The requesterId argument is NOT forwarded — the RPC verifies ownership
    // against the session user, not against a client-supplied id.
    const deleteArgs = rpcMock.mock.calls[0]?.[1] as Record<string, unknown> | undefined;
    expect(Object.keys(deleteArgs ?? {})).not.toContain("p_requester_id");
=======
  it("rejects blocked public chat text before persistence", () => {
    const community = readCommunityChats()[0];

    joinCommunityChat(community.id, { userId: "user-alice", username: "alice" });

    expect(() =>
      sendCommunityMessage(community.id, {
        senderId: "user-alice",
        senderName: "alice",
        text: "visit example.com",
      })
    ).toThrow("Links are not allowed");

    const updatedCommunity = readCommunityChats().find((entry) => entry.id === community.id);
    expect(updatedCommunity?.messages.some((message) => message.text.includes("example.com"))).toBe(false);
  });

  it("leaves a community and persists membership removal", () => {
    const community = readCommunityChats()[0];
>>>>>>> Stashed changes

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await likeMessage("message-1", "user-bob");
    expect(rpcMock).toHaveBeenCalledWith("toggle_message_like", {
      p_message_id: "message-1",
    });
  });

  it("routes community membership writes through SECURITY DEFINER RPCs", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await joinCommunity("community-1", "user-alice", "alice");
    await leaveCommunity("community-1", "user-alice");
    await markCommunityRead("community-1", "user-alice");
    await setCommunityNotifications("community-1", "user-alice", false);

    expect(rpcMock).toHaveBeenNthCalledWith(1, "join_community", { p_community_id: "community-1" });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "leave_community", { p_community_id: "community-1" });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "mark_community_read", { p_community_id: "community-1" });
    expect(rpcMock).toHaveBeenNthCalledWith(4, "set_community_notifications", {
      p_community_id: "community-1",
      p_enabled: false,
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("updates community presentation via the admin-only RPC", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

<<<<<<< Updated upstream
    await updateCommunityPresentation("community-1", {
=======
    joinCommunityChat(community.id, { userId: "user-alice", username: "alice" });
    joinCommunityChat(community.id, { userId: "user-bob", username: "bob" });
    markCommunityRead(community.id, "user-alice");

    sendCommunityMessage(community.id, {
      senderId: "user-bob",
      senderName: "bob",
      text: "new unread message",
    });

    const withUnread = readCommunityChats().find((entry) => entry.id === community.id)!;
    expect(countUnreadMessages(withUnread, "user-alice")).toBe(1);

    markCommunityRead(community.id, "user-alice");
    const afterRead = readCommunityChats().find((entry) => entry.id === community.id)!;
    expect(countUnreadMessages(afterRead, "user-alice")).toBe(0);
  });

  it("creates a live room from an approved community request", () => {
    createCommunityFromApprovedRequest({
      id: "community-request-123",
      requesterId: "user-jules",
      requesterName: "jules",
      communityName: "Writers Room",
      genre: "creative",
      focusArea: "writing and editing",
      audience: "people building drafts in public",
      whyNow: "A place for writers to workshop ideas live.",
      samplePrompt: "What are you struggling to write this week?",
      submittedAt: "2026-04-14T12:00:00.000Z",
      status: "approved",
      reviewedAt: "2026-04-14T12:30:00.000Z",
      reviewedBy: "admin",
    });

    const createdCommunity = readCommunityChats().find((entry) => entry.id === "request-community-request-123");

    expect(createdCommunity?.title).toBe("Writers Room");
    expect(createdCommunity?.messages[0]?.text).toBe("What are you struggling to write this week?");
  });

  it("lets only the creator update the community name and logo", () => {
    createCommunityFromApprovedRequest({
      id: "community-request-456",
      requesterId: "user-maya",
      requesterName: "maya",
      communityName: "Founders Circle",
      genre: "startup",
      focusArea: "operators and builders",
      audience: "people launching early-stage products",
      whyNow: "A place to compare notes while building in public.",
      samplePrompt: "What is the hardest thing about your current launch?",
      submittedAt: "2026-04-14T12:00:00.000Z",
      status: "approved",
      reviewedAt: "2026-04-14T12:30:00.000Z",
      reviewedBy: "admin",
    });

    const community = readCommunityChats().find((entry) => entry.id === "request-community-request-456")!;

    expect(canManageCommunity(community, "user-maya", "maya")).toBe(true);
    expect(canManageCommunity(community, "user-else", "someone-else")).toBe(false);

    const rejectedUpdate = updateCommunityPresentation(community.id, {
      actorUserId: "user-else",
      actorUsername: "someone-else",
      title: "Hijacked Name",
      logoUrl: "https://example.com/hijacked.png",
    });
    expect(rejectedUpdate).toBeNull();

    const creatorUpdate = updateCommunityPresentation(community.id, {
      actorUserId: "user-maya",
      actorUsername: "maya",
>>>>>>> Stashed changes
      title: "Builder Signal",
      logoUrl: "https://example.com/logo.png",
    });

    expect(rpcMock).toHaveBeenCalledWith("update_community_presentation", {
      p_community_id: "community-1",
      p_title: "Builder Signal",
      p_logo_url: "https://example.com/logo.png",
    });
    expect(fromMock).not.toHaveBeenCalled();
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
