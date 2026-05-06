import { useEffect, useMemo, useRef, useState } from "react";

type Slide = {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  cards?: { title: string; body: string }[];
  footer?: string;
};

const slides: Slide[] = [
  { id: "01", title: "raW", subtitle: "Anonymous communities powered by what people really think.", footer: "Pre-seed investor deck" },
  { id: "02", title: "People are more connected than ever — and still feel unseen.", bullets: ["Social platforms reward performance, not honesty.", "Group chats are noisy and closed.", "Algorithms feed content, but rarely help people find where they belong."], footer: "The internet is full of people. But most people still do not know where they belong." },
  { id: "03", title: "People want spaces where they can be honest without being exposed.", cards: [{ title: "Truth", body: "Anonymity lowers the fear of judgment." }, { title: "Curiosity", body: "People want to know how others really think." }, { title: "Belonging", body: "People return when they realize they are not the only one." }], footer: "Curiosity → answer → compare → relate → join → return." },
  { id: "04", title: "raW turns anonymous honesty into community matching.", bullets: ["Users answer deep anonymous polls and reveal how others voted.", "Poll patterns guide users into communities that fit real thoughts, moods, and identity signals.", "Answer → Reveal → Identity → Match → Connect."] },
  { id: "05", title: "The first beta is simple.", cards: [{ title: "Anonymous Identity", body: "Username, avatar, and words." }, { title: "Live Communities", body: "Topic-based group chats." }, { title: "Daily Polls", body: "Deep yes/no and forced-choice questions." }, { title: "Smart Recommendations", body: "Poll patterns suggest best-fit rooms." }] },
  { id: "06", title: "Polls are not a side feature. They are the engine.", bullets: ["Immediate reward: "How did everyone else answer?"", "Long-term signal: better community matching over time."], footer: "Example prompt: "Do you secretly speak to yourself?" → "You are not alone."" },
  { id: "07", title: "raW has a stronger loop than passive scrolling.", bullets: ["Curiosity → Anonymous answer → Result reveal → Self-recognition → Community suggestion → Conversation → Return", "Most apps start with content. raW starts with a question."] },
  { id: "08", title: "The timing is right.", cards: [{ title: "Social Need", body: "Loneliness is a global health and social issue." }, { title: "Behavior", body: "People are tired of polished public identities." }, { title: "Technology", body: "AI lowers the cost of useful personalization." }, { title: "Identity Economy", body: "Avatars and digital identity are already proven." }], footer: "Sources: WHO Commission on Social Connection (2025), U.S. Surgeon General Advisory (2023)." },
  { id: "09", title: "Competitive landscape", bullets: ["Reddit: pseudonymous interest communities at scale.", "Discord: identity customization + community ownership.", "Yik Yak/Jodel: anonymous demand exists but safety is essential.", "TalkLife/7 Cups: emotional peer support with safeguards.", "raW wedge: poll-led anonymous community matching."] },
  { id: "10", title: "The long-term moat is the anonymous thought graph.", bullets: ["Repeated anonymous answers may improve recommendations, ranking, matching, and retention.", "Founder-reported historical asset: The Cumulative Mind reached ~11K followers and up to ~3,000 votes/question.", "May help early pattern design, subject to consent, data rights, and validation."] },
  { id: "11", title: "Monetization follows habit.", cards: [{ title: "Phase 1", body: "Engagement first." }, { title: "Phase 2", body: "Premium avatars and identity cosmetics." }, { title: "Phase 3", body: "Paid/private communities." }, { title: "Phase 4", body: "Opt-in, privacy-aware self-discovery insights." }] },
  { id: "12", title: "Start narrow. Prove the ritual. Then expand.", bullets: ["Adult-first beta with high-pull communities and daily poll loops.", "Wedge rooms: I'm Bored, Late Night Talks, Say It As It Is, Secretly Depressed, Lebanese Entrepreneurs, Gamers in Lebanon, Investor Connect.", "Growth loops: shareable poll reveals, room curiosity, avatars, invites, stronger recommendations."] },
  { id: "13", title: "What we are building now.", bullets: ["Now: landing page, beta completion, communities, polls, avatars, waitlist.", "Next: safety/moderation, recommendation logic, analytics, invite loops, avatar rarity.", "Later: creator communities, premium avatars, paid communities, opt-in insight reports.", "Ask: Raising $___ pre-seed for product, trust & safety, recommendation engine, growth, privacy/legal foundation."], footer: "raW helps people discover themselves, find their people, and grow through honest anonymous connection." },
];

export default function PitchV1() {
  const [index, setIndex] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) setIndex((v) => Math.min(v + 1, slides.length - 1));
      if (["ArrowLeft", "PageUp"].includes(event.key)) setIndex((v) => Math.max(v - 1, 0));
      if (event.key === "Home") setIndex(0);
      if (event.key === "End") setIndex(slides.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [index]);
  const progress = useMemo(() => `${index + 1}/${slides.length}`, [index]);

  return (
    <main className="min-h-screen bg-[#080808] text-[#EBEBEB] print:bg-white print:text-black">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 print:hidden">
        <button onClick={() => setIndex((v) => Math.max(0, v - 1))} className="rounded border border-white/20 px-3 py-1">Prev</button>
        <span className="rounded border border-[#F1C42D]/50 bg-black/60 px-3 py-1 text-[#F1C42D]">{progress}</span>
        <button onClick={() => setIndex((v) => Math.min(slides.length - 1, v + 1))} className="rounded border border-white/20 px-3 py-1">Next</button>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        {slides.map((slide, i) => (
          <section key={slide.id} ref={(el) => (sectionRefs.current[i] = el)} className="flex min-h-screen items-center justify-center py-10 print:min-h-0">
            <article className="aspect-video w-full max-w-[1200px] rounded-3xl border border-white/10 bg-[#121212] p-8 md:p-14 shadow-[0_0_60px_rgba(241,196,45,0.08)] print:rounded-none print:shadow-none">
              <div className="mb-6 flex justify-between text-xs uppercase tracking-[0.25em] text-[#D9D9D9]"><span>raW investor deck</span><span>Slide {slide.id}</span></div>
              <h1 className="text-3xl md:text-6xl font-semibold">{slide.title}</h1>
              {slide.subtitle && <p className="mt-4 text-xl md:text-3xl text-[#D9D9D9]">{slide.subtitle}</p>}
              {slide.bullets && <div className="mt-8 space-y-3 text-base md:text-2xl">{slide.bullets.map((b) => <p key={b}>{b}</p>)}</div>}
              {slide.cards && <div className="mt-8 grid gap-4 md:grid-cols-2">{slide.cards.map((c) => <div key={c.title} className="rounded-2xl border border-[#F1C42D]/20 bg-black/30 p-5"><h2 className="text-lg md:text-2xl text-[#F1C42D]">{c.title}</h2><p className="mt-2 text-sm md:text-xl text-[#EBEBEB]/90">{c.body}</p></div>)}</div>}
              {slide.footer && <p className="mt-8 border-t border-[#F1C42D]/30 pt-4 text-sm md:text-lg text-[#F1C42D]">{slide.footer}</p>}
            </article>
          </section>
        ))}
      </div>
      <style>{`@media print { @page { size: 16in 9in; margin: .4in; } }`}</style>
    </main>
  );
}
