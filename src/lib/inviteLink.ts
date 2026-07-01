import { APP_CANONICAL_HOST } from "@/lib/canonicalHost";

/** Query param the landing page reads to pre-fill the signup invitation code. */
export const INVITE_PARAM = "invite";

/**
 * Absolute signup link that carries an invitation code. Opening it on the
 * landing page auto-opens the signup modal with the code already filled in.
 * Always points at the canonical host so the link works when shared from a
 * preview deploy or the mobile app.
 */
export function buildInviteUrl(code: string): string {
  return `https://${APP_CANONICAL_HOST}/?${INVITE_PARAM}=${encodeURIComponent(code)}`;
}

/** Prefilled WhatsApp share intent carrying the invite message. */
export function whatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Facebook share dialog for the invite link (quote carries the message). */
export function facebookShareUrl(link: string, quote: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(quote)}`;
}
