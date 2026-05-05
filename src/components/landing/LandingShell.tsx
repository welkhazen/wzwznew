import { Suspense, lazy } from "react";
import MatrixBackground from "@/components/ui/matrix-background";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { GlobeHero } from "@/components/landing/GlobeHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PollBenefitsSection } from "@/components/landing/PollBenefitsSection";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { Communities } from "@/components/landing/Communities";
import { PersonalityInsightsSection } from "@/components/landing/PersonalityInsightsSection";
import { AvatarShowcaseSection } from "@/components/landing/AvatarShowcaseSection";
import { WheelReward } from "@/components/landing/WheelReward";
import { WhyAnonymity } from "@/components/landing/WhyAnonymity";
import { AnonQuestionSection } from "@/components/landing/AnonQuestionSection";
import { EarnedWarUpgradesSection } from "@/components/landing/EarnedWarUpgradesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import PerforatedBackground from "@/components/ui/perforated-background";
import type { AuthResult, User } from "@/store/types";

const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((module) => ({ default: module.SignupModal }))
);

export interface LandingShellProps {
  user: User | null;
  isLoggedIn: boolean;
  showSignup: boolean;
  setShowSignup: (open: boolean) => void;
  requestSignupOtp: (email: string) => Promise<AuthResult>;
  verifySignupOtp: (email: string, otp: string, username: string) => Promise<AuthResult>;
  login: (email: string, otp: string) => Promise<AuthResult>;
}

export default function LandingShell({
  user,
  isLoggedIn,
  showSignup,
  setShowSignup,
  requestSignupOtp,
  verifySignupOtp,
  login,
}: LandingShellProps) {
  return (
    <div className="landing-page-shell min-h-screen overflow-x-hidden bg-raw-black">
      <div className="relative overflow-x-hidden">
        <PerforatedBackground />
        <MatrixBackground />

        <Navbar
          isLoggedIn={isLoggedIn}
          username={user?.username}
          onSignupClick={() => setShowSignup(true)}
        />

        <GlobeHero onSignupClick={() => setShowSignup(true)} />
        <ProblemSection />
        <HowItWorks />
        <PollBenefitsSection />
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
}
