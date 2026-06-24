import { cleanupAppUserData, json, readJsonBody } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { buildClearedSessionCookie, getRequestUserId } from "../_lib/sessionAuth.js";
import { checkRateLimit, clientIp, rateLimitErrorResponse } from "../_lib/rateLimit.js";

export const config = { runtime: "edge" };

type DeleteBody = { password?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const rate = await checkRateLimit("delete_account", `${userId}:${clientIp(request)}`);
  if (!rate.ok) return rateLimitErrorResponse(rate);

  const body = await readJsonBody<DeleteBody>(request);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return json({ error: "password_required" }, 400);

  const { data: profileRow } = await supabaseServerClient
    .from("users")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!profileRow) return json({ error: "unauthorized" }, 401);
  const username = (profileRow as { username: string }).username;

  const { data: verifiedId, error: verifyErr } = await supabaseServerClient.rpc(
    "verify_user_password",
    { p_username: username, p_password: password },
  );
  if (verifyErr || verifiedId !== userId) return json({ error: "invalid_password" }, 403);

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
