import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PollShowcase } from "@/components/landing/PollShowcase";
import { LandingFooter } from "@/components/landing/LandingFooter";
import type { AuthResult, User } from "@/store/types";
import "./landing-v2.css";

gsap.registerPlugin(ScrollTrigger);

const SignupModalLazy = lazy(() =>
  import("@/components/landing/SignupModal").then((module) => ({ default: module.SignupModal }))
);

export interface LandingShellV2Props {
  user: User | null;
  isLoggedIn: boolean;
  showSignup: boolean;
  setShowSignup: (open: boolean) => void;
  requestSignupOtp: (username: string, password: string, phone: string) => Promise<AuthResult>;
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
    seed: "rawletters",
  },
  {
    name: "After the Breakup",
    line: "Grief, rage, and the slow glow-up. In that order.",
    seed: "rawafter",
  },
  {
    name: "Night Shift Minds",
    line: "For the overthinkers awake while the world sleeps.",
    seed: "rawnight",
  },
  {
    name: "Mothers, Unfiltered",
    line: "Love without the highlight reel.",
    seed: "rawmothers",
  },
  {
    name: "The Quiet Ambitious",
    line: "Building something big without announcing it.",
    seed: "rawquiet",
  },
];

const VOICES = [
  {
    quote:
      "I typed something I had never told anyone. Four people answered within the hour. None of them know my name. All of them know me.",
    handle: "Cosmic Spark",
    tenure: "member for 8 months",
    seed: "rawvoice1",
  },
  {
    quote:
      "I expected an app. I found the group chat I had been missing my whole adult life.",
    handle: "Bronze Phoenix",
    tenure: "member for 1 year",
    seed: "rawvoice2",
  },
  {
    quote:
      "It is the only place where I am not performing. I show up wrecked and nobody flinches.",
    handle: "Iron Mind",
    tenure: "member for 5 months",
    seed: "rawvoice3",
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

function PillImage({ seed }: { seed: string }) {
  return (
    <span
      className="mx-2 inline-block h-[0.85em] w-[2.2em] translate-y-[0.12em] rounded-full bg-cover bg-center align-baseline grayscale contrast-125 opacity-80"
      style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}/360/160)` }}
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
  const [veilGone, setVeilGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteReady) return;
    const timer = window.setTimeout(() => setVeilGone(true), 800);
    return () => window.clearTimeout(timer);
  }, [siteReady]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".lv2-hero-rise", {
          y: 44,
          opacity: 0,
          duration: 1.1,
          stagger: 0.14,
          ease: "power3.out",
          delay: 0.15,
        });

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
  }, []);

  const openSignup = () => setShowSignup(true);

  return (
    <div ref={rootRef} className="lv2 lv2-grain relative min-h-screen overflow-x-hidden bg-raw-black text-raw-text">
      <PollShowcase
        initialOpen
        onOpenChange={(open) => {
          if (open) setSiteReady(false);
        }}
        onResolved={() => setSiteReady(true)}
      />

      {!veilGone && (
        <div
          className={`fixed inset-0 z-30 bg-raw-black/80 backdrop-blur-xl transition-opacity duration-700 ${
            siteReady ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        />
      )}

      <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center justify-between rounded-full border border-raw-gold/15 bg-raw-black/65 py-2 pl-6 pr-2 backdrop-blur-xl">
          <a href="#top" className="lv2-display text-lg font-bold tracking-tight">
            <span className="raw-chrome-metallic">ra</span>
            <span className="text-raw-gold">W</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-raw-silver/70 md:flex">
            <a href="#inside" className="transition-colors hover:text-raw-text">Inside</a>
            <a href="#rooms" className="transition-colors hover:text-raw-text">Rooms</a>
            <a href="#voices" className="transition-colors hover:text-raw-text">Voices</a>
            <a href="/faq" className="transition-colors hover:text-raw-text">FAQ</a>
          </div>
          <button
            onClick={openSignup}
            className="lv2-btn-gold rounded-full px-5 py-2 text-sm font-bold"
          >
            {isLoggedIn && user ? user.username : "Join raW"}
          </button>
        </nav>
      </header>

      <main id="top" className="relative z-10 w-full max-w-full overflow-x-hidden">
        <section className="lv2-hero-wash relative flex min-h-screen flex-col items-center justify-center px-6 pb-24 pt-36 text-center">
          <p className="lv2-hero-rise mb-7 text-xs uppercase tracking-[0.45em] text-raw-gold/80">
            The anonymous community
          </p>
          <h1
            className="lv2-display lv2-hero-rise mx-auto w-full max-w-6xl text-balance font-extrabold leading-[1.02] text-raw-text"
            style={{ fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)" }}
          >
            Say the things you never say out loud.
          </h1>
          <p className="lv2-hero-rise mx-auto mt-8 max-w-2xl text-balance text-base leading-relaxed text-raw-silver/70 sm:text-lg">
            A dark, quiet corner of the internet where you let it out, find your
            people, and actually bond. No followers. No filters. No performing.
          </p>
          <div className="lv2-hero-rise mt-11 flex flex-col items-center gap-4 sm:flex-row">
            <button onClick={openSignup} className="lv2-btn-gold rounded-full px-9 py-4 text-base font-bold">
              Step inside
            </button>
            <a href="#inside" className="lv2-btn-ghost rounded-full px-9 py-4 text-base font-medium">
              See what's inside
            </a>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-raw-black" />
        </section>

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
                  src="https://picsum.photos/seed/rawcandle/1280/960"
                  alt=""
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
                  src="https://picsum.photos/seed/rawsmoke/960/640"
                  alt=""
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
                  {["rawf1", "rawf2", "rawf3"].map((seed) => (
                    <img
                      key={seed}
                      src={`https://picsum.photos/seed/${seed}/96/96`}
                      alt=""
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
            <PillImage seed="rawvelvet" />
            {"Here, the volume is yours. Say it, and let a stranger whisper back:"
              .split(" ")
              .map((word, index) => (
                <span key={`b-${index}`} className="lv2-word">
                  {word}{" "}
                </span>
              ))}
            <span className="lv2-word text-raw-gold">same.</span>
            <PillImage seed="rawmidnight" />
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
                    src={`https://picsum.photos/seed/${room.seed}/800/1100`}
                    alt=""
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
                      src={`https://picsum.photos/seed/${voice.seed}/96/96`}
                      alt=""
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
  );
}
