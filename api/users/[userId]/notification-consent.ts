import { supabaseServerClient } from "../../_lib/supabaseServerClient";
import { isTrustedOrigin } from "../../_lib/requestSecurity";

export const config = { runtime: "edge" };

const supabase = supabaseServerClient;

const platforms = new Set(["apple-ios", "samsung-android", "web"]);
const statuses = new Set(["granted", "denied", "dismissed", "unsupported"]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getUserId(request: Request): string | null {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/users\/([^/]+)\/notification-consent$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  if (!isTrustedOrigin(request)) {
    return json({ error: "untrusted_origin" }, 403);
  }

  const userId = getUserId(request);
  if (!userId) {
    return json({ error: "missing_user_id" }, 400);
  }

  let body: { platform?: unknown; status?: unknown; provider?: unknown; deviceToken?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const platform = typeof body.platform === "string" ? body.platform : "";
  const status = typeof body.status === "string" ? body.status : "";
  const provider = typeof body.provider === "string" && body.provider.trim() ? body.provider.trim() : "none";
  const deviceToken = typeof body.deviceToken === "string" && body.deviceToken.trim() ? body.deviceToken.trim() : null;

  if (!platforms.has(platform) || !statuses.has(status)) {
    return json({ error: "invalid_consent_payload" }, 400);
  }

  const { error } = await supabase
    .from("notification_consents")
    .upsert(
      {
        user_id: userId,
        platform,
        status,
        provider,
        device_token: deviceToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );

  if (error) {
    return json({ error: "failed_to_save_notification_consent" }, 500);
  }

  return json({ ok: true });
}
