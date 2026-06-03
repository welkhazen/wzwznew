import { describe, expect, it } from "vitest";
import { getPollShareCode, resolvePollShareCode } from "@/lib/pollShare";
import type { Poll } from "@/store/types";

const polls: Poll[] = [
  {
    id: "a1000000-0000-0000-0000-000000000020",
    question: "Do you think you are the main character of your life?",
    options: [],
    locked: false,
  },
  {
    id: "a1000000-0000-0000-0000-000000000021",
    question: "Is it wrong to flirt with someone who is in a relationship?",
    options: [],
    locked: false,
  },
];

describe("poll share codes", () => {
  it("does not expose the source poll id", () => {
    const code = getPollShareCode(polls[0].id);

    expect(code).toMatch(/^raw-[a-z0-9]+$/);
    expect(code).not.toContain(polls[0].id);
    expect(code).not.toContain("000000000020");
  });

  it("resolves a share code back to the matching poll", () => {
    const code = getPollShareCode(polls[0].id);

    expect(resolvePollShareCode(polls, code)).toBe(polls[0].id);
  });
});

