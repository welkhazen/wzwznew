import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ThemeCustomizer } from "@/components/theme/ThemeCustomizer";
import { ThemeModeSwitcher } from "@/components/theme/ThemeModeSwitcher";
import { track } from "@/lib/analytics";
import { useTheme } from "@/providers/useTheme";

const RAW_LOGO_SRC = "/raw-logo-96.png";

interface NavbarProps {
  isLoggedIn: boolean;
  username?: string;
  onSignupClick: () => void;
}

export function Navbar({ isLoggedIn, username, onSignupClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { mode } = useTheme();
  const isLightMode = mode === "light";
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 10) {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        setNavVisible(true);
      } else if (y < lastY) {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        setNavVisible(true);
      } else if (y > lastY) {
        if (!hideTimer) {
          hideTimer = setTimeout(() => { setNavVisible(false); hideTimer = null; }, 150);
        }
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const handleSignupClick = () => {
    track("landing_cta_clicked", {
      cta_id: "navbar_join",
      cta_text: "Join",
      source_section: "navbar",
    });
    setMenuOpen(false);
    onSignupClick();
  };

  const navLinks: { href: string; label: string }[] = [];

  return (
    <nav
      className="landing-navbar fixed top-0 left-0 right-0 z-50 overflow-hidden border-b border-raw-border/50 bg-raw-black/80 backdrop-blur-xl transition-transform duration-300 ease-in-out"
      style={{ transform: navVisible ? "translateY(0)" : "translateY(-100%)" }}
    >
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          aria-label="raW — go to home"
          className="flex items-center gap-2 font-display text-xl tracking-[0.06em] text-raw-text transition-opacity hover:opacity-90 sm:gap-3"
        >
          <img
            src={RAW_LOGO_SRC}
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            decoding="async"
            fetchpriority="high"
            className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
          />
          <span>
            ra<span className="text-raw-gold">W</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-raw-silver/60 transition-colors hover:text-raw-silver"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-raw-gold/30 to-raw-gold/10 flex items-center justify-center">
                <span className="text-xs font-medium text-raw-gold">{username?.[0]?.toUpperCase()}</span>
              </div>
              <span className="hidden text-sm text-raw-silver/80 sm:inline">{username}</span>
            </div>
          ) : (
            <>
              <ThemeModeSwitcher />
              <ThemeCustomizer placement="inline" triggerStyle="compact" accentAccess="free" className="flex shrink-0" />
              <button
                onClick={handleSignupClick}
                className="min-h-11 rounded-full bg-raw-gold px-3 py-2.5 text-xs font-semibold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 sm:px-5 sm:text-sm"
              >
                Join
              </button>
            </>
          )}

          {/* Mobile hamburger — only shown when there are nav links */}
          {navLinks.length > 0 && (
            <button
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors md:hidden ${
                menuOpen
                  ? "border-raw-gold/50 bg-raw-gold/10 text-raw-gold"
                  : "border-raw-border/40 text-raw-silver/60 hover:text-raw-text"
              }`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && navLinks.length > 0 && (
        <div className="border-t border-raw-border/30 bg-raw-black/95 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-sm text-raw-silver/70 transition-colors hover:text-raw-text"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
