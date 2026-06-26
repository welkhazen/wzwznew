import { useState } from "react";
import { Archive, Lock, Sparkles, Wand2 } from "lucide-react";
import { AvatarFigure } from "@/components/ui/avatar-figure";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import { RARITY_CONFIG, RANK_TIERS, RANK_TIER_PRICING } from "@/lib/avatarRarity";
import type { AvatarRarity } from "@/lib/avatarRarity";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";
import { avatarDisplayName, avatarIdFromImageSrc, canonicalAvatarImageId } from "@/config/avatarNames";
import TokenImage from "@/assets/tokens.webp";
import { spendTokens } from "@/lib/api/tokens";
import { getAvatarRank, hasAvatarRank } from "@/lib/avatarRank";
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
  const [rankFilter, setRankFilter] = useState<number | null>(null);
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

  const availableRanks = Array.from(
    new Set(purchasable.filter(hasAvatarRank).map(getAvatarRank))
  ).sort((a, b) => a - b);

  const filtered = rankFilter === null
    ? purchasable
    : purchasable.filter((a) => hasAvatarRank(a) && getAvatarRank(a) === rankFilter);

  const visibleAvatars = showAll ? filtered : filtered.slice(0, 8);

  if (purchasable.length === 0) {
    return (
      <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-6 text-center text-xs text-raw-silver/40">
        No paid avatars in catalog yet.
      </div>
    );
  }

  return (
    <div>
      {availableRanks.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setRankFilter(null); setShowAll(false); }}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
              rankFilter === null
                ? "border-raw-gold/60 bg-raw-gold/20 text-raw-gold"
                : "border-raw-border/30 bg-raw-black/30 text-raw-silver/50 hover:border-raw-gold/30 hover:text-raw-silver"
            }`}
          >
            All
          </button>
          {availableRanks.map((rank) => (
            <button
              key={rank}
              type="button"
              onClick={() => { setRankFilter(rank === rankFilter ? null : rank); setShowAll(false); }}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                rankFilter === rank
                  ? "border-raw-gold/60 bg-raw-gold/20 text-raw-gold"
                  : "border-raw-border/30 bg-raw-black/30 text-raw-silver/50 hover:border-raw-gold/30 hover:text-raw-silver"
              }`}
            >
              R{rank}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visibleAvatars.map((avatar) => {
        const owned = ownedAvatarLevels.has(avatar.level);
        const rank = hasAvatarRank(avatar) ? getAvatarRank(avatar) : 1;
        const rankPrice = RANK_TIER_PRICING[rank]?.price ?? AVATAR_SHOP_PRICE;
        const price = Number(avatarPricesByLevel[avatar.level]) || rankPrice;
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
              {hasAvatarRank(avatar) ? (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-raw-silver/60">
                  Rank: R{getAvatarRank(avatar)}
                </p>
              ) : null}
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

type SpinResult = (typeof RANK_TIERS)[number] & { wonAvatar?: AvatarCatalogItem };

interface LootSpinProps {
  tokenBalance: number;
  avatarCatalog: AvatarCatalogItem[];
  ownedAvatarLevels: Set<number>;
  userId: string;
  onAvatarPurchased: (level: number) => void;
}

export function LootSpin({ tokenBalance, avatarCatalog, ownedAvatarLevels, userId, onAvatarPurchased }: LootSpinProps) {
  const [result, setResult] = useState<SpinResult | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const ownedImageKeys = ownedAvatarImageKeys(avatarCatalog, ownedAvatarLevels);

  const canSpin = tokenBalance >= SPIN_COST;

  const wheelPrizes: WheelPrize[] = RANK_TIERS.map((tier) => ({
    id: String(tier.rank),
    label: tier.label,
    shortLabel: tier.rank === 10 ? "R10" : `R${tier.rank}`,
    color: `${tier.color}22`,
    textColor: tier.color,
  }));

  const prizeWeights = RANK_TIERS.reduce<Partial<Record<string, number>>>((acc, tier) => {
    acc[String(tier.rank)] = tier.weight;
    return acc;
  }, {});

  const handleSpinEnd = (prize: WheelPrize) => {
    const tier = RANK_TIERS.find((t) => String(t.rank) === prize.id) ?? RANK_TIERS[0];
    const seenPrizeImageKeys = new Set<string>();
    const eligible = avatarCatalog.filter(
      (avatar) => {
        const imageKey = avatarImageKey(avatar);
        if ((avatar.rarity as AvatarRarity) !== tier.rarity || ownedAvatarLevels.has(avatar.level) || ownedImageKeys.has(imageKey) || seenPrizeImageKeys.has(imageKey)) {
          return false;
        }
        seenPrizeImageKeys.add(imageKey);
        return true;
      },
    );
    const won = eligible.length > 0 ? eligible[Math.floor(Math.random() * eligible.length)] : undefined;
    setResult({ ...tier, wonAvatar: won });
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
        <h3 className="font-display text-sm tracking-wide text-raw-text">Rank Spin</h3>
        <span className="ml-auto flex items-center gap-1 rounded-full border border-raw-border/35 bg-raw-black/50 px-2.5 py-1 text-[10px] text-raw-silver/50">
          <img src={TokenImage} alt="" className="h-3 w-3 object-contain" />
          {SPIN_COST} per spin
        </span>
      </div>

      <div className="flex justify-center">
        <WheelOfFortune
          prizes={wheelPrizes}
          prizeWeights={prizeWeights}
          onSpinEnd={handleSpinEnd}
          disabled={!canSpin || !!result}
          radius={145}
        />
      </div>

      {result && (
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-center"
          style={{ borderColor: `${result.color}50`, background: `${result.glow}18` }}
        >
          <p className="text-sm font-bold" style={{ color: result.color }}>
            {result.label}!
          </p>
          {result.wonAvatar ? (
            <>
              <div className="mt-2 flex flex-col items-center gap-1">
                <AvatarFigure
                  avatarIndex={result.wonAvatar.level}
                  size="md"
                  rarity={result.wonAvatar.rarity ?? "common"}
                  themeOverride={result.wonAvatar}
                />
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: result.color }}>
                  Rank: R{result.rank}
                </p>
              </div>
              <p className="mt-1 text-xs text-raw-silver/60">
                You won <span className="font-semibold text-raw-text">{avatarName(result.wonAvatar)}</span>
              </p>
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="mt-3 rounded-full border border-raw-gold/50 bg-raw-gold/15 px-4 py-1.5 text-xs font-semibold text-raw-gold transition hover:bg-raw-gold/25 disabled:opacity-50"
              >
                {isClaiming ? "Claiming…" : "Claim Avatar"}
              </button>
            </>
          ) : (
            <p className="mt-1 text-xs text-raw-silver/45">
              No unclaimed avatars at this rank yet — check back later!
            </p>
          )}
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
                    {hasAvatarRank(avatar) ? (
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-raw-silver/60">
                        Rank: R{getAvatarRank(avatar)}
                      </p>
                    ) : null}
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
