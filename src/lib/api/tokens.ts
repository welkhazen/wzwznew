import { supabase } from "@/backend/supabase/client";

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Verified auth required");
  return { authorization: `Bearer ${token}` };
}

export async function fetchTokenBalance(userId: string): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    headers: await authHeaders(),
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
    headers: { "content-type": "application/json", ...(await authHeaders()) },
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
