import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboarding } from "@/store/useOnboarding";
import { useCommunities } from "@/store/useCommunities";
import { readOnboardingMap } from "@/store/useRawStore.storage";
import type { User } from "@/store/types";
import { loadOnboardingProgress, saveOnboardingProgress } from "@/backend/supabase/controllers/userController";

vi.mock("@/backend/supabase/controllers/userController", () => ({
  loadOnboardingProgress: vi.fn(async () => null),
  saveOnboardingProgress: vi.fn(async () => undefined),
}));

vi.mock("@/backend/supabase/controllers/authController", () => ({
  completeUserOnboarding: vi.fn(async () => ({ ok: true })),
}));

const loadOnboardingProgressMock = vi.mocked(loadOnboardingProgress);
const saveOnboardingProgressMock = vi.mocked(saveOnboardingProgress);

const alice: User = {
  id: "user-alice",
  username: "alice",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
};

describe("onboarding persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    loadOnboardingProgressMock.mockResolvedValue(null);
    saveOnboardingProgressMock.mockResolvedValue(undefined);
  });

  it("restores onboarding step and answered polls", () => {
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "polls",
        answeredPollIds: ["poll-1", "poll-2"],
      },
    }));

    const { result } = renderHook(() => useOnboarding(true, alice));

    expect(result.current.onboardingStep).toBe("polls");
    expect(result.current.onboardingAnsweredPollIds.has("poll-1")).toBe(true);
    expect(result.current.onboardingAnsweredPollIds.has("poll-2")).toBe(true);
  });

  it("does not restore spin step after the wheel has already been claimed", () => {
    window.localStorage.setItem("raw.landing-wheel.spin.v1", JSON.stringify({
      prizeId: "wheel-avatar-1",
      avatarId: "silver-void",
      spunAt: Date.now(),
    }));
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "spin",
        answeredPollIds: [],
      },
    }));

    const { result } = renderHook(() => useOnboarding(true, alice));

    expect(result.current.onboardingStep).toBe("username");
  });

  it("moves old voucher onboarding progress to avatar", () => {
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "voucher",
        answeredPollIds: [],
      },
    }));

    const { result } = renderHook(() => useOnboarding(true, alice));

    expect(result.current.onboardingStep).toBe("avatar");
  });

  it("does not overwrite restored onboarding state with the initial default step", () => {
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "polls",
        answeredPollIds: ["poll-1"],
      },
    }));

    renderHook(() => useOnboarding(true, alice));

    expect(readOnboardingMap().alice?.step).toBe("polls");
    expect(readOnboardingMap().alice?.answeredPollIds).toEqual(["poll-1"]);
  });

  it("uses server onboarding completion over stale local onboarding state", () => {
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "spin",
        answeredPollIds: [],
      },
    }));

    const { result } = renderHook(() => useOnboarding(true, { ...alice, onboardingCompleted: true }));

    expect(result.current.onboardingCompleted).toBe(true);
  });

  it("restores onboarding progress from Supabase after sign-in", async () => {
    loadOnboardingProgressMock.mockResolvedValue({
      completed: false,
      step: "communities",
      answeredPollIds: ["poll-1", "poll-2", "core-safety", "core-moderation"],
      selectedCommunityIds: ["lnt"],
    });

    const { result } = renderHook(() => useOnboarding(true, alice));

    await waitFor(() => {
      expect(result.current.onboardingStep).toBe("communities");
    });
    expect(result.current.onboardingAnsweredPollIds.has("core-safety")).toBe(true);
    expect(readOnboardingMap().alice?.selectedCommunityIds).toEqual(["lnt"]);
  });

  it("saves onboarding progress to Supabase after server progress loads", async () => {
    const { result } = renderHook(() => useOnboarding(true, alice));

    await waitFor(() => {
      expect(loadOnboardingProgressMock).toHaveBeenCalled();
    });

    act(() => {
      result.current.setOnboardingStep("polls");
      result.current.markOnboardingPollAnswered("poll-1");
    });

    await waitFor(() => {
      expect(saveOnboardingProgressMock).toHaveBeenCalledWith({
        step: "polls",
        answeredPollIds: ["poll-1"],
      });
    });
  });

  it("persists selected communities for onboarding", () => {
    const { result } = renderHook(() => useCommunities("bob"));

    act(() => {
      result.current.setOnboardingSelectedCommunityIds(["lnt", "syt"]);
    });

    expect(readOnboardingMap().bob?.selectedCommunityIds).toEqual(["lnt", "syt"]);

    const restored = renderHook(() => useCommunities("bob"));
    expect(restored.result.current.onboardingSelectedCommunityIds).toEqual(["lnt", "syt"]);
  });

  it("restores and saves selected communities through Supabase", async () => {
    loadOnboardingProgressMock.mockResolvedValue({
      completed: false,
      step: "communities",
      answeredPollIds: [],
      selectedCommunityIds: ["syt", "lnt"],
    });

    const { result } = renderHook(() => useCommunities("alice", alice.id));

    await waitFor(() => {
      expect(result.current.onboardingSelectedCommunityIds).toEqual(["syt", "lnt"]);
    });

    act(() => {
      result.current.setOnboardingSelectedCommunityIds(["syt"]);
    });

    await waitFor(() => {
      expect(saveOnboardingProgressMock).toHaveBeenCalledWith({
        selectedCommunityIds: ["syt"],
      });
    });
  });
});
