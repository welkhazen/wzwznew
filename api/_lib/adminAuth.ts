import { fetchSessionProfile, getRequestUserId, type SessionProfile } from "./sessionAuth.js";

export async function requireAdminProfile(request: Request): Promise<SessionProfile | null> {
  const userId = await getRequestUserId(request);
  if (!userId) return null;

  const profile = await fetchSessionProfile(userId);
  if (!profile) return null;

  if (profile.role !== "admin") return null;
  if (profile.status === "banned" || profile.status === "deleted") return null;

  return profile;
}
