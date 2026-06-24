import { Suspense, lazy, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { Navbar } from "@/components/landing/Navbar";
import { StickyTicker } from "@/components/landing/StickyTicker";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { AuthResult, User } from "@/store/types";
import "./landing-v2.css";

gsap.registerPlugin(ScrollTrigger);

const GlobeHero = lazy(() =>
  import("@/components/landing/GlobeHero").then((m) => ({ default: m.GlobeHero }))
);
const AvatarShowcaseSection = lazy(() =>
  import("@/components/landing/AvatarShowcaseSection").then((m) => ({ default: m.AvatarShowcaseSection }))
);

const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((module) => ({ default: module.SignupModal }))
);

export interface LandingShellV2Props {
  user: User | null;
  isLoggedIn: boolean;
  showSignup: boolean;
  setShowSignup: (open: boolean) => void;
  requestSignupOtp: (username: string, password: string, inviteCode: string) => Promise<AuthResult>;
  verifySignupOtp: (code: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
}

const MARQUEE_LINES = [
  "I said it here first. Out loud came later.",
  "My room knew before my best friend did.",
  "Nobody knows my name. Everybody knows my story.",
  "I came to vent. I stayed for the people.",
  "It is 3am somewhere in here, always.",
  "Typed it. Sent it. Breathed for the first time all week.",
];

const ROOMS = [
  {
    name: "Unsent Letters",
    line: "Everything you almost said, finally said.",
    image: "/avatars/landing/pink-circuit.webp",
  },
  {
    name: "After the Breakup",
    line: "Grief, rage, and the slow glow-up. In that order.",
    image: "/avatars/landing/neon-lynx.webp",
  },
  {
    name: "Night Shift Minds",
    line: "For the overthinkers awake while the world sleeps.",
    image: "/avatars/landing/blue-signal.webp",
  },
  {
    name: "Mothers, Unfiltered",
    line: "Love without the highlight reel.",
    image: "/avatars/landing/solar-flame.webp",
  },
  {
    name: "The Quiet Ambitious",
    line: "Building something big without announcing it.",
    image: "/avatars/landing/violet-mask.webp",
  },
];

const VOICES = [
  {
    quote:
      "I typed something I had never told anyone. Four people answered within the hour. None of them know my name. All of them know me.",
    handle: "Cosmic Spark",
    tenure: "member for 8 months",
    avatar: "/avatars/landing/neon-lynx.webp",
  },
  {
    quote:
      "I expected an app. I found the group chat I had been missing my whole adult life.",
    handle: "Bronze Phoenix",
    tenure: "member for 1 year",
    avatar: "/avatars/landing/pink-circuit.webp",
  },
  {
    quote:
      "It is the only place where I am not performing. I show up wrecked and nobody flinches.",
    handle: "Iron Mind",
    tenure: "member for 5 months",
    avatar: "/avatars/landing/violet-mask.webp",
  },
];

const JOURNEY = [
  {
    num: "1",
    title: "Arrive unseen",
    body:
      "Pick a name nobody knows. Your face stays yours. From the first second, you are anonymous by default, not by request.",
  },
  {
    num: "2",
    title: "Answer something real",
    body:
      "One honest question opens the door. Not your job title, not your photos. What you actually think when nobody is watching.",
  },
  {
    num: "3",
    title: "Find the room that fits",
    body:
      "Heartbreak. Ambition. The 3am spiral. There is a room already mid-conversation about the exact thing you are carrying.",
  },
  {
    num: "4",
    title: "Stay for the people",
    body:
      "The thread ends. The bond does not. The same voices keep showing up for you, week after week, until they are yours.",
  },
];

function GoldDot() {
  return <span className="mx-8 inline-block text-raw-gold/60" aria-hidden="true">&#9670;</span>;
}

function PillImage({ image }: { image: string }) {
  return (
    <span
      className="mx-2 inline-block h-[0.85em] w-[2.2em] translate-y-[0.12em] rounded-full bg-cover bg-center align-baseline grayscale contrast-125 opacity-80"
      style={{ backgroundImage: `url(${image})` }}
      aria-hidden="true"
    />
  );
}

export default function LandingShellV2({
  user,
  isLoggedIn,
  showSignup,
  setShowSignup,
  requestSignupOtp,
  verifySignupOtp,
  login,
}: LandingShellV2Props) {
  const [siteReady, setSiteReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!siteReady) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".lv2-word", {
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: ".lv2-manifesto",
            start: "top 78%",
            end: "bottom 52%",
            scrub: true,
          },
        });

        gsap.utils.toArray<HTMLElement>(".lv2-grow").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.92, opacity: 0.45 },
            {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 92%", end: "top 48%", scrub: true },
            }
          );
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [siteReady]);

  const openSignup = () => setShowSignup(true);

  return (
    <ThemeProvider>
      <div ref={rootRef} className="lv2 lv2-grain relative min-h-screen overflow-x-hidden bg-raw-black text-raw-text">
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

        <StickyTicker />

        <main className="relative w-full max-w-full overflow-x-hidden">
        <Suspense fallback={<div className="min-h-[620px] sm:min-h-[680px]" />}>
          <GlobeHero onSignupClick={() => setShowSignup(true)} />
        </Suspense>

        <ProblemSection />

        <HowItWorks />

        <Suspense fallback={<div className="h-16" />}>
          <AvatarShowcaseSection onSignupClick={() => setShowSignup(true)} />
        </Suspense>

        <section aria-label="Voices from inside" className="border-y border-raw-border/70 py-7 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="overflow-hidden whitespace-nowrap">
            <div className="lv2-marquee-track items-center text-sm text-raw-silver/55 sm:text-base">
              {[0, 1].map((copy) => (
                <span key={copy} aria-hidden={copy === 1}>
                  {MARQUEE_LINES.map((line) => (
                    <span key={line} className="italic">
                      &ldquo;{line}&rdquo;
                      <GoldDot />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="inside" className="px-4 py-28 sm:px-6 md:py-44">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="lv2-display max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">
              Built for the unsaid.
            </h2>
            <p className="mt-5 max-w-xl text-raw-silver/65">
              Everything inside raW exists for one reason: so you finally have
              somewhere to be completely honest.
            </p>

            <div className="mt-14 grid auto-rows-[200px] grid-flow-dense grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[230px]">
              <article className="group relative overflow-hidden rounded-3xl border border-raw-border md:col-span-4 md:row-span-2">
                <img
                  src="/avatars/landing/neon-lynx.webp"
                  alt="Community in action"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-raw-black via-raw-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                  <h3 className="lv2-display text-2xl font-bold text-raw-text sm:text-3xl">
                    Rooms that feel like 3am conversations
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-raw-silver/75">
                    Communities built around what you are actually going
                    through, not what you look like. Walk into one
                    mid-conversation and feel the difference.
                  </p>
                </div>
              </article>

              <article className="flex flex-col justify-between rounded-3xl border border-raw-gold/25 bg-gradient-to-b from-raw-gold/[0.07] to-transparent p-7 md:col-span-2">
                <span className="lv2-display text-4xl font-extrabold text-raw-gold">?</span>
                <div>
                  <h3 className="lv2-display text-lg font-bold">No names attached</h3>
                  <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                    Anonymity is not hiding. It is what honesty needs to
                    survive.
                  </p>
                </div>
              </article>

              <article className="flex flex-col justify-between rounded-3xl border border-raw-border bg-raw-surface/60 p-7 md:col-span-2">
                <span className="text-xs uppercase tracking-[0.3em] text-raw-gold/70">Every day</span>
                <div>
                  <h3 className="lv2-display text-lg font-bold">Questions that cut deep</h3>
                  <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                    One daily prompt that starts the conversations small talk
                    never could.
                  </p>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-3xl border border-raw-border md:col-span-3">
                <img
                  src="/avatars/landing/blue-signal.webp"
                  alt="Finding community"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-raw-black via-raw-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <h3 className="lv2-display text-lg font-bold">Find your people</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-raw-silver/75">
                    Matched by what you feel, not by who you follow.
                  </p>
                </div>
              </article>

              <article className="flex flex-col justify-between rounded-3xl border border-raw-border bg-raw-surface/60 p-7 md:col-span-3">
                <div className="flex -space-x-3">
                  {["/avatars/landing/pink-circuit.webp", "/avatars/landing/solar-flame.webp", "/avatars/landing/violet-mask.webp"].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="Community member"
                      loading="lazy"
                      className="h-10 w-10 rounded-full border-2 border-raw-black object-cover grayscale"
                    />
                  ))}
                </div>
                <div>
                  <h3 className="lv2-display text-lg font-bold">Bonds that outlast the thread</h3>
                  <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                    The conversation ends. The people stay. That is the whole
                    point.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="lv2-manifesto px-6 py-28 md:py-44">
          <p className="lv2-display mx-auto w-full max-w-5xl text-balance text-center text-3xl font-bold leading-snug sm:text-4xl md:text-[2.9rem]">
            {"You were never too much. You were just loud for rooms that wanted you quiet."
              .split(" ")
              .map((word, index) => (
                <span key={index} className="lv2-word">
                  {word}{" "}
                </span>
              ))}
            <PillImage image="/avatars/landing/solar-flame.webp" />
            {"Here, the volume is yours. Say it, and let a stranger whisper back:"
              .split(" ")
              .map((word, index) => (
                <span key={`b-${index}`} className="lv2-word">
                  {word}{" "}
                </span>
              ))}
            <span className="lv2-word text-raw-gold">same.</span>
            <PillImage image="/avatars/landing/viozen.webp" />
          </p>
        </section>

        <section className="px-4 py-28 sm:px-6 md:py-44">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="lv2-display max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">
              From stranger to someone's person.
            </h2>
            <div className="mt-16 space-y-6">
              {JOURNEY.map((step, index) => (
                <article
                  key={step.num}
                  className="lv2-grow sticky overflow-hidden rounded-3xl border border-raw-border bg-raw-surface/90 px-7 py-10 backdrop-blur-md sm:px-12 sm:py-14"
                  style={{ top: `${96 + index * 18}px` }}
                >
                  <span className="lv2-ghost-num pointer-events-none absolute -right-3 -top-6 text-[9rem] sm:text-[13rem]">
                    {step.num}
                  </span>
                  <div className="relative max-w-xl">
                    <h3 className="lv2-display text-2xl font-bold sm:text-3xl">{step.title}</h3>
                    <p className="mt-4 leading-relaxed text-raw-silver/70">{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rooms" className="px-4 py-28 sm:px-6 md:py-44">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="lv2-display max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">
              Rooms already waiting for you.
            </h2>
            <p className="mt-5 max-w-xl text-raw-silver/65">
              A few of the places people walk into as strangers and out of as
              regulars.
            </p>
            <div className="mt-14 flex flex-col gap-3 md:h-[480px] md:flex-row">
              {ROOMS.map((room) => (
                <button
                  key={room.name}
                  onClick={openSignup}
                  className="lv2-slice group relative min-h-[88px] overflow-hidden rounded-2xl border border-raw-border text-left"
                >
                  <img
                    src={room.image}
                    alt={room.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale contrast-125 transition-opacity duration-700 group-hover:opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-raw-black via-raw-black/30 to-transparent" />
                  <span className="lv2-slice-label absolute bottom-5 left-1/2 hidden -translate-x-1/2 rotate-180 text-sm font-medium tracking-wide text-raw-silver/85 md:block">
                    {room.name}
                  </span>
                  <div className="lv2-slice-body absolute inset-x-0 bottom-0 p-5 sm:p-6 max-md:!opacity-100 max-md:!transform-none">
                    <h3 className="lv2-display text-lg font-bold text-raw-text">{room.name}</h3>
                    <p className="mt-1.5 text-sm text-raw-silver/70">{room.line}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="voices" className="px-4 py-28 sm:px-6 md:py-44">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="lv2-display max-w-3xl text-balance text-4xl font-bold leading-tight sm:text-5xl">
              Heard, not seen.
            </h2>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {VOICES.map((voice) => (
                <figure
                  key={voice.handle}
                  className="flex flex-col justify-between rounded-3xl border border-raw-border bg-raw-surface/60 p-8"
                >
                  <blockquote className="text-balance leading-relaxed text-raw-silver/85">
                    &ldquo;{voice.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-3">
                    <img
                      src={voice.avatar}
                      alt={voice.handle}
                      loading="lazy"
                      className="h-10 w-10 rounded-full object-cover grayscale"
                    />
                    <div>
                      <p className="text-sm font-bold text-raw-gold">{voice.handle}</p>
                      <p className="text-xs text-raw-silver/50">{voice.tenure}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="join" className="relative overflow-hidden px-6 py-32 text-center md:py-48">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgb(241_196_45/0.12),transparent_65%)]" />
          <h2
            className="lv2-display relative mx-auto w-full max-w-5xl text-balance font-extrabold leading-[1.04]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Come as you are. Leave lighter.
          </h2>
          <p className="relative mx-auto mt-7 max-w-xl text-raw-silver/65">
            Free to join. Anonymous from the first second. Your people are
            already mid-conversation.
          </p>
          <button
            onClick={openSignup}
            className="lv2-btn-gold relative mt-11 rounded-full px-12 py-5 text-lg font-bold"
          >
            Claim your place
          </button>
        </section>

        <LandingFooter />
      </main>

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
    </ThemeProvider>
  );
}
