import { json } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import {
  fetchSessionProfile,
  getRequestUserId,
  mintAccessToken,
} from "../_lib/sessionAuth.js";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ ok: false }, 401);

  const profile = await fetchSessionProfile(userId);
  if (!profile) return json({ ok: false }, 401);
  if (profile.status === "banned" || profile.status === "deleted") {
    return json({ ok: false, error: "account_inactive" }, 403);
  }

  const accessToken = await mintAccessToken(userId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);

  return json({ ok: true, user: profile, access_token: accessToken });
}
