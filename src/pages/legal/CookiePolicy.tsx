import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function CookiePolicy() {
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Legal</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Cookie Policy</h1>

          <div className="mt-6 space-y-6 text-raw-silver/75">
            <section>
              <h2 className="text-lg font-semibold text-raw-text">What Are Cookies</h2>
              <p className="mt-2 text-sm leading-relaxed">Cookies are small text files stored on your device that help websites remember information about your visit, such as your session and preferences.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">How We Use Cookies</h2>
              <p className="mt-2 text-sm leading-relaxed">raW uses cookies and similar local-storage technologies to keep you signed in, remember your preferences (such as theme), and understand how the app is used so we can improve it. We do not use cookies to sell your data to third parties.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Types of Cookies We Use</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                <li>• <span className="text-raw-text">Essential cookies</span> — required for sign-in, session security, and core functionality. These cannot be disabled without affecting how the app works.</li>
                <li>• <span className="text-raw-text">Preference cookies</span> — remember settings like display theme and notification preferences.</li>
                <li>• <span className="text-raw-text">Analytics cookies</span> — help us understand aggregate usage patterns so we can improve the product.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Managing Cookies</h2>
              <p className="mt-2 text-sm leading-relaxed">Most browsers let you control or delete cookies through their settings. Blocking essential cookies may prevent you from signing in or using parts of raW.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Changes to This Policy</h2>
              <p className="mt-2 text-sm leading-relaxed">We may update this Cookie Policy from time to time. Continued use of raW after changes are posted constitutes acceptance of the updated policy.</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-raw-text">Contact</h2>
              <p className="mt-2 text-sm leading-relaxed">Questions about this policy can be sent to <a href="mailto:privacy@theartofraw.me" className="text-raw-gold hover:underline">privacy@theartofraw.me</a>.</p>
            </section>
          </div>

          <p className="mt-10 text-xs leading-relaxed text-raw-silver/35">
            This page is a placeholder template and has not been reviewed by legal counsel. It must be reviewed and customized by a qualified lawyer before public launch.
          </p>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
