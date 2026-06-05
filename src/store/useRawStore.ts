import { useMemo } from "react";
import { useAuth } from "@/store/useAuth";
import { useCommunities } from "@/store/useCommunities";
import { useOnboarding } from "@/store/useOnboarding";
import { usePolls } from "@/store/usePolls";
import { useRewards } from "@/store/useRewards";

export type { AuthResult, OnboardingStep, Poll, PollOption, User } from "@/store/types";

export function useRawStore() {
  const auth = useAuth();
  const polls = usePolls(auth.isLoggedIn && !auth.isGuest, auth.isGuest ? undefined : auth.user?.id);
  const rewards = useRewards(auth.isGuest ? null : auth.user);
  const onboarding = useOnboarding(auth.isLoggedIn, auth.user);
  const communities = useCommunities(auth.user?.isGuest ? auth.user.id : auth.user?.username);

  return useMemo(() => ({
    user: auth.user,
    isLoggedIn: auth.isLoggedIn,
    isAdmin: auth.isAdmin,
    isGuest: auth.isGuest,
    sessionLoaded: auth.sessionLoaded,
    polls: polls.polls,
    votedPolls: polls.votedPolls,
    freeVotesUsed: polls.freeVotesUsed,
    avatarLevel: rewards.avatarLevel,
    setAvatarLevel: rewards.setAvatarLevel,
    changeAvatarLevel: rewards.changeAvatarLevel,
    selectAvatarForOnboarding: rewards.selectAvatarForOnboarding,
    avatarCatalog: rewards.avatarCatalog,
    ownedAvatarLevels: rewards.ownedAvatarLevels,
    unlockAvatarLevel: rewards.unlockAvatarLevel,
    markAvatarOwned: rewards.markAvatarOwned,
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
    tokenBalance: polls.tokenBalance,
    addTokens: polls.addTokens,
    unlockExtraPolls: polls.unlockExtraPolls,
    completeOnboarding: onboarding.completeOnboarding,
    resetOnboardingProgress: onboarding.resetOnboardingProgress,
    vote: polls.vote,
    startOnboarding: auth.startOnboarding,
    logout: auth.logout,
  }), [auth, communities, onboarding, polls, rewards]);
}
