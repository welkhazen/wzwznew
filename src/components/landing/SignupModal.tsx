import { useEffect, useRef, useState } from "react";
import { BrandName } from "@/components/ui/brand-name";
import { createPortal } from "react-dom";
import { Eye, EyeOff, X } from "lucide-react";
import {
  isValidUsername,
  normalizePlainText,
  sanitizePasswordInput,
  sanitizeUsernameInput,
} from "@/lib/inputSecurity";
import type { AuthResult } from "@/store/useRawStore";
import { track } from "@/lib/analytics";

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  onSignup: (username: string, password: string, referralCode: string) => Promise<AuthResult>;
  onLogin: (username: string, password: string) => Promise<AuthResult>;
  source?: string;
  initialReferralCode?: string;
}

type AuthMode = "signup" | "login";

function normalizeInviteCode(code: string): string {
  return normalizePlainText(code).trim().toUpperCase().replace(/\s+/g, "");
}

export function SignupModal({ open, onClose, onSignup, onLogin, source, initialReferralCode }: SignupModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode ?? "");
  const [cooldown, setCooldown] = useState(0);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const openedFiredRef = useRef(false);

  useEffect(() => {
    if (open && !openedFiredRef.current) {
      openedFiredRef.current = true;
      if (initialReferralCode) setReferralCode(initialReferralCode);
      track("signup_modal_opened", { source: source ?? "unknown" });
    }
    if (!open) {
      openedFiredRef.current = false;
      setPassword("");
      setConfirmPassword("");
      setReferralCode("");
      setCooldown(0);
      setError("");
      setIsSubmitting(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowTermsPopup(false);
    }
  }, [open, source]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  if (!open) return null;

  const handleStartSignup = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalizedUsername = normalizePlainText(sanitizeUsernameInput(username));
    const normalizedPassword = sanitizePasswordInput(password).trim();
    const normalizedConfirmPassword = sanitizePasswordInput(confirmPassword).trim();
    const normalizedReferralCode = normalizeInviteCode(referralCode);
    if (!isValidUsername(normalizedUsername) || normalizedPassword.length === 0) {
      setError("Use a 3-24 character username and enter a password.");
      return;
    }

    if (normalizedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!normalizedReferralCode) {
      setError("Enter your invitation code to sign up.");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setShowTermsPopup(true);
  };

  const handleConfirmTerms = async () => {
    setShowTermsPopup(false);
    setIsSubmitting(true);
    setError("");

    const normalizedUsername = normalizePlainText(sanitizeUsernameInput(username));
    const normalizedPassword = sanitizePasswordInput(password).trim();
    const normalizedReferralCode = normalizeInviteCode(referralCode);

    track("signup_started", { method: "username_password" });

    const result = await onSignup(normalizedUsername, normalizedPassword, normalizedReferralCode);
    if (!result.ok) {
      track("signup_failed", { reason: result.error ?? "unknown", step: "details" });
      setError(result.error ?? "Unable to create account.");
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedUsername = normalizePlainText(sanitizeUsernameInput(username));
    const normalizedPassword = sanitizePasswordInput(password).trim();

    if (!isValidUsername(normalizedUsername) || normalizedPassword.length === 0) {
      setError("Enter your username and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    track("login_started", { method: "username_password" });

    const result = await onLogin(normalizedUsername, normalizedPassword);

    if (!result.ok) {
      track("login_failed", { method: "username_password", reason: result.error ?? "unknown" });
      setError(result.error ?? "Sign in failed.");
    } else {
      track("login_completed", { method: "username_password" });
    }

    setIsSubmitting(false);
  };

  const isSignup = mode === "signup";

  return createPortal(
    <div
      className="flex items-center justify-center overflow-y-auto"
      style={{ position: "fixed", inset: 0, zIndex: 9999, width: "100dvw", height: "100dvh" }}
    >
      <div
        className="bg-black/70 backdrop-blur-sm"
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-raw-border/50 bg-raw-surface shadow-2xl mx-4 max-w-sm">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-raw-silver/60 transition-colors hover:bg-raw-black/30 hover:text-raw-silver sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto px-5 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-8">
        <div className="text-center mb-6 sm:mb-8">
          <p className="font-display text-lg tracking-wide text-raw-text">Enter <BrandName /></p>
          <p className="mt-2 text-sm text-raw-silver/50">
            Anonymous. No email. No real name.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-raw-border/70 bg-raw-black/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setConfirmPassword("");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isSignup ? "bg-raw-gold text-raw-ink" : "text-raw-silver/50 hover:text-raw-silver"
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setConfirmPassword("");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              !isSignup ? "bg-raw-gold text-raw-ink" : "text-raw-silver/50 hover:text-raw-silver"
            }`}
          >
            Sign In
          </button>
        </div>

        {isSignup ? (
          <form onSubmit={handleStartSignup} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(sanitizeUsernameInput(event.target.value))}
                placeholder="Choose a username"
                maxLength={24}
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(sanitizePasswordInput(event.target.value))}
                  placeholder="Create a password"
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 pr-12 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-raw-silver/35 transition-colors hover:text-raw-silver/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-raw-silver/30">Use at least 8 characters.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(sanitizePasswordInput(event.target.value))}
                  placeholder="Confirm your password"
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 pr-12 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-raw-silver/35 transition-colors hover:text-raw-silver/70"
                  aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Invitation Code</label>
              <input
                type="text"
                value={referralCode}
                onChange={(event) => setReferralCode(normalizeInviteCode(event.target.value))}
                placeholder="RAW-1-XXXXXXXX"
                maxLength={24}
                autoComplete="off"
                className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-sm uppercase tracking-[0.08em] text-raw-text placeholder:normal-case placeholder:tracking-normal placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-raw-gold py-3 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(sanitizeUsernameInput(event.target.value))}
                placeholder="Enter your username"
                maxLength={24}
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(sanitizePasswordInput(event.target.value))}
                  placeholder="Enter your password"
                  maxLength={128}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 pr-12 text-sm text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-raw-silver/35 transition-colors hover:text-raw-silver/70"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-raw-gold py-3 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Checking..." : "Sign In"}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-[11px] text-raw-silver/30">
          {isSignup ? "No email, no phone required." : "Sign in with your username and password."}
        </p>
        </div>
      </div>

      {showTermsPopup && (
        <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center rounded-2xl">
          <div className="absolute inset-0 rounded-2xl bg-raw-black/80 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 mb-4 sm:mb-0 w-full max-w-sm rounded-2xl border border-raw-border/50 bg-raw-surface p-6 shadow-2xl">
            <p className="text-center text-sm font-semibold text-raw-text">Before you join</p>
            <p className="mt-2 text-center text-xs leading-relaxed text-raw-silver/55">
              By creating an account you agree to our{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-raw-gold/80 underline hover:text-raw-gold">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-raw-gold/80 underline hover:text-raw-gold">
                Privacy Policy
              </a>.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowTermsPopup(false)}
                className="flex-1 rounded-xl border border-raw-border/50 py-2.5 text-sm text-raw-silver/60 transition-colors hover:border-raw-border hover:text-raw-silver"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerms}
                className="flex-1 rounded-xl bg-raw-gold py-2.5 text-sm font-bold text-raw-ink transition-all hover:bg-raw-gold/90"
              >
                I Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
