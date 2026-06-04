import { json, readJsonBody } from "../_lib/authServer.js";
import { hashPassword, verifyPassword } from "../_lib/passwordHash.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { getRequestUserId } from "../_lib/sessionAuth.js";

export const config = { runtime: "nodejs" };

type ChangeBody = { oldPassword?: unknown; newPassword?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  const body = await readJsonBody<ChangeBody>(request);
  const oldPassword = typeof body?.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (!oldPassword || newPassword.length < 6) return json({ error: "invalid_password" }, 400);

  const { data: row } = await supabaseServerClient
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (!row?.password_hash) return json({ error: "invalid_password" }, 403);
  const ok = await verifyPassword(oldPassword, row.password_hash);
  if (!ok) return json({ error: "invalid_password" }, 403);

  const newHash = await hashPassword(newPassword);
  const { error: updateError } = await supabaseServerClient
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", userId);
  if (updateError) return json({ error: "failed_to_update_password" }, 500);

  return json({ ok: true });
}
