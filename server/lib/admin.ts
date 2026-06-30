import { env } from "../config/env";
import { userRepository } from "./userRepository";

function getAdminUsernameSet(): Set<string> {
  if (!env.ADMIN_USERNAMES) {
    return new Set();
  }

  return new Set(
    env.ADMIN_USERNAMES.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await userRepository.findById(userId);
  if (!user) {
    return false;
  }

  const admins = getAdminUsernameSet();
  return admins.has(user.username.toLowerCase());
}

export async function resolveUserRole(userId: string): Promise<"admin" | "member"> {
  return (await isUserAdmin(userId)) ? "admin" : "member";
}
