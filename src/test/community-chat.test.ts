import { beforeEach, describe, expect, it } from "vitest";
import {
  canManageCommunity,
  countUnreadMessages,
  createCommunityFromApprovedRequest,
  deleteCommunityMessage,
  joinCommunityChat,
  leaveCommunityChat,
  markCommunityRead,
  readCommunityChats,
  sendCommunityMessage,
  updateCommunityPresentation,
} from "@/lib/communityChat";

describe("community chat storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("joins a community and persists sent messages", () => {
    const community = readCommunityChats()[0];

    joinCommunityChat(community.id, { userId: "user-alice", username: "alice" });
    sendCommunityMessage(community.id, {
      senderId: "user-alice",
      senderName: "alice",
      text: "hello everyone",
    });

    const updatedCommunity = readCommunityChats().find((entry) => entry.id === community.id);

    expect(updatedCommunity?.members.some((member) => member.userId === "user-alice")).toBe(true);
    expect(updatedCommunity?.messages.at(-1)?.text).toBe("hello everyone");
  });

  it("leaves a community and persists membership removal", () => {
    const community = readCommunityChats()[0];

    joinCommunityChat(community.id, { userId: "user-alice", username: "alice" });
    leaveCommunityChat(community.id, "user-alice");

    const updatedCommunity = readCommunityChats().find((entry) => entry.id === community.id);

    expect(updatedCommunity?.members.some((member) => member.userId === "user-alice")).toBe(false);
  });

  it("stores reply metadata and supports deleting own messages", () => {
    const community = readCommunityChats()[0];

    joinCommunityChat(community.id, { userId: "user-alice", username: "alice" });
    sendCommunityMessage(community.id, {
      senderId: "user-alice",
      senderName: "alice",
      text: "first message",
    });

    const originalMessage = readCommunityChats().find((entry) => entry.id === community.id)?.messages.at(-1);
    expect(originalMessage).toBeDefined();

    sendCommunityMessage(community.id, {
      senderId: "user-alice",
      senderName: "alice",
      text: "reply message",
      replyToMessage: originalMessage ?? null,
    });

    const repliedMessage = readCommunityChats().find((entry) => entry.id === community.id)?.messages.at(-1);
    expect(repliedMessage?.replyToMessageId).toBe(originalMessage?.id);
    expect(repliedMessage?.replyToText).toBe("first message");

    deleteCommunityMessage(community.id, originalMessage!.id, "user-alice");
    const deletedMessage = readCommunityChats().find((entry) => entry.id === community.id)?.messages.find((message) => message.id === originalMessage?.id);
    expect(deletedMessage?.deletedAt).toBeTruthy();
    expect(deletedMessage?.text).toBe("This message was deleted.");
  });

  it("tracks unread counts and clears them when the community is read", () => {
    const community = readCommunityChats()[0];

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
      title: "Builder Signal",
      logoUrl: "https://example.com/logo.png",
    });

    expect(creatorUpdate?.title).toBe("Builder Signal");
    expect(creatorUpdate?.logoUrl).toBe("https://example.com/logo.png");
    expect(creatorUpdate?.abbr).toBe("BS");

    const persistedCommunity = readCommunityChats().find((entry) => entry.id === community.id);
    expect(persistedCommunity?.title).toBe("Builder Signal");
    expect(persistedCommunity?.logoUrl).toBe("https://example.com/logo.png");
  });

  it("normalizes malformed stored communities instead of crashing", () => {
    window.localStorage.setItem(
      "raw.community-chats.v1",
      JSON.stringify([
        {
          id: "broken-room",
          title: "Broken Room",
          members: null,
          messages: [
            {
              id: "bad-message",
              text: "hello",
            },
          ],
        },
      ])
    );

    const communities = readCommunityChats();
    const brokenRoom = communities.find((entry) => entry.id === "broken-room");

    expect(brokenRoom?.members).toEqual([]);
    expect(brokenRoom?.messages[0]?.senderName).toBe("unknown");
  });
});
