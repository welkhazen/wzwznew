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
