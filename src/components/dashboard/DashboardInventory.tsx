import { useState } from "react";
import { Archive, Lock, Sparkles } from "lucide-react";
import { RawInsightsPanel } from "@/components/dashboard/insights/RawInsightsPanel";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { RARITY_CONFIG, RARITY_ORDER } from "@/lib/avatarRarity";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import type { Poll } from "@/store/useRawStore";
import TokenImage from "@/assets/tokens.png";

interface DashboardInventoryProps {
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  avatarPricesByLevel: Record<number, string>;
  avatarCatalog: AvatarCatalogItem[];
  tokenBalance: number;
  userId: string;
}

// ─── Avatar Shop ────────────────────────────────────────────────────────────

function AvatarShop({
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  avatarPricesByLevel,
}: Pick<DashboardInventoryProps, "avatarCatalog" | "ownedAvatarLevels" | "onUnlockAvatar" | "avatarPricesByLevel">) {
  const [unlocking, setUnlocking] = useState<number | null>(null);

  const purchasable = avatarCatalog.filter(
    (a) => a.price !== "Free" && a.price !== "0" && Number(a.price) > 0
  );

  if (purchasable.length === 0) {
    return (
      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
        No paid avatars in catalog yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {purchasable.map((avatar) => {
        const owned = ownedAvatarLevels.has(avatar.level);
        const price = avatarPricesByLevel[avatar.level] ?? avatar.price;
        const rarity = avatar.rarity ?? "common";
        const rarityConfig = RARITY_CONFIG[rarity];

        return (
          <div
            key={avatar.id}
            className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-raw-border/35 bg-raw-black/45 p-3 transition-all"
            style={owned ? { borderColor: `${rarityConfig.color}40` } : {}}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />

            <div className="relative">
              <AvatarFigure avatarIndex={avatar.level} size="md" selected={owned} rarity={rarity} />
            </div>

            <div className="relative text-center">
              <p className="text-xs font-medium text-raw-text line-clamp-1">{avatar.name}</p>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: rarityConfig.color }}
              >
                {rarityConfig.label}
              </p>
            </div>

            {owned ? (
              <span className="relative rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300">
                Owned
              </span>
            ) : (
              <button
                onClick={async () => {
                  setUnlocking(avatar.level);
                  await onUnlockAvatar(avatar.level).catch(() => null);
                  setUnlocking(null);
                }}
                disabled={unlocking === avatar.level}
                className="relative flex items-center gap-1.5 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[10px] text-raw-gold transition hover:bg-raw-gold/20 disabled:opacity-50"
              >
                <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
                {unlocking === avatar.level ? "..." : price}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Loot Spin ───────────────────────────────────────────────────────────────

const SPIN_COST = 50;
const SPIN_PRIZES = RARITY_ORDER.map((r) => ({
  rarity: r,
  label: RARITY_CONFIG[r].label,
  color: RARITY_CONFIG[r].color,
  glow: RARITY_CONFIG[r].glow,
  weight: RARITY_CONFIG[r].defaultWeight,
}));

function weightedRoll() {
  const total = SPIN_PRIZES.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;
  for (const prize of SPIN_PRIZES) {
    rand -= prize.weight;
    if (rand <= 0) return prize;
  }
  return SPIN_PRIZES[0];
}

function LootSpin({ tokenBalance }: { tokenBalance: number }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<(typeof SPIN_PRIZES)[number] | null>(null);
  const [slots, setSlots] = useState<(typeof SPIN_PRIZES)[number][]>([
    SPIN_PRIZES[0], SPIN_PRIZES[0], SPIN_PRIZES[0],
  ]);

  const canSpin = tokenBalance >= SPIN_COST && !spinning;

  const handleSpin = () => {
    if (!canSpin) return;
    setSpinning(true);
    setResult(null);

    let tick = 0;
    const interval = window.setInterval(() => {
      setSlots([
        SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)],
        SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)],
        SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)],
      ]);
      tick++;
      if (tick >= 20) {
        clearInterval(interval);
        const prize = weightedRoll();
        setSlots([prize, prize, prize]);
        setResult(prize);
        setSpinning(false);
      }
    }, 80);
  };

  return (
    <div className="rounded-2xl border border-raw-border/35 bg-raw-black/45 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-raw-gold/60" />
        <h3 className="font-display text-sm tracking-wide text-raw-text">Rarity Roll</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-raw-border/35 bg-raw-black/50 px-2.5 py-1 text-[10px] text-raw-silver/50">
          <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
          {SPIN_COST} per spin
        </span>
      </div>

      {/* Slot display */}
      <div className="mb-4 flex items-center justify-center gap-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="flex h-16 w-16 items-center justify-center rounded-xl border text-xl font-bold transition-all duration-75"
            style={{
              borderColor: `${slot.color}50`,
              background: `${slot.glow}22`,
              color: slot.color,
              boxShadow: spinning ? `0 0 12px ${slot.glow}` : "none",
            }}
          >
            {slot.label.slice(0, 2)}
          </div>
        ))}
      </div>

      {result && !spinning && (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-center text-sm font-semibold"
          style={{ borderColor: `${result.color}50`, color: result.color, background: `${result.glow}18` }}
        >
          {result.label} Rarity Drop!
        </div>
      )}

      <button
        onClick={handleSpin}
        disabled={!canSpin}
        className="w-full rounded-xl border border-raw-gold/35 bg-raw-gold/10 py-2.5 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {spinning ? "Rolling..." : tokenBalance < SPIN_COST ? (
          <span className="flex items-center justify-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Need {SPIN_COST} tokens
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <img src={TokenImage} alt="" className="h-4 w-4 object-contain" />
            Roll for {SPIN_COST} tokens
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardInventory({
  polls,
  votedPolls,
  avatarLevel,
  ownedAvatarLevels,
  onUnlockAvatar,
  avatarPricesByLevel,
  avatarCatalog,
  tokenBalance,
}: DashboardInventoryProps) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          <Archive className="h-5 w-5 text-raw-gold/60" />
          Inventory
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Your insights, collectible avatars, and loot rolls.
        </p>
      </header>

      {/* Personality Insights */}
      <section>
        <RawInsightsPanel
          polls={polls}
          votedPolls={votedPolls}
          votedOptions={{}}
          avatarLevel={avatarLevel}
          purchasedInsightIds={new Set()}
          onPurchaseInsight={() => {}}
        />
      </section>

      {/* Avatar Shop */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Avatar Shop</h2>
        <AvatarShop
          avatarCatalog={avatarCatalog}
          ownedAvatarLevels={ownedAvatarLevels}
          onUnlockAvatar={onUnlockAvatar}
          avatarPricesByLevel={avatarPricesByLevel}
        />
      </section>

      {/* Loot Spin */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Loot Roll</h2>
        <LootSpin tokenBalance={tokenBalance} />
      </section>
    </div>
  );
}
