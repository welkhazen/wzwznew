import { afterEach, describe, expect, it } from "vitest";
import {
  assertUserTextAllowed,
  moderateUserText,
  parseUserTextDenylist,
  UserTextModerationError,
} from "@/lib/inputSecurity";
import { writeBlockedWords } from "@/lib/adminData";

describe("user text moderation", () => {
  afterEach(() => {
    writeBlockedWords([]);
  });

  it("allows normal public text and normalizes whitespace", () => {
    const result = moderateUserText("  hello   everyone  ", { denylist: [] });

    expect(result.allowed).toBe(true);
    expect(result.text).toBe("hello everyone");
    expect(result.violations).toEqual([]);
  });

  it("blocks configured denylist terms as whole words", () => {
    const result = moderateUserText("please blockme now", { denylist: ["blockme"] });

    expect(result.allowed).toBe(false);
    expect(result.violations[0]).toMatchObject({ type: "denylist", value: "blockme" });
    expect(moderateUserText("this is unblockme", { denylist: ["blockme"] }).allowed).toBe(true);
  });

  it("blocks links and phone-like number sequences", () => {
    expect(moderateUserText("visit example.com", { denylist: [] }).violations).toContainEqual({ type: "link" });
    expect(moderateUserText("text me at 555-123-4567", { denylist: [] }).violations).toContainEqual({ type: "number" });
    expect(moderateUserText("I scored 100%", { denylist: [] }).allowed).toBe(true);
  });

  it("parses comma and newline separated denylist config", () => {
    expect(parseUserTextDenylist("Alpha, beta\nalpha")).toEqual(["alpha", "beta"]);
  });

  it("blocks admin-managed denylist terms by default", () => {
    writeBlockedWords(["adminterm"]);

    const result = moderateUserText("please hide adminterm");

    expect(result.allowed).toBe(false);
    expect(result.violations[0]).toMatchObject({ type: "denylist", value: "adminterm" });
  });

  it("throws a moderation error from assertUserTextAllowed", () => {
    expect(() => assertUserTextAllowed("https://example.com", { denylist: [] })).toThrow(UserTextModerationError);
  });
});
