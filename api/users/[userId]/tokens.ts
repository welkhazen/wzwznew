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

function getUserId(request: Request): string | null {
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

export default async function handler(request: Request): Promise<Response> {
  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  const userId = getUserId(request);
  if (!userId) {
    return json({ error: "missing_user_id" }, 400);
  }

  if (!isTrustedOrigin(request)) {
    return json({ error: "forbidden_origin" }, 403);
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("token_balance")
      .eq("id", userId)
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

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return json({ error: "invalid_token_amount" }, 400);
  }

  if (body.action === "add") {
    return json({ error: "token_minting_requires_trusted_server" }, 403);
  }

  const { data, error } = await supabase.rpc("spend_tokens", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    return json({ error: "failed_to_spend_tokens" }, 500);
  }

  const result = data as { ok?: boolean; balance?: number; error?: string } | null;
  if (!result?.ok) {
    return json({ error: result?.error ?? "failed_to_spend_tokens" }, 400);
  }

  return json({ balance: result.balance });
}
