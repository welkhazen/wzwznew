import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Shield, Users, MessageSquare, Star, Zap, Lock } from "lucide-react";

export default function CommunitiesExplained() {
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Communities</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">
            Communities — Built Around Who You Actually Are
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-raw-silver/60 sm:text-base">
            Communities on raW are not just topic threads. They are identity-based spaces where your presence is earned through behavior, not follower counts.
          </p>

          <div className="mt-10 space-y-10 sm:mt-14">

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Users className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">What Are Communities?</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Each community on raW is a space organized around a shared identity signal — not just an interest. You do not join a community by clicking a button. You are matched to communities based on how you answer polls, which reveals your real values, tendencies, and personality traits. The community finds you as much as you find it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Shield className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Moderators — Who They Are</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Every community has moderators — real members who have demonstrated consistent, constructive engagement. Moderators are not appointed arbitrarily. They earn the role through activity, trust, and alignment with the community's signal. They are peers, not gatekeepers.
                </p>
                <ul className="mt-4 space-y-3 text-sm text-raw-silver/65">
                  {[
                    "Keep conversations honest and on-signal — they remove noise, not disagreement.",
                    "Handle reports from members when something feels off.",
                    "Shape the tone of the space without enforcing a single viewpoint.",
                    "Can pin threads, remove spam, and mute disruptive members temporarily.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-raw-gold/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Lock className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Anonymity Inside Communities</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  You participate under your raW username — no real name, no photo required, no social capital from outside. What you bring into a community is your actual self: your opinions, your consistency, your engagement. Reputation is built from behavior inside raW, not from who you are outside it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <MessageSquare className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">What Happens Inside a Community</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Community feeds surface discussions, community-specific polls, and shared reactions to global polls. Members can post, comment, and react. The algorithm surfaces content that is most relevant to the community's identity signal — not most viral, not most recent, but most aligned.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Star className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">War Levels &amp; Community Standing</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Your War Level — earned by answering polls, engaging authentically, and contributing to community health — determines your standing. Higher War Levels unlock deeper Personality Insights, more community access, and moderation privileges. It is not about time spent. It is about quality of presence.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-raw-gold/30 bg-raw-gold/8">
                <Zap className="h-4 w-4 text-raw-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-raw-text sm:text-lg">Where Communities Are Going</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/65">
                  Communities on raW will evolve as our personality data deepens. Upcoming:
                </p>
                <ul className="mt-4 space-y-3 text-sm text-raw-silver/65">
                  {[
                    "Cross-community compatibility — see which communities overlap most with your personality profile.",
                    "Community-exclusive polls — questions scoped to a single community's identity signal.",
                    "Moderator analytics — tools for moderators to understand the health and direction of their community.",
                    "Invite-only sub-communities — tighter circles within a community for members with converging profiles.",
                  ].map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-raw-gold/50" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <div className="mt-12 rounded-xl border border-raw-gold/20 bg-raw-gold/5 px-5 py-5 sm:mt-16">
            <p className="text-sm font-medium text-raw-gold">The bottom line</p>
            <p className="mt-2 text-sm leading-relaxed text-raw-silver/70">
              Communities on raW exist because identity needs context. Polls tell us who you are. Communities give that identity somewhere to live — with others who resonate, moderated by people who actually belong there, and built around signal rather than noise.
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
