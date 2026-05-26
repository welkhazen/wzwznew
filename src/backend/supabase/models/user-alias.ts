export interface UserAliasRow {
  id: string;
  user_id: string;
  alias: string;
  is_public: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SaveUserAliasInput {
  alias: string;
  isPublic: boolean;
}
