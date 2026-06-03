function getAllowedOrigin(): string | null {
  const raw = process.env.APP_BASE_URL ?? process.env.VITE_APP_BASE_URL ?? process.env.CORS_ORIGIN ?? "";
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(request: Request): boolean {
  const allowedOrigin = getAllowedOrigin();
  if (!allowedOrigin) return false;

  const origin = request.headers.get("origin");
  if (origin) return origin === allowedOrigin;

  const referer = request.headers.get("referer");
  if (!referer) return false;

  try {
    return new URL(referer).origin === allowedOrigin;
  } catch {
    return false;
  }
}

export function hasBearerSecret(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
