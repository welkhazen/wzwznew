import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Lock, MonitorCog } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/useTheme";
import { useRawStore } from "@/store/useRawStore";
import { spendTokens } from "@/lib/api/tokens";
import { supabase } from "@/lib/supabase";
import type { AccentPresetId } from "@/providers/theme-context";

interface ThemeCustomizerProps {
  placement?: "floating" | "inline";
  triggerStyle?: "icon" | "compact";
  className?: string;
}

const ACCENT_UNLOCK_PRICE = 10;
const ACCENT_FREE_ID: AccentPresetId = "gold";
const OWNED_ACCENTS_CACHE_PREFIX = "raw.theme.accent.owned.v2.";

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

export function ThemeCustomizer({ placement = "floating", triggerStyle = "icon", className }: ThemeCustomizerProps) {
  const { accent, accentPresets, setAccent } = useTheme();
  const { user, tokenBalance, addTokens } = useRawStore();
  const isFloating = placement === "floating";
  const selectedAccent = accentPresets.find((preset) => preset.id === accent);

  const [ownedAccents, setOwnedAccents] = useState<AccentPresetId[]>(() =>
    readOwnedAccentsCache(user?.id),
  );
  const [unlocking, setUnlocking] = useState<AccentPresetId | null>(null);
  const [errorId, setErrorId] = useState<AccentPresetId | null>(null);

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

  const ownedSet = useMemo(() => new Set(ownedAccents), [ownedAccents]);

  const handleSelect = useCallback(
    async (id: AccentPresetId) => {
      setErrorId(null);
      if (ownedSet.has(id)) {
        setAccent(id);
        return;
      }
      if (!user?.id) {
        setErrorId(id);
        return;
      }
      if (tokenBalance < ACCENT_UNLOCK_PRICE) {
        setErrorId(id);
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
          // Server persist failed — refund the locally tracked tokens so the user
          // can retry without being silently overcharged.
          addTokens(ACCENT_UNLOCK_PRICE);
          setErrorId(id);
          return;
        }
        setOwnedAccents((prev) => Array.from(new Set([...prev, id])));
        setAccent(id);
      } catch {
        setErrorId(id);
      } finally {
        setUnlocking(null);
      }
    },
    [addTokens, ownedSet, setAccent, tokenBalance, user?.id],
  );

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
                  <p className="mt-1 text-sm text-raw-silver/65">Unlock new colors for {ACCENT_UNLOCK_PRICE} tokens each</p>
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
                  const canAfford = tokenBalance >= ACCENT_UNLOCK_PRICE;

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
                      aria-label={
                        owned
                          ? `Use ${preset.label} accent`
                          : `Unlock ${preset.label} accent for ${ACCENT_UNLOCK_PRICE} tokens`
                      }
                      title={
                        owned
                          ? preset.label
                          : canAfford
                            ? `Unlock ${preset.label} · ${ACCENT_UNLOCK_PRICE} tokens`
                            : `Need ${ACCENT_UNLOCK_PRICE} tokens to unlock ${preset.label}`
                      }
                    >
                      {selected && owned && <Check className="h-4 w-4 text-raw-ink" />}

                      {!owned && (
                        <span
                          className={cn(
                            "absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px] transition",
                            isUnlocking ? "opacity-100" : "group-hover:bg-black/45",
                          )}
                        >
                          <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-raw-gold shadow-[0_0_0_1px_rgb(var(--raw-accent)/0.4)]">
                            <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                            <span className="tabular-nums">{ACCENT_UNLOCK_PRICE}</span>
                          </span>
                        </span>
                      )}
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
    </div>
  );
}
