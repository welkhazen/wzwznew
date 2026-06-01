import { useState } from "react";
import {
  Calendar,
  Flame,
  KeyRound,
  MessageCircle,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changePassword, deleteAccount } from "@/backend/supabase/controllers/authController";

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
              <input
                type="password"
                placeholder="Current password"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
              />
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
              <input
                type="password"
                placeholder="Enter your password to confirm"
                value={delPw}
                onChange={(e) => setDelPw(e.target.value)}
                className="w-full rounded-xl border border-red-500/20 bg-raw-black/40 px-3 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-red-400/40 focus:outline-none"
              />
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
