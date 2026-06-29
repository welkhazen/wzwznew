import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BrandName } from "@/components/ui/brand-name";

export default function WhyDonate() {
  return (
    <div className="min-h-screen bg-raw-black">
      <nav className="border-b border-raw-border/50 bg-raw-black/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 text-raw-silver/60 transition-colors hover:text-raw-text"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="mb-12 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-raw-text sm:text-5xl">
            Why Donate to <BrandName />?
          </h1>
          <p className="text-lg leading-relaxed text-raw-silver/75">
            Your support helps us build a platform for genuine anonymous conversations.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Our Mission</h2>
            <p className="text-raw-silver/70">
              {/* Add your mission statement and explanation here */}
              Placeholder: Describe the purpose and mission of raW
            </p>
          </section>

          {/* Data/Stats Section */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Impact by the Numbers</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {/* Add your stats/data cards here */}
              <div className="rounded-lg border border-raw-border/30 bg-raw-black/50 p-6">
                <div className="text-3xl font-bold text-raw-gold">—</div>
                <p className="mt-2 text-sm text-raw-silver/60">Metric placeholder</p>
              </div>
            </div>
          </section>

          {/* How Donations Help */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">How Your Donation Helps</h2>
            <ul className="space-y-3 text-raw-silver/70">
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: First benefit</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: Second benefit</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">
                  •
                </span>
                <span>Placeholder: Third benefit</span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <section className="rounded-lg border border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.08] to-transparent p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">
              Ready to Support <BrandName />?
            </h2>
            <p className="mb-6 text-raw-silver/70">
              Your contribution helps us continue building the future of anonymous communication.
            </p>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-raw-gold px-8 py-3 text-base font-semibold text-raw-black transition hover:bg-raw-gold/90"
            >
              Donate Now
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
