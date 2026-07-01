import { describe, it, expect, beforeEach } from "vitest";
import { readFoundingInviteCodes, FOUNDING_INVITE_COUNT } from "@/lib/foundingInvites";

// Home and Profile both derive their codes from readFoundingInviteCodes. If it
// generated a fresh random set on every empty-storage read, the two surfaces
// could show different codes. Persisting on first generate keeps them identical.
describe("founding invite codes stay in sync across surfaces", () => {
  beforeEach(() => localStorage.clear());

  it("returns the same codes on repeated reads (persisted on first generate)", () => {
    const first = readFoundingInviteCodes("user-1");
    const second = readFoundingInviteCodes("user-1");
    expect(first).toHaveLength(FOUNDING_INVITE_COUNT);
    expect(second).toEqual(first);
  });

  it("keeps different users' codes separate", () => {
    const a = readFoundingInviteCodes("user-a");
    const b = readFoundingInviteCodes("user-b");
    expect(a).not.toEqual(b);
  });
});
