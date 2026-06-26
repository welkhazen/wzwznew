import { describe, expect, it } from "vitest";
import { mapBlockedWord, normalizeBlockedWord } from "../api/_lib/blockedWordsStore.js";

describe("blocked words store helpers", () => {
  it("normalizes admin-entered blocked words before persistence", () => {
    expect(normalizeBlockedWord("  AdminTerm  ")).toBe("adminterm");
    expect(normalizeBlockedWord("")).toBe("");
    expect(normalizeBlockedWord(null)).toBe("");
  });

  it("maps Supabase rows to API records", () => {
    expect(
      mapBlockedWord({
        id: "word-1",
        term: "adminterm",
        normalized_term: "adminterm",
        created_at: "2026-06-26T10:00:00.000Z",
        created_by: "admin-1",
      }),
    ).toEqual({
      id: "word-1",
      term: "adminterm",
      normalizedTerm: "adminterm",
      createdAt: "2026-06-26T10:00:00.000Z",
      createdBy: "admin-1",
    });
  });
});
