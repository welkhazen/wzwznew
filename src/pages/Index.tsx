import { Suspense, lazy, useEffect } from "react";
import { useHostMode } from "@/hooks/use-host-mode";
import { POLL_SHARE_PARAM } from "@/lib/pollShare";
import { INVITE_PARAM } from "@/lib/inviteLink";
import { useRawStore } from "@/store/useRawStore";
import { awardXP, XP_REWARDS } from "@/lib/userProgress";
import { claimPendingLandingWheelAvatarForUser } from "@/lib/avatarCatalog";
import { unlockCommunity } from "@/lib/communityAccess";
import { joinCommunity } from "@/backend/supabase/controllers/communityController";
import { saveOnboardingIdentities } from "@/backend/supabase/controllers/userController";
import { APP_CANONICAL_HOST, buildCanonicalAppUrl } from "@/lib/canonicalHost";

const LandingShellLazy = lazy(() => import("@/components/landing/LandingShell"));
const DashboardLazy = lazy(() => import("@/pages/Dashboard"));
const OnboardingJourneyLazy = lazy(() =>
  import("@/components/onboarding/OnboardingJourney").then((m) => ({ default: m.OnboardingJourney })),
);
const SharedPollPageLazy = lazy(() =>
  import("@/components/polls/SharedPollPage").then((m) => ({ default: m.SharedPollPage })),
);
const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((m) => ({ default: m.SignupModal })),
);

const Index = () => {

  const {
    user,
    isLoggedIn,
    sessionLoaded,
    polls,
    votedPolls,
    showSignup,
    setShowSignup,
    avatarLevel,
    setAvatarLevel,
    selectAvatarForOnboarding,
    ownedAvatarLevels,
    ownedAvatarIds,
    unlockAvatarLevel,
    markAvatarOwned,
    markAvatarOwnedById,
    avatarPricesByLevel,
    avatarCatalog,
    onboardingStep,
    setOnboardingStep,
    onboardingAnsweredPollIds,
    onboardingPublicUsername,
    onboardingPrivateUsername,
    setOnboardingPublicUsername,
    setOnboardingPrivateUsername,
    markOnboardingPollAnswered,
    onboardingSelectedCommunityIds,
    setOnboardingSelectedCommunityIds,
    onboardingCompleted,
    isOnboardingResolved,
    dailyAnsweredCount,
    dailyPollLimit,
    isDailyPollLimitReached,
    tokenBalance,
    addTokens,
    unlockExtraPolls,
    completeOnboarding,
    vote,
    signup,
    login,
    logout,
  } = useRawStore();
  const { hostname, isTheRawMe } = useHostMode();
  const sharedPollRef = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(POLL_SHARE_PARAM)
    : null;
  const inviteCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get(INVITE_PARAM)
    : null;

  const joinOnboardingCommunities = async () => {
    if (!user) return;

    for (const communityId of onboardingSelectedCommunityIds) {
      const result = await unlockCommunity(user.id, communityId);
      if (!result.ok && !result.already) {
        throw new Error("Could not save your selected community. Please try again.");
      }
      await joinCommunity(communityId, user.id, user.username);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !user || !isTheRawMe || typeof window === "undefined") {
      return;
    }

    const targetUrl = buildCanonicalAppUrl(window.location);
    if (window.location.hostname !== APP_CANONICAL_HOST) {
      window.location.replace(targetUrl);
    }
  }, [hostname, isLoggedIn, isTheRawMe, user]);

  // An invite link (?invite=CODE) opens the signup modal with the code prefilled.
  useEffect(() => {
    if (inviteCode && !isLoggedIn) setShowSignup(true);
  }, [inviteCode, isLoggedIn, setShowSignup]);

  // Don't flash the landing page (and its poll popup) while auth is still
  // resolving on refresh. Wait for the session to load first.
  if (!sessionLoaded && !sharedPollRef) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raw-black">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" />
      </div>
    );
  }

  if (isLoggedIn && user && isTheRawMe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-raw-black px-6 text-center text-raw-silver/60">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-raw-gold/70">Redirecting</p>
          <p className="mt-3 text-sm">Taking you to www.myraw.app...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && sharedPollRef) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-raw-black"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" /></div>}>
        <SharedPollPageLazy
          polls={polls}
          shareCode={sharedPollRef}
          votedPolls={votedPolls}
          onVote={vote}
          onSignup={() => setShowSignup(true)}
        />
        <SignupModalLazy
          open={showSignup}
          initialReferralCode={inviteCode ?? undefined}
          onClose={() => setShowSignup(false)}
          onSignup={signup}
          onLogin={login}
          source="shared-poll"
        />
      </Suspense>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-raw-black"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" /></div>}>
        <OnboardingJourneyLazy
          user={user}
          polls={polls}
          avatarIndex={avatarLevel}
          onAvatarChange={selectAvatarForOnboarding}
          ownedAvatarLevels={ownedAvatarLevels}
          ownedAvatarIds={ownedAvatarIds}
          avatarCatalog={avatarCatalog}
          onboardingStep={onboardingStep}
          onboardingAnsweredPollIds={onboardingAnsweredPollIds}
          publicUsername={onboardingPublicUsername}
          privateUsername={onboardingPrivateUsername}
          onSaveUsernames={async (publicUsername, privateUsername) => {
            await saveOnboardingIdentities(publicUsername, privateUsername);
            setOnboardingPublicUsername(publicUsername);
            setOnboardingPrivateUsername(privateUsername);
          }}
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
          onCompleteOnboarding={async () => {
            await joinOnboardingCommunities();
            completeOnboarding();
            void awardXP(user.id, XP_REWARDS.ONBOARDING_COMPLETE);
          }}
          onLogout={logout}
          onClaimLandingWheelAvatar={async () => {
            const result = await claimPendingLandingWheelAvatarForUser(user.id);
            if (result && (result.status === "granted" || result.status === "already_claimed")) {
              markAvatarOwnedById(result.avatarId);
            }
          }}
          markAvatarOwnedById={markAvatarOwnedById}
        />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-raw-black"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-raw-border border-t-raw-gold" /></div>}>
      <DashboardLazy
        user={user}
        polls={polls}
        votedPolls={votedPolls}
        avatarLevel={avatarLevel}
        setAvatarLevel={setAvatarLevel}
        ownedAvatarLevels={ownedAvatarLevels}
        unlockAvatarLevel={unlockAvatarLevel}
        markAvatarOwned={markAvatarOwned}
        avatarPricesByLevel={avatarPricesByLevel}
        avatarCatalog={avatarCatalog}
        dailyAnsweredCount={dailyAnsweredCount}
        dailyPollLimit={dailyPollLimit}
        isDailyPollLimitReached={isDailyPollLimitReached}
        tokenBalance={tokenBalance}
        addTokens={addTokens}
        unlockExtraPolls={unlockExtraPolls}
        vote={vote}
        onLogout={logout}
      />
      </Suspense>
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
        initialReferralCode={inviteCode ?? undefined}
        signup={signup}
        login={login}
      />
    </Suspense>
  );
};

export default Index;
