import { json, readJsonBody } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { getRequestUserId } from "../_lib/sessionAuth.js";
import { checkRateLimit, rateLimitErrorResponse } from "../_lib/rateLimit.js";

export const config = { runtime: "edge" };

type ChangeBody = { oldPassword?: unknown; newPassword?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  // Per-user throttle: 5 changes / 10 min limits abuse if a session leaks.
  const rate = await checkRateLimit("change_password", userId);
  if (!rate.ok) return rateLimitErrorResponse(rate);

  const body = await readJsonBody<ChangeBody>(request);
  const oldPassword = typeof body?.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!oldPassword || newPassword.length < 6) return json({ error: "invalid_password" }, 400);

  const { data, error } = await supabaseServerClient.rpc("update_user_password", {
    p_user_id: userId,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });
  if (error) return json({ error: "failed_to_update_password" }, 500);
  if (data !== true) return json({ error: "invalid_password" }, 403);

  return json({ ok: true });
}
