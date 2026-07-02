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

describe("community chat Supabase persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends community messages through POST /api/chat/send", async () => {
    // Server-authoritative endpoint, not a browser-side RPC — identity comes
    // from the session cookie (see src/backend/supabase/controllers/chatController.ts).
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          ok: true,
          message: {
            id: "message-1",
            communityId: "community-1",
            senderId: "user-alice",
            senderName: "alice",
            text: "hello everyone",
            createdAt: "2026-06-02T09:00:00.000Z",
            likedBy: [],
            senderAvatarLevel: 3,
          },
        }),
    } as Response);

    const message = await sendMessage("community-1", {
      text: "hello everyone",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat/send",
      expect.objectContaining({ method: "POST" }),
    );
    expect(rpcMock).not.toHaveBeenCalled();
    expect(message.text).toBe("hello everyone");
    expect(message.senderAvatarLevel).toBe(3);
  });

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

    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await likeMessage("message-1", "user-bob");
    expect(rpcMock).toHaveBeenCalledWith("toggle_message_like", {
      p_message_id: "message-1",
    });
  });

  it("routes community membership writes through the appropriate server-authoritative path", async () => {
    // join goes through POST /api/communities/join (see communityController.ts —
    // no `join_community` RPC exists in supabase/migrations at all, and even if
    // it did, browser-side RPC calls can't carry the app's session identity).
    // leave/read/notifications still call RPCs pending the same migration.
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    } as Response);
    rpcMock.mockResolvedValue({ data: null, error: null });

    await joinCommunity("community-1", "user-alice", "alice");
    await leaveCommunity("community-1", "user-alice");
    await markCommunityRead("community-1", "user-alice");
    await setCommunityNotifications("community-1", "user-alice", false);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/communities/join",
      expect.objectContaining({ method: "POST" }),
    );
    expect(rpcMock).toHaveBeenNthCalledWith(1, "leave_community", { p_community_id: "community-1" });
    expect(rpcMock).toHaveBeenNthCalledWith(2, "mark_community_read", { p_community_id: "community-1" });
    expect(rpcMock).toHaveBeenNthCalledWith(3, "set_community_notifications", {
      p_community_id: "community-1",
      p_enabled: false,
    });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("updates community presentation via the admin-only RPC", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await updateCommunityPresentation("community-1", {
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
