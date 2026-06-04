import { SignJWT, jwtVerify } from "jose";
import { supabaseServerClient } from "./supabaseServerClient.js";

const COOKIE_NAME = "raw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionProfile = {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
  onboarding_completed?: boolean;
  profile_public?: boolean;
};

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.SUPABASE_JWT_SECRET ?? "";
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function mintAccessToken(userId: string): Promise<string | null> {
  const key = getJwtSecret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .setAudience("authenticated")
    .setIssuer("supabase")
    .sign(key);
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  const key = getJwtSecret();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { audience: "authenticated" });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join("; ");
}

export function buildClearedSessionCookie(): string {
  return [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "Secure", "SameSite=Lax", "Max-Age=0"].join("; ");
}

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export async function getRequestUserId(request: Request): Promise<string | null> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function fetchSessionProfile(userId: string): Promise<SessionProfile | null> {
  if (!supabaseServerClient) return null;
  const { data, error } = await supabaseServerClient
    .from("users")
    .select("id, username, role, status, avatar_level, onboarding_completed, profile_public")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SessionProfile;
}
