import { Link } from "react-router-dom";
import { BrandName } from "@/components/ui/brand-name";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SECURITY_ITEMS = [
  {
    title: "Encryption",
    body:
      "Data is encrypted in transit using TLS and protected at rest using strong encryption standards in managed infrastructure.",
  },
  {
    title: "Moderation & Safety",
    body:
      "Communities are moderated through reporting workflows, admin actions, and anti-abuse controls to reduce harmful behavior.",
  },
  {
    title: "Data Residency",
    body:
      "We store and process data in approved infrastructure regions with operational controls for availability and compliance.",
  },
  {
    title: "GDPR Principles",
    body:
      "We support core GDPR principles including data minimization, purpose limitation, user access requests, and deletion workflows.",
  },
  {
    title: "No-Sale Policy",
    body:
      "We do not sell personal data. User information is used only to provide, secure, and improve the platform experience.",
  },
];

const Security = () => {
  return (
    <div className="min-h-screen bg-raw-black">
      <header className="border-b border-raw-border/30 bg-raw-black/85 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            <BrandName />
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
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-raw-gold/15 bg-[linear-gradient(160deg,rgba(18,18,18,0.96),rgba(8,8,8,0.98))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Security & Privacy</p>
            <h1 className="font-display text-2xl tracking-wide text-raw-text sm:text-3xl md:text-4xl">How We Protect Users</h1>
            <p className="text-sm text-raw-silver/55">
              Security and privacy controls are built into product design, moderation workflows, and data operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {SECURITY_ITEMS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-raw-border/35 bg-raw-black/35 p-4">
                <h2 className="text-base font-semibold text-raw-text">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-raw-silver/60">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Security;
