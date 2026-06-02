import { useMemo } from "react";
import { Archive, Home, MessageCircle, Store, Target, Trophy, Shield, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingDock } from "@/components/ui/floating-dock";
import { countUnreadMessages, type PersistedCommunityRecord } from "@/lib/communityChat";
import { COMMUNITY_COVER_IMAGES } from "@/lib/communityConstants";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import IIJMLogo from "@/assets/itisjustme.webp";
import type { DashboardTab } from "./DashboardNav";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userId: string;
  username: string;
  avatarLevel: number;
  showAdminLink?: boolean;
  onHomeClick: () => void;
  isHome: boolean;
  onLogout: () => void;
  communities: PersistedCommunityRecord[];
  favoriteCommunityIds: string[];
  onOpenCommunity: (communityId: string) => void;
}

const NAV: { icon: typeof Home; label: string; tab: DashboardTab | "home" }[] = [
  { icon: Home,          label: "Home",        tab: "home"        },
  { icon: MessageCircle, label: "Communities", tab: "communities" },
  { icon: Target,        label: "Polls",       tab: "polls"       },
  { icon: Trophy,        label: "Challenges",  tab: "challenges"  },
  { icon: Store,         label: "Store",       tab: "store"       },
  { icon: Archive,       label: "Inventory",   tab: "inventory"   },
];

const COMMUNITY_LOGOS: Record<string, string> = {
  lnt: LNTLogo,
  syt: SYTLogo,
  iijm: IIJMLogo,
};

export function DashboardSidebar({
  activeTab,
  onTabChange,
  userId,
  showAdminLink = false,
  onHomeClick,
  isHome,
  onLogout,
  communities,
  favoriteCommunityIds,
  onOpenCommunity,
}: DashboardSidebarProps) {
  const joinedCommunities = useMemo(
    () => communities.filter((community) => community.members.some((member) => member.userId === userId)),
    [communities, userId],
  );

  const displayedCommunities = useMemo(() => {
    if (favoriteCommunityIds.length === 0) return joinedCommunities.slice(0, 3);
    const byId = new Map(joinedCommunities.map((c) => [c.id, c] as const));
    const picked = favoriteCommunityIds
      .map((id) => byId.get(id))
      .filter((c): c is PersistedCommunityRecord => Boolean(c));
    return picked.slice(0, 3);
  }, [favoriteCommunityIds, joinedCommunities]);

  const totalUnread = useMemo(() =>
    communities.reduce((sum, c) => {
      if (!c.members.some((m) => m.userId === userId)) return sum;
      return sum + countUnreadMessages(c, userId);
    }, 0),
  [communities, userId]);

  const dockItems = NAV.map((item) => {
    const Icon = item.icon;
    const isActive =
      (item.tab === "home" && isHome) ||
      (item.tab !== "home" && activeTab === item.tab && !isHome);
    const showBadge = item.tab === "communities" && totalUnread > 0;

    return {
      title: item.label,
      icon: (
        <div className="relative flex h-full w-full items-center justify-center">
          <Icon className="h-full w-full" />
          {showBadge && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-raw-ink">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </div>
      ),
      href: "#",
      onClick: () => { if (item.tab === "home") { onHomeClick(); } else { onTabChange(item.tab as DashboardTab); } },
      active: isActive,
    };
  });

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-40 hidden w-[80px] flex-col items-center border-r border-raw-border/20 bg-raw-black lg:flex">
      {/* Floating dock nav — anchored directly under the navbar */}
      <div className="mt-4 flex w-full justify-center">
        <FloatingDock
          orientation="vertical"
          desktopClassName="border-raw-border/25 bg-raw-surface/30 w-14 gap-3 py-4 px-2"
          items={dockItems}
        />
      </div>

      {displayedCommunities.length > 0 && (
        <div className="mt-5 flex w-full flex-col items-center gap-3 px-3">
          {displayedCommunities.map((community) => {
            const imageUrl = COMMUNITY_LOGOS[community.id] ?? community.logoUrl ?? COMMUNITY_COVER_IMAGES[community.id];
            const unread = countUnreadMessages(community, userId);

            return (
              <button
                key={community.id}
                type="button"
                onClick={() => onOpenCommunity(community.id)}
                title={community.title}
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-raw-border/35 bg-raw-surface/35 text-[10px] font-semibold text-raw-text shadow-sm transition hover:border-raw-gold/55 hover:bg-raw-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-raw-gold/50"
                aria-label={`Open ${community.title}`}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span>{community.abbr}</span>
                )}
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-raw-ink">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2 pb-5">
        {showAdminLink && (
          <Link
            to="/admin"
            title="Admin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-raw-border/30 bg-raw-black/25 text-raw-silver/45 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Shield className="h-4 w-4" />
          </Link>
        )}
        <button
          title="Log Out"
          onClick={onLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-raw-border/30 bg-raw-black/25 text-raw-silver/30 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
