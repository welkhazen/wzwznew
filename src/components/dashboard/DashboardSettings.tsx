import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldOff,
  Trash2,
  UserCog,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changePassword, deleteAccount } from "@/backend/supabase/controllers/authController";
import {
  getProfileVisibility,
  updateProfileVisibility,
} from "@/backend/supabase/controllers/userController";
import {
  readBlockedCommunitySenders,
  writeBlockedCommunitySenders,
} from "@/lib/blockedCommunitySenders";

interface DashboardSettingsProps {
  userId: string;
  onLogout: () => void;
}

type SettingsSection = "account" | "privacy" | "security" | "danger";

const SECTIONS: Array<{ key: SettingsSection; label: string; icon: typeof UserCog }> = [
  { key: "account",  label: "Account",      icon: UserCog },
  { key: "privacy",  label: "Privacy",      icon: ShieldOff },
  { key: "security", label: "Security",     icon: KeyRound },
  { key: "danger",   label: "Danger zone",  icon: Trash2 },
];

export function DashboardSettings({ userId, onLogout }: DashboardSettingsProps) {
  const { toast } = useToast();
  const [section, setSection] = useState<SettingsSection>("account");

  // Visibility
  const [profilePublic, setProfilePublic] = useState(true);
  const [profileVisibilitySaving, setProfileVisibilitySaving] = useState(false);

  // Change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Blocked users
  const [blockedKeys, setBlockedKeys] = useState<string[]>(() => readBlockedCommunitySenders(userId));

  function handleUnblock(key: string) {
    const next = blockedKeys.filter((k) => k !== key);
    setBlockedKeys(next);
    writeBlockedCommunitySenders(userId, next);
    window.dispatchEvent(new StorageEvent("storage", { key: "raw.community.blocked-senders.v1" }));
  }

  // Delete account
  const [delPw, setDelPw] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [showDelPw, setShowDelPw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfileVisibility(userId)
      .then((isPublic) => { if (!cancelled) setProfilePublic(isPublic); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  async function handleProfileVisibilityChange() {
    const nextProfilePublic = !profilePublic;
    setProfileVisibilitySaving(true);
    try {
      await updateProfileVisibility(userId, nextProfilePublic);
      setProfilePublic(nextProfilePublic);
      toast({
        title: nextProfilePublic ? "Profile is visible" : "Profile is hidden",
        description: nextProfilePublic ? "People can see your chat profile." : "Your chat profile is now private.",
      });
    } catch {
      toast({ title: "Could not update profile privacy", description: "Please try again." });
    } finally {
      setProfileVisibilitySaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPw.length < 6) {
      toast({ title: "Password too short", description: "New password must be at least 6 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match." });
      return;
    }
    setPwLoading(true);
    const result = await changePassword(userId, oldPw, newPw);
    setPwLoading(false);
    if (!result.ok) {
      toast({ title: "Could not change password", description: result.error ?? "Please try again." });
      return;
    }
    toast({ title: "Password changed", description: "Your password has been updated." });
    setOldPw(""); setNewPw(""); setConfirmPw("");
  }

  async function handleDeleteAccount() {
    setDelLoading(true);
    const result = await deleteAccount(userId, delPw);
    setDelLoading(false);
    if (!result.ok) {
      toast({ title: "Could not delete account", description: result.error ?? "Please try again." });
      return;
    }
    onLogout();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Settings</h1>
        <p className="mt-1 text-xs text-raw-silver/40">Visibility, aliases, and account security.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
        {/* Left sidebar */}
        <nav className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 p-1.5 md:self-start">
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-x-visible">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <li key={key} className="md:w-full">
                <button
                  type="button"
                  onClick={() => setSection(key)}
                  className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    section === key
                      ? "bg-raw-gold/15 text-raw-gold"
                      : "text-raw-silver/70 hover:bg-raw-surface/60 hover:text-raw-text"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right panel */}
        <div className="space-y-3">
          {section === "account" && (
            <div className="overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/30">
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-raw-text">Public chat profile</p>
                  <p className="mt-1 text-xs text-raw-silver/40">Your username, avatar, role, join date, and pinned message appear when someone taps your message.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { void handleProfileVisibilityChange(); }}
                  disabled={profileVisibilitySaving}
                  className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
                    profilePublic ? "border-raw-gold/60 bg-raw-gold/30" : "border-raw-border/40 bg-white/15"
                  }`}
                  aria-pressed={profilePublic}
                  aria-label={profilePublic ? "Disable public chat profile" : "Enable public chat profile"}
                >
                  <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-raw-text transition-transform ${profilePublic ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

          {section === "privacy" && (
            <div className="overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/30">
              <div className="flex items-center gap-2.5 border-b border-raw-border/20 px-4 py-3.5">
                <ShieldOff className="h-4 w-4 text-raw-gold/50" />
                <span className="text-sm font-medium text-raw-text">Blocked users</span>
              </div>
              <div className="space-y-2 px-4 pb-4 pt-3">
                <p className="text-xs text-raw-silver/40">Unblock someone to show their community messages again.</p>
                {blockedKeys.length === 0 ? (
                  <p className="rounded-2xl border border-raw-border/25 bg-raw-surface/20 px-4 py-6 text-center text-sm text-raw-silver/40">
                    You haven't blocked anyone yet.
                  </p>
                ) : (
                  blockedKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-raw-border/25 bg-raw-surface/25 px-4 py-3"
                    >
                      <p className="truncate text-sm text-raw-text">@{key}</p>
                      <button
                        type="button"
                        onClick={() => handleUnblock(key)}
                        className="shrink-0 rounded-xl border border-raw-gold/30 bg-raw-gold/10 px-3 py-1.5 text-xs text-raw-gold hover:bg-raw-gold/15"
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-raw-border/20">
                <div className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-raw-gold/50" />
                  <span className="text-sm font-medium text-raw-text">Change Password</span>
                </div>
              </div>
              <div className="px-4 pb-4 pt-3 space-y-2.5">
                <PwField placeholder="Current password" value={oldPw} setValue={setOldPw} show={showOldPw} setShow={setShowOldPw} />
                <PwField placeholder="New password" value={newPw} setValue={setNewPw} show={showNewPw} setShow={setShowNewPw} />
                <PwField placeholder="Confirm new password" value={confirmPw} setValue={setConfirmPw} show={showConfirmPw} setShow={setShowConfirmPw} />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={pwLoading || !oldPw || !newPw || !confirmPw}
                  className="w-full rounded-xl bg-raw-gold px-4 py-2.5 text-sm font-semibold text-raw-ink disabled:opacity-40"
                >
                  {pwLoading ? "Saving…" : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {section === "danger" && (
            <div className="rounded-2xl border border-red-500/20 bg-raw-surface/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-red-500/10">
                <div className="flex items-center gap-2.5">
                  <Trash2 className="h-4 w-4 text-red-400/60" />
                  <span className="text-sm font-medium text-red-400/80">Delete Account</span>
                </div>
              </div>
              <div className="px-4 pb-4 pt-3 space-y-2.5">
                <p className="text-xs text-raw-silver/40">This is permanent. All your data will be deleted and cannot be recovered.</p>
                <PwField placeholder="Enter your password to confirm" value={delPw} setValue={setDelPw} show={showDelPw} setShow={setShowDelPw} danger />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={delLoading || !delPw}
                  className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 disabled:opacity-40"
                >
                  {delLoading ? "Deleting…" : "Permanently Delete My Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PwFieldProps {
  placeholder: string;
  value: string;
  setValue: (next: string) => void;
  show: boolean;
  setShow: (next: boolean) => void;
  danger?: boolean;
}

function PwField({ placeholder, value, setValue, show, setShow, danger = false }: PwFieldProps) {
  const border = danger ? "border-red-500/20 focus:border-red-400/40" : "border-raw-border/30 focus:border-raw-gold/40";
  const iconColor = danger ? "hover:text-red-400" : "hover:text-raw-gold";
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`w-full rounded-xl border ${border} bg-raw-black/40 px-3 py-2.5 pr-10 text-sm text-raw-text placeholder:text-raw-silver/25 focus:outline-none`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className={`absolute inset-y-0 right-2 flex items-center px-1 text-raw-silver/50 ${iconColor}`}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
