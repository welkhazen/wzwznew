import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { identify, reset, track } from "@/lib/analytics";
import { awardXPOnce, recordLocalLoginDay, XP_REWARDS } from "@/lib/userProgress";
import { getTodayKey } from "@/store/useRawStore.storage";
import type { User } from "@/store/types";
import { signOut, getSession, type AuthUser } from "@/backend/supabase/controllers/authController";

function toUser(a: AuthUser): User {
  return {
    id: a.id,
    username: a.username,
    role: a.role === "admin" ? "admin" : "member",
    moderationStatus:
      a.status === "banned" || a.status === "deleted"
        ? "banned"
        : a.status === "warned"
          ? "warned"
        : "active",
    warnings: 0,
    onboardingCompleted: a.onboarding_completed,
    profilePublic: a.profile_public,
  };
}

function awardDailyLoginXP(userId: string): void {
  const todayKey = getTodayKey();
  recordLocalLoginDay(userId, todayKey);
  void awardXPOnce(userId, "daily-login", todayKey, XP_REWARDS.DAILY_LOGIN);
}

const GUEST_SESSION_KEY = "raw.guest-session.v1";

function createGuestUser(): User {
  const guestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const id = `guest-${guestId}`;
  return {
    id,
    username: "guest",
    role: "member",
    moderationStatus: "active",
    warnings: 0,
    onboardingCompleted: false,
    profilePublic: false,
    isGuest: true,
  };
}

function readGuestUser(): User | null {
  try {
    const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
    return stored ? JSON.parse(stored) as User : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Restore session on mount
  useEffect(() => {
    getSession()
      .then((authUser) => {
        if (authUser) {
          const u = toUser(authUser);
          setUser(u);
          awardDailyLoginXP(u.id);
          identify(u.id, { username: u.username });
          return;
        }
        setUser(readGuestUser());
      })
      .catch(() => setUser(readGuestUser()))
      .finally(() => {
        setSessionLoaded(true);
      });
  }, []);

  const startOnboarding = useCallback(() => {
    const guest = readGuestUser() ?? createGuestUser();
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guest));
    setUser(guest);
    track("onboarding_started", { source: "join", account_type: "guest" });
  }, []);

  const logout = useCallback(async () => {
    if (!user?.isGuest) await signOut();
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    setUser(null);
    queryClient.clear();
    reset();
    window.location.href = "/";
  }, [queryClient, user?.isGuest]);

  return useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isAdmin: user?.role === "admin",
      sessionLoaded,
      isGuest: Boolean(user?.isGuest),
      startOnboarding,
      logout,
    }),
    [logout, sessionLoaded, startOnboarding, user],
  );
}
