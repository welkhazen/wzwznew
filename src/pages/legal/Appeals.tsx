import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useToast } from "@/hooks/use-toast";

export default function Appeals() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent("Moderation appeal");
    const body = encodeURIComponent(`Account/username: ${username}\n\nWhy you believe this action was a mistake:\n${details}`);
    window.location.href = `mailto:safety@theartofraw.me?subject=${subject}&body=${body}`;
    setSubmitted(true);
    toast({ title: "Opening email client", description: "Your appeal draft has been prepared." });
  };

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
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Appeals</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl">Appeal a Moderation Decision</h1>

          <div className="mt-6 space-y-4 text-sm leading-relaxed text-raw-silver/75">
            <p>If you believe a warning, mute, ban, or message removal was applied in error, you can appeal the decision. Appeals are reviewed by a moderator who was not involved in the original action.</p>
            <p>Please include your account username and a clear explanation of why you believe the action should be reversed. We aim to respond within a few business days.</p>
          </div>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-raw-gold/20 bg-raw-gold/5 p-6 text-center">
              <p className="text-raw-gold font-medium">Draft prepared</p>
              <p className="mt-2 text-sm text-raw-silver/60">Your email app opened with a prefilled draft. Please send it to complete your appeal.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-xs text-raw-silver/50 hover:text-raw-gold transition">Open another draft</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="appeal-username" className="text-xs uppercase tracking-wide text-raw-silver/60">Username</label>
                <input
                  id="appeal-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your raW username"
                  className="mt-1 w-full rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="appeal-details" className="text-xs uppercase tracking-wide text-raw-silver/60">Why should this decision be reconsidered?</label>
                <textarea
                  id="appeal-details"
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the action taken and why you believe it was a mistake…"
                  rows={6}
                  className="mt-1 w-full resize-none rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full rounded-xl border border-raw-gold/45 bg-raw-gold/15 px-4 py-2.5 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/25">
                Submit Appeal
              </button>
            </form>
          )}

          <p className="mt-10 text-xs leading-relaxed text-raw-silver/35">
            This page is a placeholder template and has not been reviewed by legal counsel. It must be reviewed and customized by a qualified lawyer before public launch.
          </p>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
