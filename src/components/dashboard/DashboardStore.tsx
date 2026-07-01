import { Suspense, lazy, useEffect, useState } from "react";
import { Store, Wand2 } from "lucide-react";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { fetchRankSupplyCounts } from "@/lib/avatarCatalog";
import { RANK_TIERS, RANK_TIER_PRICING } from "@/lib/avatarRarity";
import { AVATAR_RANK_LABELS } from "@/lib/avatarRank";
import { AvatarCustomRequestModal } from "@/components/dashboard/AvatarCustomRequestModal";
import TokenImage from "@/assets/tokens.webp";

const AvatarShop = lazy(() =>
  import("@/components/dashboard/DashboardInventory").then((m) => ({ default: m.AvatarShop }))
);
const LootSpin = lazy(() =>
  import("@/components/dashboard/DashboardInventory").then((m) => ({ default: m.LootSpin }))
);

interface DashboardStoreProps {
  avatarCatalog: AvatarCatalogItem[];
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  onAvatarPurchased: (level: number) => void;
  avatarPricesByLevel: Record<number, string>;
  tokenBalance: number;
  userId: string;
  userName: string;
}

export function DashboardStore({
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  onAvatarPurchased,
  avatarPricesByLevel,
  tokenBalance,
  userId,
  userName,
}: DashboardStoreProps) {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [supplyCounts, setSupplyCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchRankSupplyCounts(avatarCatalog)
      .then(setSupplyCounts)
      .catch(() => {});
  }, [avatarCatalog]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          <Store className="h-5 w-5 text-raw-gold/60" />
          Store
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Buy avatars and identity reports, or spin for rarity rewards. Owned items live in your Inventory.
        </p>
      </header>

      {/* Rank Pricing Legend */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Rank Tiers</h2>
        <div className="overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-black/40">
          <div className="grid grid-cols-4 border-b border-raw-border/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-raw-silver/40">
            <span>Rank</span>
            <span>Rarity</span>
            <span className="text-center">Price</span>
            <span className="text-right">Supply</span>
          </div>
          {RANK_TIERS.map((tier) => {
            const pricing = RANK_TIER_PRICING[tier.rank];
            const label = AVATAR_RANK_LABELS[tier.rank] ?? `R${tier.rank}`;
            const isC1 = tier.rank === 12;
            return (
              <div
                key={tier.rank}
                className="grid grid-cols-4 items-center border-b border-raw-border/10 px-4 py-2.5 last:border-0"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full${tier.rank === 10 ? " ring-1 ring-slate-400/60" : ""}`}
                    style={{ backgroundColor: tier.color, boxShadow: `0 0 5px ${tier.color}` }}
                  />
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: tier.rank === 10 ? "#94a3b8" : tier.color }}
                  >
                    R{tier.rank}
                  </span>
                </span>
                <span className="text-[11px] text-raw-silver/60">{label}</span>
                {isC1 ? (
                  <span className="col-span-2 flex justify-end">
                    <button
                      onClick={() => setRequestModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[10px] text-raw-gold transition hover:bg-raw-gold/20"
                    >
                      <Wand2 className="h-3 w-3" />
                      Request Design
                    </button>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center justify-center gap-1 text-[11px] font-semibold text-raw-gold">
                      <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
                      {pricing.price.toLocaleString()}
                    </span>
                    <span className="text-right text-[11px]">
                      {pricing.maxOwners === null ? (
                        <span className="text-raw-silver/50">∞</span>
                      ) : (() => {
                        const owned = supplyCounts[tier.rank] ?? 0;
                        const isFull = owned >= pricing.maxOwners;
                        return isFull ? (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                            Sold out
                          </span>
                        ) : (
                          <span className="text-raw-silver/50">
                            {owned.toLocaleString()} / {pricing.maxOwners.toLocaleString()}
                          </span>
                        );
                      })()}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Avatar Shop</h2>
        <Suspense fallback={null}>
          <AvatarShop
            avatarCatalog={avatarCatalog}
            ownedAvatarLevels={ownedAvatarLevels}
            onUnlockAvatar={onUnlockAvatar}
            onAvatarPurchased={onAvatarPurchased}
            avatarPricesByLevel={avatarPricesByLevel}
            tokenBalance={tokenBalance}
            userId={userId}
            userName={userName}
          />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Loot Spin</h2>
        <Suspense fallback={null}>
          <LootSpin
            tokenBalance={tokenBalance}
            avatarCatalog={avatarCatalog}
            ownedAvatarLevels={ownedAvatarLevels}
            userId={userId}
            onAvatarPurchased={onAvatarPurchased}
          />
        </Suspense>
      </section>

      {/* Personality Insights moved to the Profile tab. */}

      <AvatarCustomRequestModal
        userId={userId}
        userName={userName}
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
}
