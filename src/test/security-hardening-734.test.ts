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
//
// sendMessage() calls POST /api/chat/send (server-authoritative, identity from
// the session cookie) rather than the send_community_message RPC directly —
// supabase-js's rpc()/from() calls cannot carry the app's minted access token
// from the browser (see docs/architecture-review.md A2). api/chat/send.ts
// mirrors the RPC's exact error codes (blocked_word, not_a_member, ...) so
// getChatSendErrorInfo() classifies them identically either way.

function mockFetchResponse(body: unknown, ok: boolean, status = ok ? 200 : 400) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe("POST /api/chat/send — blocked-word enforcement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws when the endpoint returns a blocked_word error", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      mockFetchResponse({ error: "blocked_word" }, false, 422),
    );

    await expect(
      sendMessage("community-1", { text: "some blocked content" }),
    ).rejects.toThrow("blocked_word");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat/send",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init!.body as string)).toMatchObject({
      communityId: "community-1",
      text: "some blocked content",
    });
  });

  it("succeeds when the endpoint returns a valid message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      mockFetchResponse(
        {
          ok: true,
          message: {
            id: "msg-ok",
            communityId: "community-1",
            senderId: "user-1",
            senderName: "alice",
            text: "hello world",
            createdAt: "2026-06-30T10:00:00Z",
            likedBy: [],
            senderAvatarLevel: 2,
          },
        },
        true,
      ),
    );

    const msg = await sendMessage("community-1", { text: "hello world" });
    expect(msg.text).toBe("hello world");
    expect(msg.id).toBe("msg-ok");
  });

  it("throws for other endpoint errors (non-blocked)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      mockFetchResponse({ error: "not_a_member" }, false, 403),
    );

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
