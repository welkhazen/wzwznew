import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "spam", label: "Spam or unwanted advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "violence", label: "Violence or threats" },
  { value: "misinformation", label: "Misinformation" },
  { value: "nsfw", label: "Explicit or adult content" },
  { value: "self_harm", label: "Self-harm or suicide content" },
  { value: "other", label: "Other" },
];

export default function ReportContent() {
  const { toast } = useToast();
  const [category, setCategory] = useState("spam");
  const [details, setDetails] = useState("");
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Content report: ${category}`);
    const body = encodeURIComponent(`Category: ${category}\nURL: ${url}\n\nDetails:\n${details}`);
    window.location.href = `mailto:safety@theartofraw.me?subject=${subject}&body=${body}`;
    setSubmitted(true);
    toast({ title: "Opening email client", description: "Your report draft has been prepared." });
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
          <p className="text-[11px] uppercase tracking-[0.2em] text-raw-gold/75">Report</p>
          <h1 className="mt-2 font-display text-2xl tracking-wide text-raw-text sm:text-3xl">Report Content</h1>
          <p className="mt-3 text-sm text-raw-silver/60 leading-relaxed">
            To report a specific message, use the flag icon directly on the message. Use this form for general content reports or for content you can no longer access.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-raw-gold/20 bg-raw-gold/5 p-6 text-center">
              <p className="text-raw-gold font-medium">Report submitted</p>
              <p className="mt-2 text-sm text-raw-silver/60">Thank you. Our team will review it within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="mt-4 text-xs text-raw-silver/50 hover:text-raw-gold transition">Submit another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-raw-silver/60">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text focus:border-raw-gold/45 focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-raw-silver/60">URL or location (optional)</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. community name or message link"
                  className="mt-1 w-full rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-raw-silver/60">Details</label>
                <textarea
                  required
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the content and why it violates our guidelines…"
                  rows={5}
                  className="mt-1 w-full resize-none rounded-xl border border-raw-border/40 bg-raw-black/30 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/35 focus:border-raw-gold/45 focus:outline-none"
                />
              </div>
              <button type="submit" className="w-full rounded-xl border border-raw-gold/45 bg-raw-gold/15 px-4 py-2.5 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/25">
                Submit Report
              </button>
            </form>
          )}
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
