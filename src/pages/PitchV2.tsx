import { useEffect, useMemo, useRef, useState } from "react";

import logoSpeak from "@/assets/logospeak.webp";
import tokensImage from "@/assets/tokens.webp";
import avatarsCollage from "@/assets/Extra avatars they can pick (5).webp";
import warBadges from "@/assets/war-level-badges.webp";
import chromeAvatar from "@/assets/01_chrome.webp";
import cyborgPurple from "@/assets/02_cyborg_purple.webp";
import steampunkAvatar from "@/assets/03_steampunk.webp";
import solarAvatar from "@/assets/04_solar.webp";

type SlideTheme = "gold" | "violet" | "teal";

interface Slide {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  body?: string[];
  footer?: string;
  visual?: { src: string; alt: string; caption?: string };
  theme?: SlideTheme;
}

const slides: Slide[] = [
  { id: "01", kicker: "Pre-seed investor deck", title: "raW", subtitle: "Anonymous communities powered by what people really think.", visual: { src: logoSpeak, alt: "raW logo", caption: "Where honesty becomes belonging." }, theme: "gold" },
  { id: "02", title: "People are more connected than ever — and still feel unseen.", body: ["Social platforms reward performance, not honesty.", "Group chats are noisy and closed.", "Algorithms feed people content, but rarely help people understand themselves or find their people."], footer: "The internet is full of people. But most people still do not know where they belong.", theme: "violet" },
  { id: "03", title: "People want spaces where they can be honest without being exposed.", body: ["Truth — Anonymity lowers the fear of judgment.", "Curiosity — People want to know how others really think.", "Belonging — People return when they realize they are not the only one."], footer: "The loop: curiosity → answer → compare → relate → join → return.", theme: "teal" },
  { id: "04", title: "raW turns anonymous honesty into community matching.", body: ["Users answer deep anonymous polls, see how others voted, and get guided into communities that match their real thoughts, moods, and identity signals.", "Answer polls → reveal results → build anonymous identity → get matched → connect with people who relate."], visual: { src: tokensImage, alt: "raW polling and matching preview", caption: "The product starts with a question, not a feed." }, theme: "gold" },
  { id: "05", title: "The first beta is simple.", body: ["Anonymous Identity — A username, avatar, and words.", "Live Communities — Topic-based group chats for moods and interests.", "Daily Polls — Deep yes/no and forced-choice questions.", "Smart Recommendations — Poll patterns suggest better-fit communities."], visual: { src: avatarsCollage, alt: "raW avatar collection", caption: "Identity expression drives return behavior and monetization." }, theme: "violet" },
  { id: "06", title: "Polls are not a side feature. They are the engine.", body: ["Every answer creates an immediate reward: how did everyone else answer?", "Every answer creates long-term signal for better community matching.", "Example: “Do you secretly speak to yourself?” → You are not alone."], footer: "Goal: understand patterns and improve discovery — not label people.", theme: "teal" },
  { id: "07", title: "raW has a stronger loop than passive scrolling.", body: ["Curiosity → Anonymous answer → Result reveal → Self-recognition → Community suggestion → Conversation → Return", "Most apps start with content. raW starts with a question."], theme: "gold" },
  { id: "08", title: "The timing is right.", body: ["Loneliness is a global health and social issue.", "People are tired of polished public identities.", "AI makes personalization cheaper and more powerful.", "Digital identity economies are already proven in gaming and communities."], footer: "Sources: WHO Commission on Social Connection (2025), U.S. Surgeon General Advisory (2023).", theme: "violet" },
  { id: "09", title: "raW sits between anonymous social, communities, and self-discovery.", body: ["Reddit proves pseudonymous interest communities scale.", "Discord proves identity customization and community ownership scale.", "Yik Yak/Jodel prove anonymous demand exists but needs safety.", "TalkLife/7 Cups prove emotional peer-support demand exists with safeguards.", "raW wedge: poll-led anonymous community matching."], theme: "teal" },
  { id: "10", title: "The long-term moat is the anonymous thought graph.", body: ["Repeated anonymous answers create patterns that may improve recommendations, poll ranking, matching, and retention.", "Founder historical asset: The Cumulative Mind reached ~11K followers and up to ~3,000 votes per question (founder-reported).", "This may inform early question design, subject to consent, data rights, and validation."], visual: { src: warBadges, alt: "raW progression badges", caption: "Progression + identity + trust = a durable graph moat." }, theme: "gold" },
  { id: "11", title: "Monetization follows habit.", body: ["Phase 1: Engagement first.", "Phase 2: Cosmetic monetization (premium avatars, identity skins).", "Phase 3: Community monetization (paid/private communities).", "Phase 4: Opt-in, privacy-aware self-discovery insights."], visual: { src: chromeAvatar, alt: "premium chrome avatar", caption: "Cosmetic upgrades feel native to anonymous identity." }, theme: "violet" },
  { id: "12", title: "Start narrow. Prove the ritual. Then expand.", body: ["Adult-first beta with high-pull communities and daily poll loops.", "Initial wedges: I'm Bored, Late Night Talks, Say It As It Is, Secretly Depressed, Lebanese Entrepreneurs, Gamers in Lebanon, Investor Connect.", "Growth loops: shareable poll results, curiosity-driven community titles, avatar attachment, room invites, improving recommendations."], visual: { src: cyborgPurple, alt: "cyborg avatar", caption: "Use aspirational identity to push viral invites and retention." }, theme: "teal" },
  { id: "13", title: "What we are building now.", body: ["Now: landing page ready, beta nearly done, communities, polls, avatars, waitlist.", "Next: safety/moderation, recommendation logic, beta analytics, invite loops, avatar rarity.", "Later: creator communities, premium avatars, paid communities, opt-in insight reports.", "Ask: Raising $___ pre-seed for product, trust & safety, recommendation engine, growth experiments, legal/privacy foundation."], footer: "raW helps people discover themselves, find their people, and grow through honest anonymous connection.", visual: { src: steampunkAvatar, alt: "steampunk avatar", caption: "Immediate milestone: finish beta + lock safety + prove retention." }, theme: "gold" },
];

const themeClasses: Record<SlideTheme, string> = {
  gold: "from-[#F1C42D]/35 via-[#121212] to-[#121212]",
  violet: "from-fuchsia-500/20 via-[#121212] to-[#121212]",
  teal: "from-cyan-400/20 via-[#121212] to-[#121212]",
};

export default function PitchV2() {
  const [index, setIndex] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        setIndex((v) => Math.min(v + 1, slides.length - 1));
      }
      if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        setIndex((v) => Math.max(v - 1, 0));
      }
      if (event.key === "Home") setIndex(0);
      if (event.key === "End") setIndex(slides.length - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    refs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  const progressLabel = useMemo(() => `${index + 1} / ${slides.length}`, [index]);

  return (
    <main className="bg-[#080808] text-[#EBEBEB] min-h-screen pb-20 print:bg-white print:text-black">
      <div className="fixed top-5 right-6 z-50 rounded-full border border-[#F1C42D]/40 bg-black/70 px-4 py-1 text-sm text-[#F1C42D] backdrop-blur print:hidden">
        {progressLabel}
      </div>
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        {slides.map((slide, i) => (
          <section
            key={slide.id}
            ref={(el) => (refs.current[i] = el)}
            className="min-h-screen snap-start flex items-center justify-center py-10 print:min-h-0 print:py-6"
          >
            <article className={`relative aspect-video w-full max-w-[1200px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br p-8 md:p-14 shadow-[0_0_60px_rgba(241,196,45,0.08)] print:rounded-none print:border print:shadow-none ${themeClasses[slide.theme ?? "gold"]}`}>
              <div className="absolute -top-24 -right-24 size-64 rounded-full bg-[#F1C42D]/15 blur-3xl" />
              <div className="relative z-10 mb-8 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#D9D9D9]">
                <span>{slide.kicker ?? "raW investor narrative"}</span>
                <span>Slide {slide.id}</span>
              </div>
              <div className="relative z-10 grid h-[calc(100%-3.5rem)] gap-8 md:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <h1 className="text-3xl md:text-6xl font-semibold leading-tight">{slide.title}</h1>
                  {slide.subtitle && <p className="mt-6 max-w-3xl text-xl md:text-3xl text-[#D9D9D9]">{slide.subtitle}</p>}
                  <div className="mt-8 space-y-3 text-base md:text-2xl leading-relaxed text-[#EBEBEB]/90">
                    {slide.body?.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  {slide.footer && <p className="mt-8 border-t border-[#F1C42D]/30 pt-5 text-sm md:text-lg text-[#F1C42D]">{slide.footer}</p>}
                </div>
                <div className="hidden h-full md:flex md:flex-col md:justify-end">
                  {slide.visual ? (
                    <figure className="rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur">
                      <img src={slide.visual.src} alt={slide.visual.alt} className="max-h-[340px] w-full rounded-xl object-cover" />
                      {slide.visual.caption && <figcaption className="mt-3 text-sm text-[#D9D9D9]">{slide.visual.caption}</figcaption>}
                    </figure>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                      {[solarAvatar, chromeAvatar, cyborgPurple, steampunkAvatar].map((asset) => (
                        <img key={`${slide.id}-${asset}`} src={asset} alt="raW identity avatar" className="h-32 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>
        ))}
      </div>
      <style>{`@media print { @page { size: 16in 9in; margin: 0.4in; } }`}</style>
    </main>
  );
}
