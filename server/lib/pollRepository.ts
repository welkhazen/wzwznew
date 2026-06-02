import type { Poll } from "../types";
import { supabaseAdmin } from "./supabaseClient";

function randomize<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

type PollRow = {
  id: string;
  question: string;
  locked?: boolean | null;
  status?: string | null;
  options?: unknown;
};

type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  position: number | null;
};

function normalizeOptionsFromJson(pollId: string, input: unknown): Poll["options"] {
  if (!Array.isArray(input)) return [];

  return input
    .map((option, index) => {
      if (typeof option === "string") {
        return {
          id: `${pollId}-option-${index + 1}`,
          text: option,
          votes: 0,
        };
      }

      if (!option || typeof option !== "object") return null;
      const value = option as { id?: unknown; text?: unknown; label?: unknown; votes?: unknown };
      const text = typeof value.text === "string" ? value.text : typeof value.label === "string" ? value.label : "";
      if (!text.trim()) return null;

      return {
        id: typeof value.id === "string" && value.id.trim() ? value.id : `${pollId}-option-${index + 1}`,
        text,
        votes: typeof value.votes === "number" && Number.isFinite(value.votes) ? value.votes : 0,
      };
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option));
}

export async function fetchActivePolls(limit: number): Promise<Poll[] | null> {
  const supabase = supabaseAdmin;
  if (!supabase) return null;

  const { data: pollRows, error: pollError } = await supabase
    .from("polls")
    .select("id, question, locked, status, options, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 3, 30));

  if (pollError) {
    console.error("[pollRepository] Failed to fetch polls", pollError);
    return null;
  }

  if (!pollRows || pollRows.length === 0) {
    return null;
  }

  const rows = pollRows as PollRow[];
  const pollIds = rows.map((row) => row.id);

  let optionRowsByPollId = new Map<string, PollOptionRow[]>();
  const { data: optionRows, error: optionError } = await supabase
    .from("poll_options")
    .select("id, poll_id, label, position")
    .in("poll_id", pollIds);

  if (optionError) {
    console.error("[pollRepository] Failed to fetch poll options", optionError);
  }

  if (!optionError && optionRows) {
    optionRowsByPollId = (optionRows as PollOptionRow[]).reduce((acc, row) => {
      const previous = acc.get(row.poll_id) ?? [];
      previous.push(row);
      acc.set(row.poll_id, previous);
      return acc;
    }, new Map<string, PollOptionRow[]>());
  }

  const normalized = rows
    .map<Poll | null>((row) => {
      const locked = row.locked === true || row.status === "locked";
      const withTableOptions = (optionRowsByPollId.get(row.id) ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((option) => ({
          id: option.id,
          text: option.label,
          votes: 0,
        }));

      const options = withTableOptions.length > 0 ? withTableOptions : normalizeOptionsFromJson(row.id, row.options);
      if (!row.question?.trim() || options.length < 2 || locked) return null;

      return {
        id: row.id,
        question: row.question,
        options: options.slice(0, 2),
        locked: false,
      };
    })
    .filter((poll): poll is Poll => Boolean(poll));

  if (normalized.length === 0) {
    return null;
  }

  return randomize(normalized).slice(0, limit);
}
