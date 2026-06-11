import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendDashboardCommunityMessage } from "@/lib/communityChatSend";
import { readCommunityChats } from "@/lib/communityChat";

beforeEach(() => {
  window.localStorage.clear();
});

describe("sendDashboardCommunityMessage", () => {
  it("returns the remote message when the Supabase send succeeds", async () => {
    const remoteMessage = {
      id: "remote-message-1",
      communityId: "lnt",
      senderId: "user-alice",
      senderName: "alice",
      text: "hello late night",
      createdAt: "2026-06-11T00:00:00.000Z",
      likedBy: [],
    };
    const joinCommunity = vi.fn().mockResolvedValue(undefined);
    const sendMessage = vi.fn().mockResolvedValue(remoteMessage);

    const result = await sendDashboardCommunityMessage({
      communityId: "lnt",
      senderId: "user-alice",
      username: "alice",
      senderName: "alice",
      text: "hello late night",
      isJoined: false,
    }, { joinCommunity, sendMessage });

    expect(joinCommunity).toHaveBeenCalledWith("lnt", "user-alice", "alice");
    expect(result).toEqual({ message: remoteMessage, usedLocalFallback: false });
  });

  it("falls back to local community storage when the Supabase insert fails", async () => {
    const joinCommunity = vi.fn().mockResolvedValue(undefined);
    const sendMessage = vi.fn().mockRejectedValue(new Error("server unavailable"));

    const result = await sendDashboardCommunityMessage({
      communityId: "lnt",
      senderId: "user-alice",
      username: "alice",
      senderName: "alice",
      senderAvatarLevel: 2,
      text: "testing late night talks",
      isJoined: true,
    }, { joinCommunity, sendMessage });

    expect(result.usedLocalFallback).toBe(true);
    expect(result.message).toMatchObject({
      communityId: "lnt",
      senderId: "user-alice",
      senderName: "alice",
      text: "testing late night talks",
    });
    expect(result.message.deliveryStatus).toBeUndefined();
    expect(readCommunityChats().find((community) => community.id === "lnt")?.messages.at(-1)?.text).toBe("testing late night talks");
  });

  it("falls back to local community storage when joining through Supabase fails", async () => {
    const joinCommunity = vi.fn().mockRejectedValue(new Error("join failed"));
    const sendMessage = vi.fn();

    const result = await sendDashboardCommunityMessage({
      communityId: "lnt",
      senderId: "user-alice",
      username: "alice",
      senderName: "alice",
      text: "join failure fallback",
      isJoined: false,
    }, { joinCommunity, sendMessage });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(result.usedLocalFallback).toBe(true);
    expect(result.message.text).toBe("join failure fallback");
  });
});
