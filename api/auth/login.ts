import { json, normalizeUsername, readJsonBody } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import {
  buildSessionCookie,
  fetchSessionProfile,
  mintAccessToken,
} from "../_lib/sessionAuth.js";
import { checkRateLimit, clientIp, rateLimitErrorResponse } from "../_lib/rateLimit.js";

export const config = { runtime: "edge" };

type LoginBody = { username?: unknown; password?: unknown };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const body = await readJsonBody<LoginBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return json({ error: "invalid_credentials" }, 401);

  // Per-username+IP throttle: 10 attempts / 10 min. Slows credential stuffing
  // and per-user brute force without blocking a real user from retrying after.
  const rate = await checkRateLimit("login", `${username}:${clientIp(request)}`);
  if (!rate.ok) return rateLimitErrorResponse(rate);

  const { data, error } = await supabaseServerClient.rpc("verify_user_password", {
    p_username: username,
    p_password: password,
  });
  if (error) return json({ error: "invalid_credentials" }, 401);
  const userId = typeof data === "string" ? data : null;
  if (!userId) return json({ error: "invalid_credentials" }, 401);

  const profile = await fetchSessionProfile(userId);
  if (!profile) return json({ error: "profile_not_found" }, 500);

  const accessToken = await mintAccessToken(userId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);

  return new Response(JSON.stringify({ ok: true, user: profile, access_token: accessToken }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildSessionCookie(accessToken) },
  });
}
