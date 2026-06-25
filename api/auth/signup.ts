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

type SignupBody = { username?: unknown; password?: unknown; referralCode?: unknown; inviteCode?: unknown };

const INVITATION_CODE_PATTERN = /^RAW-[12]-[A-Z0-9]{4,16}$/;

function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

// Best-effort: notifies the inviter that their code was used. Invite codes are
// registered by the client (see registerFoundingInviteCodes), so a code with no
// matching row just means the inviter hasn't synced it yet — not an error.
async function recordFoundingInviteRedemption(code: string, redeemedBy: string, redeemedUsername: string): Promise<void> {
  if (!supabaseServerClient) return;
  try {
    const { data: invite, error: lookupError } = await supabaseServerClient
      .from("founding_invites")
      .select("inviter_id")
      .eq("code", code)
      .maybeSingle();
    if (lookupError || !invite || invite.inviter_id === redeemedBy) return;

    const { error: insertError } = await supabaseServerClient.from("founding_invite_redemptions").insert({
      inviter_id: invite.inviter_id,
      code,
      redeemed_by: redeemedBy,
      redeemed_username: redeemedUsername,
    });
    if (insertError) console.error("[auth.signup] founding invite redemption insert error", insertError);
  } catch (err) {
    console.error("[auth.signup] founding invite redemption error", err);
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  // Per-IP throttle: 5 signups / 10 min. Fail-closed in prod if Upstash
  // isn't configured so a forgotten env var doesn't silently open this up.
  const rate = await checkRateLimit("signup", clientIp(request));
  if (!rate.ok) return rateLimitErrorResponse(rate);

  const body = await readJsonBody<SignupBody>(request);
  const username = typeof body?.username === "string" ? normalizeUsername(body.username) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const referralCode = typeof body?.referralCode === "string"
    ? normalizeInviteCode(body.referralCode)
    : typeof body?.inviteCode === "string"
      ? normalizeInviteCode(body.inviteCode)
      : "";
  if (!username) return json({ error: "username_required" }, 400);
  if (password.length < 6) return json({ error: "password_too_short" }, 400);
  if (!referralCode) return json({ error: "invitation_code_required" }, 403);
  if (!INVITATION_CODE_PATTERN.test(referralCode)) return json({ error: "invalid_invitation_code" }, 403);

  const { data, error } = await supabaseServerClient.rpc("create_user_with_password", {
    p_username: username,
    p_password: password,
  });
  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("username_taken") || error.code === "23505") {
      return json({ error: "username_taken" }, 409);
    }
    return json({ error: "failed_to_create_profile" }, 400);
  }
  const userId = typeof data === "string" ? data : null;
  if (!userId) return json({ error: "failed_to_create_profile" }, 500);

  const profile = await fetchSessionProfile(userId);
  if (!profile) return json({ error: "profile_not_found" }, 500);

  await recordFoundingInviteRedemption(referralCode, userId, username);

  const accessToken = await mintAccessToken(userId);
  if (!accessToken) return json({ error: "session_not_configured" }, 500);

  return new Response(JSON.stringify({ ok: true, user: profile, access_token: accessToken }), {
    status: 200,
    headers: { "content-type": "application/json", "set-cookie": buildSessionCookie(accessToken) },
  });
}
