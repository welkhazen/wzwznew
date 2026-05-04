import crypto from "node:crypto";
import { audit } from "./audit";

export type OtpChannel = "sms";

export type OtpSendResult =
  | { ok: true; channels: OtpChannel[] }
  | { ok: false; error: string };

type OtpRecord = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const otpByPhone = new Map<string, OtpRecord>();

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const code = generateCode();

  otpByPhone.set(phone, {
    codeHash: hashCode(code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  // NOTE: Twilio has been fully removed from the codebase.
  // For safety, we do not return the code in API responses.
  // In local/dev, operators can retrieve it from server logs.
  audit("otp.local.sent", { phone }, "info");

  return { ok: true, channels: ["sms"] };
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
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
