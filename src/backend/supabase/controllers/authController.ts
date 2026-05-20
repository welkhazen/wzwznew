import { supabase } from '../client';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
}

const SESSION_KEY = 'raw.auth.session.v2';
const LOCAL_USERS_KEY = 'raw.auth.local-users.v1';
const USE_LOCAL_AUTH_ONLY = true;
const DEFAULT_LOCAL_USERS: LocalAuthUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    password: 'Admin123!',
    role: 'admin',
    status: 'active',
    avatar_level: 1,
  },
];

const DEFAULT_ADMIN_USER = DEFAULT_LOCAL_USERS[0];

interface LocalAuthUser extends AuthUser {
  password: string;
}

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

function toAuthUser(user: LocalAuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    avatar_level: user.avatar_level,
  };
}

function normalizeLocalAuthUser(user: LocalAuthUser): LocalAuthUser {
  if (user.username.toLowerCase() !== DEFAULT_ADMIN_USER.username) return user;
  return {
    ...user,
    id: DEFAULT_ADMIN_USER.id,
    role: DEFAULT_ADMIN_USER.role,
    status: DEFAULT_ADMIN_USER.status,
    avatar_level: user.avatar_level || DEFAULT_ADMIN_USER.avatar_level,
  };
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  if (user.username.toLowerCase() !== DEFAULT_ADMIN_USER.username) return user;
  return {
    ...user,
    id: DEFAULT_ADMIN_USER.id,
    role: DEFAULT_ADMIN_USER.role,
    status: DEFAULT_ADMIN_USER.status,
    avatar_level: user.avatar_level || DEFAULT_ADMIN_USER.avatar_level,
  };
}

function readLocalUsers(): LocalAuthUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as LocalAuthUser[]) : [];
    const users = Array.isArray(parsed) ? parsed.map(normalizeLocalAuthUser) : [];
    const hasAdmin = users.some((user) => user.username.toLowerCase() === 'admin');
    return hasAdmin ? users : [...DEFAULT_LOCAL_USERS, ...users];
  } catch {
    return DEFAULT_LOCAL_USERS;
  }
}

function writeLocalUsers(users: LocalAuthUser[]): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function localSignUp(username: string, password: string): RpcResult {
  const normalizedUsername = username.trim();
  const users = readLocalUsers();
  const existing = users.find((user) => user.username.toLowerCase() === normalizedUsername.toLowerCase());
  if (existing) return { ok: false, error: 'Username is already taken' };

  const user: LocalAuthUser = {
    id: crypto.randomUUID(),
    username: normalizedUsername,
    password,
    role: 'user',
    status: 'active',
    avatar_level: 1,
  };
  writeLocalUsers([...users, user]);
  const authUser = toAuthUser(user);
  saveSession(authUser);
  return { ok: true, user: authUser };
}

function localSignIn(username: string, password: string): RpcResult {
  const normalizedUsername = username.trim();
  const user = readLocalUsers().find((entry) => entry.username.toLowerCase() === normalizedUsername.toLowerCase());
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid username or password' };
  }

  const authUser = toAuthUser(user);
  saveSession(authUser);
  return { ok: true, user: authUser };
}

export async function signUp(username: string, password: string): Promise<RpcResult> {
  if (USE_LOCAL_AUTH_ONLY) return localSignUp(username, password);

  const { data, error } = await supabase.rpc('signup_user', {
    p_username: username,
    p_password: password,
  }).catch(() => ({ data: null, error: true }));
  if (error || !data) return localSignUp(username, password);
  const result = data as RpcResult;
  if (result.ok && result.user) saveSession(result.user);
  return result;
}

export async function signIn(username: string, password: string): Promise<RpcResult> {
  if (USE_LOCAL_AUTH_ONLY) return localSignIn(username, password);

  const { data, error } = await supabase.rpc('login_user', {
    p_username: username,
    p_password: password,
  }).catch(() => ({ data: null, error: true }));
  if (error || !data) return localSignIn(username, password);
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
