export type BlockedWordRecord = {
  id: string;
  term: string;
  normalizedTerm: string;
  createdAt: string;
  createdBy?: string | null;
};

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "blocked_words_request_failed");
  }
  return body;
}

export async function fetchBlockedWords(): Promise<BlockedWordRecord[]> {
  const body = await parseJsonResponse<{ blockedWords: BlockedWordRecord[] }>(
    await fetch("/api/admin/blocked-words", { credentials: "include" }),
  );
  return body.blockedWords;
}

export async function addBlockedWord(term: string): Promise<BlockedWordRecord> {
  const body = await parseJsonResponse<{ blockedWord: BlockedWordRecord }>(
    await fetch("/api/admin/blocked-words", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ term }),
    }),
  );
  return body.blockedWord;
}

export async function removeBlockedWord(id: string): Promise<void> {
  await parseJsonResponse<{ ok: true }>(
    await fetch("/api/admin/blocked-words", {
      method: "DELETE",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }),
  );
}
