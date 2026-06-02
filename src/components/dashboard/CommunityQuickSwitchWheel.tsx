import { AnimatePresence, motion } from "framer-motion";
import { COMMUNITY_COVER_IMAGES } from "@/lib/communityConstants";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

interface CommunityQuickSwitchWheelProps {
  open: boolean;
  anchorRect: DOMRect | null;
  currentCommunity: PersistedCommunityRecord | null;
  joinedCommunities: PersistedCommunityRecord[];
  logoUrlsByCommunityId: Record<string, string>;
  onSelectCommunity: (communityId: string) => void;
}

function getCommunityImage(community: PersistedCommunityRecord, logoUrlsByCommunityId: Record<string, string>): string | undefined {
  return logoUrlsByCommunityId[community.id] ?? community.logoUrl ?? COMMUNITY_COVER_IMAGES[community.id];
}

export function CommunityQuickSwitchWheel({
  open,
  anchorRect,
  currentCommunity,
  joinedCommunities,
  logoUrlsByCommunityId,
  onSelectCommunity,
}: CommunityQuickSwitchWheelProps) {
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
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className="absolute inset-x-1 bottom-3 aspect-square rounded-full border border-raw-border/30 bg-raw-black/35 shadow-[0_18px_42px_rgba(0,0,0,0.35)] backdrop-blur-md" />
          <div
            className="absolute inset-x-2 bottom-4 aspect-square overflow-hidden rounded-full border border-raw-border/45 bg-raw-black/85 shadow-[0_18px_42px_rgba(0,0,0,0.48),0_0_28px_rgba(255,207,92,0.12)]"
            style={{
              background:
                "radial-gradient(circle at 50% 56%, rgba(255,207,92,0.16) 0 20%, rgba(12,12,14,0.94) 21% 50%, rgba(0,0,0,0.9) 51% 100%), conic-gradient(from 210deg, rgba(255,207,92,0.24) 0deg 118deg, rgba(255,255,255,0.07) 118deg 122deg, rgba(255,255,255,0.045) 122deg 238deg, rgba(255,255,255,0.07) 238deg 242deg, rgba(255,255,255,0.045) 242deg 360deg)",
            }}
          >
            <div className="absolute inset-[18px] rounded-full border border-raw-border/25" />
            <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 rotate-[30deg] bg-gradient-to-r from-transparent via-raw-silver/25 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 rotate-[150deg] bg-gradient-to-r from-transparent via-raw-silver/25 to-transparent" />
          </div>

          <button
            type="button"
            onClick={() => onSelectCommunity(currentCommunity.id)}
            onContextMenu={(event) => event.preventDefault()}
            title={currentCommunity.title}
            aria-label={`Current community ${currentCommunity.title}`}
            className="absolute bottom-4 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-[34px] items-center justify-center overflow-hidden rounded-full border border-raw-gold/75 bg-raw-black text-[10px] font-semibold text-raw-text shadow-[0_0_22px_rgba(255,207,92,0.24)] ring-2 ring-raw-gold/35"
            style={{
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          >
            {getCommunityImage(currentCommunity, logoUrlsByCommunityId) ? (
              <img
                src={getCommunityImage(currentCommunity, logoUrlsByCommunityId)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                draggable={false}
              />
            ) : (
              <span>{currentCommunity.abbr}</span>
            )}
          </button>

          {outerCommunities.map((community, index, visibleCommunities) => {
            const imageUrl = getCommunityImage(community, logoUrlsByCommunityId);
            const positions =
              visibleCommunities.length === 1
                ? [{ x: 0, y: -72 }]
                : visibleCommunities.length === 2
                  ? [{ x: -38, y: -50 }, { x: 38, y: -50 }]
                  : [{ x: -44, y: -40 }, { x: 0, y: -73 }, { x: 44, y: -40 }];
            const { x, y } = positions[index];

            return (
              <motion.button
                key={community.id}
                type="button"
                initial={{ opacity: 0, scale: 0.68 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.16, delay: index * 0.025 }}
                onClick={() => onSelectCommunity(community.id)}
                onContextMenu={(event) => event.preventDefault()}
                title={community.title}
                aria-label={`Open ${community.title}`}
                className="absolute bottom-0 left-1/2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-raw-border/35 bg-raw-surface text-[10px] font-semibold text-raw-text shadow-xl shadow-black/30 ring-1 ring-raw-gold/10 transition hover:border-raw-gold/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
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
