import { Suspense, lazy, useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { GlobeHero } from "@/components/landing/GlobeHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PollSection } from "@/components/landing/PollSection";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { AvatarShowcaseSection } from "@/components/landing/AvatarShowcaseSection";
import { Communities } from "@/components/landing/Communities";
import { PersonalityInsightsSection } from "@/components/landing/PersonalityInsightsSection";
import { WheelReward } from "@/components/landing/WheelReward";
import { WhyAnonymity } from "@/components/landing/WhyAnonymity";
import { AnonQuestionSection } from "@/components/landing/AnonQuestionSection";
import { EarnedWarUpgradesSection } from "@/components/landing/EarnedWarUpgradesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { OnboardingJourney } from "@/components/onboarding/OnboardingJourney";
import MatrixBackgroundIntro from "@/components/ui/matrix-background-intro";
import PerforatedBackground from "@/components/ui/perforated-background";
import MatrixBackground from "@/components/ui/matrix-background";
import { useHostMode } from "@/hooks/use-host-mode";
import Dashboard from "@/pages/Dashboard";
import { useRawStore } from "@/store/useRawStore";
import { joinCommunityChat } from "@/lib/communityChat";

const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((module) => ({ default: module.SignupModal }))
);

const Index = () => {
  const [showMatrixIntro, setShowMatrixIntro] = useState(true);

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
        dailyAnsweredCount={dailyAnsweredCount}
        dailyPollLimit={dailyPollLimit}
        isDailyPollLimitReached={isDailyPollLimitReached}
        vote={vote}
        onLogout={logout}
      />
    );
  }

  return (
    <div className="landing-page-shell min-h-screen overflow-x-hidden bg-raw-black">
      <div className="relative overflow-x-hidden">
        <PerforatedBackground />
        <MatrixBackground />
        {showMatrixIntro ? <MatrixBackgroundIntro onComplete={() => setShowMatrixIntro(false)} /> : null}

        <Navbar
          isLoggedIn={isLoggedIn}
          username={user?.username}
          onSignupClick={() => setShowSignup(true)}
        />

        <GlobeHero onSignupClick={() => setShowSignup(true)} />
        <ProblemSection />
        <HowItWorks />
        <AvatarShowcaseSection />
        <PollSection
          polls={polls}
          votedPolls={votedPolls}
          isLoggedIn={isLoggedIn}
          freeVotesUsed={freeVotesUsed}
          onVote={vote}
          onSignupClick={() => setShowSignup(true)}
        />
        <Communities onSignupClick={() => setShowSignup(true)} />
        <PersonalityInsightsSection />
        <EarnedWarUpgradesSection />
        <PollShowcase />
        <AvatarShowcaseSection />
        <WheelReward onSignupClick={() => setShowSignup(true)} />
        <WhyAnonymity />
        <AnonQuestionSection />
        <TestimonialsSection />
        <LandingFooter />
      </div>

      <Suspense fallback={null}>
        <SignupModalLazy
          open={showSignup}
          onClose={() => setShowSignup(false)}
          onRequestSignupOtp={requestSignupOtp}
          onVerifySignupOtp={verifySignupOtp}
          onLogin={login}
        />
      </Suspense>
    </div>
  );
};

export default Index;
