import { describe, it, expect } from "vitest";
import { INVITE_PARAM, buildInviteUrl } from "@/lib/inviteLink";
import { buildInviteShareText } from "@/lib/foundingInvites";

// The share link (built in the share text) and the landing reader (LandingShell)
// share this contract: the param name and that the code survives the round trip.
describe("invite link", () => {
  it("builds a canonical signup URL carrying the code", () => {
    const url = new URL(buildInviteUrl("RAW-1-ABC123"));
    expect(url.host).toBe("www.myraw.app");
    expect(url.searchParams.get(INVITE_PARAM)).toBe("RAW-1-ABC123");
  });

  it("encodes codes so they round-trip intact", () => {
    const code = "RAW 1&2";
    expect(new URL(buildInviteUrl(code)).searchParams.get(INVITE_PARAM)).toBe(code);
  });

  it("share text embeds the invite link", () => {
    const text = buildInviteShareText("RAW-1-ABC123");
    expect(text).toContain(buildInviteUrl("RAW-1-ABC123"));
    expect(text).toContain("applied automatically");
  });
});
