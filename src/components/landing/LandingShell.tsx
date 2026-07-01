import { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandName } from "@/components/ui/brand-name";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";
import { motion } from "framer-motion";
import MatrixBackground from "@/components/ui/matrix-background";
import { Navbar } from "@/components/landing/Navbar";
import { ProblemSection } from "@/components/landing/ProblemSection";
const GlobeHero = lazy(() =>
  import("@/components/landing/GlobeHero").then((m) => ({ default: m.GlobeHero }))
);
import { PollShowcase } from "@/components/landing/PollShowcase";
import { Communities } from "@/components/landing/Communities";
import { PersonalityInsightsSection } from "@/components/landing/PersonalityInsightsSection";
import { AvatarShowcaseSection } from "@/components/landing/AvatarShowcaseSection";
import { LandingPollsSection } from "@/components/landing/LandingPollsSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { FAQSection } from "@/components/landing/FAQSection";
import PerforatedBackground from "@/components/ui/perforated-background";
import { LaunchCountdown } from "@/components/ui/LaunchCountdown";
import type { AuthResult, User } from "@/store/types";
import { INVITE_PARAM } from "@/lib/inviteLink";

const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((module) => ({ default: module.SignupModal }))
);

export interface LandingShellProps {
  user: User | null;
  isLoggedIn: boolean;
  showSignup: boolean;
  setShowSignup: (open: boolean) => void;
  signup: (username: string, password: string, referralCode: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
}

export default function LandingShell({
  user,
  isLoggedIn,
  showSignup,
  setShowSignup,
  signup,
  login,
}: LandingShellProps) {
  const navigate = useNavigate();
  const [siteReady, setSiteReady] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState("");

  // An invite link (?invite=CODE) pre-fills the code and opens signup.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get(INVITE_PARAM);
    if (code) {
      setPendingInviteCode(code.toUpperCase().replace(/\s+/g, ""));
      setShowSignup(true);
    }
  }, [setShowSignup]);

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
        onDonateClick={() => navigate("/why-donate")}
      />
      <LaunchCountdown variant="banner" />

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
            <LandingPollsSection onSignupClick={() => setShowSignup(true)} />
            <Communities onSignupClick={() => setShowSignup(true)} />
            <AvatarShowcaseSection onSignupClick={() => setShowSignup(true)} />

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
                    {highlightRawWordmark("Personality Insight is coming soon: anonymous answers turned into sharper self-understanding.")}
                  </p>
                </div>

                <PersonalityInsightsSection />
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

                <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={pendingInviteCode}
                    onChange={(e) => setPendingInviteCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="Invitation code"
                    maxLength={32}
                    className="flex-1 rounded-xl border border-raw-border/40 bg-raw-black/60 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/35 outline-none transition focus:border-raw-gold/60 focus:ring-1 focus:ring-raw-gold/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-raw-gold/45 bg-raw-gold px-7 py-3 text-base font-semibold text-raw-ink transition hover:bg-raw-gold/90 sm:whitespace-nowrap"
                  >
                    Join Now
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-raw-silver/35">
                  Have an invitation code? Enter it above — it unlocks your account.
                </p>
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
          onSignup={signup}
          onLogin={login}
          initialReferralCode={pendingInviteCode}
        />
      </Suspense>
    </div>
  );
}
