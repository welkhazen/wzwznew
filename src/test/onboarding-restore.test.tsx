import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Index from "@/pages/Index";

vi.mock("@/components/landing/Navbar", () => ({
  Navbar: () => <div data-testid="landing-navbar" />,
}));

vi.mock("@/components/landing/Hero", () => ({
  Hero: () => <div data-testid="landing-hero" />,
}));

vi.mock("@/components/landing/ProblemSection", () => ({
  ProblemSection: () => <div data-testid="landing-problem" />,
}));

vi.mock("@/components/landing/GlobeHero", () => ({
  GlobeHero: () => <div data-testid="landing-globe-hero" />,
}));

vi.mock("@/components/landing/HowItWorks", () => ({
  HowItWorks: () => <div data-testid="landing-how-it-works" />,
}));

vi.mock("@/components/landing/PollSection", () => ({
  PollSection: () => <div data-testid="landing-polls" />,
}));

vi.mock("@/components/landing/Communities", () => ({
  Communities: () => <div data-testid="landing-communities" />,
}));

vi.mock("@/components/landing/AvatarIdentity", () => ({
  AvatarIdentity: () => <div data-testid="landing-avatar" />,
}));

vi.mock("@/components/landing/AvatarProgression", () => ({
  AvatarProgression: () => <div data-testid="landing-avatar-progression" />,
}));

vi.mock("@/components/landing/WhyAnonymity", () => ({
  WhyAnonymity: () => <div data-testid="landing-why" />,
}));

vi.mock("@/components/landing/FoundingProviders", () => ({
  FoundingProviders: () => <div data-testid="landing-founders" />,
}));

vi.mock("@/components/landing/WheelReward", () => ({
  WheelReward: () => <div data-testid="landing-wheel-reward" />,
}));

vi.mock("@/components/landing/LandingFooter", () => ({
  LandingFooter: () => <div data-testid="landing-footer" />,
}));

vi.mock("@/components/landing/FinalCTA", () => ({
  FinalCTA: () => <div data-testid="landing-cta" />,
}));

vi.mock("@/components/landing/SignupModal", () => ({
  SignupModal: () => null,
}));

vi.mock("@/components/onboarding/OnboardingJourney", () => ({
  OnboardingJourney: () => <div data-testid="onboarding-journey" />,
}));

vi.mock("@/pages/Dashboard", () => ({
  default: () => <div data-testid="dashboard-screen" />,
}));

vi.mock("@/hooks/use-host-mode", () => ({
  useHostMode: () => ({
    hostname: "localhost",
    isMyRawApp: false,
    isTheRawMe: false,
  }),
}));

vi.mock("@/store/useRawStore", () => ({
  useRawStore: () => ({
    user: { id: "user-returning-user", username: "returning-user", role: "member" },
    isLoggedIn: true,
    sessionLoaded: true,
    polls: [],
    votedPolls: [],
    freeVotesUsed: 0,
    showSignup: false,
    setShowSignup: vi.fn(),
    avatarLevel: 1,
    setAvatarLevel: vi.fn(),
    onboardingStep: "ready",
    setOnboardingStep: vi.fn(),
    onboardingAnsweredPollIds: ["poll-1"],
    markOnboardingPollAnswered: vi.fn(),
    onboardingSelectedCommunityIds: [],
    setOnboardingSelectedCommunityIds: vi.fn(),
    onboardingCompleted: true,
    isOnboardingResolved: true,
    dailyAnsweredCount: 0,
    dailyPollLimit: 3,
    isDailyPollLimitReached: false,
    completeOnboarding: vi.fn(),
    vote: vi.fn(),
    requestSignupOtp: vi.fn(),
    verifySignupOtp: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe("onboarding restore flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the dashboard for a returning user with completed onboarding", async () => {
    const queryClient = new QueryClient();
    const { findByTestId, queryByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <Index />
      </QueryClientProvider>
    );

    expect(await findByTestId("dashboard-screen")).toBeInTheDocument();
    expect(queryByTestId("onboarding-journey")).not.toBeInTheDocument();
  });
});
