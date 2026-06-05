import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/supabase/client", () => ({ supabase: {} }));

import { signIn } from "@/backend/supabase/controllers/authController";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth rate-limit errors", () => {
  it("shows a useful message when rate limiting is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "rate_limit_unavailable" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(signIn("william", "password")).resolves.toEqual({
      ok: false,
      error: "Authentication is temporarily unavailable. Please try again shortly.",
    });
  });
});
