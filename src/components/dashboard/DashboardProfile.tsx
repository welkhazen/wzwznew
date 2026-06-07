import { useEffect, useState } from "react";
import {
  Calendar,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  MessageCircle,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changePassword, deleteAccount } from "@/backend/supabase/controllers/authController";
import {
  addPrivateAlias,
  deleteUserAlias,
  listUserAliases,
  updateProfileVisibility,
  type UserAliasRow,
} from "@/backend/supabase/controllers/userController";
import type { PinnedMessageRecord } from "@/backend/supabase/controllers/userExtrasController";

import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { LEVEL_THEMES, MAX_LEVEL, getAvatar } from "@/lib/avataridentity";

interface DashboardProfileProps {
  userId: string;
  username: string;
  avatarLevel: number;
  onAvatarChange: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  avatarPricesByLevel: Record<number, string>;
  pollsAnswered: number;
  xp?: number;
  xpLevel?: number;
  pinnedMessage?: PinnedMessageRecord | null;
  onLogout: () => void;
}

const stats = [
  { icon: Target, label: "Polls Answered", value: "—", key: "polls" },
  { icon: MessageCircle, label: "Messages Sent", value: "—", key: "messages" },
  { icon: Flame, label: "Day Streak", value: "—", key: "streak" },
  { icon: TrendingUp, label: "XP Earned", value: "—", key: "xp" },
  { icon: Calendar, label: "Member Since", value: "—", key: "member" },
];

export function DashboardProfile({
  userId,
  username,
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  pollsAnswered,
  xp = 0,
  xpLevel = 1,
  pinnedMessage = null,
  onLogout,
}: DashboardProfileProps) {
  const { toast } = useToast();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delLoading, setDelLoading] = useState(false);

  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showDelPw, setShowDelPw] = useState(false);
  const [profileVisibilitySaving, setProfileVisibilitySaving] = useState(false);

  const [aliases, setAliases] = useState<UserAliasRow[]>([]);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState("");
  const [aliasSaving, setAliasSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listUserAliases(userId)
      .then((rows) => { if (!cancelled) setAliases(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  async function handleAddPrivateAlias() {
    const trimmed = aliasInput.trim();
    if (trimmed.length < 3 || trimmed.length > 32) {
      toast({ title: "Name must be 3–32 characters." });
      return;
    }
    setAliasSaving(true);
    try {
      const row = await addPrivateAlias(userId, trimmed);
      setAliases((prev) => [row, ...prev]);
      setAliasInput("");
      setAliasOpen(false);
      toast({ title: "Private name added" });
    } catch (e) {
      toast({ title: "Could not add name", description: e instanceof Error ? e.message : "Please try again." });
    } finally {
      setAliasSaving(false);
    }
  }

  async function handleDeleteAlias(id: string) {
    try {
      await deleteUserAlias(id);
      setAliases((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast({ title: "Could not remove name" });
    }
  }

  async function handleProfileVisibilityChange() {
    setProfileVisibilitySaving(true);
    try {
      await updateProfileVisibility(userId, true);
      toast({
        title: "Profile is visible",
        description: "People can see your chat profile.",
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
    setOldPw(""); setNewPw(""); setConfirmPw(""); setPwOpen(false);
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

  const displayIndex = hoveredIndex ?? avatarLevel;
  const theme = getAvatar(displayIndex);
  const ownedLevels = Array.from({ length: LEVEL_THEMES.length }, (_, i) => i + 1)
    .filter((lvl) => ownedAvatarLevels.has(lvl));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          Profile
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Your anonymous identity. Your progress. Your growth.
        </p>
      </div>

      {/* Avatar card */}
      <div className="flex flex-col items-center rounded-2xl border border-raw-border/40 bg-raw-surface/40 px-4 py-5 text-center sm:px-6 sm:py-6">
        <AvatarFigure avatarIndex={displayIndex} size="xl" selected />
        <p className="mt-3 font-display text-lg tracking-wide text-raw-text">
          {username}
        </p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-raw-silver/30">Public name</p>
        <p className="text-xs text-raw-gold/60">Level {displayIndex}</p>
        <p className="text-[10px] text-raw-silver/30">{theme.name}</p>

        <LevelProgressBanner xp={xp} level={xpLevel} className="mt-4 w-full" />

        {/* Level selector */}
        <div
          className="mt-4 grid w-full justify-items-center gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(MAX_LEVEL / 2)}, minmax(0, 1fr))`,
          }}
        >
          {ownedLevels.map(
            (lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  onAvatarChange(lvl);
                }}
                onMouseEnter={() => setHoveredIndex(lvl)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(lvl)}
                onBlur={() => setHoveredIndex(null)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/40"
                aria-label={`Preview level ${lvl}`}
                aria-pressed={lvl === avatarLevel}
              >
                <AvatarFigure
                  avatarIndex={lvl}
                  size="sm"
                  selected={lvl === avatarLevel}
                />
              </button>
            )
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-raw-border/30 bg-raw-surface/30 p-3 text-center sm:p-4"
            >
              <Icon className="mx-auto mb-1.5 h-3.5 w-3.5 text-raw-gold/40" />
              <p className="text-base font-bold text-raw-text sm:text-lg">
                {stat.key === "polls"
                  ? pollsAnswered
                  : stat.key === "xp"
                  ? xp.toLocaleString()
                  : stat.value}
              </p>
              <p className="mt-0.5 text-[8px] uppercase leading-tight tracking-wider text-raw-silver/30 sm:text-[9px]">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Account Settings */}
      <div className="space-y-2">
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
              className="relative h-7 w-12 shrink-0 rounded-full border border-raw-gold/60 bg-raw-gold/30 transition-colors disabled:opacity-60"
              aria-pressed
              aria-label="Public chat profile is always on"
            >
              <span className="absolute top-1 h-5 w-5 translate-x-5 rounded-full bg-raw-text transition-transform" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/30">
          <button
            type="button"
            onClick={() => setAliasOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <div>
              <p className="text-sm font-medium text-raw-text">Private names</p>
              <p className="mt-1 text-xs text-raw-silver/40">
                Add a separate name only you can see. Use it as an alias when you don't want your username shown.
              </p>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-raw-gold/40 text-raw-gold">
              {aliasOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </span>
          </button>

          {aliasOpen && (
            <div className="border-t border-raw-border/30 px-4 py-3.5 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder="New private name"
                  maxLength={32}
                  className="flex-1 rounded-lg border border-raw-border/40 bg-raw-black/40 px-3 py-2 text-sm text-raw-text placeholder:text-raw-silver/30 focus:border-raw-gold/60 focus:outline-none"
                  disabled={aliasSaving}
                />
                <button
                  type="button"
                  onClick={() => { void handleAddPrivateAlias(); }}
                  disabled={aliasSaving || aliasInput.trim().length < 3}
                  className="rounded-lg bg-raw-gold px-3 py-2 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {aliasSaving ? "Saving…" : "Add"}
                </button>
              </div>

              {aliases.length > 0 && (
                <ul className="space-y-1.5">
                  {aliases.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-lg border border-raw-border/30 bg-raw-black/30 px-3 py-2">
                      <span className="text-sm text-raw-text">{a.alias}</span>
                      <button
                        type="button"
                        onClick={() => { void handleDeleteAlias(a.id); }}
                        className="text-xs text-raw-silver/50 hover:text-raw-gold"
                        aria-label={`Remove ${a.alias}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {pinnedMessage && (
          <div className="rounded-2xl border border-raw-gold/25 bg-raw-gold/[0.06] px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-raw-gold/70">Pinned message</p>
            <p className="mt-1.5 text-sm leading-relaxed text-raw-text/85">{pinnedMessage.messageText}</p>
          </div>
        )}

        <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setPwOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-raw-gold/50" />
              <span className="text-sm font-medium text-raw-text">Change Password</span>
            </div>
            <span className="text-xs text-raw-silver/30">{pwOpen ? "Cancel" : "Edit"}</span>
          </button>
          {pwOpen && (
            <div className="border-t border-raw-border/20 px-4 pb-4 pt-3 space-y-2.5">
              <div className="relative">
                <input
                  type={showOldPw ? "text" : "password"}
                  placeholder="Current password"
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 pr-10 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPw((v) => !v)}
                  aria-label={showOldPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-raw-silver/50 hover:text-raw-gold"
                >
                  {showOldPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  placeholder="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 pr-10 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-raw-silver/50 hover:text-raw-gold"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 pr-10 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  aria-label={showConfirmPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-raw-silver/50 hover:text-raw-gold"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={pwLoading || !oldPw || !newPw || !confirmPw}
                className="w-full rounded-xl bg-raw-gold px-4 py-2.5 text-sm font-semibold text-raw-ink disabled:opacity-40"
              >
                {pwLoading ? "Saving…" : "Update Password"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-raw-surface/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setDelOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="h-4 w-4 text-red-400/60" />
              <span className="text-sm font-medium text-red-400/80">Delete Account</span>
            </div>
            <span className="text-xs text-raw-silver/30">{delOpen ? "Cancel" : "Danger"}</span>
          </button>
          {delOpen && (
            <div className="border-t border-red-500/10 px-4 pb-4 pt-3 space-y-2.5">
              <p className="text-xs text-raw-silver/40">This is permanent. All your data will be deleted and cannot be recovered.</p>
              <div className="relative">
                <input
                  type={showDelPw ? "text" : "password"}
                  placeholder="Enter your password to confirm"
                  value={delPw}
                  onChange={(e) => setDelPw(e.target.value)}
                  className="w-full rounded-xl border border-red-500/20 bg-raw-black/40 px-3 py-2.5 pr-10 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-red-400/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowDelPw((v) => !v)}
                  aria-label={showDelPw ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-raw-silver/50 hover:text-red-400"
                >
                  {showDelPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={delLoading || !delPw}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 disabled:opacity-40"
              >
                {delLoading ? "Deleting…" : "Permanently Delete My Account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
