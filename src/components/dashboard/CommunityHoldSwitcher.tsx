import { AnimatePresence, motion } from "framer-motion";
import { COMMUNITY_COVER_IMAGES } from "@/lib/communityConstants";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

interface CommunityHoldSwitcherProps {
  open: boolean;
  anchorRect: DOMRect | null;
  currentCommunity: PersistedCommunityRecord | null;
  joinedCommunities: PersistedCommunityRecord[];
  hoveredCommunityId: string | null;
  logoUrlsByCommunityId: Record<string, string>;
  onSelectCommunity: (communityId: string) => void;
  onClose: () => void;
}

export function getCommunityHoldSwitcherTargets(
  anchorRect: DOMRect | null,
  currentCommunity: PersistedCommunityRecord | null,
  joinedCommunities: PersistedCommunityRecord[],
) {
  if (!anchorRect || !currentCommunity) return [];
  const centerX = anchorRect.left + anchorRect.width / 2;
  const outerCommunities = joinedCommunities.filter((community) => community.id !== currentCommunity.id).slice(0, 3);
  const positions =
    outerCommunities.length === 1
      ? [{ x: 0, y: -72 }]
      : outerCommunities.length === 2
        ? [{ x: -38, y: -50 }, { x: 38, y: -50 }]
        : [{ x: -44, y: -40 }, { x: 0, y: -73 }, { x: 44, y: -40 }];

  return outerCommunities.map((community, index) => ({
    community,
    x: centerX + positions[index].x,
    y: anchorRect.top - 30 + positions[index].y,
    radius: 28,
  }));
}

function getCommunityImage(community: PersistedCommunityRecord, logoUrlsByCommunityId: Record<string, string>): string | undefined {
  return logoUrlsByCommunityId[community.id] ?? community.logoUrl ?? COMMUNITY_COVER_IMAGES[community.id];
}

export function CommunityHoldSwitcher({
  open,
  anchorRect,
  currentCommunity,
  joinedCommunities,
  hoveredCommunityId,
  logoUrlsByCommunityId,
  onSelectCommunity,
  onClose,
}: CommunityHoldSwitcherProps) {
  const outerCommunities = currentCommunity
    ? joinedCommunities.filter((community) => community.id !== currentCommunity.id).slice(0, 3)
    : [];

  return (
    <AnimatePresence>
      {open && currentCommunity && anchorRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed z-[60] h-36 w-36 -translate-x-1/2 lg:hidden"
          style={{
            left: anchorRect.left + anchorRect.width / 2,
            bottom: window.innerHeight - anchorRect.top + 8,
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            aria-label="Close community switcher"
            className="absolute inset-0 -z-10 rounded-full bg-raw-black/15 backdrop-blur-[2px]"
            onClick={onClose}
            onContextMenu={(event) => event.preventDefault()}
          />
          <svg className="absolute inset-x-3 bottom-5 h-24 w-[120px] overflow-visible" viewBox="0 0 120 96" aria-hidden="true">
            <path d="M16 74 Q60 10 104 74" fill="none" stroke="rgba(31,180,255,0.52)" strokeWidth="3" strokeLinecap="round" />
            <path d="M16 74 Q60 10 104 74" fill="none" stroke="rgba(31,180,255,0.16)" strokeWidth="12" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-x-1 bottom-3 aspect-square rounded-full border border-raw-border/30 bg-raw-black/35 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-md" />
          <div className="absolute inset-x-2 bottom-4 aspect-square overflow-hidden rounded-full border border-raw-border/45 bg-raw-black/85 shadow-[0_18px_42px_rgba(0,0,0,0.48),0_0_28px_rgba(31,180,255,0.14)]" />

          <div
            className="absolute bottom-4 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-[34px] items-center justify-center overflow-hidden rounded-full border border-raw-gold/75 bg-raw-black text-[10px] font-semibold text-raw-text shadow-[0_0_22px_rgba(255,207,92,0.24)] ring-2 ring-raw-gold/35"
            style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" }}
          >
            {getCommunityImage(currentCommunity, logoUrlsByCommunityId) ? (
              <img src={getCommunityImage(currentCommunity, logoUrlsByCommunityId)} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
            ) : (
              <span>{currentCommunity.abbr}</span>
            )}
          </div>

          {outerCommunities.map((community, index, visibleCommunities) => {
            const imageUrl = getCommunityImage(community, logoUrlsByCommunityId);
            const positions =
              visibleCommunities.length === 1
                ? [{ x: 0, y: -72 }]
                : visibleCommunities.length === 2
                  ? [{ x: -38, y: -50 }, { x: 38, y: -50 }]
                  : [{ x: -44, y: -40 }, { x: 0, y: -73 }, { x: 44, y: -40 }];
            const { x, y } = positions[index];
            const hovered = hoveredCommunityId === community.id;

            return (
              <motion.button
                key={community.id}
                type="button"
                initial={{ opacity: 0, scale: 0.68 }}
                animate={{ opacity: 1, scale: hovered ? 1.16 : 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.14, delay: index * 0.025 }}
                onClick={() => onSelectCommunity(community.id)}
                onContextMenu={(event) => event.preventDefault()}
                title={community.title}
                aria-label={`Open ${community.title}`}
                className={`absolute bottom-0 left-1/2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-raw-surface text-[10px] font-semibold text-raw-text shadow-xl shadow-black/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50 ${
                  hovered ? "border-sky-300/90 ring-4 ring-sky-400/35 shadow-[0_0_24px_rgba(31,180,255,0.46)]" : "border-raw-border/35 ring-1 ring-raw-gold/10"
                }`}
                style={{
                  transform: `translate(calc(-50% + ${x}px), ${y}px)`,
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
                ) : (
                  <span>{community.abbr}</span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
