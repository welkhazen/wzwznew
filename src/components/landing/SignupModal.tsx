import { useEffect, useRef, useState } from "react";
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
  onRequestSignupOtp: (username: string, password: string, phone: string) => Promise<AuthResult>;
  onVerifySignupOtp: (code: string) => Promise<AuthResult>;
  onLogin: (username: string, password: string) => Promise<AuthResult>;
  source?: string;
}

type AuthMode = "signup" | "login";
type SignupStep = "details" | "verify";

function maskPhone(phone: string): string {
  if (phone.length <= 7) {
    return phone;
  }

  return `${phone.slice(0, 4)}${"•".repeat(phone.length - 7)}${phone.slice(-3)}`;
}

function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordStrength(password: string) {
  const checks = getPasswordChecks(password);
  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (password.length === 0) {
    return { label: "Add a stronger password", tone: "text-raw-silver/40", checks };
  }

  if (passedChecks <= 2) {
    return { label: "Weak", tone: "text-red-300", checks };
  }

  if (passedChecks <= 4) {
    return { label: "Medium", tone: "text-amber-300", checks };
  }

  return { label: "Strong", tone: "text-emerald-300", checks };
}

export function SignupModal({ open, onClose, onRequestSignupOtp, onVerifySignupOtp, onLogin, source }: SignupModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentChannels, setSentChannels] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const openedFiredRef = useRef(false);

  useEffect(() => {
    if (open && !openedFiredRef.current) {
      openedFiredRef.current = true;
      track("signup_modal_opened", { source: source ?? "unknown" });
    }
    if (!open) {
      openedFiredRef.current = false;
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setCode("");
      setSentChannels([]);
      setCooldown(0);
      setSignupStep("details");
      setError("");
      setIsSubmitting(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
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
    const checks = getPasswordChecks(normalizedPassword);

    if (!isValidUsername(normalizedUsername) || normalizedPassword.length < 8) {
      setError("Use a 3-24 character username and an 8+ character password.");
      return;
    }

    if (Object.values(checks).some((isValid) => !isValid)) {
      setError("Password must include upper/lowercase letters, a number, and a symbol.");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    track("signup_started", { method: "username_password" });

    const result = await onRequestSignupOtp(normalizedUsername, normalizedPassword, "");
    if (!result.ok) {
      track("signup_failed", { reason: result.error ?? "unknown", step: "details" });
      setError(result.error ?? "Unable to create account.");
      setIsSubmitting(false);
    } else {
      track("signup_otp_sent", { channel: "sms", attempt: 1 });
    }
  };

  const handleVerifySignup = async (event?: React.FormEvent, overrideCode?: string) => {
    event?.preventDefault();
    const verificationCode = overrideCode ?? code;

    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await onVerifySignupOtp(verificationCode);
    if (!result.ok) {
      track("signup_failed", { reason: result.error ?? "otp_invalid", step: "otp" });
      setError(result.error ?? "Verification failed.");
    } else {
      track("signup_otp_verified", { attempts_used: 1, time_to_verify_ms: 0 });
    }

    setIsSubmitting(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedUsername = normalizePlainText(sanitizeUsernameInput(username));
    const normalizedPassword = sanitizePasswordInput(password).trim();

    if (!isValidUsername(normalizedUsername) || normalizedPassword.length < 8) {
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
  const passwordStrength = getPasswordStrength(password);
  const channelSummary =
    sentChannels.length > 0
      ? sentChannels.map((channel) => channel === "whatsapp" ? "WhatsApp" : "SMS").join(" + ")
      : "SMS or WhatsApp";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

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
          <p className="font-display text-lg tracking-wide text-raw-text">Enter raW</p>
          <p className="mt-2 text-sm text-raw-silver/50">
            Anonymous. No email. No real name.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-raw-border/70 bg-raw-black/40 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setSignupStep("details");
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
              setSignupStep("details");
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

        {isSignup && signupStep === "details" ? (
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
                  minLength={8}
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
              <div className="mt-2 rounded-xl border border-raw-border/50 bg-raw-black/30 px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-raw-silver/45">Password strength</span>
                  <span className={passwordStrength.tone}>{passwordStrength.label}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-raw-silver/35">
                  <span className={passwordStrength.checks.length ? "text-emerald-300" : undefined}>8+ characters</span>
                  <span className={passwordStrength.checks.uppercase ? "text-emerald-300" : undefined}>Uppercase letter</span>
                  <span className={passwordStrength.checks.lowercase ? "text-emerald-300" : undefined}>Lowercase letter</span>
                  <span className={passwordStrength.checks.number ? "text-emerald-300" : undefined}>Number</span>
                  <span className={passwordStrength.checks.symbol ? "text-emerald-300" : undefined}>Special character</span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(sanitizePasswordInput(event.target.value))}
                  placeholder="Confirm your password"
                  minLength={8}
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
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </form>
        ) : isSignup ? (
          <form onSubmit={handleVerifySignup} className="space-y-4">
            <div className="rounded-xl border border-raw-border/60 bg-raw-black/35 px-4 py-3 text-sm text-raw-silver/75">
              <p className="text-xs uppercase tracking-[0.24em] text-raw-silver/35">Delivery</p>
              <p className="mt-2 text-raw-text">Code sent to {maskPhone(phone)}</p>
              <p className="mt-1 text-[11px] text-raw-silver/40">Channels: {channelSummary}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-raw-silver/40">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  const nextCode = event.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(nextCode);
                  if (nextCode.length === 6 && !isSubmitting) {
                    void handleVerifySignup(undefined, nextCode);
                  }
                }}
                placeholder="000000"
                autoFocus
                className="w-full rounded-xl border border-raw-border bg-raw-black/50 px-4 py-3 text-center text-lg tracking-[0.45em] text-raw-text placeholder:text-raw-silver/25 transition-all focus:border-raw-gold/30 focus:outline-none focus:ring-1 focus:ring-raw-gold/20"
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
              {isSubmitting ? "Checking..." : "Verify & Create Account"}
            </button>

            <div className="flex items-center justify-between text-xs text-raw-silver/40">
              <button
                type="button"
                onClick={() => {
                  setSignupStep("details");
                  setCode("");
                  setError("");
                }}
                className="transition-colors hover:text-raw-silver"
              >
                Back to details
              </button>
              <button
                type="button"
                onClick={() => void handleStartSignup()}
                disabled={cooldown > 0 || isSubmitting}
                className="transition-colors hover:text-raw-silver disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
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
                  minLength={8}
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
    </div>
  );
}
