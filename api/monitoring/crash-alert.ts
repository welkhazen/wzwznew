export const config = { runtime: "edge" };

type CrashAlertPayload = {
  message?: unknown;
  stack?: unknown;
  componentStack?: unknown;
  route?: unknown;
  source?: unknown;
  release?: unknown;
  environment?: unknown;
  userAgent?: unknown;
  url?: unknown;
  occurredAt?: unknown;
};

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const crashAlertTo = process.env.CRASH_ALERT_TO ?? "";
const crashAlertFrom = process.env.CRASH_ALERT_FROM ?? "crashes@raw.app";
const appName = process.env.CRASH_ALERT_APP_NAME ?? "raW";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function formatBlock(label: string, value: string): string {
  return value ? `${label}\n${value}\n` : "";
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!resendApiKey || !crashAlertTo || !crashAlertFrom) {
    return json({ error: "crash_email_not_configured" }, 503);
  }

  let body: CrashAlertPayload;
  try {
    body = (await request.json()) as CrashAlertPayload;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const message = cleanString(body.message, 300);
  if (!message) {
    return json({ error: "missing_crash_message" }, 400);
  }

  const route = cleanString(body.route, 300);
  const source = cleanString(body.source, 80) || "unknown";
  const environment = cleanString(body.environment, 80) || "unknown";
  const release = cleanString(body.release, 120) || "unknown";
  const occurredAt = cleanString(body.occurredAt, 80) || new Date().toISOString();
  const url = cleanString(body.url, 500);
  const userAgent = cleanString(body.userAgent, 500);
  const stack = cleanString(body.stack, 6000);
  const componentStack = cleanString(body.componentStack, 6000);

  const text = [
    `${appName} crash alert`,
    "",
    `Message: ${message}`,
    `Source: ${source}`,
    `Route: ${route || "unknown"}`,
    `Environment: ${environment}`,
    `Release: ${release}`,
    `Occurred at: ${occurredAt}`,
    `URL: ${url || "unknown"}`,
    `User agent: ${userAgent || "unknown"}`,
    "",
    formatBlock("Stack:", stack),
    formatBlock("Component stack:", componentStack),
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: crashAlertFrom,
      to: [crashAlertTo],
      subject: `[${appName}] Crash: ${message.slice(0, 120)}`,
      text,
    }),
  });

  if (!response.ok) {
    return json({ error: "failed_to_send_crash_email" }, 502);
  }

  return json({ ok: true });
}
