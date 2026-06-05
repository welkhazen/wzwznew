import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "../../api/_lib/rateLimit";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubProductionWithoutRedis(): void {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  vi.stubEnv("KV_REST_API_URL", "");
  vi.stubEnv("KV_REST_API_TOKEN", "");
}

describe("production rate-limit fallback", () => {
  it("allows login through the per-instance limiter when Redis is unavailable", async () => {
    stubProductionWithoutRedis();

    await expect(checkRateLimit("login", `login-no-redis-${crypto.randomUUID()}`)).resolves.toEqual({ ok: true });
  });

  it("allows signup through the per-instance limiter when Redis is unavailable", async () => {
    stubProductionWithoutRedis();

    await expect(checkRateLimit("signup", `signup-no-redis-${crypto.randomUUID()}`)).resolves.toEqual({ ok: true });
  });

  it("still enforces the login attempt limit without Redis", async () => {
    stubProductionWithoutRedis();
    const key = `limited-login-${crypto.randomUUID()}`;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(checkRateLimit("login", key)).resolves.toEqual({ ok: true });
    }
    await expect(checkRateLimit("login", key)).resolves.toEqual({ ok: false, reason: "rate_limited" });
  });

  it("keeps non-auth production writes fail-closed without Redis", async () => {
    stubProductionWithoutRedis();

    await expect(checkRateLimit("token_spend", `token-no-redis-${crypto.randomUUID()}`)).resolves.toEqual({
      ok: false,
      reason: "config_missing",
    });
  });
});
