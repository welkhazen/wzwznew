import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

interface PollOptionRow {
  id: string;
  label: string;
  position: number | null;
}

interface PollRow {
  id: string;
  question: string;
  status: string | null;
  poll_options: PollOptionRow[];
}

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(50, Math.max(1, parseInt(limitParam ?? "10", 10) || 10));

  const { data, error } = await supabase
    .from("polls")
    .select("id, question, status, poll_options(id, label, position)")
    .neq("status", "locked")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) {
    return json({ error: "failed_to_fetch_polls" }, 500);
  }

  const polls = ((data as PollRow[]) ?? [])
    .map((row) => {
      const opts = [...(row.poll_options ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      return {
        id: row.id,
        question: row.question,
        options: opts.slice(0, 2).map((o) => ({ id: o.id, text: o.label, votes: 0 })),
      };
    })
    .filter(
      (p) =>
        typeof p.question === "string" &&
        p.question.trim().length > 5 &&
        p.options.length >= 2
    );

  const randomized = polls
    .map((p) => ({ p, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, limit)
    .map(({ p }) => p);

  return json(
    { polls: randomized },
    200,
    { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
  );
}
