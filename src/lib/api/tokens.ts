// Frontend token endpoint bindings.
//
// The userId argument is sent in the URL for routing only — the server does
// NOT trust it as identity. It also goes in the X-Raw-Session-User header so
// the edge function can verify it matches the active session user. This is a
// transitional bridge until full Supabase Auth lands; see
// docs/supabase-access-boundary.md.
//
// TODO(auth-migration): drop the userId argument from these helpers once the
// server derives identity from a real verified session cookie.

function sessionHeaders(userId: string): HeadersInit {
  return { "x-raw-session-user": userId };
}

export async function fetchTokenBalance(userId: string): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    headers: sessionHeaders(userId),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch token balance");
  }

  const payload = (await response.json()) as { balance?: unknown };
  const balance = Number(payload.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token balance response");
  return balance;
}

export async function spendTokens(userId: string, amount: number): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json", ...sessionHeaders(userId) },
    body: JSON.stringify({ amount }),
  });

  const payload = (await response.json().catch(() => null)) as { balance?: unknown; error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Failed to spend tokens");
  }

  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token spend response");
  return balance;
}
