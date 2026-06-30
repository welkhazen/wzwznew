export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function getSeedPollsResponse(): Promise<unknown> {
  const { POLL_QUESTION_SEEDS } = await import("@/features/polls/pollQuestions");
  return {
    polls: POLL_QUESTION_SEEDS.map((poll, index) => ({
      id: poll.id,
      question: poll.question,
      options: [
        { id: `p${index + 1}-yes`, text: "Yes", votes: poll.yesVotes },
        { id: `p${index + 1}-no`, text: "No", votes: poll.noVotes },
      ],
      locked: false,
    })),
    votedPolls: [],
  };
}

function isPlaceholderPoll(poll: unknown): boolean {
  if (!poll || typeof poll !== "object" || !("question" in poll)) return true;
  const question = String((poll as { question: unknown }).question).trim().toLowerCase();
  return question === "supabase" || question.length <= 5;
}

async function getPollsMockResponse(): Promise<unknown> {
  try {
    const { supabase } = await import('@/backend/supabase/client');
    const { data, error } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        status,
        poll_options (
          id,
          label,
          position
        )
      `)
      .order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const polls = data
        .map((row) => {
          const opts = [...((row.poll_options as { id: string; label: string; position: number }[]) ?? [])]
            .sort((a, b) => a.position - b.position);
          return {
            id: row.id,
            question: row.question as string,
            options: opts.map((o) => ({ id: o.id, text: o.label, votes: 0 })),
            locked: row.status === 'locked',
          };
        })
        .filter(
          (p) =>
            p.question &&
            p.question.trim().length > 5 &&
            p.options.length >= 2 &&
            !p.locked
        );
      if (polls.length > 0 && !polls.every(isPlaceholderPoll)) {
        return { polls, votedPolls: [] };
      }
    }
  } catch {
    // fall through to localStorage
  }
  try {
    const raw = localStorage.getItem("raw.admin.polls.v1");
    const polls = raw ? (JSON.parse(raw) as unknown[]) : [];
    if (polls.length > 0 && !polls.every(isPlaceholderPoll)) {
      return { polls, votedPolls: [] };
    }
    return getSeedPollsResponse();
  } catch {
    return getSeedPollsResponse();
  }
}

async function getCommentsMockResponse(input: string, init?: RequestInit): Promise<unknown> {
  const match = input.match(/\/polls\/([^/?]+)\/comments/);
  const pollId = match?.[1];
  if (!pollId) return { comments: [], ok: true };

  try {
    const { supabase } = await import('@/backend/supabase/client');
    if (init?.method === "POST" && init.body) {
      const { text } = JSON.parse(init.body as string) as { text: string };
      const { assertUserTextAllowed } = await import('@/lib/inputSecurity');
      await supabase.from('poll_comments').insert({ poll_id: pollId, body: assertUserTextAllowed(text) });
      return { ok: true };
    }
    // GET
    const { data } = await supabase
      .from('poll_comments')
      .select('body')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { comments: (data ?? []).map((r) => (r as { body: string }).body) };
  } catch {
    return { comments: [], ok: true };
  }
}

async function getMockResponse(input: string, init?: RequestInit): Promise<unknown> {
  if (input.includes("/api/users/me")) {
    return {
      user: {
        id: "dev-user-1",
        username: "dev-user",
        displayName: "Development User",
        bio: "Testing UI/UX",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
        role: "member",
      },
    };
  }
  if ((input.includes("/api/polls") || input.includes("/api/v2/polls")) && input.includes("/vote")) {
    return { ok: true };
  }
  if ((input.includes("/api/polls") || input.includes("/api/v2/polls")) && input.includes("/comments")) {
    return getCommentsMockResponse(input, init);
  }
  if (input.includes("/api/polls") || input.includes("/api/v2/polls")) {
    return getPollsMockResponse();
  }
  if (input.includes("/api/assistant")) {
    return { message: "" };
  }
  if (input.includes("/api/notifications")) {
    return { ok: true };
  }
  return { ok: true };
}

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });
  } catch (error) {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      return getMockResponse(input, init) as Promise<T>;
    }
    throw error;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    // Gateway errors mean the backend is not running — use mock data in dev
    if (import.meta.env.DEV && [502, 503, 504].includes(response.status) && typeof window !== "undefined") {
      return getMockResponse(input, init) as Promise<T>;
    }
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Request failed.";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}
