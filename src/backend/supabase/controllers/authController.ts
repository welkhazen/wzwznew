import { supabase } from '../client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
}

const SESSION_KEY = 'raw.auth.session.v2';

function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

type RpcResult = { ok: boolean; user?: AuthUser; error?: string };

function normalizeAuthUser(user: AuthUser): AuthUser {
  return user;
}

export async function signUp(username: string, password: string): Promise<RpcResult> {
 let data = null;
let error = null;

try {
  const response = await supabase.rpc('signup_user', {
    p_username: username,
    p_password: password,
  });

  data = response.data;
  error = response.error;
} catch (err) {
  data = null;
  error = err;
}
  if (error || !data) return { ok: false, error: 'Could not create account. Please try again.' };
  const result = data as RpcResult;
  if (result.ok && result.user) saveSession(result.user);
  return result;
}

export async function signIn(username: string, password: string): Promise<RpcResult> {
  const { data, error } = await supabase.rpc('login_user', {
    p_username: username,
    p_password: password,
  }).catch(() => ({ data: null, error: true }));
  if (error || !data) return { ok: false, error: 'Could not sign in. Please try again.' };
  const result = data as RpcResult;
  if (result.ok && result.user) saveSession(result.user);
  return result;
}

export async function signOut(): Promise<void> {
  clearSession();
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = normalizeAuthUser(JSON.parse(raw) as AuthUser);
    saveSession(user);
    return user;
  } catch {
    return null;
  }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('change_password', {
    p_user_id: userId,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });
  if (error) return { ok: false, error: error.message };
  return (data as { ok: boolean; error?: string }) ?? { ok: true };
}

export async function deleteAccount(
  userId: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('delete_account', {
    p_user_id: userId,
    p_password: password,
  });
  if (error) return { ok: false, error: error.message };
  clearSession();
  return (data as { ok: boolean; error?: string }) ?? { ok: true };
}
