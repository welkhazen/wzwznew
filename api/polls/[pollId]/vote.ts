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

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    request.headers.get("x-real-ip")
    ?? request.headers.get("cf-connecting-ip")
    ?? forwarded
    ?? "unknown-ip"
  );
}

async function sha256Base64Url(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getVoterKey(request: Request, pollId: string): Promise<string> {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  const acceptLanguage = request.headers.get("accept-language") ?? "unknown-language";
  return sha256Base64Url(`${pollId}:${ip}:${userAgent}:${acceptLanguage}`);
}

async function getPollVoteCounts(pollId: string): Promise<Record<string, number>> {
  if (!supabase) return {};

  const { data } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);

  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    if (row.option_id) counts[row.option_id] = (counts[row.option_id] ?? 0) + 1;
    return counts;
  }, {});
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

  const voterKey = await getVoterKey(request, pollId);
  let { error: insertError } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionId, voter_key: voterKey });

  if (insertError && insertError.code === "PGRST204") {
    const fallbackResult = await supabase
      .from("poll_votes")
      .insert({ poll_id: pollId, option_id: optionId });
    insertError = fallbackResult.error;
  }

  if (insertError) {
    if (insertError.code === "23505") {
      return json({ error: "already_voted", optionVotes: await getPollVoteCounts(pollId) }, 409);
    }

    return json({ error: "failed_to_save_vote" }, 500);
  }

  return json({ ok: true, optionVotes: await getPollVoteCounts(pollId) });
}
