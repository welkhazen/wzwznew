import { supabaseServerClient } from "../../_lib/supabaseServerClient";
import { isTrustedOrigin } from "../../_lib/requestSecurity";

export const config = { runtime: "edge" };

const supabase = supabaseServerClient;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getPollId(request: Request): string | null {
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/^\/api\/(?:v2\/)?polls\/([^/]+)\/vote$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function readBody(request: Request): Promise<{ optionId?: unknown } | null> {
  try {
    return (await request.json()) as { optionId?: unknown };
  } catch {
    return null;
  }
}

async function tallyOptionVotes(pollId: string): Promise<Record<string, number>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("poll_votes")
    .select("option_id")
    .eq("poll_id", pollId);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { option_id: string }[]) {
    const key = row.option_id;
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  if (!isTrustedOrigin(request)) {
    return json({ error: "forbidden_origin" }, 403);
  }

  const pollId = getPollId(request);
  if (!pollId) {
    return json({ error: "missing_poll_id" }, 400);
  }

  const body = await readBody(request);
  if (!body || typeof body.optionId !== "string" || body.optionId.length === 0 || body.optionId.length > 64) {
    return json({ error: "invalid_vote_payload" }, 400);
  }

  const optionId = body.optionId;

  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionId });

  if (error) {
    return json({ error: "failed_to_record_vote" }, 500);
  }

  const optionVotes = await tallyOptionVotes(pollId);

  return json({ ok: true, optionVotes });
}
