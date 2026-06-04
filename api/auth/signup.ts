import { json, normalizeUsername, readJsonBody } from "../_lib/authServer.js";
import { hashPassword } from "../_lib/passwordHash.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import {
  buildSessionCookie,
  fetchSessionProfile,
  mintAccessToken,
} from "../_lib/sessionAuth.js";

export const config = { runtime: "nodejs" };

type SignupBody = { username?: unknown; password?: unknown };

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "23505" || message.includes("duplicate") || message.includes("unique");
}

// TODO(rate-limit): block production deploy until this endpoint is protected
// by IP throttling at the edge or gateway layer.
export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody<SignupBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username) return json({ error: "username_required" }, 400);
  if (password.length < 6) return json({ error: "password_too_short" }, 400);

  const { data: existing } = await supabaseServerClient
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return json({ error: "username_taken" }, 409);

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  const { error: insertError } = await supabaseServerClient
    .from("users")
    .insert({ id: userId, username, password_hash: passwordHash });
  if (insertError) {
    if (isUniqueViolation(insertError)) return json({ error: "username_taken" }, 409);
    return json({ error: "failed_to_create_profile" }, 400);
  }

  const profile = await fetchSessionProfile(userId);
  if (!profile) return json({ error: "profile_not_found" }, 500);

  const accessToken = await mintAccessToken(userId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);

  return new Response(JSON.stringify({ ok: true, user: profile, access_token: accessToken }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildSessionCookie(accessToken) },
  });
}
