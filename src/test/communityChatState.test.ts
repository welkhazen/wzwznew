import { describe, expect, it } from "vitest";
import {
  appendOptimisticMessage,
  markCommunityMessageFailed,
  mergeCommunityMessageList,
  mergeCommunityMessages,
  removeCommunityMessage,
  replaceCommunityMessage,
  setCommunityMessages,
  updateMessageLike,
  upsertCommunityMessage,
} from "@/lib/communityChatState";
import type {
  CommunityChatMessageRecord,
  PersistedCommunityRecord,
} from "@/lib/communityChat.types";

function makeMessage(
  id: string,
  createdAt: string,
  overrides: Partial<CommunityChatMessageRecord> = {},
): CommunityChatMessageRecord {
  return {
    id,
    communityId: "c1",
    senderId: "u1",
    senderName: "alice",
    text: `msg-${id}`,
    createdAt,
    ...overrides,
  };
}

function makeCommunity(messages: CommunityChatMessageRecord[]): PersistedCommunityRecord {
  return {
    id: "c1",
    abbr: "C1",
    title: "C1",
    description: "",
    topic: "",
    status: "Active",
    createdAt: "2026-01-01T00:00:00.000Z",
    members: [],
    messages,
  };
}

describe("communityChatState", () => {
  it("upsertCommunityMessage adds a new message in createdAt order", () => {
    const state = [makeCommunity([makeMessage("a", "2026-01-01T00:00:01.000Z")])];
    const next = upsertCommunityMessage(state, "c1", makeMessage("b", "2026-01-01T00:00:00.000Z"));
    expect(next[0].messages.map((m) => m.id)).toEqual(["b", "a"]);
  });

  it("upsertCommunityMessage replaces a pending optimistic copy in place", () => {
    const pending = makeMessage("optimistic-1", "2026-01-01T00:00:02.000Z", {
      text: "hello",
      deliveryStatus: "sending",
    });
    const state = [makeCommunity([pending])];
    const confirmed = makeMessage("server-1", "2026-01-01T00:00:02.000Z", { text: "hello" });
    const next = upsertCommunityMessage(state, "c1", confirmed);
    expect(next[0].messages).toHaveLength(1);
    expect(next[0].messages[0].id).toBe("server-1");
    expect(next[0].messages[0].deliveryStatus).toBeUndefined();
  });

  it("removeCommunityMessage drops only the targeted id", () => {
    const state = [
      makeCommunity([
        makeMessage("a", "2026-01-01T00:00:00.000Z"),
        makeMessage("b", "2026-01-01T00:00:01.000Z"),
      ]),
    ];
    const next = removeCommunityMessage(state, "c1", "a");
    expect(next[0].messages.map((m) => m.id)).toEqual(["b"]);
  });

  it("setCommunityMessages replaces the whole list for one community", () => {
    const state = [
      makeCommunity([makeMessage("a", "2026-01-01T00:00:00.000Z")]),
      { ...makeCommunity([makeMessage("z", "2026-01-01T00:00:00.000Z")]), id: "c2" },
    ];
    const next = setCommunityMessages(state, "c1", [makeMessage("b", "2026-01-01T00:00:05.000Z")]);
    expect(next[0].messages.map((m) => m.id)).toEqual(["b"]);
    expect(next[1].messages.map((m) => m.id)).toEqual(["z"]); // unchanged
  });

  it("mergeCommunityMessageList dedupes by id, latest wins", () => {
    const older = [makeMessage("a", "2026-01-01T00:00:00.000Z", { text: "stale" })];
    const newer = [makeMessage("a", "2026-01-01T00:00:00.000Z", { text: "fresh" })];
    const merged = mergeCommunityMessageList(older, newer);
    expect(merged).toHaveLength(1);
    expect(merged[0].text).toBe("fresh");
  });

  it("replaceCommunityMessage swaps the optimistic id for the real one", () => {
    const optimistic = makeMessage("optimistic-1", "2026-01-01T00:00:01.000Z", {
      deliveryStatus: "sending",
    });
    const state = [makeCommunity([optimistic])];
    const confirmed = makeMessage("server-1", "2026-01-01T00:00:01.000Z");
    const next = replaceCommunityMessage(state, "c1", "optimistic-1", confirmed);
    expect(next[0].messages.map((m) => m.id)).toEqual(["server-1"]);
  });

  it("markCommunityMessageFailed flips deliveryStatus to 'failed'", () => {
    const state = [
      makeCommunity([makeMessage("a", "2026-01-01T00:00:00.000Z", { deliveryStatus: "sending" })]),
    ];
    const next = markCommunityMessageFailed(state, "c1", "a");
    expect(next[0].messages[0].deliveryStatus).toBe("failed");
  });

  it("appendOptimisticMessage inserts with deliveryStatus 'sending'", () => {
    const state = [makeCommunity([])];
    const next = appendOptimisticMessage(
      state,
      "c1",
      makeMessage("o1", "2026-01-01T00:00:00.000Z"),
    );
    expect(next[0].messages[0].deliveryStatus).toBe("sending");
  });

  it("appendOptimisticMessage appends without sort when message is newer than the tail", () => {
    const state = [
      makeCommunity([
        makeMessage("a", "2026-01-01T00:00:01.000Z"),
        makeMessage("b", "2026-01-01T00:00:02.000Z"),
      ]),
    ];
    const next = appendOptimisticMessage(
      state,
      "c1",
      makeMessage("c", "2026-01-01T00:00:03.000Z"),
    );
    expect(next[0].messages.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("appendOptimisticMessage replaces a duplicate optimistic id", () => {
    const state = [
      makeCommunity([
        makeMessage("o1", "2026-01-01T00:00:01.000Z", {
          text: "hello",
          deliveryStatus: "sending",
        }),
      ]),
    ];
    const next = appendOptimisticMessage(
      state,
      "c1",
      makeMessage("o1", "2026-01-01T00:00:01.000Z", { text: "hello" }),
    );
    expect(next[0].messages).toHaveLength(1);
    expect(next[0].messages[0].deliveryStatus).toBe("sending");
    expect(next[0].messages[0].text).toBe("hello");
  });

  it("updateMessageLike updates likedBy for the target message only", () => {
    const state = [
      makeCommunity([
        makeMessage("a", "2026-01-01T00:00:00.000Z", { likedBy: [] }),
        makeMessage("b", "2026-01-01T00:00:01.000Z", { likedBy: [] }),
      ]),
    ];
    const next = updateMessageLike(state, "c1", "a", ["u1", "u2"]);
    expect(next[0].messages[0].likedBy).toEqual(["u1", "u2"]);
    expect(next[0].messages[1].likedBy).toEqual([]); // unchanged
  });

  it("mergeCommunityMessages appends without sort when incoming is newer than tail", () => {
    const existing = [
      makeMessage("a", "2026-01-01T00:00:01.000Z"),
      makeMessage("b", "2026-01-01T00:00:02.000Z"),
    ];
    const incoming = makeMessage("c", "2026-01-01T00:00:03.000Z");
    const result = mergeCommunityMessages(existing, incoming);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("mergeCommunityMessages sorts when incoming is older than tail (backfill)", () => {
    const existing = [
      makeMessage("a", "2026-01-01T00:00:01.000Z"),
      makeMessage("c", "2026-01-01T00:00:03.000Z"),
    ];
    const incoming = makeMessage("b", "2026-01-01T00:00:02.000Z");
    const result = mergeCommunityMessages(existing, incoming);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});
