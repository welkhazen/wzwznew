// Read-only endpoint: returns the merged set of blocked terms for any
// authenticated user.  The response intentionally omits record ids and
// metadata — callers receive only the normalized strings needed for
// client-side pre-validation (UX feedback before the server rejects).
//
// Server-side enforcement in api/chat/send.ts is the authoritative gate;
// this endpoint is supplementary UX only.
import { json } from "../_lib/authServer.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { getRequestUserId } from "../_lib/sessionAuth.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { listBlockedWords } from "../_lib/blockedWordsStore.js";
import { parseEnvDenylist } from "../_lib/serverModeration.js";

export const config = { runtime: "edge" };

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const userId = await getRequestUserId(request);
  if (!userId) return json({ error: "unauthorized" }, 401);

  try {
    const dbTerms = (await listBlockedWords(supabaseServerClient)).map((w) => w.normalizedTerm);
    const envTerms = parseEnvDenylist(process.env.VITE_RAW_TEXT_DENYLIST);
    const terms = [...new Set([...envTerms, ...dbTerms])].sort();
    return json({ terms });
  } catch {
    return json({ error: "failed_to_load_blocked_terms" }, 500);
  }
}
