import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimitRedisConfig } from "../../api/_lib/rateLimit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rateLimitRedisConfig", () => {
  it("accepts native Upstash credentials", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");

    expect(rateLimitRedisConfig()).toEqual({ url: "https://upstash.example.com", token: "upstash-token" });
  });

  it("accepts Vercel KV/Redis integration aliases", () => {
    vi.stubEnv("KV_REST_API_URL", "https://kv.example.com");
    vi.stubEnv("KV_REST_API_TOKEN", "kv-token");

    expect(rateLimitRedisConfig()).toEqual({ url: "https://kv.example.com", token: "kv-token" });
  });

  it("does not combine incomplete credential pairs", () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://upstash.example.com");
    vi.stubEnv("KV_REST_API_TOKEN", "kv-token");

    expect(rateLimitRedisConfig()).toBeNull();
  });
});
