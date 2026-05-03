export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
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
      if (polls.length > 0) return { polls, votedPolls: [] };
    }
  } catch {
    // fall through to localStorage
  }
  try {
    const raw = localStorage.getItem("raw.admin.polls.v1");
    const polls = raw ? (JSON.parse(raw) as unknown[]) : [];
    return { polls, votedPolls: [] };
  } catch {
    return { polls: [], votedPolls: [] };
  }
}

async function getMockResponse(input: string): Promise<unknown> {
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
  if (typeof window !== "undefined") {
    return getMockResponse(input) as Promise<T>;
  }

  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Request failed.";
    throw new ApiError(response.status, message);
  }

  return payload as T;
}
