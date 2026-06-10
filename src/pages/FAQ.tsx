import { Link } from "react-router-dom";
import { FAQSection } from "@/components/landing/FAQSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useTheme } from "@/providers/useTheme";

const FAQ = () => {
  const { mode } = useTheme();
  const isLight = mode === "light";

  return (
    <div className="min-h-screen" style={{ background: isLight ? "#ffffff" : "rgb(var(--raw-black))" }}>
      <header className="border-b border-raw-border/30 px-4 py-4 backdrop-blur-sm sm:px-6" style={{ background: isLight ? "rgba(255,255,255,0.9)" : "rgb(var(--raw-black) / 0.85)" }}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="font-display text-xl tracking-[0.2em] text-raw-text/85">
            ra<span className="text-raw-gold">W</span>
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-raw-border/40 bg-raw-black/35 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-raw-silver/75 transition hover:border-raw-gold/35 hover:text-raw-gold"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <FAQSection />

      <LandingFooter />
    </div>
  );
};

export default FAQ;
