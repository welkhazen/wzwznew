import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useOnboarding } from "@/store/useOnboarding";
import { useCommunities } from "@/store/useCommunities";
import { readOnboardingMap } from "@/store/useRawStore.storage";

describe("onboarding persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores onboarding step and answered polls", () => {
    window.localStorage.setItem("raw.onboarding.v1", JSON.stringify({
      alice: {
        completed: false,
        step: "polls",
        answeredPollIds: ["poll-1", "poll-2"],
      },
    }));

    const { result } = renderHook(() => useOnboarding(true, "alice"));

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

    const { result } = renderHook(() => useOnboarding(true, "alice"));

    expect(result.current.onboardingStep).toBe("avatar");
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
});
