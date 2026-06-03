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

function usernameToEmail(username: string): string {
  return `${encodeURIComponent(username.trim().toLowerCase())}@users.raw.local`;
}

function normalizeUsername(username: string): string {
  return username.trim();
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return user;
}

async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, status, avatar_level, onboarding_completed, profile_public')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeAuthUser(data as AuthUser);
}

async function requireProfile(userId: string): Promise<RpcResult> {
  const user = await fetchProfile(userId);
  if (!user) return { ok: false, error: 'Profile not found. Please contact support.' };
  if (user.status === 'banned' || user.status === 'deleted') return { ok: false, error: 'Account is not active.' };
  return { ok: true, user };
}

async function postAuthJson(path: string, body: unknown, accessToken?: string): Promise<RpcResult> {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as RpcResult | null;
  if (!response.ok) return { ok: false, error: payload?.error ?? 'Request failed.' };
  return payload ?? { ok: true };
}

export async function completeUserOnboarding(_userId?: string): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const { data, error } = await supabase.rpc('complete_user_onboarding');
  if (error) return { ok: false, error: error.message };
  return (data as { ok: boolean; error?: string }) ?? { ok: true };
}

export async function signUp(username: string, password: string): Promise<RpcResult> {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return { ok: false, error: 'Username is required.' };

  const email = usernameToEmail(normalizedUsername);
  const created = await postAuthJson('/api/auth/signup', { username: normalizedUsername, password });
  if (!created.ok) return created;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: error?.message ?? 'Could not sign in after signup.' };
  return requireProfile(data.user.id);
}

export async function signIn(username: string, password: string): Promise<RpcResult> {
  const email = usernameToEmail(username);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const migrated = await postAuthJson('/api/auth/migrate-custom', { username, password });
    if (!migrated.ok) return { ok: false, error: 'Could not sign in. Please try again.' };

    const retry = await supabase.auth.signInWithPassword({ email, password });
    if (retry.error || !retry.data.user) return { ok: false, error: 'Could not sign in. Please try again.' };
    return requireProfile(retry.data.user.id);
  }

  return requireProfile(data.user.id);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return fetchProfile(data.user.id);
}

export async function changePassword(
  _userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) return { ok: false, error: 'auth_migration_required' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: oldPassword,
  });
  if (verifyError) return { ok: false, error: 'Invalid current password' };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAccount(
  _userId: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  void _userId;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user?.email) return { ok: false, error: 'auth_migration_required' };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password,
  });
  if (verifyError) return { ok: false, error: 'Invalid password' };

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { ok: false, error: 'auth_migration_required' };

  const result = await postAuthJson('/api/auth/delete-account', { password }, token);
  if (result.ok) await supabase.auth.signOut();
  return result;
}
