import { Suspense, lazy, useState } from "react";
import { BrandName } from "@/components/ui/brand-name";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
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
import { FAQSection } from "@/components/landing/FAQSection";
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
      <PollShowcase
        initialOpen
        onOpenChange={(open) => {
          if (open) setSiteReady(false);
        }}
        onResolved={() => setSiteReady(true)}
      />

      <Navbar
        isLoggedIn={isLoggedIn}
        username={user?.username}
        onSignupClick={() => setShowSignup(true)}
      />

      <div className="relative min-h-screen overflow-x-hidden">
        {!siteReady && (
          <div className="fixed inset-0 z-0 bg-raw-black">
            <PerforatedBackground />
          </div>
        )}

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
            <WhyAnonymity />
            <Suspense fallback={<div className="h-16" />}>
              <TestimonialsSection />
            </Suspense>

            <section className="landing-section px-4 py-8 sm:px-6 sm:py-12">
              <div
                className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border-2 border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.04] to-transparent px-2 py-6 sm:px-4 sm:py-10"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px rgba(241,196,45,0.06)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/70 to-transparent" />
                <div className="px-6 pb-2 pt-2 text-center sm:pb-6">
                  <h3 className="landing-heading text-raw-gold">
                    {highlightRawWordmark("What raW is building next")}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-raw-silver/55">
                    {highlightRawWordmark("See how raW turns anonymous answers into sharper insights, better rewards, and safer community matching.")}
                  </p>
                </div>

                <PersonalityInsightsSection />
                <EarnedWarUpgradesSection />
              </div>
            </section>

            <FAQSection />

            <section className="landing-section px-4 pb-14 pt-4 sm:px-6 sm:pb-20">
              <div
                className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.06] to-transparent px-6 py-10 text-center sm:px-10 sm:py-14"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px rgba(241,196,45,0.06)" }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-raw-gold/70 to-transparent" />
                <h2 className="landing-heading">
                  Ready to be <BrandName />?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-raw-silver/55 sm:text-base">
                  Join with just a username and password. No email, no phone, no real name — your people are already talking.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl border border-raw-gold/45 bg-raw-gold px-8 py-3.5 text-base font-semibold text-raw-ink transition hover:bg-raw-gold/90 sm:text-lg"
                >
                  Join Now — Free
                </button>
              </div>
            </section>

            <LandingFooter />
          </div>
          </motion.div>
        )}
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
