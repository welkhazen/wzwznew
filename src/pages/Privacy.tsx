import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Privacy() {
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Legal</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">Privacy Policy</h1>

          <div className="mt-6 space-y-5 text-raw-silver/75 sm:mt-8 sm:space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-raw-text">1. Introduction</h2>
              <p className="mt-2 text-sm leading-relaxed">
                raW ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">2. Information We Collect</h2>
              <p className="mt-2 text-sm leading-relaxed">
                We focus on collecting raW data: the choices, votes, communities, messages, and engagement signals you create while using the platform. This data is primarily connected to your username and account features, not to a public real-world identity.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Account information needed to run your account, such as username and password</li>
                <li>• Profile data, including avatar selection and community preferences</li>
                <li>• raW engagement data, including polls voted, communities joined, messages sent, and features used</li>
                <li>• Technical data needed for security and reliability, such as IP address, browser type, and device type</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">3. How We Use Your Information</h2>
              <p className="mt-2 text-sm leading-relaxed">
                We use your raW engagement data to operate the product and to power The Cumulative Mind (The raW Engine), our system for trend analysis and correlation. The raW Engine looks for patterns in how people vote, join, talk, and engage so we can better understand what different users have in common.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Provide, maintain, and improve our services</li>
                <li>• Process your account and deliver features connected to your username</li>
                <li>• Match you with people who show similar interests, opinions, and engagement patterns</li>
                <li>• Recommend better communities, suggestions, polls, and services</li>
                <li>• Analyze trends and correlations across engagement data</li>
                <li>• Detect and prevent fraudulent activity, spam, and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">4. Data Security</h2>
              <p className="mt-2 text-sm leading-relaxed">
                We implement appropriate technical and organizational measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">5. Anonymity & Account Features</h2>
              <p className="mt-2 text-sm leading-relaxed">
                raW is designed for username-based participation. Your activity helps shape your raW profile, but the experience is built around a username rather than a required real name. We use your engagement to improve matching, recommendations, and communities through The Cumulative Mind (The raW Engine), while retaining the account and technical data needed to operate the service and prevent abuse.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">6. Third-Party Services</h2>
              <p className="mt-2 text-sm leading-relaxed">
                We use third-party services for error tracking (Sentry). These services have their own privacy policies governing their use of data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">7. Data Retention</h2>
              <p className="mt-2 text-sm leading-relaxed">
                We retain personal data for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your account and associated data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">8. Your Rights</h2>
              <p className="mt-2 text-sm leading-relaxed">
                Depending on your location, you may have rights including access, correction, deletion, and portability of your personal data. Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-raw-text">9. Contact Us</h2>
              <p className="mt-2 text-sm leading-relaxed">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@theartofraw.me or via WhatsApp.
              </p>
            </section>

            <section className="pt-4 border-t border-raw-border/30">
              <p className="text-xs text-raw-silver/50">Last updated: April 2026</p>
            </section>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
