import { Suspense, lazy, useState } from "react";
import { motion } from "framer-motion";
import MatrixBackground from "@/components/ui/matrix-background";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSection } from "@/components/landing/ProblemSection";
const GlobeHero = lazy(() =>
  import("@/components/landing/GlobeHero").then((m) => ({ default: m.GlobeHero }))
);
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { Communities } from "@/components/landing/Communities";
import { PersonalityInsightsSection } from "@/components/landing/PersonalityInsightsSection";
import { AvatarShowcaseSection } from "@/components/landing/AvatarShowcaseSection";
import { LandingPollsSection } from "@/components/landing/LandingPollsSection";
import { WhyAnonymity } from "@/components/landing/WhyAnonymity";
const TestimonialsSection = lazy(() =>
  import("@/components/landing/TestimonialsSection").then((m) => ({ default: m.TestimonialsSection }))
);
import { EarnedWarUpgradesSection } from "@/components/landing/EarnedWarUpgradesSection";
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
  const [siteReady, setSiteReady] = useState(true);

  return (
    <div className="landing-page-shell min-h-screen overflow-x-hidden bg-raw-black">
      <PollShowcase initialOpen onResolved={() => setSiteReady(true)} />

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
            <Suspense fallback={<div className="min-h-[620px] sm:min-h-[680px]" />}>
              <GlobeHero onSignupClick={() => setShowSignup(true)} />
            </Suspense>
            <ProblemSection />
            <HowItWorks />
            <AvatarShowcaseSection onSignupClick={() => setShowSignup(true)} />
            <LandingPollsSection onSignupClick={() => setShowSignup(true)} />
            <Communities onSignupClick={() => setShowSignup(true)} />

            <section className="landing-section px-4 py-8 sm:px-6 sm:py-12">
              <div
                className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border-2 border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.04] to-transparent px-2 py-6 sm:px-4 sm:py-10"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px rgba(241,196,45,0.06)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/70 to-transparent" />
                <div className="px-6 pb-2 pt-2 text-center sm:pb-6">
                  <p className="font-display text-[10px] tracking-[0.3em] uppercase text-raw-gold/70">
                    On the way
                  </p>
                  <h3 className="mt-2 landing-heading text-raw-gold">
                    Coming soon.
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-raw-silver/55">
                    Everything in this frame is still being built. Sign up to be first
                    in line when these features go live.
                  </p>
                </div>

                <PersonalityInsightsSection />
                <EarnedWarUpgradesSection />
                <WhyAnonymity />
              </div>
            </section>

            <Suspense fallback={<div className="h-16" />}>
              <TestimonialsSection />
            </Suspense>

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
