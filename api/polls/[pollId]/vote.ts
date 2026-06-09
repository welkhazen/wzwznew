import { createClient } from "@supabase/supabase-js";
import { supabaseServerClient } from "../../_lib/supabaseServerClient.js";
import { isTrustedOrigin } from "../../_lib/requestSecurity.js";
import { getRequestUserId, mintAccessToken } from "../../_lib/sessionAuth.js";
import { checkRateLimit, clientIp, rateLimitErrorResponse } from "../../_lib/rateLimit.js";

export const config = { runtime: "edge" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getPollId(request: Request): string | null {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/(?:v2\/)?polls\/([^/]+)\/vote$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function readBody(request: Request): Promise<{ optionId?: unknown } | null> {
  try {
    return (await request.json()) as { optionId?: unknown };
  } catch {
    return null;
  }
}

// Build a per-request Supabase client that carries the verified user's JWT
// so PostgREST + Postgres see the right `auth.uid()` inside the RPC.
function buildUserScopedClient(accessToken: string) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const supabaseAnonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  // Per-IP throttle: 30 votes / 10 min. The DB unique index is the hard
  // dedup guarantee; this just blunts scripted mass-voting before it hits DB.
  const rate = await checkRateLimit("poll_vote", clientIp(request));
  if (!rate.ok) return rateLimitErrorResponse(rate);

  const pollId = getPollId(request);
  if (!pollId) return json({ error: "missing_poll_id" }, 400);

  const body = await readBody(request);
  if (
    !body ||
    typeof body.optionId !== "string" ||
    body.optionId.length === 0 ||
    body.optionId.length > 64
  ) {
    return json({ error: "invalid_vote_payload" }, 400);
  }

  const accessToken = await mintAccessToken(userId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);
  const client = buildUserScopedClient(accessToken);
  if (!client) return json({ error: "supabase_not_configured" }, 503);

  const { data, error } = await client.rpc("submit_poll_vote", {
    p_poll_id: pollId,
    p_option_id: body.optionId,
  });

  if (error) return json({ error: "failed_to_record_vote" }, 500);

  const payload = (data as { ok?: boolean; error?: string; optionVotes?: Record<string, number> }) ?? {};
  if (payload.ok === false) {
    const status = payload.error === "already_voted" ? 409 : 400;
    return json({ error: payload.error ?? "vote_rejected", optionVotes: payload.optionVotes ?? {} }, status);
  }
  return json({ ok: true, optionVotes: payload.optionVotes ?? {} });
}
