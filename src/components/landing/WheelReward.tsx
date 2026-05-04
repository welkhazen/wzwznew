import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { LandingSectionShell } from "@/components/landing/LandingSectionShell";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { readDailySpinAvatarPool, type DailySpinAvatarPoolItem } from "@/lib/dailySpinAvatarPool";
import { AVATARS } from "@/lib/avataridentity";
import { useTheme } from "@/providers/useTheme";
import { useTrackSectionView } from "@/lib/analytics/useTrackSectionView";
import { track } from "@/lib/analytics";

const TRANSPARENT_REWARDS_IMAGE_SRC = "/images/avatar-rarity-chart.png";

type PoolEntry = { id: string; name: string; imageSrc: string };

function getPool(): PoolEntry[] {
  const spin = readDailySpinAvatarPool();
  if (spin.length > 0) return spin;
  return AVATARS.map((a, i) => ({ id: `avatar-${i + 1}`, name: a.name, imageSrc: a.imageSrc ?? "" }));
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

export function WheelReward({ onSignupClick }: WheelRewardProps) {
  const sectionRef = useTrackSectionView("final_cta");
  const { mode } = useTheme();
  const isLight = mode === "light";
  const [pool, setPool] = useState<PoolEntry[]>(getPool);
  const [hasSpun, setHasSpun] = useState(false);
  const [landedEntry, setLandedEntry] = useState<PoolEntry | null>(null);
  const [rewardsImageMissing, setRewardsImageMissing] = useState(false);

  useEffect(() => {
    function refresh() { setPool(getPool()); }
    window.addEventListener("raw:avatar-catalog-updated", refresh);
    return () => window.removeEventListener("raw:avatar-catalog-updated", refresh);
  }, []);

  const prizes = buildPrizes(pool, isLight);

  function handleSpinEnd(prize: WheelPrize) {
    const entry = pool.find((p) => p.id === prize.id) ?? pool[0];
    setLandedEntry(entry);
    setHasSpun(true);
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
                {landedEntry.name} unlocked
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-raw-text/75">
              Claim this avatar now as an early access gift from raW to you.
            </p>
            <button
              type="button"
              onClick={() => {
                track("landing_cta_clicked", { cta_id: "avatar_claim", cta_text: "Claim My Avatar", source_section: "wheel" });
                onSignupClick();
              }}
              className="mt-4 w-full rounded-full bg-raw-gold px-6 py-3 text-sm font-bold text-raw-black transition-all hover:bg-raw-gold/90 hover:shadow-lg hover:shadow-raw-gold/20"
            >
              Claim My Avatar
            </button>
          </div>
        )}
      </div>
    </LandingSectionShell>
  );
}
