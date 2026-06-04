import { json, normalizeUsername, readJsonBody } from "../_lib/authServer.js";
import { verifyPassword } from "../_lib/passwordHash.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import {
  buildSessionCookie,
  fetchSessionProfile,
  mintAccessToken,
} from "../_lib/sessionAuth.js";

export const config = { runtime: "nodejs" };

type LoginBody = { username?: unknown; password?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody<LoginBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return json({ error: "invalid_credentials" }, 401);

  const { data: row, error } = await supabaseServerClient
    .from("users")
    .select("id, password_hash, status")
    .eq("username", username)
    .maybeSingle();

  if (error || !row || !row.password_hash) return json({ error: "invalid_credentials" }, 401);
  if (row.status === "banned" || row.status === "deleted") return json({ error: "account_inactive" }, 403);
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return json({ error: "invalid_credentials" }, 401);

  const profile = await fetchSessionProfile(row.id);
  if (!profile) return json({ error: "profile_not_found" }, 500);

  const accessToken = await mintAccessToken(row.id);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);

  return new Response(JSON.stringify({ ok: true, user: profile, access_token: accessToken }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildSessionCookie(accessToken) },
  });
}
