import { useEffect, useMemo, useRef, useState } from "react";
import { xpProgressInLevel } from "@/lib/userProgress";
import { MAX_LEVEL } from "@/lib/avataridentity";
import { track } from "@/lib/analytics";
import { readCommunityChats } from "@/lib/communityChat";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import {
  ArrowLeft,
  Bell,
  Check,
  CloudMoon,
  LogOut,
  Moon,
  Palette,
  Receipt,
  Settings,
  Shield,
  Sun,
} from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { TokenBalanceButton } from "@/components/ui/TokenBalanceButton";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/useTheme";
import { THEME_MODE_LABELS, type AccentPresetId, type ThemeMode } from "@/providers/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type DashboardTab = "home" | "polls" | "challenges" | "daily-spin" | "communities" | "profile" | "wallet" | "inventory";

interface DashboardNavProps {
  username: string;
  avatarLevel: number;
  showAdminLink?: boolean;
  onProfileClick: () => void;
  onBillingClick: () => void;
  onLogout: () => void;
  communityTitle?: string;
  onBack?: () => void;
  communities?: PersistedCommunityRecord[];
  xp?: number;
  level?: number;
}

export function DashboardNav({ username, avatarLevel, showAdminLink = false, onProfileClick, onBillingClick, onLogout, communityTitle, onBack, communities: propCommunities, xp = 0, level = 1 }: DashboardNavProps) {
  const { mode, accent, accentPresets, setMode, setAccent } = useTheme();
  const [hoveredMode, setHoveredMode] = useState<ThemeMode | null>(null);
  const [hoveredAccent, setHoveredAccent] = useState<AccentPresetId | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    const communities = propCommunities ?? readCommunityChats();
    const tag = `@${username}`.toLowerCase();
    const results: { type: "mention" | "like"; communityTitle: string; senderName: string; text: string; createdAt: string; likeCount?: number }[] = [];
    for (const community of communities) {
      for (const msg of community.messages) {
        if (msg.text.toLowerCase().includes(tag) && msg.senderName !== username) {
          results.push({ type: "mention", communityTitle: community.title, senderName: msg.senderName, text: msg.text, createdAt: msg.createdAt });
        }
        if ((msg.senderId === username || msg.senderName === username) && (msg.likedBy?.length ?? 0) > 0) {
          results.push({ type: "like", communityTitle: community.title, senderName: msg.senderName, text: msg.text, createdAt: msg.createdAt, likeCount: msg.likedBy?.length });
        }
      }
    }
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [username, propCommunities]);

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);
  const effectiveMode = hoveredMode ?? mode;
  const effectiveAccent = hoveredAccent ?? accent;
  const isEffectiveLight = effectiveMode === "light";
  const modeOptions: { mode: ThemeMode; label: string; icon: typeof Moon }[] = [
    { mode: "dark", label: "Dark", icon: Moon },
    { mode: "dusk", label: "Dusk", icon: CloudMoon },
    { mode: "light", label: "Light", icon: Sun },
  ];

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
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
              {notifications.length > 0 && (
                <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-raw-gold px-1 text-[9px] font-bold text-raw-ink">
                  {notifications.length > 99 ? "99+" : notifications.length}
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
                          {n.type === "like" ? `♥ ${n.likeCount} like${(n.likeCount ?? 0) > 1 ? "s" : ""}` : "@ mention"}
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
          <DropdownMenu onOpenChange={(open) => { if (!open) setAppearanceOpen(false); }}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2.5 rounded-full border p-0.5 transition-colors",
                  isEffectiveLight
                    ? "border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.10)] hover:border-raw-gold/35"
                    : "border-raw-border/40 bg-raw-surface/35 hover:border-raw-gold/35",
                )}
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
                "w-[285px] max-w-[calc(100vw-1rem)] rounded-2xl p-2 text-raw-text",
                isEffectiveLight
                  ? "border border-slate-300/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(242,247,255,0.96))] shadow-[0_20px_50px_rgba(28,38,58,0.18)]"
                  : "border border-raw-border/40 bg-[linear-gradient(160deg,rgba(17,17,17,0.96),rgba(9,9,9,0.98))] shadow-[0_20px_50px_rgba(0,0,0,0.55)]",
              )}
            >
              <button
                onClick={onProfileClick}
                className={cn(
                  "mb-1 flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
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

              {/* XP progress strip */}
              {(() => {
                const { current, needed, pct } = xpProgressInLevel(xp, level);
                const isMax = level >= MAX_LEVEL;
                return (
                  <div className={cn("mx-1 mb-1 rounded-lg border px-3 py-2", isEffectiveLight ? "border-slate-200 bg-slate-50" : "border-raw-border/25 bg-raw-black/30")}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-raw-gold/70">
                        Lvl {level}{!isMax ? ` → Lvl ${level + 1}` : " · Max"}
                      </span>
                      <span className={cn("text-[10px]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/40")}>
                        {isMax ? `${xp.toLocaleString()} XP` : `${current.toLocaleString()} / ${needed.toLocaleString()} XP`}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-raw-border/30">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-raw-gold/60 to-raw-gold transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <DropdownMenuItem
                onClick={onBillingClick}
                className={cn("cursor-pointer rounded-lg px-3 py-2.5 text-sm focus:text-raw-text", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}
              >
                <Receipt className="mr-3 h-4 w-4" />
                Billing
              </DropdownMenuItem>

              <DropdownMenuSeparator className={cn("my-2", isEffectiveLight ? "bg-slate-200" : "bg-raw-border/30")} />

              {showAdminLink ? (
                <DropdownMenuItem asChild className={cn("rounded-lg px-3 py-2.5 text-sm focus:text-raw-text", isEffectiveLight ? "text-slate-700 focus:bg-slate-100" : "text-raw-silver/80 focus:bg-raw-surface/80")}>
                  <a href="/admin">
                    <Shield className="mr-3 h-4 w-4" />
                    Admin
                  </a>
                </DropdownMenuItem>
              ) : null}

              <button
                type="button"
                onClick={() => setAppearanceOpen((o) => !o)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
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
                <div className={cn("mx-1 mb-1 rounded-xl border p-3", isEffectiveLight ? "border-slate-200 bg-white/85" : "border-raw-border/30 bg-raw-surface/25")}>
                  <div className={cn("mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>
                    <Palette className="h-3.5 w-3.5" />
                    Theme Studio
                  </div>

                  <div className={cn("rounded-lg border px-3 py-2", isEffectiveLight ? "border-slate-200 bg-slate-50" : "border-raw-border/25 bg-raw-black/25")}>
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn("text-[10px] uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>Mode</span>
                      <span className={cn("text-[10px] uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-600" : "text-raw-silver/65")}>{THEME_MODE_LABELS[effectiveMode]}</span>
                    </div>
                    <div className={cn("mt-2 grid grid-cols-3 gap-1 rounded-full border p-1", isEffectiveLight ? "border-slate-200 bg-white" : "border-raw-border/25 bg-raw-black/35")}>
                      {modeOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = effectiveMode === option.mode;
                        return (
                          <button
                            key={option.mode}
                            type="button"
                            onClick={() => { setMode(option.mode); setHoveredMode(null); }}
                            className={cn(
                              "flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-[11px] font-semibold transition-colors",
                              selected
                                ? "bg-raw-gold/18 text-raw-gold shadow-[0_0_0_1px_rgb(var(--raw-accent)/0.35)]"
                                : isEffectiveLight
                                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  : "text-raw-silver/55 hover:bg-raw-surface/60 hover:text-raw-text",
                            )}
                            aria-pressed={selected}
                            aria-label={`Use ${option.label} mode`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className={cn("mb-2 text-[10px] uppercase tracking-[0.16em]", isEffectiveLight ? "text-slate-500" : "text-raw-silver/45")}>Accent</p>
                    <div className="grid grid-cols-5 gap-2">
                      {accentPresets.map((preset) => {
                        const selected = preset.id === effectiveAccent;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => { setAccent(preset.id); setHoveredAccent(null); }}
                            className={cn(
                              "relative h-10 rounded-lg border transition-all",
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

              <DropdownMenuSeparator className={cn("my-2", isEffectiveLight ? "bg-slate-200" : "bg-raw-border/30")} />

              <DropdownMenuItem
                onClick={() => {
                  track("logout_clicked", {});
                  onLogout();
                }}
                className={cn("rounded-lg px-3 py-2.5 text-sm focus:bg-red-500/15 focus:text-red-200", isEffectiveLight ? "text-slate-700" : "text-raw-silver/80")}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
