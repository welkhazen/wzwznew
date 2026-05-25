import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { track } from "@/lib/analytics";
import { readCommunityChats } from "@/lib/communityChat";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import {
  ArrowLeft,
  Bell,
  Ban,
  Camera,
  Check,
  Flag,
  LogOut,
  Moon,
  Palette,
  Receipt,
  Settings,
  Shield,
  Sun,
  Sunset,
} from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { LevelProgressBanner } from "@/components/dashboard/LevelProgressBanner";
import { TokenBalanceButton } from "@/components/ui/TokenBalanceButton";
import { apiFetch } from "@/lib/http";
import { cn } from "@/lib/utils";
import { readIssueReports, writeIssueReports, type IssueReportRecord } from "@/lib/adminData";
import { readBlockedCommunitySenders, writeBlockedCommunitySenders } from "@/lib/blockedCommunitySenders";
import { useTheme } from "@/providers/useTheme";
import { THEME_MODE_LABELS, type AccentPresetId, type ThemeMode } from "@/providers/theme-context";
import { xpProgressInLevel } from "@/lib/userProgress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { ChevronDown } from "lucide-react";

export type DashboardTab = "home" | "polls" | "challenges" | "daily-spin" | "communities" | "profile" | "wallet" | "inventory";

interface DashboardNavProps {
  userId: string;
  username: string;
  avatarLevel: number;
  showAdminLink?: boolean;
  onAddTestXP?: () => void;
  onProfileClick: () => void;
  onBillingClick: () => void;
  onLogout: () => void;
  communityTitle?: string;
  onBack?: () => void;
  communities?: PersistedCommunityRecord[];
  xp?: number;
  level?: number;
}

const ISSUE_TYPE_OPTIONS = ["Harmful content", "Bug or broken screen", "Account or billing", "Other"];
const MAX_SCREENSHOT_SIZE = 2 * 1024 * 1024;
const DELIVERED_NOTIFICATIONS_PREFIX = "raw.delivered-notifications";
const SEEN_NOTIFICATIONS_PREFIX = "raw.seen-notifications";

type DashboardNotification = {
  id: string;
  type: "mention" | "like" | "community";
  title: string;
  communityTitle: string;
  senderName?: string;
  text: string;
  createdAt: string;
  likeCount?: number;
};

function deliveredNotificationsKey(userId: string) {
  return `${DELIVERED_NOTIFICATIONS_PREFIX}.${userId}`;
}

function notificationDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function seenNotificationsKey(userId: string) {
  return `${SEEN_NOTIFICATIONS_PREFIX}.${userId}.${notificationDayKey()}`;
}

function readSeenNotificationIds(userId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(seenNotificationsKey(userId));
    const parsed = raw ? JSON.parse(raw) as string[] : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeSeenNotificationIds(userId: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(seenNotificationsKey(userId), JSON.stringify(Array.from(new Set(ids))));
}

export function DashboardNav({ userId, username, avatarLevel, showAdminLink = false, onAddTestXP, onProfileClick, onBillingClick, onLogout, communityTitle, onBack, communities: propCommunities, xp = 0, level = 1 }: DashboardNavProps) {
  const { mode, accent, accentPresets, setMode, setAccent } = useTheme();
  const [hoveredMode, setHoveredMode] = useState<ThemeMode | null>(null);
  const [hoveredAccent, setHoveredAccent] = useState<AccentPresetId | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>(() => readSeenNotificationIds(userId));
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockedUsersOpen, setBlockedUsersOpen] = useState(false);
  const [blockedSenderKeys, setBlockedSenderKeys] = useState<string[]>(() => readBlockedCommunitySenders(userId));
  const [issueType, setIssueType] = useState(ISSUE_TYPE_OPTIONS[0]);
  const [issueDetails, setIssueDetails] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo<DashboardNotification[]>(() => {
    const communities = propCommunities ?? readCommunityChats();
    const tag = `@${username}`.toLowerCase();
    const results: DashboardNotification[] = [];
    for (const community of communities) {
      if (community.createdBy && community.createdBy !== userId) {
        results.push({
          id: `community:${community.id}:${community.createdAt}`,
          type: "community",
          title: "New community created",
          communityTitle: community.title,
          text: community.description,
          createdAt: community.createdAt,
        });
      }

      for (const msg of community.messages) {
        if (msg.text.toLowerCase().includes(tag) && msg.senderName !== username) {
          results.push({
            id: `mention:${msg.id}:${userId}`,
            type: "mention",
            title: `@${msg.senderName} mentioned you`,
            communityTitle: community.title,
            senderName: msg.senderName,
            text: msg.text,
            createdAt: msg.createdAt,
          });
        }
        if ((msg.senderId === userId || msg.senderName === username) && (msg.likedBy?.length ?? 0) > 0) {
          const likeCount = msg.likedBy?.length ?? 0;
          results.push({
            id: `like:${msg.id}:${likeCount}`,
            type: "like",
            title: `${likeCount} like${likeCount > 1 ? "s" : ""} on your post`,
            communityTitle: community.title,
            senderName: msg.senderName,
            text: msg.text,
            createdAt: msg.createdAt,
            likeCount,
          });
        }
      }
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [userId, username, propCommunities]);
  const unseenNotificationCount = useMemo(() => {
    const seen = new Set(seenNotificationIds);
    return notifications.filter((notification) => !seen.has(notification.id)).length;
  }, [notifications, seenNotificationIds]);

  useEffect(() => {
    setSeenNotificationIds(readSeenNotificationIds(userId));
    setBlockedSenderKeys(readBlockedCommunitySenders(userId));
  }, [userId]);

  const blockedSenderLabels = useMemo(() => {
    const communities = propCommunities ?? readCommunityChats();
    const labels = new Map<string, string>();
    for (const community of communities) {
      for (const message of community.messages) {
        const key = (message.senderId || message.senderName).trim().toLowerCase();
        if (blockedSenderKeys.includes(key)) labels.set(key, message.senderName);
      }
      for (const member of community.members) {
        const key = (member.userId || member.username).trim().toLowerCase();
        if (blockedSenderKeys.includes(key)) labels.set(key, member.username);
      }
    }
    return blockedSenderKeys.map((key) => ({ key, label: labels.get(key) ?? key }));
  }, [blockedSenderKeys, propCommunities]);

  const handleUnblockSender = (senderKey: string) => {
    const next = blockedSenderKeys.filter((key) => key !== senderKey);
    setBlockedSenderKeys(next);
    writeBlockedCommunitySenders(userId, next);
    window.dispatchEvent(new StorageEvent("storage", { key: "raw.community.blocked-senders.v1" }));
  };

  useEffect(() => {
    if (!notifOpen || notifications.length === 0) return;
    const ids = notifications.map((notification) => notification.id);
    setSeenNotificationIds((previous) => {
      const next = Array.from(new Set([...previous, ...ids]));
      writeSeenNotificationIds(userId, next);
      return next;
    });
  }, [notifOpen, notifications, userId]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const key = deliveredNotificationsKey(userId);
    const stored = window.localStorage.getItem(key);
    const deliveredIds = new Set<string>(stored ? JSON.parse(stored) as string[] : []);

    if (!stored) {
      window.localStorage.setItem(key, JSON.stringify(notifications.map((notification) => notification.id)));
      return;
    }

    const unseen = notifications.filter((notification) => !deliveredIds.has(notification.id));
    for (const notification of unseen.slice(0, 4)) {
      const browserNotification = new Notification(notification.title, {
        body: `${notification.communityTitle}: ${notification.text}`,
        icon: "/raw-logo-192.png",
        tag: notification.id,
      });
      browserNotification.onclick = () => {
        window.focus();
      };
    }

    if (unseen.length > 0) {
      window.localStorage.setItem(key, JSON.stringify(notifications.map((notification) => notification.id)));
    }
  }, [notifications, userId]);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setScreenshotName("");
      setScreenshotDataUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Screenshot must be an image", description: "Upload a PNG, JPG, or screenshot image file." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SCREENSHOT_SIZE) {
      toast({ title: "Screenshot too large", description: "Use an image under 2MB for the report." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotName(file.name);
      setScreenshotDataUrl(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => {
      toast({ title: "Could not read screenshot", description: "Try another image file." });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitIssueReport = async () => {
    const details = issueDetails.trim();
    if (!details && !screenshotDataUrl) {
      toast({ title: "Add report details", description: "Write a short note or attach a screenshot before sending." });
      return;
    }

    const report: IssueReportRecord = {
      id: `issue-report-${Date.now()}`,
      reporterId: userId,
      reporterName: username,
      issueType,
      details,
      screenshotDataUrl: screenshotDataUrl || undefined,
      screenshotName: screenshotName || undefined,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      createdAt: new Date().toISOString(),
      status: "open",
    };

    try {
      const response = await apiFetch("/api/moderation/issue-reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!response.ok) {
        throw new Error("Issue report API failed");
      }
    } catch {
      writeIssueReports([report, ...readIssueReports()]);
    }

    setIssueDetails("");
    setScreenshotName("");
    setScreenshotDataUrl("");
    setIssueType(ISSUE_TYPE_OPTIONS[0]);
    setReportOpen(false);
    toast({ title: "Report sent", description: "Admin can review it with the screenshot in the admin queue." });
  };

  const effectiveMode = hoveredMode ?? mode;
  const effectiveAccent = hoveredAccent ?? accent;
  const isEffectiveLight = effectiveMode === "light";
  const modeOptions: { mode: ThemeMode; label: string; icon: typeof Moon }[] = [
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "dusk", label: "Dusk", icon: Sunset },
    { mode: "light", label: "Light", icon: Sun },
  ];
  const modeIndex = modeOptions.findIndex((option) => option.mode === mode);
  const effectiveModeIndex = modeOptions.findIndex((option) => option.mode === effectiveMode);
  const mobileXpProgress = xpProgressInLevel(xp, level);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    const selectedAccent = accentPresets.find((preset) => preset.id === effectiveAccent) ?? accentPresets[0];

    root.classList.toggle("theme-light", effectiveMode === "light");
    root.classList.toggle("theme-dusk", effectiveMode === "dusk");
    root.dataset.themeMode = effectiveMode;
    root.dataset.themeAccent = effectiveAccent;
    root.style.setProperty("--raw-accent", selectedAccent.rgb);
    root.style.setProperty("--raw-accent-shadow", selectedAccent.shadowRgb);
    root.style.setProperty("--primary", selectedAccent.hsl);
    root.style.setProperty("--accent", selectedAccent.hsl);
    root.style.setProperty("--ring", selectedAccent.hsl);
    root.style.setProperty("--sidebar-primary", selectedAccent.hsl);
    root.style.setProperty("--sidebar-ring", selectedAccent.hsl);
  }, [accentPresets, effectiveAccent, effectiveMode]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl",
        isEffectiveLight
          ? "border-slate-200 bg-white/90"
          : "border-raw-border/50 bg-raw-black/90",
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        {/* Logo — hidden on mobile when inside a community */}
        <a href="/" className={cn("font-display text-base tracking-[0.3em] shrink-0 sm:text-lg", isEffectiveLight ? "text-slate-950" : "text-raw-text", communityTitle ? "hidden sm:block" : "")}>
          ra<span className="text-raw-gold">W</span>
        </a>

        {/* Community name — mobile only, shown instead of logo when in a community */}
        {communityTitle && (
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <button
              onClick={onBack}
              className={cn(
                "shrink-0 rounded-full border p-1.5 transition-colors hover:border-raw-gold/20 hover:text-raw-gold",
                isEffectiveLight ? "border-slate-200 text-slate-500" : "border-raw-border/30 text-raw-silver/55",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className={cn("truncate font-display text-sm tracking-wide", isEffectiveLight ? "text-slate-950" : "text-raw-text")}>{communityTitle}</span>
          </div>
        )}

        {/* Right: token + bell + avatar */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <TokenBalanceButton />
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((p) => !p)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                isEffectiveLight
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  : "text-raw-silver/60 hover:bg-raw-surface/40 hover:text-raw-silver",
              )}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unseenNotificationCount > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-raw-gold px-1 text-[9px] font-bold text-raw-ink">
                  {unseenNotificationCount > 99 ? "99+" : unseenNotificationCount}
                </div>
              )}
            </button>
            {notifOpen && (
              <div className={cn(
                "fixed inset-x-2 top-[57px] z-50 rounded-2xl border shadow-2xl backdrop-blur-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80",
                isEffectiveLight
                  ? "border-slate-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                  : "border-raw-border/40 bg-raw-black/95",
              )}>
                <div className={cn("border-b px-4 py-3 flex items-center justify-between", isEffectiveLight ? "border-slate-200" : "border-raw-border/20")}>
                  <p className={cn("text-[11px] uppercase tracking-[0.18em]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/40")}>Notifications</p>
                  {notifications.length > 0 && <span className={cn("text-[10px]", isEffectiveLight ? "text-slate-400" : "text-raw-silver/30")}>{notifications.length} total</span>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto sm:max-h-80">
                  {notifications.length === 0 ? (
                    <p className={cn("px-4 py-6 text-center text-sm", isEffectiveLight ? "text-slate-500" : "text-raw-silver/35")}>No notifications yet</p>
                  ) : notifications.map((n, i) => (
                    <div key={i} className={cn("border-b px-4 py-3 last:border-0", isEffectiveLight ? "border-slate-100" : "border-raw-border/15")}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 ${n.type === "like" ? "bg-raw-gold/15 text-raw-gold" : "bg-raw-silver/10 text-raw-silver/60"}`}>
                          {n.type === "like" ? `♥ ${n.likeCount} like${(n.likeCount ?? 0) > 1 ? "s" : ""}` : n.type === "community" ? "New community" : "@ mention"}
                        </span>
                        <p className={cn("text-[10px]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/40")}>{n.communityTitle}</p>
                      </div>
                      {n.type === "mention" && <p className={cn("mt-1 text-xs", isEffectiveLight ? "text-slate-500" : "text-raw-silver/60")}>from @{n.senderName}</p>}
                      <p className={cn("mt-1 text-sm leading-relaxed line-clamp-2", isEffectiveLight ? "text-slate-800" : "text-raw-text/80")}>{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Three-state theme switcher */}
          <div
            className={cn(
              "relative hidden h-9 w-[104px] grid-cols-3 rounded-full border p-1 backdrop-blur-md transition-colors sm:grid",
              isEffectiveLight
                ? "border-slate-200 bg-white/80 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                : "border-white/10 bg-white/[0.045] text-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
            )}
            aria-label="Theme mode"
          >
            <span
              className={cn(
                "pointer-events-none absolute left-1 top-1 h-7 w-[30px] rounded-full border transition-transform duration-300 ease-out",
                mode === "light"
                  ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.12)]"
                  : mode === "dusk"
                    ? "border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(244,114,182,0.18),rgba(251,146,60,0.12))]"
                    : "border-white/10 bg-white/8",
              )}
              style={{ transform: `translateX(${Math.max(modeIndex, 0) * 32}px)` }}
            />
            {modeOptions.map((option) => {
              const Icon = option.icon;
              const selected = mode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setMode(option.mode)}
                  className={cn(
                    "relative z-10 flex h-7 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
                    selected
                      ? option.mode === "light"
                        ? "text-slate-900"
                        : option.mode === "dusk"
                          ? "text-pink-200"
                          : "text-white"
                      : isEffectiveLight
                        ? "text-slate-400 hover:text-slate-700"
                        : "text-white/35 hover:text-white/70",
                  )}
                  aria-label={`Use ${option.label} mode`}
                  aria-pressed={selected}
                  title={option.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          <DropdownMenu onOpenChange={(open) => { if (!open) setAppearanceOpen(false); }}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center transition-opacity hover:opacity-80"
                aria-label="Open profile menu"
              >
                <AvatarFigure avatarIndex={avatarLevel} size="sm" selected />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={10}
              collisionPadding={12}
              className={cn(
                "w-[min(21rem,calc(100vw-1.25rem))] overflow-visible rounded-2xl p-1.5 text-raw-text sm:max-h-[min(78dvh,620px)] sm:w-[min(22rem,calc(100vw-1rem))] sm:overflow-y-auto sm:overscroll-contain sm:p-2",
                isEffectiveLight
                  ? "border border-slate-300/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(242,247,255,0.96))] shadow-[0_20px_50px_rgba(28,38,58,0.18)]"
                  : "border border-raw-border/40 bg-[linear-gradient(160deg,rgba(17,17,17,0.96),rgba(9,9,9,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
              )}
            >
              <button
                onClick={onProfileClick}
                className={cn(
                  "mb-1 flex w-full items-center gap-2 rounded-xl border px-2 py-1 text-left transition-colors sm:gap-3 sm:px-3 sm:py-2",
                  isEffectiveLight
                    ? "border-raw-gold/25 bg-raw-gold/[0.12] hover:bg-raw-gold/[0.2]"
                    : "border-raw-gold/20 bg-raw-gold/[0.08] hover:bg-raw-gold/[0.12]",
                )}
              >
                <AvatarFigure avatarIndex={avatarLevel} size="sm" selected />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-raw-text">View Profile</p>
                  <p className={cn("truncate text-xs", isEffectiveLight ? "text-slate-600" : "text-raw-silver/50")}>@{username}</p>
                </div>
              </button>

              <div className={cn("mx-1 mb-1 rounded-lg border px-2 py-1.5 sm:hidden", isEffectiveLight ? "border-slate-200 bg-slate-50" : "border-raw-border/25 bg-raw-black/30")}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-display text-[10px] tracking-wide text-[#8f96ff]">Lvl {level}</span>
                  <span className={cn("text-[9px]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/55")}>{xp.toLocaleString()} XP</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-raw-border/20">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-raw-gold/75 to-raw-gold"
                    style={{ width: `${mobileXpProgress.pct}%` }}
                  />
                </div>
              </div>

              <LevelProgressBanner
                xp={xp}
                level={level}
                compact
                className={cn("mx-1 mb-1 hidden sm:block", isEffectiveLight ? "border-slate-200 bg-slate-50" : "border-raw-border/25 bg-raw-black/30")}
              />

              {showAdminLink && onAddTestXP ? (
                <button
                  type="button"
                  onClick={onAddTestXP}
                  className="mx-1 mb-1 flex w-[calc(100%-0.5rem)] items-center justify-center rounded-xl border border-raw-gold/35 bg-raw-gold/10 px-3 py-2 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/20"
                >
                  +100 XP
                </button>
              ) : null}

              <DropdownMenuItem
                onClick={onBillingClick}
                className={cn("cursor-pointer rounded-lg px-2 py-1.5 text-xs focus:text-raw-text sm:px-3 sm:py-2.5 sm:text-sm", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}
              >
                <Receipt className="mr-3 h-4 w-4" />
                Billing
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setBlockedSenderKeys(readBlockedCommunitySenders(userId));
                  setBlockedUsersOpen(true);
                }}
                className={cn("cursor-pointer rounded-lg px-2 py-1.5 text-xs focus:text-raw-text sm:px-3 sm:py-2.5 sm:text-sm", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}
              >
                <Ban className="mr-3 h-4 w-4" />
                Blocked users
              </DropdownMenuItem>

              <DropdownMenuSeparator className={cn("my-1 sm:my-2", isEffectiveLight ? "bg-slate-200" : "bg-raw-border/30")} />

              {showAdminLink ? (
                <DropdownMenuItem asChild className={cn("rounded-lg px-3 py-2.5 text-sm focus:text-raw-text", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}>
                  <a href="/admin">
                    <Shield className="mr-3 h-4 w-4" />
                    Admin
                  </a>
                </DropdownMenuItem>
              ) : null}

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setReportOpen(true);
                }}
                className={cn("cursor-pointer rounded-lg px-2 py-1.5 text-xs focus:text-raw-text sm:px-3 sm:py-2.5 sm:text-sm", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}
              >
                <Flag className="mr-3 h-4 w-4" />
                Report an issue
              </DropdownMenuItem>

              <button
                type="button"
                onClick={() => setAppearanceOpen((o) => !o)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors sm:px-3 sm:py-2.5 sm:text-sm",
                  isEffectiveLight ? "text-slate-700 hover:bg-slate-100" : "text-raw-silver/80 hover:bg-raw-surface/80",
                )}
              >
                <span className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  Appearance
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", appearanceOpen && "rotate-180")} />
              </button>

              {appearanceOpen && (
                <div className={cn("mx-1 mb-1 rounded-xl border p-1.5 sm:p-3", isEffectiveLight ? "border-slate-200 bg-white/85" : "border-raw-border/30 bg-raw-surface/25")}>
                  <div className={cn("mb-1 hidden items-center gap-2 uppercase tracking-[0.16em] sm:mb-3 sm:flex sm:text-xs", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>
                    <Palette className="h-3.5 w-3.5" />
                    Theme Studio
                  </div>

                  <div className={cn("rounded-lg border px-2 py-1 sm:px-3 sm:py-2", isEffectiveLight ? "border-slate-200 bg-slate-50" : "border-raw-border/25 bg-raw-black/25")}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("text-[10px] uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>Mode</span>
                      <span className={cn("text-[10px] uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-600" : "text-raw-silver/65")}>{THEME_MODE_LABELS[effectiveMode]}</span>
                    </div>
                    <div className={cn("relative mt-2 grid grid-cols-3 rounded-full border p-1", isEffectiveLight ? "border-slate-200 bg-white" : "border-raw-border/25 bg-raw-black/35")}>
                      <span
                        className={cn(
                          "pointer-events-none absolute left-1 top-1 h-6 w-[calc((100%_-_0.5rem)/3)] rounded-full border transition-transform duration-300 ease-out sm:h-9",
                          effectiveMode === "light"
                            ? "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.12)]"
                            : effectiveMode === "dusk"
                              ? "border-fuchsia-300/25 bg-[linear-gradient(135deg,rgba(244,114,182,0.18),rgba(251,146,60,0.12))]"
                              : "border-white/10 bg-white/8",
                        )}
                        style={{ transform: `translateX(${Math.max(effectiveModeIndex, 0) * 100}%)` }}
                      />
                      {modeOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = effectiveMode === option.mode;
                        return (
                          <button
                            key={option.mode}
                            type="button"
                            onClick={() => { setMode(option.mode); setHoveredMode(null); }}
                            className={cn(
                              "relative z-10 flex h-6 items-center justify-center rounded-full px-2 transition-all duration-200 active:scale-95 sm:h-9",
                              selected
                                ? option.mode === "light"
                                  ? "text-slate-900"
                                  : option.mode === "dusk"
                                    ? "text-pink-200"
                                    : "text-white"
                                : isEffectiveLight
                                  ? "text-slate-400 hover:text-slate-700"
                                  : "text-raw-silver/45 hover:text-raw-text",
                            )}
                            aria-pressed={selected}
                            aria-label={`Use ${option.label} mode`}
                            title={option.label}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-1.5 sm:mt-3">
                    <p className={cn("mb-1 text-[9px] uppercase tracking-[0.16em] sm:mb-2 sm:text-[10px]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>Accent</p>
                    <div className="grid grid-cols-5 gap-1 sm:gap-2">
                      {accentPresets.map((preset) => {
                        const selected = preset.id === effectiveAccent;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => { setAccent(preset.id); setHoveredAccent(null); }}
                            className={cn(
                              "relative h-5 rounded-md border transition-all sm:h-10 sm:rounded-lg",
                              selected ? "border-raw-text shadow-[0_0_0_1px_rgb(var(--raw-text)/0.3)]" : "border-raw-border/35 hover:border-raw-silver/35",
                            )}
                            style={{ backgroundColor: `rgb(${preset.rgb})` }}
                            aria-label={`Use ${preset.label} accent`}
                            title={preset.label}
                          >
                            {selected ? <Check className="mx-auto h-3.5 w-3.5 text-raw-ink" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <DropdownMenuSeparator className={cn("my-1 sm:my-2", isEffectiveLight ? "bg-slate-200" : "bg-raw-border/30")} />

              <DropdownMenuItem
                onClick={() => {
                  track("logout_clicked", {});
                  onLogout();
                }}
                className={cn("rounded-lg px-2 py-1.5 text-xs focus:bg-red-500/15 focus:text-red-200 sm:px-3 sm:py-2.5 sm:text-sm", isEffectiveLight ? "text-slate-700" : "text-raw-silver/80")}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-raw-border/40 bg-raw-black text-raw-text sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wide">Report an issue</DialogTitle>
            <DialogDescription className="text-raw-silver/50">
              Send a screenshot and note to admin for review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Type</span>
              <select
                value={issueType}
                onChange={(event) => setIssueType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-raw-border/30 bg-raw-surface/35 px-3 py-2.5 text-sm text-raw-text outline-none focus:border-raw-gold/45"
              >
                {ISSUE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Screenshot</span>
              <div className="mt-2 rounded-2xl border border-dashed border-raw-border/35 bg-raw-surface/20 p-4">
                <Input type="file" accept="image/*" onChange={handleScreenshotChange} className="border-raw-border/30 bg-raw-black/35 text-raw-silver/70" />
                {screenshotDataUrl ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-raw-border/25 bg-raw-black/45">
                    <img src={screenshotDataUrl} alt="Issue screenshot preview" className="max-h-48 w-full object-contain" />
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-xs text-raw-silver/40">
                    <Camera className="h-4 w-4" />
                    Add the screenshot that shows the problem.
                  </div>
                )}
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">What happened?</span>
              <Textarea
                value={issueDetails}
                onChange={(event) => setIssueDetails(event.target.value)}
                placeholder="Tell admin what content, screen, or behavior should be reviewed."
                className="mt-2 min-h-[110px] border-raw-border/30 bg-raw-surface/25 text-raw-text placeholder:text-raw-silver/30"
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)} className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text">
              Cancel
            </Button>
            <Button onClick={handleSubmitIssueReport} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
              Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockedUsersOpen} onOpenChange={setBlockedUsersOpen}>
        <DialogContent className="border-raw-border/40 bg-raw-black text-raw-text sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-wide">Blocked users</DialogTitle>
            <DialogDescription className="text-raw-silver/50">
              Unblock someone to show their community messages again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {blockedSenderLabels.length === 0 ? (
              <p className="rounded-2xl border border-raw-border/25 bg-raw-surface/20 px-4 py-6 text-center text-sm text-raw-silver/40">
                You have not blocked anyone yet.
              </p>
            ) : blockedSenderLabels.map((sender) => (
              <div
                key={sender.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-raw-border/25 bg-raw-surface/25 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-raw-text">@{sender.label}</p>
                  <p className="truncate text-[10px] text-raw-silver/35">{sender.key}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleUnblockSender(sender.key)}
                  className="shrink-0 rounded-xl border-raw-gold/30 bg-raw-gold/10 px-3 text-xs text-raw-gold hover:bg-raw-gold/15 hover:text-raw-gold"
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBlockedUsersOpen(false)}
              className="rounded-xl text-raw-silver/70 hover:text-raw-text"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
