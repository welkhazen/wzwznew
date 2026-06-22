import { Suspense, lazy } from "react";
import { Store } from "lucide-react";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import type { Poll } from "@/store/useRawStore";

const AvatarShop = lazy(() =>
  import("@/components/dashboard/DashboardInventory").then((m) => ({ default: m.AvatarShop }))
);
const LootSpin = lazy(() =>
  import("@/components/dashboard/DashboardInventory").then((m) => ({ default: m.LootSpin }))
);

interface DashboardStoreProps {
  polls: Poll[];
  votedPolls: Set<string>;
  avatarCatalog: AvatarCatalogItem[];
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  onAvatarPurchased: (level: number) => void;
  avatarPricesByLevel: Record<number, string>;
  tokenBalance: number;
  userId: string;
}

export function DashboardStore({
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  onAvatarPurchased,
  avatarPricesByLevel,
  tokenBalance,
  userId,
}: DashboardStoreProps) {
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
    </div>
  );
}
