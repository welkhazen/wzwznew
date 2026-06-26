import { json, readJsonBody } from "../_lib/authServer.js";
import { requireAdminProfile } from "../_lib/adminAuth.js";
import { isTrustedOrigin } from "../_lib/requestSecurity.js";
import { supabaseServerClient } from "../_lib/supabaseServerClient.js";
import { addBlockedWord, listBlockedWords, removeBlockedWord } from "../_lib/blockedWordsStore.js";

export const config = { runtime: "edge" };

type AddBlockedWordBody = {
  term?: unknown;
};

type RemoveBlockedWordBody = {
  id?: unknown;
};

export default async function handler(request: Request): Promise<Response> {
  if (!supabaseServerClient) return json({ error: "supabase_not_configured" }, 503);
  if (!isTrustedOrigin(request)) return json({ error: "forbidden_origin" }, 403);

  const admin = await requireAdminProfile(request);
  if (!admin) return json({ error: "unauthorized" }, 401);

  if (request.method === "GET") {
    try {
      return json({ blockedWords: await listBlockedWords(supabaseServerClient) });
    } catch {
      return json({ error: "failed_to_load_blocked_words" }, 500);
    }
  }

  if (request.method === "POST") {
    const body = await readJsonBody<AddBlockedWordBody>(request);
    if (!body) return json({ error: "invalid_json" }, 400);

    try {
      const blockedWord = await addBlockedWord(supabaseServerClient, String(body.term ?? ""), admin.id);
      return json({ blockedWord }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed_to_save_blocked_word";
      return json({ error: message }, message === "invalid_blocked_word" ? 400 : 500);
    }
  }

  if (request.method === "DELETE") {
    const body = await readJsonBody<RemoveBlockedWordBody>(request);
    if (!body) return json({ error: "invalid_json" }, 400);

    const id = typeof body.id === "string" ? body.id : "";
    try {
      await removeBlockedWord(supabaseServerClient, id);
      return json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed_to_remove_blocked_word";
      return json({ error: message }, message === "invalid_blocked_word" ? 400 : 500);
    }
  }

  return json({ error: "method_not_allowed" }, 405);
}
