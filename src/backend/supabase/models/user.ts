export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'warned' | 'banned';

export interface UserRow {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  warnings: number;
  avatar_level: number;
  email?: string | null;
  phone?: string | null;
  stytch_user_id?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
  onboarding_completed?: boolean | null;
  profile_public?: boolean | null;
}
