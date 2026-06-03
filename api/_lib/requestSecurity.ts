function getAllowedOrigin(): string | null {
  const raw = process.env.APP_BASE_URL ?? process.env.VITE_APP_BASE_URL ?? process.env.CORS_ORIGIN ?? "";
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function getRequestOriginCandidates(request: Request): string[] {
  const candidates: string[] = [];
  const origin = request.headers.get("origin");
  if (origin) candidates.push(origin);
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      candidates.push(new URL(referer).origin);
    } catch {
      // ignore malformed referer
    }
  }
  return candidates;
}

function getSelfOrigin(request: Request): string | null {
  // The API's own origin, derived from the incoming request URL. A request
  // from www.myraw.app to www.myraw.app/api/... is always same-host and safe.
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function isTrustedOrigin(request: Request): boolean {
  const candidates = getRequestOriginCandidates(request);

  // Same-host requests (browser at the same origin as the API) are trusted
  // without any env-var configuration. This avoids 403s in production when
  // APP_BASE_URL isn't set on the deployment.
  const selfOrigin = getSelfOrigin(request);
  if (selfOrigin && candidates.includes(selfOrigin)) return true;

  const allowedOrigin = getAllowedOrigin();
  if (!allowedOrigin) return false;

  if (candidates.length === 0) return false;
  return candidates.includes(allowedOrigin);
}

export function hasBearerSecret(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
