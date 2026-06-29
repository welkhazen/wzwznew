import { useState } from "react";
import { Archive, Lock, Sparkles, Wand2 } from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { avatarDisplayName, avatarIdFromImageSrc, canonicalAvatarImageId } from "@/config/avatarNames";
import TokenImage from "@/assets/tokens.webp";
import { spendTokens } from "@/lib/api/tokens";
import { toast } from "@/hooks/use-toast";
import { AvatarCustomRequestModal } from "./AvatarCustomRequestModal";

interface DashboardInventoryProps {
  avatarLevel: number;
  onAvatarChange: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  avatarCatalog: AvatarCatalogItem[];
}

interface AvatarCommerceProps {
  avatarCatalog: AvatarCatalogItem[];
  ownedAvatarLevels: Set<number>;
  onUnlockAvatar: (level: number) => Promise<boolean>;
  onAvatarPurchased: (level: number) => void;
  avatarPricesByLevel: Record<number, string>;
  tokenBalance: number;
  userId: string;
  userName: string;
}

const AVATAR_SHOP_PRICE = 50;
const TOKEN_BALANCE_STORAGE_PREFIX = "raw.polls.token-balance";
const TOKEN_BALANCE_UPDATED_EVENT = "raw:token-balance-updated";

function avatarImageKey(avatar: AvatarCatalogItem): string {
  const imageId = avatarIdFromImageSrc(avatar.imageSrc);
  return imageId === null ? String(avatar.imageSrc ?? avatar.id) : String(canonicalAvatarImageId(imageId));
}

function avatarName(avatar: AvatarCatalogItem): string {
  const imageId = avatarIdFromImageSrc(avatar.imageSrc);
  return imageId === null ? avatar.name : avatarDisplayName(imageId);
}

function ownedAvatarImageKeys(avatarCatalog: AvatarCatalogItem[], ownedAvatarLevels: Set<number>): Set<string> {
  return new Set(
    avatarCatalog
      .filter((avatar) => ownedAvatarLevels.has(avatar.level))
      .map(avatarImageKey),
  );
}

function updateTokenBalanceCache(userId: string, balance: number): void {
  if (typeof window === "undefined") return;
  const key = `${TOKEN_BALANCE_STORAGE_PREFIX}.${userId}`;
  window.localStorage.setItem(key, String(balance));
  window.dispatchEvent(new CustomEvent(TOKEN_BALANCE_UPDATED_EVENT, { detail: { storageKey: key, balance } }));
}

export function AvatarShop({
  avatarCatalog,
  ownedAvatarLevels,
  onUnlockAvatar,
  avatarPricesByLevel,
  tokenBalance,
  userId,
  userName,
  onAvatarPurchased,
}: AvatarCommerceProps) {
  const [unlocking, setUnlocking] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const ownedImageKeys = ownedAvatarImageKeys(avatarCatalog, ownedAvatarLevels);
  const seenShopImageKeys = new Set<string>();

  const purchasable = avatarCatalog.filter(
    (avatar) => {
      const imageKey = avatarImageKey(avatar);
      const isPaid = avatar.price !== "Free" && avatar.price !== "0" && Number(avatar.price) > 0;
      if (!isPaid || ownedAvatarLevels.has(avatar.level) || ownedImageKeys.has(imageKey) || seenShopImageKeys.has(imageKey)) {
        return false;
      }
      seenShopImageKeys.add(imageKey);
      return true;
    },
  );

  const visibleAvatars = showAll ? purchasable : purchasable.slice(0, 8);

  if (purchasable.length === 0) {
    return (
      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
        No paid avatars in catalog yet.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visibleAvatars.map((avatar) => {
        const owned = ownedAvatarLevels.has(avatar.level);
        const price = Number(avatarPricesByLevel[avatar.level]) || AVATAR_SHOP_PRICE;
        const canBuy = tokenBalance >= price;
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
              <AvatarFigure avatarIndex={avatar.level} size="md" selected={owned} rarity={rarity} themeOverride={avatar} />
            </div>

            <div className="relative text-center">
              <p className="text-xs font-medium text-raw-text line-clamp-1">{avatarName(avatar)}</p>
            </div>

            {owned ? (
              <span className="relative rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] text-emerald-300">
                Owned
              </span>
            ) : avatar.id === "s1-custom" ? (
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="relative flex items-center gap-1.5 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[10px] text-raw-gold transition hover:bg-raw-gold/20"
              >
                <Wand2 className="h-3 w-3" />
                Request Design
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!canBuy) {
                    toast({
                      title: "Not enough tokens",
                      description: "You don't have enough tokens for this purchase. Go to the Wallet tab to get more.",
                    });
                    return;
                  }
                  setUnlocking(avatar.level);
                  try {
                    const balance = await spendTokens(userId, price);
                    const ok = await onUnlockAvatar(avatar.level);
                    if (ok) {
                      updateTokenBalanceCache(userId, balance);
                      onAvatarPurchased(avatar.level);
                      toast({
                        title: "Avatar unlocked!",
                        description: "Your new avatar can be found in the Profile section.",
                      });
                    }
                  } catch {
                    // Keep shop state unchanged on payment or unlock failure.
                  }
                  setUnlocking(null);
                }}
                disabled={unlocking === avatar.level}
                className="relative flex items-center gap-1.5 rounded-full border border-raw-gold/35 bg-raw-gold/10 px-3 py-1 text-[10px] text-raw-gold transition hover:bg-raw-gold/20 disabled:opacity-50"
              >
                <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
                {unlocking === avatar.level ? "..." : `${price} tokens`}
              </button>
            )}
          </div>
        );
      })}
      </div>
      {filtered.length > 8 ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mx-auto mt-5 block rounded-full border border-raw-gold/35 bg-raw-gold/10 px-5 py-2 text-xs font-medium text-raw-gold transition hover:bg-raw-gold/20"
        >
          {showAll ? "Show Less" : "Show More"}
        </button>
      ) : null}

      <AvatarCustomRequestModal
        userId={userId}
        userName={userName}
        tokenBalance={tokenBalance}
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
}

// ─── Loot Spin ───────────────────────────────────────────────────────────────

const SPIN_COST = 50;

interface LootSpinProps {
  tokenBalance: number;
  avatarCatalog: AvatarCatalogItem[];
  ownedAvatarLevels: Set<number>;
  userId: string;
  onAvatarPurchased: (level: number) => void;
}

interface SpinResult {
  wonAvatar: AvatarCatalogItem;
}

export function LootSpin({ tokenBalance, avatarCatalog, ownedAvatarLevels, userId, onAvatarPurchased }: LootSpinProps) {
  const [result, setResult] = useState<SpinResult | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const ownedImageKeys = ownedAvatarImageKeys(avatarCatalog, ownedAvatarLevels);

  const canSpin = tokenBalance >= SPIN_COST;

  const availableAvatars = avatarCatalog.filter(
    (avatar) => {
      const imageKey = avatarImageKey(avatar);
      return !ownedAvatarLevels.has(avatar.level) && !ownedImageKeys.has(imageKey);
    },
  );

  const wheelPrizes: WheelPrize[] = availableAvatars.map((avatar, i) => ({
    id: String(avatar.level),
    label: avatarName(avatar),
    shortLabel: avatarName(avatar).slice(0, 8),
    color: i % 2 === 0 ? "#1a1a1a" : "#0e0e0e",
    textColor: "#F1C42D",
  }));

  const handleSpinEnd = (prize: WheelPrize) => {
    const avatar = availableAvatars.find((a) => String(a.level) === prize.id) ?? availableAvatars[0];
    if (avatar) {
      setResult({ wonAvatar: avatar });
    }
  };

  const handleClaim = async () => {
    if (!result?.wonAvatar || isClaiming) return;
    setIsClaiming(true);
    try {
      onAvatarPurchased(result.wonAvatar.level);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="rounded-2xl border border-raw-border/35 bg-raw-black/45 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-raw-gold/60" />
        <h3 className="font-display text-sm tracking-wide text-raw-text">Loot Spin</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-raw-border/35 bg-raw-black/50 px-2.5 py-1 text-[10px] text-raw-silver/50">
          <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
          {SPIN_COST} per spin
        </span>
      </div>

      {wheelPrizes.length > 0 ? (
        <>
          <div className="flex justify-center">
            <WheelOfFortune
              prizes={wheelPrizes}
              onSpinEnd={handleSpinEnd}
              disabled={!canSpin || !!result}
              radius={145}
            />
          </div>

          {result && (
            <div className="mt-4 rounded-xl border border-raw-gold/30 bg-gradient-to-b from-raw-gold/[0.08] to-raw-gold/[0.02] px-4 py-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <AvatarFigure
                  avatarIndex={result.wonAvatar.level}
                  size="sm"
                  rarity={result.wonAvatar.rarity ?? "common"}
                  themeOverride={result.wonAvatar}
                />
                <Sparkles className="h-4 w-4 text-raw-gold" />
              </div>
              <p className="text-sm font-semibold text-raw-gold">
                You won {avatarName(result.wonAvatar)}!
              </p>
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="mt-3 rounded-full border border-raw-gold/50 bg-raw-gold/15 px-4 py-1.5 text-xs font-semibold text-raw-gold transition hover:bg-raw-gold/25 disabled:opacity-50"
              >
                {isClaiming ? "Claiming…" : "Claim Avatar"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-raw-border/30 bg-raw-surface/20 py-6 text-center">
          <p className="text-xs text-raw-silver/45">No avatars available to spin for right now.</p>
        </div>
      )}

      {!canSpin && !result && (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-raw-border/30 bg-raw-surface/20 py-2.5 text-sm font-semibold text-raw-silver/45">
          <Lock className="h-3.5 w-3.5" />
          Need {SPIN_COST} tokens
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardInventory({
  avatarLevel,
  onAvatarChange,
  ownedAvatarLevels,
  avatarCatalog,
}: DashboardInventoryProps) {
  const seenOwnedImageKeys = new Set<string>();
  const ownedAvatars = avatarCatalog.filter((avatar) => {
    if (!ownedAvatarLevels.has(avatar.level)) return false;
    const imageKey = avatarImageKey(avatar);
    if (seenOwnedImageKeys.has(imageKey)) return false;
    seenOwnedImageKeys.add(imageKey);
    return true;
  });
  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 font-display text-xl tracking-wide text-raw-text sm:text-2xl">
          <Archive className="h-5 w-5 text-raw-gold/60" />
          Inventory
        </h1>
        <p className="mt-1 text-xs text-raw-silver/40">
          Everything you've collected — avatars, insights, and rewards.
        </p>
      </header>

      {/* Owned Avatars */}
      <section>
        <h2 className="mb-3 font-display text-sm tracking-wide text-raw-text">Your Avatars</h2>
        {ownedAvatars.length === 0 ? (
          <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
            You don't own any avatars yet. Visit the Store to unlock some.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ownedAvatars.map((avatar) => {
              const rarity = avatar.rarity ?? "common";
              const rarityConfig = RARITY_CONFIG[rarity];
              return (
                <button
                  type="button"
                  key={avatar.id}
                  onClick={() => onAvatarChange(avatar.level)}
                  className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border bg-raw-black/45 p-3 text-center transition hover:-translate-y-0.5 hover:bg-raw-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
                  style={{
                    borderColor: avatar.level === avatarLevel ? rarityConfig.color : `${rarityConfig.color}40`,
                    boxShadow: avatar.level === avatarLevel ? `0 0 0 1px ${rarityConfig.color}55` : undefined,
                  }}
                  aria-pressed={avatar.level === avatarLevel}
                  aria-label={`Use ${avatarName(avatar)} avatar`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.12)_0.6px,transparent_0.6px)] [background-size:8px_8px]" />
                  <AvatarFigure avatarIndex={avatar.level} size="md" selected={avatar.level === avatarLevel} rarity={rarity} />
                  <div className="relative text-center">
                    <p className="text-xs font-medium text-raw-text line-clamp-1">{avatarName(avatar)}</p>
                    <p className="mt-1 text-[10px] text-raw-silver/45">
                      {avatar.level === avatarLevel ? "Selected" : "Tap to use"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
