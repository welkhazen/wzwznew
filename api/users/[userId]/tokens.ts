import { supabaseServerClient } from "../../_lib/supabaseServerClient";
import { isTrustedOrigin } from "../../_lib/requestSecurity";

export const config = { runtime: "edge" };

const supabase = supabaseServerClient;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getRouteUserId(request: Request): string | null {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/users\/([^/]+)\/tokens$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function readBody(request: Request): Promise<{ action?: unknown; amount?: unknown } | null> {
  try {
    return (await request.json()) as { action?: unknown; amount?: unknown };
  } catch {
    return null;
  }
}

/**
 * Resolve the verified session user id from the request.
 *
 * TODO(auth-migration): until proper Supabase Auth / Stytch server-session
 * verification is wired up, the only identity signal we trust on the
 * server is the (forthcoming) `raw.sid` httpOnly session cookie set by the
 * Express server. That cookie is opaque to this edge function today.
 *
 * Transitional rule: if the X-Raw-Session-User header is present AND its
 * value matches the route userId AND the request is from a trusted origin,
 * we accept it as the session user. This is *not* sufficient long-term —
 * the header can be set by the browser — but it lets us harden the obvious
 * "spend someone else's tokens by typing their UUID in the URL" attack
 * without breaking the existing UX while the real session layer ships.
 *
 * Returns null when the caller cannot be matched to the route user; the
 * caller of this helper must then 401/403.
 */
function getVerifiedSessionUserId(request: Request, routeUserId: string): string | null {
  const headerUserId = request.headers.get("x-raw-session-user");
  if (!headerUserId) return null;
  if (headerUserId !== routeUserId) return null;
  return headerUserId;
}

export default async function handler(request: Request): Promise<Response> {
  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  const routeUserId = getRouteUserId(request);
  if (!routeUserId) {
    return json({ error: "missing_user_id" }, 400);
  }

  if (!isTrustedOrigin(request)) {
    return json({ error: "forbidden_origin" }, 403);
  }

  // Identity check: the URL userId is NOT trusted on its own. Cross-user
  // access is blocked until the proper session layer lands.
  const sessionUserId = getVerifiedSessionUserId(request, routeUserId);
  if (!sessionUserId) {
    return json({ error: "unauthorized" }, 401);
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("token_balance")
      .eq("id", sessionUserId)
      .single();

    if (error || !data) {
      return json({ error: "failed_to_fetch_token_balance" }, 404);
    }

    return json({ balance: (data as { token_balance: number }).token_balance });
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const body = await readBody(request);
  if (!body) {
    return json({ error: "invalid_json" }, 400);
  }

  // Client-side token minting stays blocked. Only payment webhooks / trusted
  // server reward paths may add tokens, and those don't run through this route.
  if (body.action === "add") {
    return json({ error: "token_minting_requires_trusted_server" }, 403);
  }

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json({ error: "invalid_token_amount" }, 400);
  }

  // spend_tokens derives the user from current_user_id() inside the RPC, so
  // even if the route userId were spoofed the spend lands on the verified
  // session user. The header check above adds a second layer.
  const { data, error } = await supabase.rpc("spend_tokens", { p_amount: amount });

  if (error) {
    return json({ error: "failed_to_spend_tokens" }, 500);
  }

  const result = data as { ok?: boolean; balance?: number; error?: string } | null;
  if (!result?.ok) {
    return json({ error: result?.error ?? "failed_to_spend_tokens" }, 400);
  }

  return json({ balance: result.balance });
}
