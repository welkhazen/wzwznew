import { fetchPublicProfile, json, normalizeUsername, readJsonBody, usernameToEmail } from "../_lib/authServer";
import { isTrustedOrigin } from "../_lib/requestSecurity";
import { supabaseServerClient } from "../_lib/supabaseServerClient";

export const config = { runtime: "edge" };

type SignupBody = { username?: unknown; password?: unknown };

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" || message.includes("duplicate") || message.includes("unique");
}

function isExistingAuthUser(error: { message?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("already") || message.includes("registered") || message.includes("exists");
}

// TODO(rate-limit): block production deploy until this endpoint is protected
// by IP/user throttling at the edge or gateway layer.
export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody<SignupBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username) return json({ error: "username_required" }, 400);
  if (password.length < 6) return json({ error: "password_too_short" }, 400);

  const { data: existingProfile } = await supabaseServerClient
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existingProfile) return json({ error: "username_taken" }, 409);

  const email = usernameToEmail(username);
  const { data: authData, error: authError } = await supabaseServerClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (authError || !authData.user) {
    if (isExistingAuthUser(authError)) return json({ error: "username_taken" }, 409);
    return json({ error: "failed_to_create_auth_user" }, 400);
  }

  const { error: profileError } = await supabaseServerClient
    .from("users")
    .insert({ id: authData.user.id, username });

  if (profileError) {
    await supabaseServerClient.auth.admin.deleteUser(authData.user.id);
    if (isUniqueViolation(profileError)) return json({ error: "username_taken" }, 409);
    return json({ error: "failed_to_create_profile" }, 400);
  }

  const profile = await fetchPublicProfile(authData.user.id);
  if (!profile) return json({ error: "profile_not_found" }, 500);

  return json({ ok: true, user: profile });
}
