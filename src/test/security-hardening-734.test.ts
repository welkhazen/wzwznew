/**
 * Regression tests for PR #734 security hardening.
 *
 * These tests verify the CONTRACT of the security migrations at the
 * controller/hook layer using vitest mocks. Full DB-level verification
 * requires a live Supabase instance — see docs/security-staging-checklist.md.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "@/backend/supabase/controllers/chatController";
import { getChatSendErrorInfo } from "@/lib/chatSendError";

// ─── Supabase mock setup ────────────────────────────────────────────────────

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: { from: fromMock, rpc: rpcMock },
}));

// ─── 1. Chat blocked-word enforcement ───────────────────────────────────────

describe("send_community_message RPC — blocked-word enforcement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when the RPC returns a blocked_word error", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "blocked_word", code: "P0001" },
    });

    await expect(
      sendMessage("community-1", { text: "some blocked content" }),
    ).rejects.toThrow("blocked_word");

    expect(rpcMock).toHaveBeenCalledWith("send_community_message", expect.objectContaining({
      p_community_id: "community-1",
      p_text: "some blocked content",
    }));
  });

  it("succeeds when the RPC returns a valid message", async () => {
    rpcMock.mockResolvedValueOnce({
      data: {
        id: "msg-ok",
        community_id: "community-1",
        sender_id: "user-1",
        sender_name: "alice",
        text: "hello world",
        created_at: "2026-06-30T10:00:00Z",
        liked_by: [],
        reply_to_message_id: null,
        reply_to_sender_name: null,
        reply_to_text: null,
        deleted_at: null,
        deleted_by_user_id: null,
        sender_avatar_level: 2,
      },
      error: null,
    });

    const msg = await sendMessage("community-1", { text: "hello world" });
    expect(msg.text).toBe("hello world");
    expect(msg.id).toBe("msg-ok");
  });

  it("throws for other RPC errors (non-blocked)", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: "not_a_member", code: "42501" },
    });

    await expect(
      sendMessage("community-1", { text: "hello" }),
    ).rejects.toThrow("not_a_member");
  });
});

// ─── 2. getChatSendErrorInfo classifies errors for UX ───────────────────────

describe("getChatSendErrorInfo — RLS error classification", () => {
  it("blocked_word → non-retryable specific toast", () => {
    const info = getChatSendErrorInfo(new Error("blocked_word"));
    expect(info.title).toBe("Message blocked");
    expect(info.description).toBe("That message contains blocked content.");
    expect(info.retryable).toBe(false);
  });

  it("network failure → retryable generic toast", () => {
    const info = getChatSendErrorInfo(new Error("Failed to fetch"));
    expect(info.title).toBe("Failed to send message");
    expect(info.retryable).toBe(true);
  });

  it("not_a_member → non-retryable", () => {
    expect(getChatSendErrorInfo(new Error("not_a_member")).retryable).toBe(false);
  });

  it("unauthorized → non-retryable", () => {
    expect(getChatSendErrorInfo(new Error("unauthorized")).retryable).toBe(false);
  });
});

// ─── 3. user-owned table RLS — controller layer (mock-level) ────────────────
//
// The controller passes userId to .eq('user_id', userId). With the new RLS,
// a row where user_id !== auth.uid() will be silently rejected by Postgres.
// Here we verify that:
//   a) the controller does NOT add any secondary client-side ownership check
//      (it relies on RLS, not application-layer filtering), and
//   b) when Supabase returns an RLS violation error, the controller propagates it.

describe("user_favorite_communities — ownership enforced by RLS not by controller", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propagates RLS rejection when another user's row is targeted", async () => {
    const { setUserFavoriteCommunities } = await import(
      "@/backend/supabase/controllers/userExtrasController"
    );

    const deleteChain = { eq: vi.fn().mockResolvedValueOnce({ error: { message: "42501: permission denied", code: "42501" } }) };
    fromMock.mockReturnValueOnce({ delete: vi.fn().mockReturnValue(deleteChain) });

    await expect(
      setUserFavoriteCommunities("other-user-id", []),
    ).rejects.toThrow();
  });

  it("succeeds (no error) when Supabase returns no error", async () => {
    const { setUserFavoriteCommunities } = await import(
      "@/backend/supabase/controllers/userExtrasController"
    );

    const deleteChain = { eq: vi.fn().mockResolvedValueOnce({ error: null }) };
    fromMock.mockReturnValueOnce({ delete: vi.fn().mockReturnValue(deleteChain) });

    await expect(setUserFavoriteCommunities("own-user-id", [])).resolves.not.toThrow();
  });
});


// ─── 4. communities — anon cannot insert (mock-level contract) ──────────────
//
// The migration revokes INSERT on communities from anon. At the mock level we
// verify the controller does NOT attempt direct table inserts on `communities`
// for non-admin paths — community creation goes through RPCs only.

describe("communities — no direct table writes from non-admin controller paths", () => {
  beforeEach(() => vi.clearAllMocks());

  it("community presentation update goes through RPC, not direct table write", async () => {
    const { updateCommunityPresentation } = await import(
      "@/backend/supabase/controllers/communityController"
    );

    rpcMock.mockResolvedValueOnce({ data: null, error: null });

    await updateCommunityPresentation("community-1", { title: "New Title" });

    // Must use rpc, never direct .from('communities').update(...)
    expect(rpcMock).toHaveBeenCalledWith("update_community_presentation", expect.any(Object));
    expect(fromMock).not.toHaveBeenCalledWith("communities");
  });
});
