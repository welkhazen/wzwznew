import { supabaseServerClient } from "../_lib/supabaseServerClient";

export const config = { runtime: "edge" };

type NotificationPayload = {
  title?: unknown;
  body?: unknown;
  userId?: unknown;
  url?: unknown;
};

type NotificationConsentRow = {
  user_id: string;
  device_token: string | null;
};

const pushSendSecret = process.env.PUSH_SEND_SECRET ?? "";
const appleTeamId = process.env.APPLE_TEAM_ID ?? "";
const appleKeyId = process.env.APPLE_KEY_ID ?? "";
const appleBundleId = process.env.APPLE_BUNDLE_ID ?? "";
const appleApnsPrivateKey = process.env.APPLE_APNS_PRIVATE_KEY ?? "";
const appleApnsEnv = process.env.APPLE_APNS_ENV ?? "sandbox";

const supabase = supabaseServerClient;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function base64Url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string"
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizePem(input: string): string {
  return input.replace(/\\n/g, "\n").trim();
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = normalizePem(pem)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function createAppleJwt(): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: appleKeyId }));
  const claims = base64Url(JSON.stringify({ iss: appleTeamId, iat: Math.floor(Date.now() / 1000) }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(appleApnsPrivateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64Url(signature)}`;
}

function isAppleConfigured(): boolean {
  return Boolean(appleTeamId && appleKeyId && appleBundleId && appleApnsPrivateKey);
}

async function sendApplePush(token: string, jwt: string, payload: { title: string; body: string; url?: string }) {
  const host = appleApnsEnv === "production" ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const response = await fetch(`https://${host}/3/device/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": appleBundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: "default",
      },
      url: payload.url,
    }),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, error: await response.text() };
  }

  return { ok: true, status: response.status };
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!pushSendSecret || request.headers.get("authorization") !== `Bearer ${pushSendSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  if (!isAppleConfigured()) {
    return json({ error: "apple_apns_not_configured" }, 503);
  }

  let body: NotificationPayload;
  try {
    body = (await request.json()) as NotificationPayload;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "raW";
  const message = typeof body.body === "string" && body.body.trim() ? body.body.trim() : "";
  const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : null;
  const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : undefined;

  if (!message) {
    return json({ error: "missing_notification_body" }, 400);
  }

  let query = supabase
    .from("notification_consents")
    .select("user_id, device_token")
    .eq("platform", "apple-ios")
    .eq("status", "granted")
    .not("device_token", "is", null);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    return json({ error: "failed_to_load_notification_tokens" }, 500);
  }

  const rows = ((data as NotificationConsentRow[] | null) ?? []).filter((row) => row.device_token);
  if (rows.length === 0) {
    return json({ ok: true, sent: 0, failed: 0 });
  }

  const jwt = await createAppleJwt();
  const results = await Promise.all(
    rows.map((row) => sendApplePush(row.device_token!, jwt, { title, body: message, url })),
  );
  const sent = results.filter((result) => result.ok).length;

  return json({
    ok: sent === results.length,
    sent,
    failed: results.length - sent,
  }, sent === results.length ? 200 : 207);
}
