import { supabase } from '../client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
  onboarding_completed?: boolean;
  profile_public?: boolean;
}

type RpcResult = { ok: boolean; user?: AuthUser; error?: string };
type AuthEndpointResponse = { ok?: boolean; user?: AuthUser; access_token?: string; error?: string };

function normalizeUsername(username: string): string {
  return username.trim();
}

async function applySupabaseSession(accessToken: string | undefined): Promise<void> {
  if (!accessToken) return;
  await supabase.auth.setSession({ access_token: accessToken, refresh_token: accessToken });
}

async function postAuth(path: string, body: unknown): Promise<AuthEndpointResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as AuthEndpointResponse | null;
  if (!response.ok) return { ok: false, error: payload?.error ?? 'Request failed.' };
  return payload ?? { ok: true };
}

function toResult(payload: AuthEndpointResponse): RpcResult {
  if (!payload.ok || !payload.user) return { ok: false, error: payload.error ?? 'Authentication failed.' };
  return { ok: true, user: payload.user };
}

export async function completeUserOnboarding(_userId?: string): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const { data, error } = await supabase.rpc('complete_user_onboarding');
  if (error) return { ok: false, error: error.message };
  return (data as { ok: boolean; error?: string }) ?? { ok: true };
}

export async function signUp(username: string, password: string): Promise<RpcResult> {
  const normalized = normalizeUsername(username);
  if (!normalized) return { ok: false, error: 'Username is required.' };
  const payload = await postAuth('/api/auth/signup', { username: normalized, password });
  await applySupabaseSession(payload.access_token);
  return toResult(payload);
}

export async function signIn(username: string, password: string): Promise<RpcResult> {
  const normalized = normalizeUsername(username);
  if (!normalized) return { ok: false, error: 'Username is required.' };
  const payload = await postAuth('/api/auth/login', { username: normalized, password });
  await applySupabaseSession(payload.access_token);
  return toResult(payload);
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  } catch {
    // ignore network errors on logout
  }
  await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return null;
    const payload = (await response.json()) as AuthEndpointResponse;
    if (!payload.ok || !payload.user) return null;
    await applySupabaseSession(payload.access_token);
    return payload.user;
  } catch {
    return null;
  }
}

export async function changePassword(
  _userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const payload = await postAuth('/api/auth/change-password', { oldPassword, newPassword });
  return { ok: Boolean(payload.ok), error: payload.error };
}

export async function deleteAccount(
  _userId: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const payload = await postAuth('/api/auth/delete-account', { password });
  if (payload.ok) await supabase.auth.signOut();
  return { ok: Boolean(payload.ok), error: payload.error };
}
