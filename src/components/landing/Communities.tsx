import { useState } from "react";
import { GlareCard } from "@/components/ui/glare-card";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import LNTLogo from "@/assets/LNT.png";
import isItJustMeVideo from "@/assets/itisjustme.webm";
import speakYourTruthVideo from "@/assets/speakyourheart.webm";

const communities = [
  {
    title: "Late Night Talks",
    description: "",
    badge: "Founding Community",
  },
  {
    title: "Speak Your Truth",
    description: "A safe space to share your story, be heard, and support others on their journey.",
    badge: "Active",
    video: speakYourTruthVideo,
  },
  {
    title: "Is It Just Me?",
    description: "Relatable moments, shared observations, and the quiet comfort of realizing you're not the only one.",
    badge: "Active",
    video: isItJustMeVideo,
  },
  {
    title: "Lebanon Initiatives",
    description: "Coming soon.",
    badge: "Waitlist",
    waitlist: true,
  },
];

interface CommunitiesProps {
  onSignupClick: () => void;
}

export function Communities({ onSignupClick }: CommunitiesProps) {
  const sectionRef = useTrackSectionView("communities");
  const [waitlistConfirmed, setWaitlistConfirmed] = useState(false);
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false);

  function handleWaitlistClick() {
    setWaitlistConfirmed(true);
    setShowWaitlistPopup(true);
  }

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      id="communities"
      className="landing-section relative py-14 px-4 sm:py-20 sm:px-6 md:py-28"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center sm:mb-14">
          <img src={LNTLogo} alt="LNT Logo" className="h-16 w-auto mx-auto mb-4" />
          <h2 className="font-display text-3xl tracking-wide text-raw-text sm:text-4xl">
            24/7 communities for real talk.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-raw-silver/50 sm:mt-4 sm:text-base">
            Start with 3 founding categories. Smaller micro-communities unlock as raW grows.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
          {communities.map((c) => (
            <div
              key={c.title}
              onClick={() => {
                if (c.waitlist) {
                  handleWaitlistClick();
                } else {
                  onSignupClick();
                }
              }}
              className="cursor-pointer"
            >
              <GlareCard className={c.video ? "bg-transparent border-0 shadow-none" : ""}>
                <div
                  className={
                    `rounded-2xl p-5 sm:p-6 relative overflow-visible ` +
                    (c.video
                      ? "bg-transparent border-0 shadow-none"
                      : "border border-raw-border/50 bg-raw-surface/50 overflow-hidden")
                  }
                >
                  {c.title === "Late Night Talks" ? (
                    <div className="flex h-full items-center justify-center py-8">
                      <img src={LNTLogo} alt="LNT Logo" className="h-16 w-auto" />
                    </div>
                  ) : c.waitlist ? (
                    <div className="flex h-full flex-col items-center justify-center py-8 gap-3">
                      <span className="text-3xl">🔒</span>
                      <h3 className="font-display text-sm tracking-wide text-raw-text text-center">{c.title}</h3>
                      <span className="inline-block rounded-full border border-raw-gold/30 bg-raw-gold/5 px-2 py-0.5 text-[10px] font-medium tracking-wider text-raw-gold/70 uppercase">
                        Waitlist
                      </span>
                      <span className="text-[10px] text-raw-silver/40 text-center">Click to join waitlist</span>
                    </div>
                  ) : c.video ? (
                    <>
                      <video
                        src={c.video}
                        className="rounded-xl w-full h-32 object-cover mb-3"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                      <h3 className="font-display text-sm tracking-wide text-raw-text">{c.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">{c.description}</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 inline-block rounded-full border border-raw-gold/20 bg-raw-gold/5 px-3 py-1">
                        <span className="text-[10px] font-medium tracking-wider text-raw-gold/70 uppercase">{c.badge}</span>
                      </div>
                      <h3 className="font-display text-sm tracking-wide text-raw-text">{c.title}</h3>
                      <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">{c.description}</p>
                    </>
                  )}
                </div>
              </GlareCard>
            </div>
          ))}
        </div>

        {/* Communities worldwide */}
        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-6 sm:mt-16 sm:gap-8">
          <div className="text-center">
            <p className="font-display text-[10px] tracking-[0.3em] uppercase text-raw-silver/40">
              Communities worldwide
            </p>
            <h3 className="mt-3 font-display text-xl tracking-wide text-raw-text sm:text-2xl md:text-3xl">
              Where mind meets heart.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-raw-silver/50">
              Real connection starts when intellect and emotion align. raW communities
              are built for people who think deeply and feel deeply — worldwide, 24/7.
            </p>
          </div>
        </div>
      </div>

      {/* Waitlist confirmation popup */}
      {showWaitlistPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowWaitlistPopup(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-raw-gold/30 bg-raw-surface p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-4xl">🎉</div>
            <h3 className="font-display text-xl tracking-wide text-raw-gold">
              You're on the waitlist!
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-raw-silver/60">
              Lebanon Initiatives is coming soon. We'll let you know when it launches.
            </p>
            <button
              onClick={() => {
                setShowWaitlistPopup(false);
                onSignupClick();
              }}
              className="mt-6 w-full rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-black transition-opacity hover:opacity-90"
            >
              Sign up to get notified
            </button>
            <button
              onClick={() => setShowWaitlistPopup(false)}
              className="mt-3 w-full rounded-xl border border-raw-border/40 px-5 py-2.5 text-sm text-raw-silver/50 transition-colors hover:text-raw-silver"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
