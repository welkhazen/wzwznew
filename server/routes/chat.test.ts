import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import session from "express-session";
import request from "supertest";
import { chatRouter } from "./chat";

// ── mocks ────────────────────────────────────────────────────────────────────

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("../lib/supabaseClient", () => ({
  supabaseAdmin: { from: fromMock },
}));

vi.mock("../lib/moderation", () => ({
  moderateText: vi.fn().mockResolvedValue({ verdict: "ALLOW" }),
}));

vi.mock("../lib/admin", () => ({
  isUserAdmin: vi.fn().mockResolvedValue(false),
}));

vi.mock("../lib/audit", () => ({
  audit: vi.fn(),
}));

import { moderateText } from "../lib/moderation";
import { isUserAdmin } from "../lib/admin";

// ── test app ──────────────────────────────────────────────────────────────────

function buildApp(userId?: string) {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret-32-chars-long-enough!",
      resave: false,
      saveUninitialized: true,
    }),
  );
  // Inject userId into session for every request
  if (userId) {
    app.use((req, _res, next) => {
      (req.session as Record<string, unknown>).userId = userId;
      next();
    });
  }
  app.use("/api/chat", chatRouter);
  return app;
}

// ── DB mock helpers ───────────────────────────────────────────────────────────

const USER_ROW = {
  id: "user-1",
  username: "alice",
  avatar_level: 3,
  moderation_status: "ok",
};

const MESSAGE_ROW = {
  id: "msg-1",
  community_id: "comm-1",
  sender_id: "user-1",
  sender_name: "alice",
  sender_avatar_level: 3,
  text: "hello",
  created_at: "2026-06-11T00:00:00.000Z",
  pinned: false,
  liked_by: [],
  moderation_status: "ok",
};

function mockUserAndMember(userRow = USER_ROW, hasMember = true) {
  // users.select().eq().single()
  fromMock.mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: userRow, error: null }),
  });
  // community_members.select().eq().eq().maybeSingle()
  fromMock.mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: hasMember ? { user_id: userRow.id } : null,
    }),
  });
}

function mockInsertMessage(row = MESSAGE_ROW) {
  fromMock.mockReturnValueOnce({
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  });
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("POST /api/chat/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moderateText).mockResolvedValue({ verdict: "ALLOW" });
    vi.mocked(isUserAdmin).mockResolvedValue(false);
  });

  it("returns 401 when not authenticated", async () => {
    const app = buildApp(); // no userId
    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello" });
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing communityId", async () => {
    const app = buildApp("user-1");
    const res = await request(app)
      .post("/api/chat/send")
      .send({ text: "hello" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty text", async () => {
    const app = buildApp("user-1");
    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "   " });
    expect(res.status).toBe(400);
  });

  it("returns 400 for text over 2000 chars", async () => {
    const app = buildApp("user-1");
    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  it("sends a message successfully for a member", async () => {
    const app = buildApp("user-1");
    mockUserAndMember();
    mockInsertMessage();

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.message.text).toBe("hello");
    expect(res.body.message.senderAvatarLevel).toBe(3);
  });

  it("sets moderation_status to 'ok' for an ALLOW verdict", async () => {
    const app = buildApp("user-1");
    mockUserAndMember();
    mockInsertMessage({ ...MESSAGE_ROW, moderation_status: "ok" });

    await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "clean message" });

    const insertCall = fromMock.mock.calls.find(
      (c) => c[0] === "community_messages",
    );
    expect(insertCall).toBeDefined();
    const insertArg = (fromMock.mock.results.find(
      (_, i) => fromMock.mock.calls[i]?.[0] === "community_messages",
    )?.value as { insert: ReturnType<typeof vi.fn> })?.insert?.mock?.calls?.[0]?.[0];
    expect(insertArg?.moderation_status).toBe("ok");
  });

  it("returns 403 for a banned user", async () => {
    const app = buildApp("user-1");
    // users query returns banned user
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { ...USER_ROW, moderation_status: "banned" },
        error: null,
      }),
    });

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/banned/i);
  });

  it("returns 403 for non-member non-admin", async () => {
    const app = buildApp("user-1");
    mockUserAndMember(USER_ROW, false); // not a member

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/member/i);
  });

  it("allows admin to send even if not a member", async () => {
    vi.mocked(isUserAdmin).mockResolvedValue(true);
    const app = buildApp("user-1");
    mockUserAndMember(USER_ROW, false); // not a member, but admin
    mockInsertMessage();

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "admin message" });

    expect(res.status).toBe(200);
  });

  it("returns 403 when moderation blocks the message", async () => {
    vi.mocked(moderateText).mockResolvedValue({
      verdict: "BLOCK",
      reason: "banned_word",
    });
    const app = buildApp("user-1");
    mockUserAndMember();

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "blocked content" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/blocked/i);
  });

  it("uses the provided avatarLevel when sending", async () => {
    const app = buildApp("user-1");
    mockUserAndMember();
    mockInsertMessage({ ...MESSAGE_ROW, sender_avatar_level: 7 });

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello", avatarLevel: 7 });

    expect(res.status).toBe(200);
    expect(res.body.message.senderAvatarLevel).toBe(7);
  });

  it("trims whitespace from the message text", async () => {
    const app = buildApp("user-1");
    mockUserAndMember();
    mockInsertMessage({ ...MESSAGE_ROW, text: "hello" });

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "  hello  " });

    expect(res.status).toBe(200);
    // The insert should have been called with trimmed text
    const communityMessagesResults = fromMock.mock.results.filter(
      (_, i) => fromMock.mock.calls[i]?.[0] === "community_messages",
    );
    const insertMock = (communityMessagesResults[0]?.value as { insert: ReturnType<typeof vi.fn> })?.insert;
    expect(insertMock?.mock?.calls?.[0]?.[0]?.text).toBe("hello");
  });

  it("returns 500 when the DB insert fails", async () => {
    const app = buildApp("user-1");
    mockUserAndMember();
    // insert returns an error
    fromMock.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } }),
    });

    const res = await request(app)
      .post("/api/chat/send")
      .send({ communityId: "comm-1", text: "hello" });

    expect(res.status).toBe(500);
  });
});
