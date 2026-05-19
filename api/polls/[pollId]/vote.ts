import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getPollId(request: Request): string | null {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/polls\/([^/]+)\/vote$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  const pollId = getPollId(request);
  if (!pollId) {
    return json({ error: "missing_poll_id" }, 400);
  }

  let body: { optionId?: unknown };
  try {
    body = (await request.json()) as { optionId?: unknown };
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!body?.optionId || typeof body.optionId !== "string") {
    return json({ error: "missing_option_id" }, 400);
  }

  const optionId = body.optionId.trim();
  if (!optionId) {
    return json({ error: "missing_option_id" }, 400);
  }

  const { data: option, error: optionError } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();

  if (optionError) {
    return json({ error: "failed_to_validate_vote" }, 500);
  }

  if (!option) {
    return json({ error: "invalid_poll_option" }, 404);
  }

  const { error: insertError } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionId });

  if (insertError) {
    return json({ error: "failed_to_save_vote" }, 500);
  }

  return json({ ok: true });
}
