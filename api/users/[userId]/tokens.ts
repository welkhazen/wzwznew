import { supabaseServerClient } from "../../_lib/supabaseServerClient.js";
import { isTrustedOrigin } from "../../_lib/requestSecurity.js";
import { getRequestUserId, verifyAccessToken } from "../../_lib/sessionAuth.js";

export const config = { runtime: "nodejs" };

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

async function getVerifiedUserId(request: Request): Promise<string | null> {
  const cookieUserId = await getRequestUserId(request);
  if (cookieUserId) return cookieUserId;
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyAccessToken(match[1]);
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

  const verifiedUserId = await getVerifiedUserId(request);
  if (!verifiedUserId) {
    return json({ error: "unauthorized" }, 401);
  }
  if (verifiedUserId !== routeUserId) {
    return json({ error: "forbidden_user" }, 403);
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("token_balance")
      .eq("id", verifiedUserId)
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

  if (body.action === "add") {
    return json({ error: "token_minting_requires_trusted_server" }, 403);
  }

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json({ error: "invalid_token_amount" }, 400);
  }

  const { data, error: readError } = await supabase
    .from("users")
    .select("token_balance")
    .eq("id", verifiedUserId)
    .single();

  if (readError || !data) {
    return json({ error: "failed_to_fetch_token_balance" }, 404);
  }

  const currentBalance = Number((data as { token_balance: number }).token_balance);
  if (!Number.isFinite(currentBalance)) {
    return json({ error: "invalid_token_balance" }, 500);
  }
  if (currentBalance < amount) {
    return json({ error: "insufficient_tokens" }, 400);
  }

  const balance = currentBalance - amount;
  const { error: updateError } = await supabase
    .from("users")
    .update({ token_balance: balance })
    .eq("id", verifiedUserId);

  if (updateError) {
    return json({ error: "failed_to_spend_tokens" }, 500);
  }

  return json({ balance });
}
