import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.min(50, Math.max(1, parseInt(limitParam ?? "10", 10) || 10));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("polls")
    .select("id, question, status, poll_options(id, label, position)")
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (error) {
    return json({ error: "failed_to_fetch_polls" }, 500);
  }

  const polls = ((data as PollRow[]) ?? [])
    .map((row) => {
      const locked = row.status === "locked";
      const opts = [...(row.poll_options ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0)
      );
      return {
        id: row.id,
        question: row.question,
        options: opts.slice(0, 2).map((o) => ({ id: o.id, text: o.label, votes: 0 })),
        locked,
      };
    })
    .filter(
      (p) =>
        typeof p.question === "string" &&
        p.question.trim().length > 5 &&
        p.options.length >= 2 &&
        !p.locked
    );

  const randomized = polls
    .map((p) => ({ p, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, limit)
    .map(({ p }) => p);

  return json({ polls: randomized });
}
