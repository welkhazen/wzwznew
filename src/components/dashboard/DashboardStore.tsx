import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import {
  AvatarShop,
  LootSpin,
  PersonalityInsightsInventory,
} from "@/components/dashboard/DashboardInventory";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import type { Poll } from "@/store/useRawStore";
import { addOwnedInsightId, readOwnedInsightIds } from "@/lib/insightsOwnership";
import { spendTokens } from "@/lib/api/tokens";
import { toast } from "@/components/ui/use-toast";

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

const TOKEN_BALANCE_STORAGE_PREFIX = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

function pushTokenBalance(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  const key = `${TOKEN_BALANCE_STORAGE_PREFIX}.${userId}`;
  window.localStorage.setItem(key, String(balance));
  window.dispatchEvent(new CustomEvent(TOKEN_BALANCE_UPDATED_EVENT, { detail: { storageKey: key, balance } }));
}

export function DashboardStore({
  polls,
  votedPolls,
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  onAvatarPurchased,
  avatarPricesByLevel,
  tokenBalance,
  userId,
}: DashboardStoreProps) {
  const [ownedInsightIds, setOwnedInsightIds] = useState<Set<string>>(() => readOwnedInsightIds(userId));

  useEffect(() => {
    setOwnedInsightIds(readOwnedInsightIds(userId));
  }, [userId]);

  const handlePurchaseInsight = async (insightId: string, tokenPrice: number) => {
    if (tokenBalance < tokenPrice) {
      toast({ title: "Not enough tokens", description: `You need ${tokenPrice} tokens.` });
      return;
    }
    try {
      const newBalance = await spendTokens(userId, tokenPrice);
      pushTokenBalance(userId, newBalance);
      const next = addOwnedInsightId(userId, insightId);
      setOwnedInsightIds(new Set(next));
      window.dispatchEvent(new CustomEvent("raw:insights-updated"));
      toast({ title: "Report unlocked", description: `${tokenPrice} tokens spent.` });
    } catch {
      toast({ title: "Unlock failed", description: "Please try again." });
    }
  };

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
        <AvatarShop
          avatarCatalog={avatarCatalog}
          ownedAvatarLevels={ownedAvatarLevels}
          onUnlockAvatar={onUnlockAvatar}
          onAvatarPurchased={onAvatarPurchased}
          avatarPricesByLevel={avatarPricesByLevel}
          tokenBalance={tokenBalance}
          userId={userId}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Loot Spin</h2>
        <LootSpin tokenBalance={tokenBalance} />
      </section>

      <section>
        <PersonalityInsightsInventory
          pollsAnswered={votedPolls.size}
          totalPolls={polls.length}
          tokenBalance={tokenBalance}
          ownedIds={ownedInsightIds}
          onPurchase={handlePurchaseInsight}
        />
      </section>
    </div>
  );
}
