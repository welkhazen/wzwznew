import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Safety() {
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Trust &amp; Safety</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Safety Center</h1>

          <div className="mt-6 space-y-6 text-raw-silver/75">
            <section>
              <h2 className="text-lg font-semibold text-raw-text">How We Keep raW Safe</h2>
              <p className="mt-2 text-sm leading-relaxed">All messages pass through an automated moderation pipeline before being stored. Messages containing policy-violating content are blocked or queued for human review before they reach other users.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Reporting</h2>
              <p className="mt-2 text-sm leading-relaxed">Use the flag icon on any message to report it. You can also submit a detailed report at <Link to="/report-content" className="text-raw-gold hover:underline">/report-content</Link>. All reports go directly to our moderation queue and are reviewed within 24 hours.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Moderation Actions</h2>
              <p className="mt-2 text-sm leading-relaxed">Depending on the severity and frequency of violations, we may: warn a user, temporarily mute them in a community, or permanently ban their account. Severe violations (hate speech, CSAM, doxxing) result in immediate permanent bans with no appeal.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Appeals</h2>
              <p className="mt-2 text-sm leading-relaxed">If you believe a moderation action was applied in error, you may submit an appeal at <Link to="/appeals" className="text-raw-gold hover:underline">/appeals</Link>. Appeals are reviewed by a different team member than the one who took the original action.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Crisis Resources</h2>
              <p className="mt-2 text-sm leading-relaxed">If you or someone you know is in immediate danger, please contact your local emergency services. For mental health support: International Association for Suicide Prevention — <a href="https://www.iasp.info/resources/Crisis_Centres/" className="text-raw-gold hover:underline" target="_blank" rel="noopener noreferrer">crisis centres by country</a>.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Contact</h2>
              <p className="mt-2 text-sm leading-relaxed">For urgent safety concerns, email <a href="mailto:safety@theartofraw.me" className="text-raw-gold hover:underline">safety@theartofraw.me</a>.</p>
            </section>
          </div>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
