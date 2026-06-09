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

// In-memory sliding window. Per-Vercel-instance: each cold start resets state
// and concurrent instances do not share counters. Accepted tradeoff to avoid
// taking on an external Redis/KV dependency. Still slows down a single
// attacker burst within one instance, which is the realistic threat model.
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

export type RateLimitDecision = { ok: true } | { ok: false; reason: "rate_limited" };

/**
 * Returns ok:false when the key has exhausted its policy window.
 * Backed by an in-memory bucket — see memCheck for caveats.
 */
export async function checkRateLimit(policy: RatePolicy, key: string): Promise<RateLimitDecision> {
  return memCheck(policy, key) ? { ok: true } : { ok: false, reason: "rate_limited" };
}

export function rateLimitErrorResponse(_decision: Extract<RateLimitDecision, { ok: false }>): Response {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": "60",
    },
  });
}
