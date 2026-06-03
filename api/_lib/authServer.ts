import { createClient } from "@supabase/supabase-js";
import { supabaseServerClient } from "./supabaseServerClient";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export type PublicUserProfile = {
  id: string;
  username: string;
  role: string;
  status: string;
  avatar_level: number;
  onboarding_completed?: boolean;
  profile_public?: boolean;
};

export function normalizeUsername(username: string): string {
  return username.trim();
}

export function usernameToEmail(username: string): string {
  return `${encodeURIComponent(normalizeUsername(username).toLowerCase())}@users.raw.local`;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPublicProfile(userId: string): Promise<PublicUserProfile | null> {
  if (!supabaseServerClient) return null;
  const { data, error } = await supabaseServerClient
    .from("users")
    .select("id, username, role, status, avatar_level, onboarding_completed, profile_public")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicUserProfile;
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await publicClient.auth.signInWithPassword({ email, password });
  return !error;
}

export async function cleanupAppUserData(userId: string): Promise<void> {
  if (!supabaseServerClient) throw new Error("supabase_not_configured");
  const userIdText = userId;

  await supabaseServerClient.from("user_aliases").delete().eq("user_id", userId).throwOnError();
  await supabaseServerClient.from("user_xp_claims").delete().eq("user_id", userId).throwOnError();
  await supabaseServerClient.from("user_progress").delete().eq("user_id", userId).throwOnError();
  await supabaseServerClient.from("user_avatar_selection").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("user_avatar_inventory").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("user_community_unlocks").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("user_subscriptions").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("notification_consents").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("community_waitlist").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("community_members").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("community_poll_votes").delete().eq("user_id", userIdText).throwOnError();
  await supabaseServerClient.from("community_polls").delete().eq("created_by_user_id", userIdText).throwOnError();
  await supabaseServerClient.from("community_messages").delete().eq("sender_id", userIdText).throwOnError();
  await supabaseServerClient.rpc("remove_user_from_message_likes", { p_user_id: userIdText }).throwOnError();
  await supabaseServerClient.from("community_requests").delete().eq("requester_id", userIdText).throwOnError();
  await supabaseServerClient.from("issue_reports").delete().eq("reporter_id", userIdText).throwOnError();
  await supabaseServerClient.from("communities").update({ created_by: null }).eq("created_by", userIdText).throwOnError();
  await supabaseServerClient.from("users").delete().eq("id", userId).throwOnError();
}
