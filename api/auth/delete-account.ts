import { cleanupAppUserData, json, readJsonBody, verifyPassword } from "../_lib/authServer";
import { isTrustedOrigin } from "../_lib/requestSecurity";
import { supabaseServerClient } from "../_lib/supabaseServerClient";

export const config = { runtime: "edge" };

type DeleteBody = { password?: unknown };

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const token = getBearerToken(request);
  if (!token) return json({ error: "unauthorized" }, 401);

  const { data: userData, error: userError } = await supabaseServerClient.auth.getUser(token);
  const user = userData.user;
  if (userError || !user?.id || !user.email) return json({ error: "unauthorized" }, 401);

  const body = await readJsonBody<DeleteBody>(request);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return json({ error: "password_required" }, 400);

  const passwordOk = await verifyPassword(user.email, password);
  if (!passwordOk) return json({ error: "invalid_password" }, 403);

  await cleanupAppUserData(user.id);

  const { error: deleteError } = await supabaseServerClient.auth.admin.deleteUser(user.id);
  if (deleteError) return json({ error: deleteError.message }, 500);

  return json({ ok: true });
}
