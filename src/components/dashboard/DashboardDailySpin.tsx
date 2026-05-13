import { useCallback, useEffect, useMemo, useState } from "react";
import { Gift, Sparkles, Star, Zap, Clock } from "lucide-react";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { useTheme } from "@/providers/useTheme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTodayKey } from "@/store/useRawStore.storage";
import {
  loadDailySpinPoolFromSupabase,
  readDailySpinAvatarPool,
  type DailySpinAvatarPoolItem,
} from "@/lib/dailySpinAvatarPool";

interface DashboardDailySpinProps {
  userId: string;
  isAdmin?: boolean;
  onAwardXP?: (amount: number) => Promise<void>;
}

function toRgba(rgbSpaceSeparated: string, alpha: number): string {
  const [r, g, b] = rgbSpaceSeparated.split(" ").map((value) => Number(value));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildSpinPrizes(mode: "light" | "dark", accentRgb: string): WheelPrize[] {
  const isLight = mode === "light";
  const neutralA = isLight ? "#c9d7ea" : "#1d2533";
  const neutralB = isLight ? "#b8c7dc" : "#131b29";
  const neutralText = isLight ? "#223247" : "#d7e1f2";
  const missText = isLight ? "#4e5f78" : "#6f7d93";
  const accentSoft = toRgba(accentRgb, isLight ? 0.28 : 0.24);
  const accentStrong = toRgba(accentRgb, isLight ? 0.38 : 0.32);

  return [
    { id: "xp-50", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
    { id: "try-1", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-100", label: "100 XP", shortLabel: "100 XP", color: accentSoft, textColor: neutralText },
    { id: "try-2", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-200", label: "200 XP", shortLabel: "200 XP", color: accentStrong, textColor: neutralText },
    { id: "try-3", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "theme", label: "Avatar Theme", shortLabel: "THEME", color: accentStrong, textColor: neutralText },
    { id: "xp-50b", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
    { id: "try-4", label: "Try Again", shortLabel: "TRY AGAIN", color: neutralB, textColor: missText },
    { id: "xp-500", label: "500 XP Jackpot!", shortLabel: "500 XP", color: isLight ? "#efd98f" : "#1a1508", textColor: isLight ? "#6f4e00" : "#F1C42D" },
    { id: "xp-100b", label: "100 XP", shortLabel: "100 XP", color: accentSoft, textColor: neutralText },
    { id: "xp-50c", label: "50 XP", shortLabel: "50 XP", color: neutralA, textColor: neutralText },
  ];
}

const PRIZE_WEIGHTS: Partial<Record<string, number>> = {
  "xp-500": 0.01,
  "try-1": 0.15,
  "try-2": 0.15,
  "try-3": 0.15,
  "try-4": 0.15,
  "xp-50": 0.10,
  "xp-50b": 0.10,
  "xp-50c": 0.10,
  "xp-100": 0.06,
  "xp-100b": 0.06,
  "xp-200": 0.04,
  theme: 0.03,
};

const prizeMessages: Record<string, { title: string; desc: string; icon: typeof Gift; poolLabel: string; rarity: string; poolColor: string }> = {
  "xp-50": { title: "50 XP Earned!", desc: "Every bit counts on your journey.", icon: Zap, poolLabel: "50 XP", rarity: "Common", poolColor: "text-raw-silver/50" },
  "xp-50b": { title: "50 XP Earned!", desc: "Every bit counts on your journey.", icon: Zap, poolLabel: "50 XP", rarity: "Common", poolColor: "text-raw-silver/50" },
  "xp-100": { title: "100 XP Earned!", desc: "Solid spin! Your avatar grows stronger.", icon: Star, poolLabel: "100 XP", rarity: "Common", poolColor: "text-raw-gold/60" },
  "xp-100b": { title: "100 XP Earned!", desc: "Solid spin! Your avatar grows stronger.", icon: Star, poolLabel: "100 XP", rarity: "Common", poolColor: "text-raw-gold/60" },
  "xp-200": { title: "200 XP Earned!", desc: "Big win! You're leveling up fast.", icon: Sparkles, poolLabel: "200 XP", rarity: "Rare", poolColor: "text-raw-gold/80" },
  "xp-500": { title: "500 XP Jackpot!", desc: "Incredible! The wheel favors the bold.", icon: Gift, poolLabel: "500 XP", rarity: "Jackpot", poolColor: "text-raw-gold" },
  theme: { title: "Avatar Theme Unlocked!", desc: "A new look awaits you in the Marketplace.", icon: Gift, poolLabel: "Avatar Theme", rarity: "Rare", poolColor: "text-raw-gold/80" },
  "try-1": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock, poolLabel: "Try Again", rarity: "Miss", poolColor: "text-raw-silver/45" },
  "try-2": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock, poolLabel: "Try Again", rarity: "Miss", poolColor: "text-raw-silver/45" },
  "try-3": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock, poolLabel: "Try Again", rarity: "Miss", poolColor: "text-raw-silver/45" },
  "try-4": { title: "Not This Time", desc: "The wheel will turn again tomorrow.", icon: Clock, poolLabel: "Try Again", rarity: "Miss", poolColor: "text-raw-silver/45" },
  "xp-50c": { title: "50 XP Earned!", desc: "Every bit counts on your journey.", icon: Zap, poolLabel: "50 XP", rarity: "Common", poolColor: "text-raw-silver/50" },
};

export function DashboardDailySpin({ userId, isAdmin = false, onAwardXP }: DashboardDailySpinProps) {
  const { mode, accent, accentPresets } = useTheme();
  const storageKey = useMemo(() => `raw.daily-spin.${userId}`, [userId]);
  const accentRgb = useMemo(
    () => accentPresets.find((preset) => preset.id === accent)?.rgb ?? "241 196 45",
    [accent, accentPresets],
  );
  const prizes = useMemo(() => buildSpinPrizes(mode, accentRgb), [accentRgb, mode]);
  const adminRewardOptions = useMemo(
    () => [
      { id: "random", label: "Random (weighted)" },
      { id: "xp-50", label: "50 XP" },
      { id: "xp-100", label: "100 XP" },
      { id: "xp-200", label: "200 XP" },
      { id: "xp-500", label: "500 XP Jackpot" },
      { id: "theme", label: "Avatar Theme" },
      { id: "try-1", label: "Try Again" },
    ],
    [],
  );
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return false;
      const parsed = JSON.parse(stored) as { date: string };
      return parsed.date === getTodayKey();
    } catch {
      return false;
    }
  });
  const [countdown, setCountdown] = useState("");
  const [prizeModal, setPrizeModal] = useState<WheelPrize | null>(null);
  const [adminSelectedRewardId, setAdminSelectedRewardId] = useState<string>("random");
  const [themeRewardAvatar, setThemeRewardAvatar] = useState<DailySpinAvatarPoolItem | null>(null);
  const [themeRewardPool, setThemeRewardPool] = useState<DailySpinAvatarPoolItem[]>(() => readDailySpinAvatarPool());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextKey = getTodayKey();
      setTodayKey((previous) => (previous === nextKey ? previous : nextKey));
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setHasSpunToday(false);
    setSelectedRewardId(null);
  }, [todayKey, userId]);

  useEffect(() => {
    loadDailySpinPoolFromSupabase()
      .then((items) => setThemeRewardPool(items))
      .catch(() => setThemeRewardPool(readDailySpinAvatarPool()));
  }, []);

  const updateCountdown = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
  }, []);

  useEffect(() => {
    if (!hasSpunToday) return;
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [hasSpunToday, updateCountdown]);

  const selectedPrize = prizes.find((prize) => prize.id === selectedRewardId) ?? null;

  const handleSpinEnd = (prize: WheelPrize) => {
    if (prize.id === "theme") {
      const pool = themeRewardPool.length > 0 ? themeRewardPool : readDailySpinAvatarPool();
      if (pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        setThemeRewardAvatar(pool[randomIndex]);
      } else {
        setThemeRewardAvatar(null);
      }
    } else {
      setThemeRewardAvatar(null);
    }

    setSelectedRewardId(prize.id);
    setHasSpunToday(true);
    setPrizeModal(prize);
    try { localStorage.setItem(storageKey, JSON.stringify({ date: getTodayKey() })); } catch { /* noop */ }

    const xpMatch = prize.id.match(/^xp-(\d+)/);
    if (xpMatch && onAwardXP) {
      void onAwardXP(parseInt(xpMatch[1], 10));
    }
  };

  const selectedMessage = selectedPrize ? prizeMessages[selectedPrize.id] : null;
  const modalMessage = prizeModal ? prizeMessages[prizeModal.id] : null;
  const jackpotCoins = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: index,
        left: (index * 37) % 100,
        delay: (index % 8) * 0.2,
        duration: 3 + (index % 5) * 0.35,
        size: 9 + (index % 4) * 4,
      })),
    [],
  );
  const ModalIcon = modalMessage?.icon ?? Gift;
  const isWin = prizeModal ? !prizeModal.id.startsWith("try") : false;
  const isJackpot = prizeModal?.id === "xp-500";
  const isSpinDisabled = !isAdmin && hasSpunToday;
  const forcedPrizeId = isAdmin && adminSelectedRewardId !== "random" ? adminSelectedRewardId : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <p className="mb-2 font-display text-[10px] uppercase tracking-[0.28em] text-raw-gold/50 sm:mb-3 sm:tracking-[0.3em]">
          Daily Reward
        </p>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl md:text-3xl">Wheel of Fortune</h1>
        <p className="mx-auto mt-2 max-w-md text-xs text-raw-silver/40 sm:mt-3 sm:text-sm">
          Spin once daily for a chance to earn XP, avatar themes, streak shields, and more.
        </p>
      </div>

      {isAdmin && (
        <div className="mx-auto flex w-full max-w-md flex-col gap-2 rounded-2xl border border-raw-border/45 bg-raw-surface/35 p-3">
          <p className="text-center text-[10px] font-display uppercase tracking-[0.18em] text-raw-gold/70">Admin Test Controls</p>
          <label className="text-xs text-raw-silver/60" htmlFor="admin-spin-reward-select">Force next reward</label>
          <select
            id="admin-spin-reward-select"
            value={adminSelectedRewardId}
            onChange={(event) => setAdminSelectedRewardId(event.target.value)}
            className="w-full rounded-lg border border-raw-border/55 bg-raw-black/55 px-3 py-2 text-sm text-raw-text outline-none transition-colors focus:border-raw-gold/60"
          >
            {adminRewardOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        className={`rounded-2xl border p-4 sm:rounded-[2rem] sm:p-6 md:p-8 ${
          mode === "light"
            ? "border-raw-border/70 bg-[radial-gradient(circle_at_50%_10%,rgba(241,196,45,0.2),rgba(224,231,242,0.96)_58%)]"
            : "border-raw-border/35 bg-[radial-gradient(circle_at_50%_10%,rgba(241,196,45,0.08),rgba(0,0,0,0.8)_48%)]"
        }`}
      >
        <div className="flex justify-center pt-2">
          <WheelOfFortune
            prizes={prizes}
            onSpinEnd={handleSpinEnd}
            disabled={isSpinDisabled}
            prizeWeights={PRIZE_WEIGHTS}
            forcedPrizeId={forcedPrizeId}
            radius={160}
          />
        </div>
      </div>

      {hasSpunToday && selectedPrize && selectedMessage && (
        <div className="mx-auto max-w-sm rounded-2xl border border-raw-border/40 bg-raw-surface/40 p-5 text-center">
          <p className="mb-1 text-xs text-raw-silver/40">Today&apos;s Result</p>
          <p className="font-display text-sm tracking-wide text-raw-gold">{selectedMessage.title}</p>
          {isAdmin ? (
            <p className="mt-2 text-xs text-raw-silver/30">Admin test mode: spin infinitely and force rewards one by one.</p>
          ) : (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-raw-silver/35">Next spin in</p>
              <p className="mt-1 font-display text-2xl tracking-widest text-raw-gold/90">{countdown}</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!prizeModal} onOpenChange={() => setPrizeModal(null)}>
        {isJackpot && <div className="jackpot-screen-flash pointer-events-none fixed inset-0 z-[45]" />}
        {isJackpot && (
          <div className="pointer-events-none fixed inset-0 z-[49] overflow-hidden">
            {jackpotCoins.map((coin) => (
              <span
                key={coin.id}
                className="jackpot-coin"
                style={{
                  left: `${coin.left}%`,
                  animationDelay: `${coin.delay}s`,
                  animationDuration: `${coin.duration}s`,
                  width: `${coin.size}px`,
                  height: `${coin.size}px`,
                }}
              />
            ))}
          </div>
        )}
        <DialogContent className="z-[60] border-raw-border/40 bg-raw-black/95 backdrop-blur-xl sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                isWin ? "bg-raw-gold/15 shadow-[0_0_30px_rgba(241,196,45,0.2)]" : "bg-raw-surface"
              }`}
            >
              {modalMessage && <ModalIcon className={`h-8 w-8 ${isWin ? "text-raw-gold" : "text-raw-silver/40"}`} />}
            </div>
            <DialogTitle className={`font-display text-xl tracking-wide ${isWin ? "text-raw-gold" : "text-raw-silver/60"}`}>
              {modalMessage?.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-raw-silver/40">
              {modalMessage?.desc}
            </DialogDescription>
            {prizeModal?.id === "theme" && themeRewardAvatar && (
              <div className="mt-3 rounded-xl border border-raw-gold/25 bg-raw-gold/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-raw-gold/85">Pulled from daily spin pool</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <img
                    src={themeRewardAvatar.imageSrc}
                    alt={themeRewardAvatar.name}
                    className="h-10 w-10 rounded-lg border border-raw-gold/35 object-cover"
                  />
                  <p className="text-xs text-raw-text">{themeRewardAvatar.name}</p>
                </div>
              </div>
            )}
            {prizeModal?.id === "theme" && !themeRewardAvatar && (
              <p className="mt-2 text-xs text-raw-silver/45">
                No daily spin avatars in pool yet. Add some from Admin by setting target to Daily spin.
              </p>
            )}
          </DialogHeader>
          <button
            onClick={() => setPrizeModal(null)}
            className={`mt-4 w-full rounded-full py-3 text-sm font-display uppercase tracking-[0.15em] transition-all ${
              isWin
                ? "bg-raw-gold text-raw-black hover:bg-raw-gold/90"
                : "border border-raw-border/40 text-raw-silver/50 hover:bg-raw-surface/50"
            } ${isJackpot ? "jackpot-claim-button" : ""}`}
          >
            {isWin ? "Claim" : "Close"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
