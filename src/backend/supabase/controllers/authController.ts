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

function decodeJwtPayload(token: string): { sub?: string; exp?: number } {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    const padded = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

async function applySupabaseSession(accessToken: string | undefined): Promise<void> {
  if (!accessToken || typeof window === 'undefined') return;

  const payload = decodeJwtPayload(accessToken);
  const now = Math.floor(Date.now() / 1000);
  const sb = supabase as unknown as {
    supabaseUrl?: string;
    headers?: Record<string, string>;
    rest?: { headers?: Record<string, string> };
    realtime?: { setAuth?: (token: string) => void };
    functions?: { setAuth?: (token: string) => void };
  };

  const projectRef = (() => {
    try {
      return new URL(sb.supabaseUrl ?? '').hostname.split('.')[0];
    } catch {
      return null;
    }
  })();

  const session = {
    access_token: accessToken,
    refresh_token: accessToken,
    token_type: 'bearer',
    expires_at: payload.exp ?? now + 3600,
    expires_in: (payload.exp ?? now + 3600) - now,
    user: {
      id: payload.sub ?? '',
      aud: 'authenticated',
      role: 'authenticated',
      email: '',
      phone: '',
      user_metadata: {},
      app_metadata: {},
      created_at: new Date().toISOString(),
    },
  };

  if (projectRef) {
    try {
      window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
    } catch {
      /* storage unavailable */
    }
  }

  const bearer = `Bearer ${accessToken}`;
  if (sb.headers) sb.headers.Authorization = bearer;
  if (sb.rest?.headers) sb.rest.headers.Authorization = bearer;
  sb.realtime?.setAuth?.(accessToken);
  sb.functions?.setAuth?.(accessToken);
}

async function clearSupabaseSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  const sb = supabase as unknown as {
    supabaseUrl?: string;
    headers?: Record<string, string>;
    rest?: { headers?: Record<string, string> };
    realtime?: { setAuth?: (token: string) => void };
  };
  try {
    const projectRef = new URL(sb.supabaseUrl ?? '').hostname.split('.')[0];
    if (projectRef) window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
  } catch {
    /* ignore */
  }
  if (sb.headers) delete sb.headers.Authorization;
  if (sb.rest?.headers) delete sb.rest.headers.Authorization;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  rate_limited: 'Too many attempts. Please wait a minute and try again.',
};

function authErrorMessage(error: string | undefined): string {
  return error ? AUTH_ERROR_MESSAGES[error] ?? error : 'Request failed.';
}

async function postAuth(path: string, body: unknown): Promise<AuthEndpointResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as AuthEndpointResponse | null;
  if (!response.ok) return { ok: false, error: authErrorMessage(payload?.error) };
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
  await clearSupabaseSession();
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore: signOut may throw if no supabase-native session exists
  }
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
