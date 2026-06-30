import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCommunityPolls } from "@/hooks/useCommunityPolls";

const mocks = vi.hoisted(() => ({
  fetchCommunityPolls: vi.fn(async () => ([
    {
      id: "poll-1",
      communityId: "community-1",
      question: "Best idea?",
      createdByUserId: "user-a",
      createdAt: "2026-01-01T00:00:00.000Z",
      isClosed: false,
      totalVotes: 0,
      userVoteOptionId: null,
      options: [
        { id: "option-a", pollId: "poll-1", text: "A", votes: 0 },
        { id: "option-b", pollId: "poll-1", text: "B", votes: 0 },
      ],
    },
  ])),
  voteOnCommunityPoll: vi.fn(async () => undefined),
  removeChannel: vi.fn(async () => undefined),
}));

vi.mock("@/backend/supabase/controllers/communityPollController", () => ({
  createCommunityPoll: vi.fn(),
  deleteCommunityPoll: vi.fn(),
  fetchCommunityPolls: mocks.fetchCommunityPolls,
  voteOnCommunityPoll: mocks.voteOnCommunityPoll,
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: mocks.removeChannel,
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("useCommunityPolls", () => {
  beforeEach(() => {
    mocks.fetchCommunityPolls.mockClear();
    mocks.voteOnCommunityPoll.mockClear();
    mocks.removeChannel.mockClear();
  });

  it("hides answered polls after voting", async () => {
    const { result } = renderHook(() => useCommunityPolls("community-1", "user-a", false));

    await waitFor(() => {
      expect(result.current.communityPolls).toHaveLength(1);
    });

    let timeoutCallback: TimerHandler | undefined;
    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation(((callback: TimerHandler) => {
      timeoutCallback = callback;
      return 1 as unknown as number;
    }) as typeof window.setTimeout);

    await act(async () => {
      await result.current.votePoll("poll-1", "option-a");
    });

    expect(result.current.communityPolls[0]?.userVoteOptionId).toBe("option-a");

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 4500);
    await act(async () => {
      timeoutCallback?.();
    });
    expect(result.current.hiddenAnsweredPollIds.has("poll-1")).toBe(true);
    setTimeoutSpy.mockRestore();
  });

  it("does not reload after voting", async () => {
    const { result } = renderHook(() => useCommunityPolls("community-1", "user-a", false));

    await waitFor(() => {
      expect(result.current.communityPolls).toHaveLength(1);
    });
    expect(mocks.fetchCommunityPolls).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.votePoll("poll-1", "option-a");
    });

    expect(mocks.voteOnCommunityPoll).toHaveBeenCalledWith("poll-1", "option-a", "user-a");
    expect(mocks.fetchCommunityPolls).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.communityPolls[0]?.userVoteOptionId).toBe("option-a");
    });
  });
});
