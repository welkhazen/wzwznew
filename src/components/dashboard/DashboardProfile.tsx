import { useState } from "react";
import {
  Award,
  Calendar,
  Flame,
  MessageCircle,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LEVEL_THEMES, MAX_LEVEL, getAvatar } from "@/lib/avataridentity";

interface DashboardProfileProps {
  username: string;
  avatarLevel: number;
  onAvatarChange: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  avatarPricesByLevel: Record<number, string>;
  pollsAnswered: number;
  xp?: number;
}

const stats = [
  { icon: Target, label: "Polls Answered", value: "—", key: "polls" },
  { icon: MessageCircle, label: "Messages Sent", value: "—", key: "messages" },
  { icon: Flame, label: "Day Streak", value: "—", key: "streak" },
  { icon: TrendingUp, label: "XP Earned", value: "—", key: "xp" },
  { icon: Calendar, label: "Member Since", value: "—", key: "member" },
  { icon: Award, label: "Badges", value: "—", key: "badges" },
];

const badges = [
  { name: "Founding Member", desc: "Joined during the founding era", earned: true },
  { name: "First Vote", desc: "Answered your first poll", earned: true },
  { name: "Week Warrior", desc: "7-day activity streak", earned: true },
  { name: "Voice of Reason", desc: "50 community messages", earned: false },
  { name: "Gold Standard", desc: "Reach Level 10", earned: false },
];

export function DashboardProfile({
  username,
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  onUnlockAvatar,
  avatarPricesByLevel,
  pollsAnswered,
  xp = 0,
}: DashboardProfileProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [unlockingLevel, setUnlockingLevel] = useState<number | null>(null);
  const displayIndex = hoveredIndex ?? avatarLevel;
  const theme = getAvatar(displayIndex);
  const xpForNext = displayIndex * 500;
  const xpPct = Math.min(Math.round((xp / xpForNext) * 100), 100);

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

        {/* XP Progress */}
        <div className="mt-4 w-full">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] text-raw-silver/30">
              XP to Level {Math.min(displayIndex + 1, MAX_LEVEL)}
            </span>
            <span className="text-[10px] text-raw-gold/60">
              {xp.toLocaleString()} / {xpForNext.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raw-border/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-raw-gold/60 to-raw-gold transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        {/* Level selector */}
        <div
          className="mt-4 grid w-full justify-items-center gap-1"
          style={{
            gridTemplateColumns: `repeat(${Math.ceil(MAX_LEVEL / 2)}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: LEVEL_THEMES.length }, (_, i) => i + 1).map(
            (lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  if (ownedAvatarLevels.has(lvl)) {
                    onAvatarChange(lvl);
                    return;
                  }

                  setUnlockingLevel(lvl);
                  void onUnlockAvatar(lvl).then((ok) => {
                    if (ok) onAvatarChange(lvl);
                  }).catch(() => {
                    // Keep current selection if unlock fails.
                  }).finally(() => {
                    setUnlockingLevel((previous) => (previous === lvl ? null : previous));
                  });
                }}
                onMouseEnter={() => setHoveredIndex(lvl)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(lvl)}
                onBlur={() => setHoveredIndex(null)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/40 ${
                  ownedAvatarLevels.has(lvl) ? "" : "opacity-75"
                }`}
                aria-label={`Preview level ${lvl}`}
                aria-pressed={lvl === avatarLevel}
              >
                <AvatarFigure
                  avatarIndex={lvl}
                  size="sm"
                  selected={lvl === avatarLevel}
                />
                {!ownedAvatarLevels.has(lvl) && (
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-raw-silver/40">
                    {unlockingLevel === lvl ? "Unlocking..." : (avatarPricesByLevel[lvl] || "Locked")}
                  </span>
                )}
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

      {/* Badges */}
      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/30 p-4 sm:p-5">
        <h3 className="mb-3 font-display text-sm tracking-wide text-raw-text">
          Badges
        </h3>
        <div className="space-y-2">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                badge.earned
                  ? "border-raw-gold/15 bg-raw-gold/[0.03]"
                  : "border-raw-border/15 bg-raw-black/20 opacity-40"
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  badge.earned ? "bg-raw-gold/10" : "bg-raw-surface/50"
                }`}
              >
                <Trophy
                  className={`h-3.5 w-3.5 ${
                    badge.earned ? "text-raw-gold/60" : "text-raw-silver/20"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-medium ${
                    badge.earned ? "text-raw-text" : "text-raw-silver/30"
                  }`}
                >
                  {badge.name}
                </p>
                <p className="text-[10px] text-raw-silver/25">{badge.desc}</p>
              </div>
              {badge.earned && (
                <span className="shrink-0 text-[9px] font-medium text-raw-gold/50">
                  Earned
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
