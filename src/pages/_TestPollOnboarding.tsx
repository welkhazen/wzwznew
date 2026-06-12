/**
 * DEV-ONLY test harness for the polls step of OnboardingJourney.
 * Mounted at /__test/poll-onboarding only when import.meta.env.DEV is true.
 * Used to verify swipe + Enter raW modal + backdrop dismiss without going
 * through the real auth flow.
 */
import { useState } from "react";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import type { OnboardingStep, Poll, User } from "@/store/types";

const MOCK_USER: User = {
  id: "dev-user",
  username: "tester",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
};

const MOCK_POLLS: Poll[] = [
  {
    id: "p1",
    question: "Should anonymous voices be the default in raW?",
    locked: false,
    options: [
      { id: "p1-yes", text: "Yes", votes: 412 },
      { id: "p1-no", text: "No", votes: 188 },
    ],
  },
  {
    id: "p2",
    question: "Do you trust algorithm-curated feeds?",
    locked: false,
    options: [
      { id: "p2-yes", text: "Yes", votes: 88 },
      { id: "p2-no", text: "No", votes: 612 },
    ],
  },
  {
    id: "p3",
    question: "Should controversial takes be hidden by default?",
    locked: false,
    options: [
      { id: "p3-yes", text: "Yes", votes: 224 },
      { id: "p3-no", text: "No", votes: 376 },
    ],
  },
];

export default function TestPollOnboarding() {
  const [step, setStep] = useState<OnboardingStep>("polls");
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [communities, setCommunities] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return (
      <div
        data-testid="onboarding-complete"
        className="flex min-h-screen items-center justify-center bg-raw-black text-raw-gold"
      >
        <p className="text-xl">Onboarding complete</p>
      </div>
    );
  }

  return (
    <OnboardingJourney
      user={MOCK_USER}
      polls={MOCK_POLLS}
      avatarIndex={3}
      onAvatarChange={() => undefined}
      ownedAvatarLevels={new Set([1, 2, 3])}
      ownedAvatarIds={new Set()}
      avatarCatalog={[]}
      onboardingStep={step}
      onboardingAnsweredPollIds={answered}
      publicUsername={MOCK_USER.username}
      privateUsername=""
      onSaveUsernames={() => undefined}
      onSetOnboardingStep={setStep}
      onMarkPollAnswered={(pollId) =>
        setAnswered((previous) => {
          const next = new Set(previous);
          next.add(pollId);
          return next;
        })
      }
      selectedCommunityIds={communities}
      onToggleCommunity={(communityId) =>
        setCommunities((previous) =>
          previous.includes(communityId)
            ? previous.filter((id) => id !== communityId)
            : previous.length >= 2
              ? previous
              : [...previous, communityId]
        )
      }
      onCompleteOnboarding={() => setCompleted(true)}
      onLogout={() => undefined}
      onClaimLandingWheelAvatar={async () => undefined}
      markAvatarOwnedById={() => undefined}
    />
  );
}
