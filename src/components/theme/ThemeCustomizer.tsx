import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, MonitorCog } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/useTheme";
import { useRawStore } from "@/store/useRawStore";
import { spendTokens } from "@/lib/api/tokens";
import { supabase } from "@/lib/supabase";
import { ACCENT_PRESETS, type AccentPreset, type AccentPresetId } from "@/providers/theme-context";

interface ThemeCustomizerProps {
  placement?: "floating" | "inline";
  triggerStyle?: "icon" | "compact";
  accentAccess?: "unlockable" | "free";
  className?: string;
}

const ACCENT_UNLOCK_PRICE = 10;
const ACCENT_FREE_ID: AccentPresetId = "gold";
const OWNED_ACCENTS_CACHE_PREFIX = "raw.theme.accent.owned.v2.";
const ACCENT_PREVIEW_DURATION_MS = 60_000;

function cacheKey(userId: string): string {
  return `${OWNED_ACCENTS_CACHE_PREFIX}${userId}`;
}

function readOwnedAccentsCache(userId: string | undefined): AccentPresetId[] {
  if (!userId || typeof window === "undefined") return [ACCENT_FREE_ID];
  try {
    const raw = window.localStorage.getItem(cacheKey(userId));
    if (!raw) return [ACCENT_FREE_ID];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [ACCENT_FREE_ID];
    return Array.from(new Set([
      ACCENT_FREE_ID,
      ...parsed.filter((id): id is AccentPresetId => typeof id === "string"),
    ]));
  } catch {
    return [ACCENT_FREE_ID];
  }
}

function writeOwnedAccentsCache(userId: string | undefined, ids: AccentPresetId[]): void {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // localStorage may be unavailable; server remains the source of truth.
  }
}

export function ThemeCustomizer({
  placement = "floating",
  triggerStyle = "icon",
  accentAccess = "unlockable",
  className,
}: ThemeCustomizerProps) {
  const { accent, accentPresets, setAccent } = useTheme();
  const { user, tokenBalance, addTokens } = useRawStore();
  const isFloating = placement === "floating";
  const accentsAreFree = accentAccess === "free";
  const selectedAccent = accentPresets.find((preset) => preset.id === accent);

  const [ownedAccents, setOwnedAccents] = useState<AccentPresetId[]>(() =>
    readOwnedAccentsCache(user?.id),
  );
  const [unlocking, setUnlocking] = useState<AccentPresetId | null>(null);
  const [errorId, setErrorId] = useState<AccentPresetId | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<AccentPresetId | null>(null);
  const [previewingId, setPreviewingId] = useState<AccentPresetId | null>(null);
  const [previewPromptHidden, setPreviewPromptHidden] = useState(false);

  // Hydrate from Supabase whenever the signed-in user changes so unlocks
  // follow the account across devices and survive logout/login.
  useEffect(() => {
    if (!user?.id) {
      setOwnedAccents([ACCENT_FREE_ID]);
      return;
    }
    let cancelled = false;
    setOwnedAccents(readOwnedAccentsCache(user.id));
    void (async () => {
      const { data, error } = await supabase
        .from("user_accent_unlocks")
        .select("accent_id")
        .eq("user_id", user.id);
      if (cancelled || error || !data) return;
      const serverIds = data.map((row) => row.accent_id as AccentPresetId);
      const merged = Array.from(new Set([ACCENT_FREE_ID, ...serverIds]));
      setOwnedAccents(merged);
      writeOwnedAccentsCache(user.id, merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    writeOwnedAccentsCache(user?.id, ownedAccents);
  }, [ownedAccents, user?.id]);

  const ownedSet = useMemo(
    () => new Set(accentsAreFree ? accentPresets.map((preset) => preset.id) : ownedAccents),
    [accentPresets, accentsAreFree, ownedAccents],
  );

  const pendingPreset = useMemo<AccentPreset | null>(
    () => (pendingUnlock ? ACCENT_PRESETS.find((p) => p.id === pendingUnlock) ?? null : null),
    [pendingUnlock],
  );

  // Live-preview a locked accent by overriding the root CSS variables without
  // persisting state. Reverting just removes the inline overrides so the
  // ThemeProvider effect's values (driven by the current `accent`) take over.
  const applyAccentPreview = useCallback((preset: AccentPreset) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--raw-accent", preset.rgb);
    root.style.setProperty("--raw-accent-shadow", preset.shadowRgb);
    root.style.setProperty("--primary", preset.hsl);
    root.style.setProperty("--accent", preset.hsl);
    root.style.setProperty("--ring", preset.hsl);
    root.style.setProperty("--sidebar-primary", preset.hsl);
    root.style.setProperty("--sidebar-ring", preset.hsl);
  }, []);

  const clearAccentPreview = useCallback(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const current = ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS[0];
    root.style.setProperty("--raw-accent", current.rgb);
    root.style.setProperty("--raw-accent-shadow", current.shadowRgb);
    root.style.setProperty("--primary", current.hsl);
    root.style.setProperty("--accent", current.hsl);
    root.style.setProperty("--ring", current.hsl);
    root.style.setProperty("--sidebar-primary", current.hsl);
    root.style.setProperty("--sidebar-ring", current.hsl);
  }, [accent]);

  useEffect(() => {
    if (!previewingId) return;

    const timeoutId = window.setTimeout(() => {
      clearAccentPreview();
      setPreviewingId(null);
      setPreviewPromptHidden(false);
    }, ACCENT_PREVIEW_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [clearAccentPreview, previewingId]);

  const handleSelect = useCallback(
    (id: AccentPresetId) => {
      setErrorId(null);
      if (ownedSet.has(id)) {
        clearAccentPreview();
        setPreviewingId(null);
        setPreviewPromptHidden(false);
        setAccent(id);
        return;
      }
      setPreviewPromptHidden(false);
      setPendingUnlock(id);
    },
    [clearAccentPreview, ownedSet, setAccent],
  );

  const confirmUnlock = useCallback(async () => {
    const id = pendingUnlock;
    if (!id) return;
    if (!user?.id) {
      setErrorId(id);
      setPendingUnlock(null);
      setPreviewPromptHidden(false);
      clearAccentPreview();
      setPreviewingId(null);
      return;
    }
    if (tokenBalance < ACCENT_UNLOCK_PRICE) {
      setErrorId(id);
      setPendingUnlock(null);
      setPreviewPromptHidden(false);
      clearAccentPreview();
      setPreviewingId(null);
      return;
    }
    setUnlocking(id);
    try {
      await spendTokens(user.id, ACCENT_UNLOCK_PRICE);
      addTokens(-ACCENT_UNLOCK_PRICE);
      const { error: insertError } = await supabase
        .from("user_accent_unlocks")
        .upsert({ user_id: user.id, accent_id: id }, { onConflict: "user_id,accent_id" });
      if (insertError) {
        addTokens(ACCENT_UNLOCK_PRICE);
        setErrorId(id);
        return;
      }
      setOwnedAccents((prev) => Array.from(new Set([...prev, id])));
      setAccent(id);
      setPendingUnlock(null);
      setPreviewingId(null);
      setPreviewPromptHidden(false);
    } catch {
      setErrorId(id);
    } finally {
      setUnlocking(null);
    }
  }, [addTokens, clearAccentPreview, pendingUnlock, setAccent, tokenBalance, user?.id]);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        clearAccentPreview();
        setPreviewingId(null);
        setPendingUnlock(null);
        setPreviewPromptHidden(false);
      }
    },
    [clearAccentPreview],
  );

  const handlePreview = useCallback(() => {
    if (!pendingPreset) return;
    applyAccentPreview(pendingPreset);
    setPreviewingId(pendingPreset.id);
    setPreviewPromptHidden(true);
  }, [applyAccentPreview, pendingPreset]);

  return (
    <div
      className={cn(
        isFloating ? "pointer-events-none fixed bottom-5 right-5 z-[90]" : "pointer-events-auto",
        className,
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          {triggerStyle === "compact" ? (
            <button
              type="button"
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border border-raw-border/45 bg-raw-surface/90 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-raw-silver/80 backdrop-blur-xl transition-colors hover:bg-raw-surface",
                isFloating && "pointer-events-auto shadow-[0_18px_45px_rgb(var(--raw-black)/0.22)]",
              )}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-white/40"
                style={{ backgroundColor: selectedAccent ? `rgb(${selectedAccent.rgb})` : "rgb(var(--raw-accent))" }}
                aria-hidden="true"
              />
            </button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "rounded-2xl border border-raw-border/40 bg-raw-surface/90 text-raw-gold backdrop-blur-xl hover:bg-raw-surface",
                isFloating
                  ? "pointer-events-auto h-12 w-12 shadow-[0_18px_45px_rgb(var(--raw-black)/0.22)]"
                  : "h-10 w-10 shadow-[0_10px_24px_rgb(var(--raw-black)/0.2)]",
              )}
            >
              <MonitorCog className="h-5 w-5" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={12} className="w-[320px] rounded-3xl border border-raw-border/40 bg-raw-surface/95 p-0 text-raw-text shadow-2xl backdrop-blur-xl">
          <div className="border-b border-raw-border/25 px-5 py-4">
            <p className="font-display text-sm tracking-[0.18em] text-raw-text">Theme Studio</p>
            <p className="mt-2 text-xs leading-relaxed text-raw-silver/50">
              Change light or dark mode once and keep the same accent color across every page.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-raw-silver/45">Accent</p>
                  <p className="mt-1 text-sm text-raw-silver/65">
                    {accentsAreFree ? "Choose any accent color" : "Preview new colors for one minute, then choose whether to buy"}
                  </p>
                </div>
                <div className="rounded-full border border-raw-border/30 bg-raw-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-gold/80">
                  {selectedAccent?.label}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {accentPresets.map((preset) => {
                  const selected = preset.id === accent;
                  const owned = ownedSet.has(preset.id);
                  const isUnlocking = unlocking === preset.id;
                  const hasError = errorId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isUnlocking}
                      onClick={() => void handleSelect(preset.id)}
                      className={cn(
                        "group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl border transition-all",
                        selected
                          ? "border-raw-text shadow-[0_0_0_1px_rgb(var(--raw-text)/0.25)]"
                          : owned
                            ? "border-raw-border/35 hover:border-raw-silver/40"
                            : "border-raw-border/30 hover:border-raw-gold/55",
                        hasError && "ring-2 ring-red-500/60",
                        isUnlocking && "cursor-wait opacity-80",
                      )}
                      style={{ backgroundColor: `rgb(${preset.rgb})` }}
                      aria-label={owned ? `Use ${preset.label} accent` : `Preview or buy ${preset.label} accent`}
                      title={owned ? preset.label : `Preview ${preset.label} for one minute`}
                    >
                      {selected && owned && <Check className="h-4 w-4 text-raw-ink" />}
                    </button>
                  );
                })}
              </div>

              {errorId && (
                <p className="mt-3 text-[11px] text-red-300">
                  {user?.id
                    ? `Need ${ACCENT_UNLOCK_PRICE} tokens to unlock this color.`
                    : "Sign in to unlock more colors."}
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={pendingUnlock !== null && !previewPromptHidden} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-sm rounded-3xl border border-raw-border/40 bg-raw-surface/95 text-raw-text shadow-2xl backdrop-blur-xl">
          {pendingPreset && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span
                    className="h-12 w-12 rounded-2xl border border-white/20 shadow-[0_8px_22px_rgb(var(--raw-black)/0.35)]"
                    style={{ backgroundColor: `rgb(${pendingPreset.rgb})` }}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col">
                    <DialogTitle className="font-display text-base tracking-[0.16em]">
                      {pendingPreset.label} accent
                    </DialogTitle>
                    <DialogDescription className="text-xs text-raw-silver/60">
                      {previewingId === pendingPreset.id
                        ? "Previewing live for one minute. Confirm to unlock or close to revert."
                        : `Preview this theme for one minute, or unlock it for ${ACCENT_UNLOCK_PRICE} tokens.`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="rounded-2xl border border-raw-border/30 bg-raw-black/25 px-4 py-3 text-xs text-raw-silver/70">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-raw-silver/50">Your tokens</span>
                  <span className="font-semibold tabular-nums text-raw-text">{tokenBalance}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-raw-silver/50">Cost</span>
                  <span className="font-semibold tabular-nums text-raw-gold">{ACCENT_UNLOCK_PRICE}</span>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={previewingId === pendingPreset.id}
                  className="flex-1 rounded-full border-raw-border/50 bg-transparent text-raw-text hover:bg-raw-surface"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {previewingId === pendingPreset.id ? "Previewing" : "View"}
                </Button>
                <Button
                  type="button"
                  onClick={() => void confirmUnlock()}
                  disabled={
                    unlocking === pendingPreset.id ||
                    !user?.id ||
                    tokenBalance < ACCENT_UNLOCK_PRICE
                  }
                  className="flex-1 rounded-full bg-raw-gold text-raw-ink hover:bg-raw-gold/90"
                >
                  {unlocking === pendingPreset.id
                    ? "Unlocking…"
                    : !user?.id
                      ? "Sign in"
                      : tokenBalance < ACCENT_UNLOCK_PRICE
                        ? `Need ${ACCENT_UNLOCK_PRICE}`
                        : `Confirm · ${ACCENT_UNLOCK_PRICE}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
