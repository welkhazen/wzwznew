import { Redis } from "@upstash/redis";

// Account-level login lockout. Distinct from the IP-based rate limit:
// rate-limit slows down a single IP, lockout tracks failures against the
// username so an attacker rotating IPs still gets stopped.
//
// Policy: 10 failed logins per 15-minute window → account locked for the
// remainder of that window. Counter resets on successful login.

const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_SECONDS = 15 * 60;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function key(username: string): string {
  return `lockout:login:${username.toLowerCase()}`;
}

export type LockoutDecision =
  | { locked: false }
  | { locked: true; reason: "too_many_failures"; retryAfterSeconds: number };

/**
 * Check whether the account is currently locked. Call BEFORE attempting to
 * verify the password — if locked, short-circuit and return a 423.
 *
 * In dev / when Upstash isn't configured, returns { locked: false } so local
 * testing isn't blocked. In production this is a real check.
 */
export async function checkLoginLockout(username: string): Promise<LockoutDecision> {
  const r = getRedis();
  if (!r) return { locked: false };
  const count = await r.get<number>(key(username));
  if (typeof count === "number" && count >= MAX_FAILED_ATTEMPTS) {
    const ttl = await r.ttl(key(username));
    return {
      locked: true,
      reason: "too_many_failures",
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    };
  }
  return { locked: false };
}

/**
 * Record a failed login. Increments the per-username counter and refreshes
 * the window TTL. No-ops without Upstash configured.
 */
export async function recordFailedLogin(username: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const k = key(username);
  const next = await r.incr(k);
  if (next === 1) {
    // First failure in this window — set the TTL.
    await r.expire(k, WINDOW_SECONDS);
  }
}

/**
 * Clear the failure counter on a successful login. No-ops without Upstash.
 */
export async function clearLoginFailures(username: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(key(username));
}

export function lockoutResponse(decision: Extract<LockoutDecision, { locked: true }>): Response {
  return new Response(
    JSON.stringify({
      error: "account_locked",
      reason: decision.reason,
      retry_after_seconds: decision.retryAfterSeconds,
    }),
    {
      status: 423, // Locked
      headers: {
        "content-type": "application/json",
        "retry-after": String(decision.retryAfterSeconds),
      },
    },
  );
}
