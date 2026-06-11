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

const FAN_RADIUS = 64;
const ITEM_SIZE = 42;
const HIT_RADIUS = 26;

function getFanOffsets(count: number): { x: number; y: number }[] {
  // Angles measured from +x axis, CCW. Screen y is inverted (up = negative).
  let angles: number[] = [];
  if (count === 1) angles = [90];
  else if (count === 2) angles = [135, 45];
  else angles = [135, 90, 45];

  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: Math.cos(rad) * FAN_RADIUS,
      y: -Math.sin(rad) * FAN_RADIUS,
    };
  });
}

// eslint-disable-next-line react-refresh/only-export-components -- pure helper colocated with the component it serves; splitting would just add a one-line file
export function getCommunityHoldSwitcherTargets(
  anchorRect: DOMRect | null,
  currentCommunity: PersistedCommunityRecord | null,
  joinedCommunities: PersistedCommunityRecord[],
) {
  if (!anchorRect || !currentCommunity) return [];
  const centerX = anchorRect.left + anchorRect.width / 2;
  const centerY = anchorRect.top + anchorRect.height / 2;
  const outer = joinedCommunities.filter((c) => c.id !== currentCommunity.id).slice(0, 3);
  const offsets = getFanOffsets(outer.length);

  return outer.map((community, index) => ({
    community,
    x: centerX + offsets[index].x,
    y: centerY + offsets[index].y,
    radius: HIT_RADIUS,
  }));
}

function getCommunityImage(
  community: PersistedCommunityRecord,
  logoUrlsByCommunityId: Record<string, string>,
): string | undefined {
  return (
    logoUrlsByCommunityId[community.id] ??
    community.logoUrl ??
    COMMUNITY_COVER_IMAGES[community.id]
  );
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
    ? joinedCommunities.filter((c) => c.id !== currentCommunity.id).slice(0, 3)
    : [];
  const offsets = getFanOffsets(outerCommunities.length);

  return (
    <AnimatePresence>
      {open && currentCommunity && anchorRect && outerCommunities.length > 0 && (
        <>
          {/* Invisible click-catcher to dismiss when tapping away */}
          <button
            type="button"
            aria-label="Close community switcher"
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
            className="fixed inset-0 z-[65] bg-transparent lg:hidden"
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              touchAction: "none",
            }}
          />

          {outerCommunities.map((community, index) => {
            const { x, y } = offsets[index];
            const imageUrl = getCommunityImage(community, logoUrlsByCommunityId);
            const hovered = hoveredCommunityId === community.id;
            const centerX = anchorRect.left + anchorRect.width / 2;
            const centerY = anchorRect.top + anchorRect.height / 2;

            return (
              <motion.button
                key={community.id}
                type="button"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: hovered ? 1.18 : 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.14, delay: index * 0.03 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCommunity(community.id);
                }}
                onContextMenu={(e) => e.preventDefault()}
                title={community.title}
                aria-label={`Open ${community.title}`}
                className={`fixed z-[70] flex items-center justify-center overflow-hidden rounded-full border-2 bg-raw-black text-[10px] font-semibold text-raw-text shadow-[0_8px_22px_rgba(0,0,0,0.45)] transition-transform active:scale-90 active:border-raw-gold active:ring-4 active:ring-raw-gold/50 lg:hidden ${
                  hovered
                    ? "border-raw-gold ring-4 ring-raw-gold/40"
                    : "border-raw-border/50 ring-1 ring-raw-gold/15"
                }`}
                style={{
                  left: centerX + x - ITEM_SIZE / 2,
                  top: centerY + y - ITEM_SIZE / 2,
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  touchAction: "none",
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <span>{community.abbr}</span>
                )}
              </motion.button>
            );
          })}
        </>
      )}
    </AnimatePresence>
  );
}
