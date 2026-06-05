import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BarChart2, Brain, Compass, ShieldCheck, Sparkles, Users } from "lucide-react";

export default function PollsExplained() {
  return (
    <div className="min-h-screen bg-raw-black">
      <header className="border-b border-raw-border/30 bg-raw-black/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            ra<span className="text-raw-gold">W</span>
          </Link>
          <Link
            to="/"
            className="shrink-0 rounded-lg border border-raw-border/40 bg-raw-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-raw-silver/75 transition hover:border-raw-gold/35 hover:text-raw-gold sm:text-xs"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <section className="px-4 py-10 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Insights</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">
            Anonymous Live Polls That Help You Find Your Community
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-raw-silver/60 sm:text-base">
            Answer honest questions, compare your views anonymously, and use your response patterns to discover online communities and group chats that better fit your interests and perspective.
          </p>

          <div className="mt-10 space-y-10 sm:mt-14">

            {/* What are polls */}
            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <BarChart2 className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">What are Live Polls?</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Live Polls are short, anonymous Yes/No questions posted to the entire raW community. They cover real topics — relationships, society, ambition, identity, discomfort — things people think about but rarely say out loud. You answer, and you instantly see how the rest of the community responded. No judgment, no username attached to your vote.
                </p>
              </div>
            </div>

            {/* Why anonymous */}
            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <ShieldCheck className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Why Anonymous?</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  When people know they are being watched, they perform. They vote for what looks good, not what they actually believe. Anonymity removes that pressure. Your answers on raW reflect your real views — and that is what makes the data meaningful. We do not sell your identity. We use patterns in aggregate to generate insights.
                </p>
              </div>
            </div>

            {/* How polls reveal personality */}
            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Brain className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">How Polls Reveal Your Personality</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  A single answer tells you nothing. A hundred answers tell you everything. Over time, your response patterns across categories — risk, relationships, ambition, discomfort, community — converge into a consistent signal. That signal is your personality fingerprint.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-raw-silver/65">
                  This is why raW generates <span className="text-raw-gold/90">Personality Insights</span> — non-clinical, behavior-based identity reports that get sharper the more you answer. They measure things like your Signal Discipline (how consistent your choices are), your Growth Friction Index (whether you lean into discomfort or comfort), and your Collective Impact Lens (how much you weigh individual vs. community outcomes).
                </p>
              </div>
            </div>

            {/* Community context */}
            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Users className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Seeing Where You Stand</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  After you vote, you see the live split — what percentage of raW agreed with you. This is not about being right or wrong. It is about understanding that most of your views are shared by a significant slice of the world, and that disagreement is normal, not dangerous. The goal is perspective, not validation.
                </p>
              </div>
            </div>

            {/* Future roadmap */}
            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Compass className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Where This Is Going</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Polls are the foundation of everything raW will build. The more you answer, the more raW understands you — and the more useful it becomes to you.
                </p>
                <ul className="mt-4 space-y-3 text-sm text-raw-silver/65">
                  {[
                    { icon: Sparkles, text: "Smarter community recommendations — surfacing groups, topics, and people whose behavior pattern overlaps with yours." },
                    { icon: Brain, text: "Deeper personality reports — moving beyond three metrics to a full behavioral identity map across dozens of dimensions." },
                    { icon: BarChart2, text: "Personalized poll feeds — questions curated based on your existing answer history so each new poll sharpens your profile further." },
                    { icon: Users, text: "Compatibility signals — understanding which communities and archetypes you are most likely to connect authentically with." },
                  ].map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-raw-gold/60" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <div className="mt-12 rounded-xl border border-raw-gold/20 bg-raw-gold/5 px-5 py-5 sm:mt-16">
            <p className="text-sm font-medium text-raw-gold">The bottom line</p>
            <p className="mt-2 text-sm leading-relaxed text-raw-silver/70">
              Every poll you answer is a small act of honesty. In aggregate, those acts become a map of who you are — and a tool for raW to connect you with the right communities, insights, and people. The more honest you are, the more accurate the picture. The more accurate the picture, the more useful raW becomes.
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
