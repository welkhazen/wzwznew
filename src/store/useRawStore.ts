import { useMemo } from "react";
import { useAuth } from "@/store/useAuth";
import { useCommunities } from "@/store/useCommunities";
import { useOnboarding } from "@/store/useOnboarding";
import { usePolls } from "@/store/usePolls";
import { useRewards } from "@/store/useRewards";

export type { AuthResult, OnboardingStep, Poll, PollOption, User } from "@/store/types";

export function useRawStore() {
  const auth = useAuth();
  const polls = usePolls(auth.isLoggedIn, auth.user?.id);
  const rewards = useRewards(auth.user);
  const onboarding = useOnboarding(auth.isLoggedIn, auth.user);
  const communities = useCommunities(auth.user?.username);

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
    selectAvatarForOnboarding: rewards.selectAvatarForOnboarding,
    avatarCatalog: rewards.avatarCatalog,
    ownedAvatarLevels: rewards.ownedAvatarLevels,
    ownedAvatarIds: rewards.ownedAvatarIds,
    unlockAvatarLevel: rewards.unlockAvatarLevel,
    markAvatarOwned: rewards.markAvatarOwned,
    markAvatarOwnedById: rewards.markAvatarOwnedById,
    avatarPricesByLevel: rewards.avatarPricesByLevel,
    onboardingStep: onboarding.onboardingStep,
    setOnboardingStep: onboarding.setOnboardingStep,
    onboardingPublicUsername: onboarding.onboardingPublicUsername,
    onboardingPrivateUsername: onboarding.onboardingPrivateUsername,
    setOnboardingPublicUsername: onboarding.setOnboardingPublicUsername,
    setOnboardingPrivateUsername: onboarding.setOnboardingPrivateUsername,
    onboardingAnsweredPollIds: onboarding.onboardingAnsweredPollIds,
    markOnboardingPollAnswered: onboarding.markOnboardingPollAnswered,
    onboardingSelectedCommunityIds: communities.onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds: communities.setOnboardingSelectedCommunityIds,
    onboardingCompleted: onboarding.onboardingCompleted,
    isOnboardingResolved: onboarding.isOnboardingResolved,
    dailyAnsweredCount: polls.dailyAnsweredCount,
    dailyPollLimit: polls.dailyPollLimit,
    isDailyPollLimitReached: polls.isDailyPollLimitReached,
    tokenBalance: polls.tokenBalance,
    addTokens: polls.addTokens,
    unlockExtraPolls: polls.unlockExtraPolls,
    completeOnboarding: onboarding.completeOnboarding,
    resetOnboardingProgress: onboarding.resetOnboardingProgress,
    vote: polls.vote,
    requestSignupOtp: auth.requestSignupOtp,
    verifySignupOtp: auth.verifySignupOtp,
    login: auth.login,
    logout: auth.logout,
  }), [auth, communities, onboarding, polls, rewards]);
}
