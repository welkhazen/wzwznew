import { createClient } from "@supabase/supabase-js";
import { supabaseServerClient } from "../../_lib/supabaseServerClient.js";
import { isTrustedOrigin } from "../../_lib/requestSecurity.js";
import { getRequestUserId, mintAccessToken, verifyAccessToken } from "../../_lib/sessionAuth.js";

export const config = { runtime: "edge" };

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

async function getVerifiedUserId(request: Request): Promise<string | null> {
  const cookieUserId = await getRequestUserId(request);
  if (cookieUserId) return cookieUserId;
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyAccessToken(match[1]);
}

// Build a Supabase client scoped to the user's JWT so PostgREST sees
// auth.uid() inside SECURITY DEFINER RPCs (e.g. spend_tokens).
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
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);

  const routeUserId = getRouteUserId(request);
  if (!routeUserId) return json({ error: "missing_user_id" }, 400);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const verifiedUserId = await getVerifiedUserId(request);
  if (!verifiedUserId) return json({ error: "unauthorized" }, 401);
  if (verifiedUserId !== routeUserId) return json({ error: "forbidden_user" }, 403);

  if (request.method === "GET") {
    const { data, error } = await supabaseServerClient
      .from("users")
      .select("token_balance")
      .eq("id", verifiedUserId)
      .single();
    if (error || !data) return json({ error: "failed_to_fetch_token_balance" }, 404);
    return json({ balance: (data as { token_balance: number }).token_balance });
  }

  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const body = await readBody(request);
  if (!body) return json({ error: "invalid_json" }, 400);

  // Minting tokens from the client is never allowed; only the trusted
  // server-side reward flows may credit balances.
  if (body.action === "add") {
    return json({ error: "token_minting_requires_trusted_server" }, 403);
  }

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json({ error: "invalid_token_amount" }, 400);
  }

  // Atomic spend via the hardened RPC. Forward a freshly-minted JWT for the
  // verified user so spend_tokens()'s current_user_id() resolves correctly.
  const accessToken = await mintAccessToken(verifiedUserId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);
  const client = buildUserScopedClient(accessToken);
  if (!client) return json({ error: "supabase_not_configured" }, 503);

  const { data, error } = await client.rpc("spend_tokens", { p_amount: amount });
  if (error) return json({ error: "failed_to_spend_tokens" }, 500);

  const payload = (data as { ok?: boolean; error?: string; balance?: number }) ?? {};
  if (payload.ok === false) {
    const status = payload.error === "insufficient_balance" ? 400 : 403;
    return json({ error: payload.error ?? "spend_rejected" }, status);
  }

  return json({ balance: payload.balance ?? 0 });
}
