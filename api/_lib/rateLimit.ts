import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Policy = sliding-window cap per key. Keep names + windows here so endpoints
// pick a policy by name and we have one place to tune them.
export type RatePolicy = "signup" | "login" | "poll_vote" | "token_spend" | "change_password";

const POLICIES: Record<RatePolicy, { tokens: number; window: `${number} ${"s" | "m" | "h" | "d"}` }> = {
  signup:          { tokens: 5,  window: "10 m" },
  login:           { tokens: 10, window: "10 m" },
  poll_vote:       { tokens: 30, window: "10 m" },
  token_spend:     { tokens: 20, window: "1 m"  },
  change_password: { tokens: 5,  window: "10 m" },
};

let redis: Redis | null = null;
const limiterCache: Partial<Record<RatePolicy, Ratelimit>> = {};

export function rateLimitRedisConfig(): { url: string; token: string } | null {
  const credentialPairs = [
    [process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN],
    [process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN],
  ];
  const credentials = credentialPairs.find(([url, token]) => url && token);
  return credentials ? { url: credentials[0]!, token: credentials[1]! } : null;
}

function getRedis(): Redis | null {
  if (redis) return redis;
  // Vercel's Upstash Marketplace integration creates KV_REST_API_URL/KV_REST_API_TOKEN.
  // Older Upstash-native installs use UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.
  // Accept either so the rate limiter works without env-var renaming.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(policy: RatePolicy): Ratelimit | null {
  if (limiterCache[policy]) return limiterCache[policy] ?? null;
  const r = getRedis();
  if (!r) return null;
  const spec = POLICIES[policy];
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(spec.tokens, spec.window),
    prefix: `rl:${policy}`,
    analytics: false,
  });
  limiterCache[policy] = limiter;
  return limiter;
}

// In-memory fallback for `npm run dev` only. Resets on every cold start; not
// safe in production. The handler caller decides whether to allow this path.
const memBuckets = new Map<string, number[]>();
function memCheck(policy: RatePolicy, key: string): boolean {
  const spec = POLICIES[policy];
  const now = Date.now();
  const windowMs = parseWindowMs(spec.window);
  const bucketKey = `${policy}:${key}`;
  const events = (memBuckets.get(bucketKey) ?? []).filter((t) => now - t < windowMs);
  if (events.length >= spec.tokens) {
    memBuckets.set(bucketKey, events);
    return false;
  }
  events.push(now);
  memBuckets.set(bucketKey, events);
  return true;
}

function parseWindowMs(window: `${number} ${"s" | "m" | "h" | "d"}`): number {
  const [n, unit] = window.split(" ");
  const value = Number(n);
  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default:  return value;
  }
}

export function clientIp(request: Request): string {
  // Vercel forwards client IP via x-forwarded-for / x-real-ip
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitDecision = { ok: true } | { ok: false; reason: "rate_limited" | "config_missing" };

/**
 * Returns ok:false when the key has exhausted its policy window.
 *
 * Production: if Upstash env vars are missing, returns config_missing — caller
 * must decide whether to fail closed (recommended for write-heavy endpoints) or
 * allow through. Dev (NODE_ENV !== "production") falls back to a per-instance
 * in-memory bucket so local testing keeps working.
 */
export async function checkRateLimit(policy: RatePolicy, key: string): Promise<RateLimitDecision> {
  const limiter = getLimiter(policy);
  if (limiter) {
    const { success } = await limiter.limit(key);
    return success ? { ok: true } : { ok: false, reason: "rate_limited" };
  }
  if (process.env.NODE_ENV !== "production") {
    return memCheck(policy, key) ? { ok: true } : { ok: false, reason: "rate_limited" };
  }
  return { ok: false, reason: "config_missing" };
}

export function rateLimitErrorResponse(decision: Extract<RateLimitDecision, { ok: false }>): Response {
  const status = decision.reason === "rate_limited" ? 429 : 503;
  const body = decision.reason === "rate_limited"
    ? { error: "rate_limited" }
    : { error: "rate_limit_unavailable" };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...(decision.reason === "rate_limited" ? { "retry-after": "60" } : {}),
    },
  });
}
