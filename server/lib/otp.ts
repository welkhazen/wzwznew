import { randomInt } from "node:crypto";
import crypto from "node:crypto";
import { audit } from "./audit";
import { env } from "../config/env";

export type OtpChannel = "sms";

export type OtpSendResult =
  | { ok: true; channels: OtpChannel[] }
  | { ok: false; error: string };

// Used only when OTP_DEV_MODE=true (non-production local testing)
type OtpRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const otpByPhone = new Map<string, OtpRecord>();

// Sweep expired dev-mode entries every 5 minutes.
// unref() lets the process exit normally when this is the only remaining timer.
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpByPhone) {
    if (now > record.expiresAt) otpByPhone.delete(phone);
  }
}, CLEANUP_INTERVAL_MS).unref();

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/** Cryptographically secure 6-digit OTP code (100000–999999). */
export function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

async function sendViaTwilioVerify(phone: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    throw new Error(
      "Twilio Verify is not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_VERIFY_SERVICE_SID)."
    );
  }

  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Channel: "sms" }).toString(),
  });

  if (!response.ok) {
    const reason = await response.text().catch(() => "unknown");
    throw new Error(`Twilio Verify send failed (${response.status}): ${reason}`);
  }
}

async function checkViaTwilioVerify(phone: string, code: string): Promise<boolean> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SERVICE_SID) {
    return false;
  }

  const url = `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationChecks`;
  const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, Code: code }).toString(),
  });

  if (!response.ok) return false;

  const data = (await response.json()) as { status?: string };
  return data.status === "approved";
}

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const isProduction = env.NODE_ENV === "production";
  const devMode = env.OTP_DEV_MODE === "true";

  if (isProduction) {
    // Production: a real SMS provider is mandatory. Never silently succeed.
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_VERIFY_SERVICE_SID) {
      audit("otp.no_provider", { phone }, "error");
      return {
        ok: false,
        error: "SMS provider is not configured. Cannot send verification code.",
      };
    }

    try {
      await sendViaTwilioVerify(phone);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown SMS error";
      audit("otp.send_failed", { phone, error: message }, "error");
      return { ok: false, error: "Failed to send verification code. Please try again later." };
    }

    audit("otp.sent", { phone }, "info");
    return { ok: true, channels: ["sms"] };
  }

  // Non-production: only allow dev logging when explicitly opted-in.
  if (devMode) {
    const code = generateCode();
    otpByPhone.set(phone, {
      codeHash: hashCode(code),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });
    // Log the code to the server console only — never to the client response.
    audit("otp.dev.sent", { phone, code }, "info");
    return { ok: true, channels: ["sms"] };
  }

  // No provider and OTP_DEV_MODE not set: fail safely.
  audit("otp.no_provider", { phone }, "warn");
  return {
    ok: false,
    error: "SMS provider not configured. Set OTP_DEV_MODE=true for local development.",
  };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const isProduction = env.NODE_ENV === "production";
  const devMode = env.OTP_DEV_MODE === "true";

  if (isProduction) {
    return checkViaTwilioVerify(phone, code);
  }

  if (devMode) {
    const record = otpByPhone.get(phone);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      otpByPhone.delete(phone);
      return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpByPhone.delete(phone);
      return false;
    }

    record.attempts += 1;

    const isValid = record.codeHash === hashCode(code);
    if (isValid) {
      otpByPhone.delete(phone);
      return true;
    }

    return false;
  }

  return false;
}
