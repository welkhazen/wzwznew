import { GlareCard } from "@/components/ui/glare-card";
import { Palette, Crown, Sparkles, Shield, Lock, Gem } from "lucide-react";
import { highlightRawWordmark } from "@/components/ui/highlightRawWordmark";

interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: string;
  icon: typeof Palette;
  rarity: "common" | "rare" | "legendary";
  locked: boolean;
  levelRequired: number;
}

const items: MarketplaceItem[] = [
  {
    id: "token-golden",
    title: "Golden Geometric Token",
    description: "Exclusive digital collectible. A fractal-patterned golden sphere representing raW's core essence.",
    price: "$12.99",
    icon: Gem,
    rarity: "legendary",
    locked: false,
    levelRequired: 1,
  },
  {
    id: "theme-obsidian",
    title: "Obsidian Pack",
    description: "Deep black avatar theme with subtle gold reflections.",
    price: "Free",
    icon: Palette,
    rarity: "common",
    locked: false,
    levelRequired: 1,
  },
  {
    id: "theme-ember",
    title: "Ember Glow",
    description: "Warm amber gradient that pulses with your activity level.",
    price: "500 XP",
    icon: Sparkles,
    rarity: "common",
    locked: false,
    levelRequired: 3,
  },
  {
    id: "theme-midnight",
    title: "Midnight Silver",
    description: "Metallic silver theme with cool blue undertones.",
    price: "1,200 XP",
    icon: Palette,
    rarity: "rare",
    locked: false,
    levelRequired: 5,
  },
  {
    id: "badge-founder",
    title: "Founding Member Badge",
    description: "Exclusive badge for early community members. Never available again.",
    price: "Earned",
    icon: Crown,
    rarity: "legendary",
    locked: false,
    levelRequired: 1,
  },
  {
    id: "theme-aurora",
    title: "Aurora Veil",
    description: "Northern lights gradient that shifts based on your streak.",
    price: "2,500 XP",
    icon: Sparkles,
    rarity: "rare",
    locked: true,
    levelRequired: 7,
  },
  {
    id: "theme-gold",
    title: "Pure Gold",
    description: "The ultimate avatar theme. Full gold with animated particle effects.",
    price: "5,000 XP",
    icon: Crown,
    rarity: "legendary",
    locked: true,
    levelRequired: 10,
  },
];

const rarityStyles = {
  common: "border-raw-border/40 text-raw-silver/50",
  rare: "border-raw-gold/20 text-raw-gold/60",
  legendary: "border-raw-gold/40 text-raw-gold",
};

const rarityBadge = {
  common: "bg-raw-surface text-raw-silver/50 border-raw-border/30",
  rare: "bg-raw-gold/[0.06] text-raw-gold/70 border-raw-gold/20",
  legendary: "bg-raw-gold/10 text-raw-gold border-raw-gold/30",
};

export function DashboardMarketplace({ avatarLevel, xp = 0 }: { avatarLevel: number; xp?: number }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Marketplace</h1>
        <p className="mt-2 text-xs text-raw-silver/40 sm:text-sm">
          Earn XP through participation. Spend it on avatar themes, badges, and cosmetics.
        </p>
      </div>

      {/* XP Balance */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-raw-gold/15 bg-gradient-to-r from-raw-gold/[0.04] to-transparent p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs text-raw-silver/40">Your Balance</p>
          <p className="mt-0.5 text-xl font-bold text-raw-gold sm:text-2xl">{xp.toLocaleString()} <span className="text-sm font-normal text-raw-gold/60">XP</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-raw-silver/40">Current Level</p>
          <p className="mt-0.5 text-xl font-bold text-raw-text sm:text-2xl">{avatarLevel}</p>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <GlareCard key={item.id}>
              <div className={`relative h-full rounded-2xl border bg-raw-surface/40 p-4 sm:p-6 ${
                item.locked ? "border-raw-border/20" : "border-raw-border/40"
              }`}>
                {item.locked && (
                  <div className="absolute inset-0 rounded-2xl bg-raw-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="h-5 w-5 text-raw-silver/30 mx-auto mb-2" />
                      <p className="text-[10px] text-raw-silver/40">Level {item.levelRequired} required</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    item.rarity === "legendary"
                      ? "bg-raw-gold/15"
                      : item.rarity === "rare"
                      ? "bg-raw-gold/[0.08]"
                      : "bg-raw-surface"
                  }`}>
                    <Icon className={`h-5 w-5 ${rarityStyles[item.rarity].split(" ").pop()}`} />
                  </div>
                  <div className={`rounded-full border px-2 py-0.5 ${rarityBadge[item.rarity]}`}>
                    <span className="text-[8px] font-medium tracking-wider uppercase">
                      {item.rarity}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-sm tracking-wide text-raw-text">{item.title}</h3>
                <p className="mt-2 text-xs text-raw-silver/40 leading-relaxed">{highlightRawWordmark(item.description)}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className={`text-xs font-medium ${
                    item.price === "Free" ? "text-green-400/70" :
                    item.price === "Earned" ? "text-raw-gold" :
                    "text-raw-silver/60"
                  }`}>
                    {item.price}
                  </span>
                  {!item.locked && (
                    <button className={`rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${
                      item.price === "Earned"
                        ? "border border-raw-gold/30 text-raw-gold/70 bg-raw-gold/[0.06]"
                        : item.price === "Free"
                        ? "bg-raw-gold text-raw-black hover:bg-raw-gold/90"
                        : "border border-raw-gold/25 text-raw-gold/70 hover:bg-raw-gold/10"
                    }`}>
                      {item.price === "Earned" ? "Claimed" : item.price === "Free" ? "Equip" : "Get"}
                    </button>
                  )}
                </div>
              </div>
            </GlareCard>
          );
        })}
      </div>

      {/* Coming soon */}
      <div className="rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-8 text-center">
        <Shield className="h-6 w-6 text-raw-silver/20 mx-auto mb-3" />
        <p className="font-display text-sm tracking-wide text-raw-silver/30">{highlightRawWordmark("More items drop as raW grows")}</p>
        <p className="mt-2 text-xs text-raw-silver/20">Custom community themes, animated avatars, voice effects, and more.</p>
      </div>
    </div>
  );
}
