import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("produces a bcrypt hash that verifies against the original password", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(verifyPassword("hunter2", hash)).resolves.toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await hashPassword("correct");
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
    await expect(verifyPassword("same", h1)).resolves.toBe(true);
    await expect(verifyPassword("same", h2)).resolves.toBe(true);
  });

  it("is sensitive to the pepper — wrong-pepper hash does not verify", async () => {
    // hashPassword always uses dev-pepper-16chars in test env.
    // A hash produced by a different pepper must fail verification because
    // the comparison string includes the pepper.
    const hashWithCurrentPepper = await hashPassword("pass123");
    // Simulate a stored hash produced with a different pepper by checking
    // that a plaintext without pepper doesn't match.
    const bcrypt = await import("bcryptjs");
    const hashWithoutPepper = await bcrypt.hash("pass123", 12);
    await expect(verifyPassword("pass123", hashWithoutPepper)).resolves.toBe(false);
    await expect(verifyPassword("pass123", hashWithCurrentPepper)).resolves.toBe(true);
  });
});
