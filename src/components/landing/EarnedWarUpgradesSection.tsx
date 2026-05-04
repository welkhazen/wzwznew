import { useEffect, useState } from "react";
import { readAvatarCatalogLocal, loadAvatarCatalog, type AvatarCatalogItem } from "@/lib/avatarCatalog";

function LevelSlot({ item }: { item: AvatarCatalogItem }) {
  const hasImage = !!item.imageSrc;

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full sm:h-20 sm:w-20"
        style={{
          background: hasImage ? "transparent" : item.bg,
          boxShadow: hasImage
            ? `0 0 24px ${item.glow !== "none" ? item.glow : "rgba(241,196,45,0.2)"}, 0 0 0 2px rgba(255,255,255,0.08)`
            : `0 0 24px ${item.glow !== "none" ? item.glow : "rgba(100,100,100,0.2)"}, 0 0 0 2px ${item.ring}40`,
        }}
      >
        {hasImage ? (
          <img
            src={item.imageSrc}
            alt={item.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <>
            {/* Placeholder badge circle */}
            <div
              className="h-7 w-7 rounded-full sm:h-14 sm:w-14"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${item.figure}33, ${item.bg})`,
                border: `2px solid ${item.ring}60`,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-display text-[8px] font-bold tracking-widest sm:text-[10px]"
              style={{ color: item.figure, opacity: 0.6 }}
            >
              ?
            </span>
          </>
        )}
      </div>

      <span
        className="font-display text-[9px] font-bold tracking-[0.1em] sm:text-xs"
        style={{
          color: hasImage
            ? item.glow !== "none"
              ? item.figure
              : "#c8c8c8"
            : "rgba(255,255,255,0.25)",
          textShadow: hasImage && item.glow !== "none"
            ? `0 0 8px ${item.glow}`
            : "none",
        }}
      >
        LVL {item.level}
      </span>
    </div>
  );
}

export function EarnedWarUpgradesSection() {
  const [catalog, setCatalog] = useState<AvatarCatalogItem[]>(() =>
    readAvatarCatalogLocal().slice(0, 10)
  );

  useEffect(() => {
    // Fetch from Supabase on mount, updates localStorage as side-effect
    loadAvatarCatalog().then((items) => setCatalog(items.slice(0, 10)));

    const refresh = () => setCatalog(readAvatarCatalogLocal().slice(0, 10));
    window.addEventListener("raw:avatar-catalog-updated", refresh);
    return () => window.removeEventListener("raw:avatar-catalog-updated", refresh);
  }, []);

  const topRow = catalog.slice(0, 5);
  const bottomRow = catalog.slice(5, 10);

  return (
    <section className="landing-section relative px-4 py-14 sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(241,196,45,0.06),transparent_65%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-raw-gold/70">War Rewards</p>

        <h2
          className="mt-3 font-display text-3xl tracking-wide sm:text-5xl"
          style={{
            background: "linear-gradient(135deg, #F6D454 0%, #F1C42D 40%, #B8941E 65%, #F1C42D 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter:
              "drop-shadow(0 0 18px rgba(241,196,45,0.45)) drop-shadow(0 0 32px rgba(241,196,45,0.2))",
          }}
        >
          Earned War Upgrades
        </h2>

        <p className="mt-5 text-sm leading-relaxed text-raw-silver/60 sm:text-base">
          We give back to those who are being{" "}
          <span className="font-medium text-raw-gold/80">raW</span>. Earn{" "}
          <span className="font-medium text-raw-gold/80">War Points</span> and{" "}
          <span className="font-medium text-raw-gold/80">War-Up</span> by staying active — you
          deserve it and earned it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-raw-silver/40">
          The higher the Level, the higher the deserved privileges. The more the surprises.
        </p>

        <div className="mt-12 space-y-8">
          {/* Row 1: LVL 1–5 */}
          <div className="mx-auto flex max-w-[320px] items-end justify-center gap-3 sm:max-w-none sm:gap-10">
            {topRow.map((item) => (
              <LevelSlot key={item.id} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-raw-gold/20 to-transparent" />

          {/* Row 2: LVL 6–10 */}
          <div className="mx-auto flex max-w-[320px] items-end justify-center gap-3 sm:max-w-none sm:gap-10">
            {bottomRow.map((item) => (
              <LevelSlot key={item.id} item={item} />
            ))}
          </div>
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-raw-silver/25">
          Avatars unlock as you level up
        </p>
      </div>
    </section>
  );
}
