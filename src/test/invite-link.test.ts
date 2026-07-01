import { describe, it, expect } from "vitest";
import { INVITE_PARAM, buildInviteUrl, whatsappShareUrl, facebookShareUrl } from "@/lib/inviteLink";

// The share link (built in DashboardProfile) and the landing reader (Index.tsx)
// share this contract: the param name and that the code survives the round trip.
describe("invite link", () => {
  it("builds a canonical signup URL carrying the code", () => {
    const url = new URL(buildInviteUrl("RAW-1-ABC123"));
    expect(url.host).toBe("www.myraw.app");
    expect(url.searchParams.get(INVITE_PARAM)).toBe("RAW-1-ABC123");
  });

  it("encodes codes so they round-trip intact", () => {
    const code = "RAW 1&2";
    const url = new URL(buildInviteUrl(code));
    expect(url.searchParams.get(INVITE_PARAM)).toBe(code);
  });

  it("builds a WhatsApp share intent with the message intact", () => {
    const msg = "Join raW: https://www.myraw.app/?invite=ABC";
    const url = new URL(whatsappShareUrl(msg));
    expect(url.host).toBe("wa.me");
    expect(url.searchParams.get("text")).toBe(msg);
  });

  it("builds a Facebook share dialog for the invite link", () => {
    const url = new URL(facebookShareUrl("https://www.myraw.app/?invite=ABC", "come join"));
    expect(url.host).toBe("www.facebook.com");
    expect(url.searchParams.get("u")).toBe("https://www.myraw.app/?invite=ABC");
    expect(url.searchParams.get("quote")).toBe("come join");
  });
});
