import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

function renderPollStep(answeredPollIds = new Set<string>()) {
  const queryClient = new QueryClient();
  window.localStorage.setItem(`raw.ageGateVerified.${user.id}`, "1");
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingJourney
        user={user}
        polls={polls}
        avatarIndex={1}
        onAvatarChange={vi.fn()}
        ownedAvatarLevels={new Set([1])}
        ownedAvatarIds={new Set()}
        avatarCatalog={[]}
        onboardingStep="polls"
        onboardingAnsweredPollIds={answeredPollIds}
        publicUsername="tester"
        privateUsername=""
        onSaveUsernames={vi.fn()}
        onSetOnboardingStep={vi.fn()}
        onMarkPollAnswered={vi.fn()}
        selectedCommunityIds={[]}
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
}

describe("onboarding polls gate", () => {
  it("allows continuing even when no onboarding polls are answered", () => {
    renderPollStep();

    expect(screen.getByRole("button", { name: /continue to communities/i })).toBeEnabled();
  });
});
