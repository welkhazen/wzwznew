import { MessageCircle, Mail } from "lucide-react";

export function LandingFooter() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL ?? "support@theartofraw.me";
  const supportWhatsAppNumber = import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER ?? "+201000000000";
  const whatsAppHref = `https://wa.me/${supportWhatsAppNumber.replace(/\D/g, "")}`;

  return (
    <footer className="relative bg-raw-black">
      {/* Top glow line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-raw-gold/25 to-transparent" />

      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        {/* Brand */}
        <div className="mb-10 text-center">
          <a href="/" className="inline-block font-display text-3xl tracking-[0.25em] text-raw-text/90 sm:text-4xl">
            ra<span className="text-raw-gold">W</span>
          </a>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-raw-silver/35">Speak Your Truth.</p>
        </div>

        {/* Links — 3 cols on mobile, inline on desktop */}
        <div className="mb-10 grid grid-cols-3 gap-6 sm:flex sm:justify-center sm:gap-16">
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold/60">Product</p>
            <ul className="space-y-2.5">
              <li><a href="/#polls" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Polls</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold/60">Legal</p>
            <ul className="space-y-2.5">
              <li><a href="/terms" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Terms</a></li>
              <li><a href="/privacy" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Privacy</a></li>
              <li><a href="/security" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Security</a></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-raw-gold/60">Contact</p>
            <ul className="space-y-2.5">
              <li><a href={`mailto:${supportEmail}`} className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Email</a></li>
              <li><a href={whatsAppHref} target="_blank" rel="noreferrer" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">WhatsApp</a></li>
              <li><a href="/ask" className="text-xs text-raw-silver/55 transition hover:text-raw-gold">Ask AI</a></li>
            </ul>
          </div>
        </div>

        {/* Social icons */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <a
            href="https://twitter.com/theartofraw"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X / Twitter"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-raw-border/40 bg-raw-surface/40 text-raw-silver/50 transition hover:border-raw-gold/40 hover:text-raw-gold"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a
            href="https://instagram.com/theartofraw"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-raw-border/40 bg-raw-surface/40 text-raw-silver/50 transition hover:border-raw-gold/40 hover:text-raw-gold"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-raw-border/40 bg-raw-surface/40 text-raw-silver/50 transition hover:border-raw-gold/40 hover:text-raw-gold"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
          <a
            href={`mailto:${supportEmail}`}
            aria-label="Email"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-raw-border/40 bg-raw-surface/40 text-raw-silver/50 transition hover:border-raw-gold/40 hover:text-raw-gold"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-raw-border/20 pt-6 text-center">
          <p className="text-[11px] text-raw-silver/35">© 2026 raW · All rights reserved</p>
          <p className="mt-1 text-[10px] text-raw-silver/25">Where Discovery Becomes Transformation.</p>
        </div>
      </div>
    </footer>
  );
}
