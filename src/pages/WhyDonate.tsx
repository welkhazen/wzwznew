import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BrandName } from "@/components/ui/brand-name";
import { createDonationRequest } from "@/lib/adminData";
import { moderateUserText, getUserTextModerationMessage } from "@/lib/inputSecurity";
import { toast } from "@/components/ui/use-toast";

export default function WhyDonate() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameMod = moderateUserText(name);
    const msgMod = moderateUserText(message);
    if (!nameMod.allowed) {
      toast({ title: "Name blocked", description: getUserTextModerationMessage(nameMod) });
      return;
    }
    if (!msgMod.allowed) {
      toast({ title: "Message blocked", description: getUserTextModerationMessage(msgMod) });
      return;
    }
    setSubmitting(true);
    try {
      createDonationRequest(nameMod.text, email, msgMod.text);
      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

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
            Why Donate to{" "}
            <span className="whitespace-nowrap"><BrandName />?</span>
          </h1>
          <p className="text-lg leading-relaxed text-raw-silver/75">
            Your support helps us build a platform for genuine anonymous conversations.
          </p>
        </div>

        <div className="space-y-12">
          {/* Mission */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Our Mission</h2>
            <p className="text-raw-silver/70">
              Placeholder: Describe the purpose and mission of raW
            </p>
          </section>

          {/* Stats */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">Impact by the Numbers</h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div className="rounded-lg border border-raw-border/30 bg-raw-black/50 p-6">
                <div className="text-3xl font-bold text-raw-gold">—</div>
                <p className="mt-2 text-sm text-raw-silver/60">Metric placeholder</p>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-raw-text">How Your Donation Helps</h2>
            <ul className="space-y-3 text-raw-silver/70">
              {["First benefit", "Second benefit", "Third benefit"].map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raw-gold/20 text-xs font-bold text-raw-gold">•</span>
                  <span>Placeholder: {b}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Donation interest form */}
          <section className="rounded-lg border border-raw-gold/35 bg-gradient-to-b from-raw-gold/[0.08] to-transparent p-8">
            <h2 className="mb-2 text-2xl font-semibold text-raw-text">
              Interested in Supporting <BrandName />?
            </h2>
            <p className="mb-8 text-raw-silver/70">
              Donations aren't open yet. Leave your details and we'll reach out when they are.
            </p>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-raw-gold" />
                <p className="text-lg font-semibold text-raw-text">Got it — thank you!</p>
                <p className="text-sm text-raw-silver/60">We'll be in touch when donations go live.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="donate-name" className="mb-1.5 block text-sm font-medium text-raw-silver/80">
                    Name
                  </label>
                  <input
                    id="donate-name"
                    type="text"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded border border-raw-border/40 bg-raw-black/60 px-4 py-2.5 text-sm text-raw-text placeholder-raw-silver/35 outline-none transition focus:border-raw-gold/60 focus:ring-1 focus:ring-raw-gold/30"
                  />
                </div>

                <div>
                  <label htmlFor="donate-email" className="mb-1.5 block text-sm font-medium text-raw-silver/80">
                    Email
                  </label>
                  <input
                    id="donate-email"
                    type="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded border border-raw-border/40 bg-raw-black/60 px-4 py-2.5 text-sm text-raw-text placeholder-raw-silver/35 outline-none transition focus:border-raw-gold/60 focus:ring-1 focus:ring-raw-gold/30"
                  />
                </div>

                <div>
                  <label htmlFor="donate-message" className="mb-1.5 block text-sm font-medium text-raw-silver/80">
                    Message <span className="text-raw-silver/40">(optional)</span>
                  </label>
                  <textarea
                    id="donate-message"
                    rows={4}
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Anything you'd like us to know…"
                    className="w-full resize-none rounded border border-raw-border/40 bg-raw-black/60 px-4 py-2.5 text-sm text-raw-text placeholder-raw-silver/35 outline-none transition focus:border-raw-gold/60 focus:ring-1 focus:ring-raw-gold/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-raw-gold px-8 py-3 text-base font-semibold text-raw-black transition hover:bg-raw-gold/90 disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Sending…" : "Notify me when donations open"}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
