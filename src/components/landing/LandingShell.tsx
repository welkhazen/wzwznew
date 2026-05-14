import { Suspense, lazy, useState } from "react";
import { motion } from "framer-motion";
import MatrixBackground from "@/components/ui/matrix-background";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { GlobeHero } from "@/components/landing/GlobeHero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { Communities } from "@/components/landing/Communities";
import { PersonalityInsightsSection } from "@/components/landing/PersonalityInsightsSection";
import { AvatarShowcaseSection } from "@/components/landing/AvatarShowcaseSection";
import { LandingPollsSection } from "@/components/landing/LandingPollsSection";
import { WheelReward } from "@/components/landing/WheelReward";
import { WhyAnonymity } from "@/components/landing/WhyAnonymity";
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
  const [siteReady, setSiteReady] = useState(false);

  return (
    <div className="landing-page-shell min-h-screen overflow-x-hidden bg-raw-black">
      <PollShowcase onResolved={() => setSiteReady(true)} />

      <Navbar
        isLoggedIn={isLoggedIn}
        username={user?.username}
        onSignupClick={() => setShowSignup(true)}
      />

      {siteReady && (
        <motion.div
          className="relative overflow-x-hidden"
          initial={{ opacity: 0, filter: "blur(14px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <PerforatedBackground />
          <MatrixBackground />

          <div className="relative max-sm:z-10">
            <GlobeHero onSignupClick={() => setShowSignup(true)} />
            <ProblemSection />
            <HowItWorks />
            <AvatarShowcaseSection />
            <LandingPollsSection onSignupClick={() => setShowSignup(true)} />
            <Communities onSignupClick={() => setShowSignup(true)} />
            <PersonalityInsightsSection />
            <EarnedWarUpgradesSection />
            <WheelReward onSignupClick={() => setShowSignup(true)} />
            <WhyAnonymity />
            <TestimonialsSection />
            <LandingFooter />
          </div>
        </motion.div>
      )}

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
