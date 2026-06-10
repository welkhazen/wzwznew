import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-raw-black">
      <header className="border-b border-raw-border/30 bg-raw-black/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            ra<span className="text-raw-gold">W</span>
          </Link>
          <Link to="/" className="shrink-0 rounded-lg border border-raw-border/40 bg-raw-black/35 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-raw-silver/75 transition hover:border-raw-gold/35 hover:text-raw-gold sm:text-xs">
            Back to Home
          </Link>
        </div>
      </header>

      <section className="px-4 py-10 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Community</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Community Guidelines</h1>

          <div className="mt-6 space-y-6 text-raw-silver/75">
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Be Honest</h2>
              <p className="mt-2 text-sm leading-relaxed">raW exists for authentic conversation. Share your real thoughts. Don't misrepresent yourself, spread deliberate misinformation, or impersonate others.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Respect Others</h2>
              <p className="mt-2 text-sm leading-relaxed">Disagree with ideas, not people. Harassment, hate speech, threats, and targeted abuse toward any individual or group are not allowed and will result in removal.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">No Harmful Content</h2>
              <p className="mt-2 text-sm leading-relaxed">Do not post content that promotes violence, self-harm, illegal activity, or exploitation of minors. This includes links, images, and coded language used to evade filters.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">No Spam</h2>
              <p className="mt-2 text-sm leading-relaxed">Don't flood conversations with repetitive messages, unsolicited promotions, or off-topic content. Automated posting without permission is prohibited.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Privacy</h2>
              <p className="mt-2 text-sm leading-relaxed">Don't share other people's personal information without their consent. Doxxing — posting private information about a real person to expose or endanger them — is a permanent ban offense.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Enforcement</h2>
              <p className="mt-2 text-sm leading-relaxed">Violations may result in warnings, temporary mutes, or permanent bans depending on severity. You can appeal moderation decisions at <Link to="/appeals" className="text-raw-gold hover:underline">/appeals</Link>. To report content, use the flag button on any message or visit <Link to="/report-content" className="text-raw-gold hover:underline">/report-content</Link>.</p>
            </section>
          </div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
