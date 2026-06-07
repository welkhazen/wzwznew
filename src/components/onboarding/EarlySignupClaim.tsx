import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  EARLY_SIGNUP_POOL,
  claimEarlySignupAvatar,
} from "@/backend/supabase/controllers/avatarRewardsController";

interface EarlySignupClaimProps {
  userId: string;
  /** Called once the user successfully claims or once we know they're ineligible. */
  onResolved: (claimedAvatarCatalogId: string | null) => void;
}

export function EarlySignupClaim({ userId, onResolved }: EarlySignupClaimProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    if (!selected) return;
    setClaiming(true);
    const result = await claimEarlySignupAvatar(userId, selected);
    setClaiming(false);
    if (!result.ok) {
      toast({
        title: "Could not claim avatar",
        description: result.error ?? "Please try again.",
      });
      return;
    }
    toast({ title: "Avatar claimed", description: "Your exclusive avatar is yours." });
    onResolved(result.avatarId ?? selected);
  }

  return (
    <section>
      <h2 className="font-display text-lg tracking-wide text-raw-text sm:text-xl">
        Early Signup Reward
      </h2>
      <p className="mt-1 text-xs text-raw-silver/55 sm:text-sm">Choose 1 exclusive avatar — added straight to your inventory.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EARLY_SIGNUP_POOL.map((entry) => {
          const active = selected === entry.catalogId;
          return (
            <button
              key={entry.catalogId}
              type="button"
              onClick={() => setSelected(entry.catalogId)}
              className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                active
                  ? "border-raw-gold/70 bg-raw-gold/10 shadow-[0_0_22px_rgb(var(--raw-accent)/0.25)]"
                  : "border-raw-border/40 bg-raw-surface/30 hover:border-raw-gold/40"
              }`}
              aria-pressed={active}
              aria-label={`Choose avatar ${entry.imageId}`}
            >
              <img
                src={entry.imageSrc}
                alt={`Early signup avatar ${entry.imageId}`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onResolved(null)}
          className="rounded-xl border border-raw-border/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-raw-silver/70 transition-colors hover:border-raw-gold/40 hover:text-raw-gold"
        >
          Skip →
        </button>
        <button
          type="button"
          onClick={() => { void handleClaim(); }}
          disabled={!selected || claiming}
          className="rounded-xl bg-raw-gold px-5 py-2.5 text-sm font-semibold text-raw-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {claiming ? "Claiming…" : "Claim this avatar"}
        </button>
      </div>
    </section>
  );
}
