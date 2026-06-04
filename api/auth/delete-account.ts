import { cleanupAppUserData, json, readJsonBody } from "../_lib/authServer";
import { verifyPassword } from "../_lib/passwordHash";
import { isTrustedOrigin } from "../_lib/requestSecurity";
import { supabaseServerClient } from "../_lib/supabaseServerClient";
import { buildClearedSessionCookie, getRequestUserId } from "../_lib/sessionAuth";

export const config = { runtime: "nodejs" };

type DeleteBody = { password?: unknown };

// TODO(rate-limit): block production deploy until this endpoint is protected
// by IP/user throttling at the edge or gateway layer.
export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const body = await readJsonBody<DeleteBody>(request);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return json({ error: "password_required" }, 400);

  const { data: row } = await supabaseServerClient
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (!row?.password_hash) return json({ error: "invalid_password" }, 403);
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return json({ error: "invalid_password" }, 403);

  try {
    await cleanupAppUserData(userId);
  } catch {
    return json({ error: "app_cleanup_failed", user_id: userId }, 500);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildClearedSessionCookie() },
  });
}
