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

  if (request.method === "GET") {
    return json(
      {
        error: "auth_migration_required",
        todo: "TODO(auth-migration): verify a real server session before reading token balance",
      },
      501,
    );
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

  return json(
    {
      error: "auth_migration_required",
      todo: "TODO(auth-migration): verify a real server session before spending tokens",
    },
    501,
  );
}
