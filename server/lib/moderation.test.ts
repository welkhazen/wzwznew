import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeText,
  countLinks,
  moderateText,
  invalidateBannedWordsCache,
} from "./moderation";

// ── mock supabaseAdmin ──────────────────────────────────────────────────────

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));

vi.mock("./supabaseClient", () => ({
  supabaseAdmin: { from: fromMock },
}));

// ── mock env (AI disabled so fetch is never called) ─────────────────────────

vi.mock("../config/env", () => ({
  env: { MODERATION_AI_ENABLED: "false" },
}));

// ── helpers ─────────────────────────────────────────────────────────────────

function makeBannedWordsChain(words: { normalized_word: string; action: string }[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: words }),
  };
  fromMock.mockReturnValue(chain);
  return chain;
}

function makeMessagesChain(messages: { text: string }[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: messages }),
  };
  fromMock.mockReturnValue(chain);
  return chain;
}

function makeUsersChain(createdAt: string | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: createdAt ? { created_at: createdAt } : null,
    }),
  };
  fromMock.mockReturnValue(chain);
  return chain;
}

// ── normalizeText ────────────────────────────────────────────────────────────

describe("normalizeText", () => {
  it("lowercases input", () => {
    expect(normalizeText("HELLO")).toBe("hello");
  });

  it("replaces l33t substitutions", () => {
    expect(normalizeText("h3ll0")).toBe("hello");
    expect(normalizeText("@ss")).toBe("ass");
    expect(normalizeText("$hit")).toBe("shit");
    expect(normalizeText("7est")).toBe("test");
  });

  it("collapses repeated chars beyond 2", () => {
    expect(normalizeText("heeello")).toBe("heello");
    expect(normalizeText("aaaa")).toBe("aa");
    expect(normalizeText("aa")).toBe("aa");
  });

  it("strips non-alphanumeric non-space chars (that are not l33t mappings)", () => {
    // ! maps to 'i' via l33t, then ??? are stripped → "helloii world"
    expect(normalizeText("hello!!! world???")).toBe("helloii world");
    // Chars with no l33t mapping are stripped cleanly
    expect(normalizeText("hello--- world###")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeText("hello   world")).toBe("hello world");
  });
});

// ── countLinks ───────────────────────────────────────────────────────────────

describe("countLinks", () => {
  it("returns 0 for plain text", () => {
    expect(countLinks("hello world")).toBe(0);
  });

  it("counts https:// URLs — pattern matches prefix and domain separately", () => {
    // LINK_PATTERN matches both 'https://' prefix AND 'example.com' as separate hits
    expect(countLinks("check https://example.com please")).toBe(2);
  });

  it("counts www. URLs — pattern matches www. prefix and domain separately", () => {
    expect(countLinks("visit www.example.com today")).toBe(2);
  });

  it("counts bare domain URLs as a single match", () => {
    expect(countLinks("go to example.io for info")).toBe(1);
  });

  it("counts all link-pattern matches across a message", () => {
    // https://a.com → 2, https://b.com → 2, www.c.org → 2 = 6
    expect(countLinks("https://a.com and https://b.com and www.c.org")).toBe(6);
  });
});

// ── moderateText ─────────────────────────────────────────────────────────────

describe("moderateText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateBannedWordsCache();
  });

  // Each test uses a unique userId to avoid the in-memory rate limiter
  // (5 msgs / 10 s) accumulating across test runs.

  it("allows clean messages with no banned words", async () => {
    makeBannedWordsChain([]);
    makeMessagesChain([]);

    const result = await moderateText("hello everyone", "uid-allow", "comm-1");
    expect(result.verdict).toBe("ALLOW");
  });

  it("blocks on a 'block' banned word", async () => {
    makeBannedWordsChain([{ normalized_word: "badword", action: "block" }]);

    const result = await moderateText("this is badword content", "uid-block", "comm-1");
    expect(result.verdict).toBe("BLOCK");
    expect(result.reason).toBe("banned_word");
    expect(result.matchedWord).toBe("badword");
  });

  it("holds on a 'hold' banned word", async () => {
    makeBannedWordsChain([{ normalized_word: "holdme", action: "hold" }]);

    const result = await moderateText("please holdme here", "uid-hold", "comm-1");
    expect(result.verdict).toBe("HOLD");
    expect(result.reason).toBe("banned_word");
  });

  it("warns on a 'warn' banned word", async () => {
    makeBannedWordsChain([{ normalized_word: "warnme", action: "warn" }]);

    const result = await moderateText("do not warnme please", "uid-warn", "comm-1");
    expect(result.verdict).toBe("WARN");
    expect(result.reason).toBe("banned_word");
  });

  it("detects l33tspeak banned words after normalization", async () => {
    makeBannedWordsChain([{ normalized_word: "badword", action: "block" }]);

    const result = await moderateText("b4dw0rd is here", "uid-l33t", "comm-1");
    expect(result.verdict).toBe("BLOCK");
  });

  it("blocks messages with more than 2 link-pattern hits", async () => {
    // A bare domain counts as 1 hit; 3 bare domains = 3 hits > MAX_LINKS (2)
    makeBannedWordsChain([]);

    const result = await moderateText(
      "check example.com, test.io and thing.app too",
      "uid-links",
      "comm-1",
    );
    expect(result.verdict).toBe("BLOCK");
    expect(result.reason).toBe("too_many_links");
  });

  it("blocks new users who send any link", async () => {
    fromMock
      // banned_words
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      })
      // isNewUser: users table
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { created_at: new Date().toISOString() },
        }),
      });

    const result = await moderateText("check example.com", "uid-newuser", "comm-1");
    expect(result.verdict).toBe("BLOCK");
    expect(result.reason).toBe("new_user_link_restricted");
  });

  it("blocks duplicate spam (same message sent 3+ times recently)", async () => {
    const sameText = "spam message";
    fromMock
      // banned_words
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [] }),
      })
      // isDuplicateSpam: community_messages
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ text: sameText }, { text: sameText }, { text: sameText }],
        }),
      });

    const result = await moderateText(sameText, "uid-spam", "comm-1");
    expect(result.verdict).toBe("BLOCK");
    expect(result.reason).toBe("duplicate_message");
  });
});
