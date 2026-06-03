import { fetchPublicProfile, json, normalizeUsername, readJsonBody, usernameToEmail } from "../_lib/authServer";
import { isTrustedOrigin } from "../_lib/requestSecurity";
import { supabaseServerClient } from "../_lib/supabaseServerClient";

export const config = { runtime: "edge" };

type MigrateBody = { username?: unknown; password?: unknown };

type LegacyLoginResult = {
  ok?: boolean;
  user?: { id?: string; username?: string };
  error?: string;
};

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody<MigrateBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return json({ error: "invalid_credentials" }, 400);

  const { data: loginData, error: loginError } = await supabaseServerClient.rpc("login_user", {
    p_username: username,
    p_password: password,
  });
  const legacy = loginData as LegacyLoginResult | null;
  if (loginError || !legacy?.ok || !legacy.user?.id) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const email = usernameToEmail(username);
  const { data: authData, error: createError } = await supabaseServerClient.auth.admin.createUser({
    id: legacy.user.id,
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (createError || !authData.user) {
    const message = createError?.message ?? "failed_to_create_auth_user";
    if (message.toLowerCase().includes("already")) {
      const profile = await fetchPublicProfile(legacy.user.id);
      return json({ ok: true, user: profile });
    }
    return json({ error: message }, 400);
  }

  const profile = await fetchPublicProfile(legacy.user.id);
  return json({ ok: true, user: profile });
}
