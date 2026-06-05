import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/store/useAuth";

vi.mock("@/backend/supabase/controllers/authController", () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe("guest onboarding entry", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("starts onboarding without sign up or sign in", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.sessionLoaded).toBe(true));

    act(() => result.current.startOnboarding());

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.isGuest).toBe(true);
    expect(result.current.user).toMatchObject({ username: "guest", onboardingCompleted: false, isGuest: true });
  });
});
