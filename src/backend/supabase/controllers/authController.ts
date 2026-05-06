import { supabase } from '../client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
}

const SESSION_KEY = 'raw.auth.session.v2';

function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@raw.auth`;
}

async function ensureSupabaseAuthSession(username: string, password: string): Promise<void> {
  const email = usernameToAuthEmail(username);

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError && signInData.session) {
    return;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.trim() },
    },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes('already exists')) {
      const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!retrySignInError && retrySignInData.session) {
        return;
      }
    }
    return;
  }

  if (signUpData.session) {
    return;
  }

  if (signUpData.user) {
    await supabase.auth.signInWithPassword({ email, password }).catch(() => undefined);
  }
}

function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

type RpcResult = { ok: boolean; user?: AuthUser; error?: string };

export async function signUp(username: string, password: string): Promise<RpcResult> {
  const { data, error } = await supabase.rpc('signup_user', {
    p_username: username,
    p_password: password,
  });
  if (error) return { ok: false, error: error.message };
  const result = data as RpcResult;
  if (result.ok && result.user) saveSession(result.user);
  return result;
}

export async function signIn(username: string, password: string): Promise<RpcResult> {
  const { data, error } = await supabase.rpc('login_user', {
    p_username: username,
    p_password: password,
  });
  if (error) return { ok: false, error: error.message };
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
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
