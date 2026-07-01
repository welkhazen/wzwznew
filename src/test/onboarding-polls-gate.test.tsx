import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import type { Poll, User } from "@/store/types";

vi.mock("@/components/onboarding/SwipeablePollCard", () => ({
  SwipeablePollCard: () => <div data-testid="onboarding-poll-card" />,
}));

vi.mock("@/lib/api/polls", () => ({
  fetchPolls: vi.fn().mockResolvedValue([]),
}));

const user: User = {
  id: "user-1",
  username: "tester",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
};

const polls: Poll[] = [
  {
    id: "poll-1",
    question: "Do you prefer silence or background noise when working?",
    locked: false,
    options: [
      { id: "silence", text: "Silence", votes: 0 },
      { id: "noise", text: "Noise", votes: 0 },
    ],
  },
  {
    id: "poll-2",
    question: "Do you like mornings?",
    locked: false,
    options: [
      { id: "yes", text: "Yes", votes: 0 },
      { id: "no", text: "No", votes: 0 },
    ],
  },
];

function renderOnboardingStep(
  onboardingStep: "polls" | "communities" | "avatar",
  answeredPollIds = new Set<string>(),
  selectedCommunityIds: string[] = [],
) {
  const queryClient = new QueryClient();
  const onSetOnboardingStep = vi.fn();
  window.localStorage.setItem(`raw.ageGateVerified.${user.id}`, "1");
  const view = render(
    <QueryClientProvider client={queryClient}>
      <OnboardingJourney
        user={user}
        polls={polls}
        avatarIndex={1}
        onAvatarChange={vi.fn()}
        ownedAvatarLevels={new Set([1])}
        ownedAvatarIds={new Set()}
        avatarCatalog={[]}
        onboardingStep={onboardingStep}
        onboardingAnsweredPollIds={answeredPollIds}
        publicUsername="tester"
        privateUsername=""
        onSaveUsernames={vi.fn()}
        onSetOnboardingStep={onSetOnboardingStep}
        onMarkPollAnswered={vi.fn()}
        selectedCommunityIds={selectedCommunityIds}
        onToggleCommunity={vi.fn()}
        profilePublic
        onSetProfilePublic={vi.fn()}
        onCompleteOnboarding={vi.fn()}
        onLogout={vi.fn()}
        onClaimLandingWheelAvatar={vi.fn()}
        markAvatarOwnedById={vi.fn()}
      />
    </QueryClientProvider>,
  );

  return { ...view, onSetOnboardingStep };
}

function renderPollStep(answeredPollIds = new Set<string>()) {
  return renderOnboardingStep("polls", answeredPollIds);
}

describe("onboarding polls gate", () => {
  it("blocks continuing when onboarding polls are not answered", () => {
    renderPollStep();

    expect(screen.getByRole("button", { name: /continue to communities/i })).toBeDisabled();
  });

  it("allows continuing after all onboarding polls are answered", () => {
    renderPollStep(new Set(["poll-1", "poll-2", "core-safety", "core-moderation"]));

    expect(screen.getByRole("button", { name: /continue to communities/i })).toBeEnabled();
  });

  it("does not allow step pills to skip required polls", () => {
    const { onSetOnboardingStep } = renderPollStep();

    const communitiesStep = screen.getByRole("button", { name: /^communities$/i });
    expect(communitiesStep).toBeDisabled();
    fireEvent.click(communitiesStep);
    expect(onSetOnboardingStep).not.toHaveBeenCalledWith("communities");
  });

  it("blocks completing onboarding until a community is selected", () => {
    renderOnboardingStep("communities", new Set(["poll-1", "poll-2", "core-safety", "core-moderation"]));

    expect(screen.getByRole("button", { name: /continue to avatar/i })).toBeDisabled();
  });

  it("continues from communities to avatar after a community is selected", () => {
    const { onSetOnboardingStep } = renderOnboardingStep(
      "communities",
      new Set(["poll-1", "poll-2", "core-safety", "core-moderation"]),
      ["lnt"],
    );

    fireEvent.click(screen.getByRole("button", { name: /continue to avatar/i }));
    expect(onSetOnboardingStep).toHaveBeenCalledWith("avatar");
  });

  it("blocks completing onboarding on avatar until polls and community are done", () => {
    renderOnboardingStep("avatar");

    expect(screen.getByRole("button", { name: /complete onboarding/i })).toBeDisabled();
  });
});
