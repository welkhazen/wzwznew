import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { useTheme } from "@/providers/useTheme";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { track } from "@/lib/analytics";
import { LANDING_WHEEL_SPIN_KEY } from "@/lib/avatarCatalog";

const TRANSPARENT_REWARDS_IMAGE_SRC = "/images/avatar-rarity-chart.png";

type PoolEntry = { id: string; avatarId: string; name: string; imageSrc: string };

const WHEEL_REWARD_POOL: readonly PoolEntry[] = [
  { id: "wheel-avatar-1", avatarId: "silver-void", name: "Silver Void", imageSrc: "/avatars/1.webp" },
  { id: "wheel-avatar-2", avatarId: "neon-lynx", name: "Neon Lynx", imageSrc: "/avatars/2.webp" },
  { id: "wheel-avatar-3", avatarId: "blue-signal", name: "Blue Signal", imageSrc: "/avatars/3.webp" },
  { id: "wheel-avatar-4", avatarId: "violet-mask", name: "Violet Mask", imageSrc: "/avatars/04.webp" },
  { id: "wheel-avatar-5", avatarId: "horned-iron", name: "Viozen", imageSrc: "/avatars/5.png" },
  { id: "wheel-avatar-6", avatarId: "crimson-muse", name: "Crimson Muse", imageSrc: "/avatars/6.webp" },
  { id: "wheel-avatar-7", avatarId: "solar-flame", name: "Solar Flame", imageSrc: "/avatars/07.webp" },
  { id: "wheel-avatar-8", avatarId: "pink-circuit", name: "Pink Circuit", imageSrc: "/avatars/08.webp" },
];

function getPool(): PoolEntry[] {
  return WHEEL_REWARD_POOL.map((entry) => ({ ...entry }));
}

function readStoredSpin(pool: PoolEntry[]): PoolEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LANDING_WHEEL_SPIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prizeId?: unknown };
    if (typeof parsed.prizeId !== "string") return null;
    return pool.find((entry) => entry.id === parsed.prizeId) ?? null;
  } catch {
    return null;
  }
}

function writeStoredSpin(entry: PoolEntry): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANDING_WHEEL_SPIN_KEY, JSON.stringify({ prizeId: entry.id, avatarId: entry.avatarId, spunAt: Date.now() }));
}

function shouldResetStoredSpinForTesting(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const [navigation] = window.performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return navigation?.type === "reload";
}

function buildPrizes(pool: PoolEntry[], isLight: boolean): WheelPrize[] {
  return pool.map((entry, i) => ({
    id: entry.id,
    label: entry.name,
    shortLabel: entry.name.split(" ")[0].toUpperCase(),
    imageSrc: entry.imageSrc || undefined,
    color: isLight
      ? i % 2 === 0 ? "#e8edf5" : "#dde4ef"
      : i % 2 === 0 ? "#121212" : "#0e0e0e",
    textColor: "#F1C42D",
  }));
}

interface WheelRewardProps {
  onSignupClick: () => void;
}

/**
 * Inline variant: renders the wheel + result banner with NO section header
 * or outer LandingSectionShell, so callers can embed it inside another section.
 */
export function WheelRewardInline({ onSignupClick }: WheelRewardProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [pool, setPool] = useState<PoolEntry[]>(getPool);
  const [landedEntry, setLandedEntry] = useState<PoolEntry | null>(() => {
    if (shouldResetStoredSpinForTesting()) {
      window.localStorage.removeItem(LANDING_WHEEL_SPIN_KEY);
      return null;
    }
    return readStoredSpin(getPool());
  });
  const [rewardsImageMissing, setRewardsImageMissing] = useState(false);
  const hasSpun = Boolean(landedEntry);

  useEffect(() => {
    function refresh() {
      const nextPool = getPool();
      setPool(nextPool);
      setLandedEntry((current) => current ?? readStoredSpin(nextPool));
    }
    window.addEventListener("raw:avatar-catalog-updated", refresh);
    return () => window.removeEventListener("raw:avatar-catalog-updated", refresh);
  }, []);

  const prizes = buildPrizes(pool, isLight);

  function handleSpinEnd(prize: WheelPrize) {
    const entry = pool.find((p) => p.id === prize.id) ?? pool[0];
    setLandedEntry(entry);
    writeStoredSpin(entry);
    track("landing_cta_clicked", { cta_id: "wheel_spin", cta_text: "Spin", source_section: "wheel" });
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-10">
      <WheelOfFortune prizes={prizes} onSpinEnd={handleSpinEnd} disabled={hasSpun} />

      {!rewardsImageMissing ? (
        <img
          src={TRANSPARENT_REWARDS_IMAGE_SRC}
          alt="Avatar rarity chart"
          className={`w-full max-w-5xl object-contain ${isLight ? "opacity-80" : "mix-blend-screen"}`}
          onError={() => setRewardsImageMissing(true)}
        />
      ) : null}

      {landedEntry && (
        <div className={`w-full max-w-md rounded-2xl border p-4 text-center transition-all duration-500 sm:p-5 ${
          isLight
            ? "border-raw-gold/40 bg-gradient-to-b from-raw-gold/[0.12] to-raw-gold/[0.04]"
            : "border-raw-gold/30 bg-gradient-to-b from-raw-gold/[0.08] to-raw-gold/[0.02]"
        }`}>
          <div className="mb-2 flex items-center justify-center gap-2">
            {landedEntry.imageSrc ? (
              <img src={landedEntry.imageSrc} alt={landedEntry.name} className="h-8 w-8 rounded-full object-cover" />
            ) : null}
            <Sparkles className="h-4 w-4 text-raw-gold" />
            <span className="font-display text-sm tracking-wide text-raw-gold">
              You won {landedEntry.name}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-raw-text/75">
            You won this cool avatar from raW's early access wheel.
          </p>
          <button
            type="button"
            onClick={onSignupClick}
            className="mt-4 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-gold/85 transition hover:bg-raw-gold/15"
          >
            Sign up to claim it
          </button>
        </div>
      )}
    </div>
  );
}

export function WheelReward({ onSignupClick }: WheelRewardProps) {
  const sectionRef = useTrackSectionView("final_cta");
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [pool, setPool] = useState<PoolEntry[]>(getPool);
  const [landedEntry, setLandedEntry] = useState<PoolEntry | null>(() => {
    if (shouldResetStoredSpinForTesting()) {
      window.localStorage.removeItem(LANDING_WHEEL_SPIN_KEY);
      return null;
    }
    return readStoredSpin(getPool());
  });
  const [rewardsImageMissing, setRewardsImageMissing] = useState(false);
  const hasSpun = Boolean(landedEntry);

  useEffect(() => {
    function refresh() {
      const nextPool = getPool();
      setPool(nextPool);
      setLandedEntry((current) => current ?? readStoredSpin(nextPool));
    }
    window.addEventListener("raw:avatar-catalog-updated", refresh);
    return () => window.removeEventListener("raw:avatar-catalog-updated", refresh);
  }, []);

  const prizes = buildPrizes(pool, isLight);

  function handleSpinEnd(prize: WheelPrize) {
    const entry = pool.find((p) => p.id === prize.id) ?? pool[0];
    setLandedEntry(entry);
    writeStoredSpin(entry);
    track("landing_cta_clicked", { cta_id: "wheel_spin", cta_text: "Spin", source_section: "wheel" });
  }

  return (
    <LandingSectionShell
      id="wheel"
      sectionRef={sectionRef as React.Ref<HTMLElement>}
      eyebrow="Early Access Reward"
      title="Spin the wheel to claim your avatar."
      description="One spin, one avatar — yours as an early access gift from raW."
    >
      <div className="flex flex-col items-center gap-6 sm:gap-10">
        <WheelOfFortune prizes={prizes} onSpinEnd={handleSpinEnd} disabled={hasSpun} />

        {!rewardsImageMissing ? (
          <img
            src={TRANSPARENT_REWARDS_IMAGE_SRC}
            alt="Avatar rarity chart"
            className={`w-full max-w-5xl object-contain ${isLight ? "opacity-80" : "mix-blend-screen"}`}
            onError={() => setRewardsImageMissing(true)}
          />
        ) : null}

        {landedEntry && (
          <div className={`w-full max-w-md rounded-2xl border p-4 text-center transition-all duration-500 sm:p-5 ${
            isLight
              ? "border-raw-gold/40 bg-gradient-to-b from-raw-gold/[0.12] to-raw-gold/[0.04]"
              : "border-raw-gold/30 bg-gradient-to-b from-raw-gold/[0.08] to-raw-gold/[0.02]"
          }`}>
            <div className="mb-2 flex items-center justify-center gap-2">
              {landedEntry.imageSrc ? (
                <img src={landedEntry.imageSrc} alt={landedEntry.name} className="h-8 w-8 rounded-full object-cover" />
              ) : null}
              <Sparkles className="h-4 w-4 text-raw-gold" />
              <span className="font-display text-sm tracking-wide text-raw-gold">
                You won {landedEntry.name}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-raw-text/75">
              You won this cool avatar from raW's early access wheel.
            </p>
            <button
              type="button"
              onClick={onSignupClick}
              className="mt-4 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-5 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-raw-gold/85 transition hover:bg-raw-gold/15"
            >
              Sign up to claim it
            </button>
          </div>
        )}
      </div>
    </LandingSectionShell>
  );
}
