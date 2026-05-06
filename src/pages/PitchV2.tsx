import { useEffect, useMemo, useRef, useState } from "react";

interface Slide {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  body?: string[];
  footer?: string;
}

const slides: Slide[] = [
  { id: "01", kicker: "Pre-seed investor deck", title: "raW", subtitle: "Anonymous communities powered by what people really think." },
  { id: "02", title: "People are more connected than ever — and still feel unseen.", body: ["Social platforms reward performance, not honesty.", "Group chats are noisy and closed.", "Algorithms feed people content, but rarely help people understand themselves or find their people."], footer: "The internet is full of people. But most people still do not know where they belong." },
  { id: "03", title: "People want spaces where they can be honest without being exposed.", body: ["Truth — Anonymity lowers the fear of judgment.", "Curiosity — People want to know how others really think.", "Belonging — People return when they realize they are not the only one."], footer: "The loop: curiosity → answer → compare → relate → join → return." },
  { id: "04", title: "raW turns anonymous honesty into community matching.", body: ["Users answer deep anonymous polls, see how others voted, and get guided into communities that match their real thoughts, moods, and identity signals.", "Answer polls → reveal results → build anonymous identity → get matched → connect with people who relate."] },
  { id: "05", title: "The first beta is simple.", body: ["Anonymous Identity — A username, avatar, and words.", "Live Communities — Topic-based group chats for moods and interests.", "Daily Polls — Deep yes/no and forced-choice questions.", "Smart Recommendations — Poll patterns suggest better-fit communities."] },
  { id: "06", title: "Polls are not a side feature. They are the engine.", body: ["Every answer creates an immediate reward: how did everyone else answer?", "Every answer creates long-term signal for better community matching.", "Example: "Do you secretly speak to yourself?" → You are not alone."], footer: "Goal: understand patterns and improve discovery — not label people." },
  { id: "07", title: "raW has a stronger loop than passive scrolling.", body: ["Curiosity → Anonymous answer → Result reveal → Self-recognition → Community suggestion → Conversation → Return", "Most apps start with content. raW starts with a question."] },
  { id: "08", title: "The timing is right.", body: ["Loneliness is a global health and social issue.", "People are tired of polished public identities.", "AI makes personalization cheaper and more powerful.", "Digital identity economies are already proven in gaming and communities."], footer: "Sources: WHO Commission on Social Connection (2025), U.S. Surgeon General Advisory (2023)." },
  { id: "09", title: "raW sits between anonymous social, communities, and self-discovery.", body: ["Reddit proves pseudonymous interest communities scale.", "Discord proves identity customization and community ownership scale.", "Yik Yak/Jodel prove anonymous demand exists but needs safety.", "TalkLife/7 Cups prove emotional peer-support demand exists with safeguards.", "raW wedge: poll-led anonymous community matching."] },
  { id: "10", title: "The long-term moat is the anonymous thought graph.", body: ["Repeated anonymous answers create patterns that may improve recommendations, poll ranking, matching, and retention.", "Founder historical asset: The Cumulative Mind reached ~11K followers and up to ~3,000 votes per question (founder-reported).", "This may inform early question design, subject to consent, data rights, and validation."] },
  { id: "11", title: "Monetization follows habit.", body: ["Phase 1: Engagement first.", "Phase 2: Cosmetic monetization (premium avatars, identity skins).", "Phase 3: Community monetization (paid/private communities).", "Phase 4: Opt-in, privacy-aware self-discovery insights."] },
  { id: "12", title: "Start narrow. Prove the ritual. Then expand.", body: ["Adult-first beta with high-pull communities and daily poll loops.", "Initial wedges: I'm Bored, Late Night Talks, Say It As It Is, Secretly Depressed, Lebanese Entrepreneurs, Gamers in Lebanon, Investor Connect.", "Growth loops: shareable poll results, curiosity-driven community titles, avatar attachment, room invites, improving recommendations."] },
  { id: "13", title: "What we are building now.", body: ["Now: landing page ready, beta nearly done, communities, polls, avatars, waitlist.", "Next: safety/moderation, recommendation logic, beta analytics, invite loops, avatar rarity.", "Later: creator communities, premium avatars, paid communities, opt-in insight reports.", "Ask: Raising $___ pre-seed for product, trust & safety, recommendation engine, growth experiments, legal/privacy foundation."], footer: "raW helps people discover themselves, find their people, and grow through honest anonymous connection." },
];

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
            <article className="aspect-video w-full max-w-[1200px] rounded-3xl border border-white/10 bg-[#121212] p-8 md:p-14 shadow-[0_0_60px_rgba(241,196,45,0.08)] print:rounded-none print:border print:shadow-none">
              <div className="mb-8 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#D9D9D9]">
                <span>{slide.kicker ?? "raW investor narrative"}</span>
                <span>Slide {slide.id}</span>
              </div>
              <h1 className="text-3xl md:text-6xl font-semibold leading-tight">{slide.title}</h1>
              {slide.subtitle && <p className="mt-6 max-w-3xl text-xl md:text-3xl text-[#D9D9D9]">{slide.subtitle}</p>}
              <div className="mt-8 space-y-3 text-base md:text-2xl leading-relaxed text-[#EBEBEB]/90">
                {slide.body?.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {slide.footer && <p className="mt-8 border-t border-[#F1C42D]/30 pt-5 text-sm md:text-lg text-[#F1C42D]">{slide.footer}</p>}
            </article>
          </section>
        ))}
      </div>
      <style>{`@media print { @page { size: 16in 9in; margin: 0.4in; } }`}</style>
    </main>
  );
}
