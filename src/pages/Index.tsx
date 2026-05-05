import { Suspense, lazy, useEffect } from "react";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import { useHostMode } from "@/hooks/use-host-mode";
import Dashboard from "@/pages/Dashboard";
import { useRawStore } from "@/store/useRawStore";
import { joinCommunityChat } from "@/lib/communityChat";

const LandingShellLazy = lazy(() => import("@/components/landing/LandingShell"));

const Index = () => {

  const {
    user,
    isLoggedIn,
    polls,
    votedPolls,
    freeVotesUsed,
    showSignup,
    setShowSignup,
    avatarLevel,
    setAvatarLevel,
    ownedAvatarLevels,
    unlockAvatarLevel,
    avatarPricesByLevel,
    onboardingStep,
    setOnboardingStep,
    onboardingAnsweredPollIds,
    markOnboardingPollAnswered,
    onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds,
    onboardingCompleted,
    isOnboardingResolved,
    dailyAnsweredCount,
    dailyPollLimit,
    isDailyPollLimitReached,
    completeOnboarding,
    vote,
    requestSignupOtp,
    verifySignupOtp,
    login,
    logout,
  } = useRawStore();
  const { hostname, isTheRawMe } = useHostMode();

  useEffect(() => {
    if (!isLoggedIn || !user || !isTheRawMe || typeof window === "undefined") {
      return;
    }

    const targetUrl = `${window.location.protocol}//myraw.app${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (window.location.hostname !== "myraw.app") {
      window.location.replace(targetUrl);
    }
  }, [hostname, isLoggedIn, isTheRawMe, user]);

  if (isLoggedIn && user && isTheRawMe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raw-black px-6 text-center text-raw-silver/60">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-raw-gold/70">Redirecting</p>
          <p className="mt-3 text-sm">Taking you to myraw.app...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn && user && !isOnboardingResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-raw-black to-raw-black/80">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold mb-4"></div>
          <p className="text-raw-silver/60 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show dashboard when logged in
  if (isLoggedIn && user) {
    if (!onboardingCompleted) {
      return (
        <OnboardingJourney
          user={user}
          polls={polls}
          avatarIndex={avatarLevel}
          onAvatarChange={setAvatarLevel}
          onboardingStep={onboardingStep}
          onboardingAnsweredPollIds={onboardingAnsweredPollIds}
          onSetOnboardingStep={setOnboardingStep}
          onMarkPollAnswered={markOnboardingPollAnswered}
          selectedCommunityIds={onboardingSelectedCommunityIds}
          onToggleCommunity={(communityId) => {
            setOnboardingSelectedCommunityIds((previous) => {
              if (previous.includes(communityId)) {
                return previous.filter((id) => id !== communityId);
              }

              if (previous.length >= 2) {
                return previous;
              }

              return [...previous, communityId];
            });
          }}
          onCompleteOnboarding={() => {
            onboardingSelectedCommunityIds.forEach((communityId) => {
              joinCommunityChat(communityId, { userId: user.id, username: user.username });
            });
            completeOnboarding();
          }}
          onLogout={logout}
        />
      );
    }

    return (
      <Dashboard
        user={user}
        polls={polls}
        votedPolls={votedPolls}
        avatarLevel={avatarLevel}
        setAvatarLevel={setAvatarLevel}
        ownedAvatarLevels={ownedAvatarLevels}
        unlockAvatarLevel={unlockAvatarLevel}
        avatarPricesByLevel={avatarPricesByLevel}
        dailyAnsweredCount={dailyAnsweredCount}
        dailyPollLimit={dailyPollLimit}
        isDailyPollLimitReached={isDailyPollLimitReached}
        vote={vote}
        onLogout={logout}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-raw-black">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" />
        </div>
      }
    >
      <LandingShellLazy
        user={user}
        isLoggedIn={isLoggedIn}
        showSignup={showSignup}
        setShowSignup={setShowSignup}
        requestSignupOtp={requestSignupOtp}
        verifySignupOtp={verifySignupOtp}
        login={login}
      />
    </Suspense>
  );
};

export default Index;
