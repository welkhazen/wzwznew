export const APP_CANONICAL_HOST = "www.myraw.app";

export function buildCanonicalAppUrl(location: Pick<Location, "protocol" | "pathname" | "search" | "hash">): string {
  return `${location.protocol}//${APP_CANONICAL_HOST}${location.pathname}${location.search}${location.hash}`;
}
