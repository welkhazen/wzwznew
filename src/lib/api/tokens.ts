import { supabase } from "@/lib/supabase";

export async function fetchTokenBalance(userId: string): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`);
  if (!response.ok) {
    const { data, error } = await supabase
      .from("users")
      .select("token_balance")
      .eq("id", userId)
      .single();
    if (error || !data) throw new Error("Failed to fetch token balance");
    return Number((data as { token_balance?: unknown }).token_balance ?? 0);
  }

  const payload = (await response.json()) as { balance?: unknown };
  const balance = Number(payload.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token balance response");
  return balance;
}

export async function spendTokens(userId: string, amount: number): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount }),
  });

  const payload = (await response.json().catch(() => null)) as { balance?: unknown; error?: string } | null;
  if (!response.ok) {
    const { data, error } = await supabase.rpc("spend_tokens", {
      p_user_id: userId,
      p_amount: amount,
    });
    const result = data as { ok?: boolean; balance?: unknown; error?: string } | null;
    if (error || !result?.ok) throw new Error(result?.error ?? payload?.error ?? "Failed to spend tokens");
    const fallbackBalance = Number(result.balance);
    if (!Number.isFinite(fallbackBalance)) throw new Error("Invalid token spend response");
    return fallbackBalance;
  }

  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token spend response");
  return balance;
}

export async function addTokensToBalance(userId: string, amount: number): Promise<number> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}/tokens`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "add", amount }),
  });

  const payload = (await response.json().catch(() => null)) as { balance?: unknown; error?: string } | null;
  if (!response.ok) {
    const { data: current, error: readError } = await supabase
      .from("users")
      .select("token_balance")
      .eq("id", userId)
      .single();
    if (readError || !current) throw new Error(payload?.error ?? "Failed to add tokens");

    const nextBalance = Number((current as { token_balance?: unknown }).token_balance ?? 0) + amount;
    const { error: updateError } = await supabase
      .from("users")
      .update({ token_balance: nextBalance })
      .eq("id", userId);
    if (updateError) throw new Error(payload?.error ?? "Failed to add tokens");
    return nextBalance;
  }

  const balance = Number(payload?.balance);
  if (!Number.isFinite(balance)) throw new Error("Invalid token add response");
  return balance;
}
