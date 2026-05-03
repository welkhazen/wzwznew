import { useMemo } from "react";
import { useAuth } from "@/store/useAuth";
import { useCommunities } from "@/store/useCommunities";
import { useOnboarding } from "@/store/useOnboarding";
import { usePolls } from "@/store/usePolls";
import { useRewards } from "@/store/useRewards";

export type { AuthResult, OnboardingStep, Poll, PollOption, User } from "@/store/types";

export function useRawStore() {
  const auth = useAuth();
  const polls = usePolls(auth.isLoggedIn);
  const rewards = useRewards(auth.user);
  const onboarding = useOnboarding(auth.isLoggedIn, auth.user?.username);
  const communities = useCommunities();

  return useMemo(() => ({
    user: auth.user,
    isLoggedIn: auth.isLoggedIn,
    isAdmin: auth.isAdmin,
    sessionLoaded: auth.sessionLoaded,
    polls: polls.polls,
    votedPolls: polls.votedPolls,
    freeVotesUsed: polls.freeVotesUsed,
    showSignup: auth.showSignup,
    setShowSignup: auth.setShowSignup,
    avatarLevel: rewards.avatarLevel,
    setAvatarLevel: rewards.setAvatarLevel,
    changeAvatarLevel: rewards.changeAvatarLevel,
    avatarCatalog: rewards.avatarCatalog,
    ownedAvatarLevels: rewards.ownedAvatarLevels,
    unlockAvatarLevel: rewards.unlockAvatarLevel,
    avatarPricesByLevel: rewards.avatarPricesByLevel,
    onboardingStep: onboarding.onboardingStep,
    setOnboardingStep: onboarding.setOnboardingStep,
    onboardingAnsweredPollIds: onboarding.onboardingAnsweredPollIds,
    markOnboardingPollAnswered: onboarding.markOnboardingPollAnswered,
    onboardingSelectedCommunityIds: communities.onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds: communities.setOnboardingSelectedCommunityIds,
    onboardingCompleted: onboarding.onboardingCompleted,
    isOnboardingResolved: onboarding.isOnboardingResolved,
    dailyAnsweredCount: polls.dailyAnsweredCount,
    dailyPollLimit: polls.dailyPollLimit,
    isDailyPollLimitReached: polls.isDailyPollLimitReached,
    completeOnboarding: onboarding.completeOnboarding,
    resetOnboardingProgress: onboarding.resetOnboardingProgress,
    vote: polls.vote,
    requestSignupOtp: auth.requestSignupOtp,
    verifySignupOtp: auth.verifySignupOtp,
    login: auth.login,
    logout: auth.logout,
  }), [auth, communities, onboarding, polls, rewards]);
}
