import { useMemo } from "react";
import { Archive, Home, MessageCircle, Target, Trophy, Shield, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { FloatingDock } from "@/components/ui/floating-dock";
import { countUnreadMessages, type PersistedCommunityRecord } from "@/lib/communityChat";
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
}

const NAV: { icon: typeof Home; label: string; tab: DashboardTab | "home" }[] = [
  { icon: Home,          label: "Home",        tab: "home"        },
  { icon: MessageCircle, label: "Communities", tab: "communities" },
  { icon: Target,        label: "Polls",       tab: "polls"       },
  { icon: Trophy,        label: "Challenges",  tab: "challenges"  },
  { icon: Archive,       label: "Inventory",   tab: "inventory"   },
];

export function DashboardSidebar({
  activeTab,
  onTabChange,
  userId,
  showAdminLink = false,
  onHomeClick,
  isHome,
  onLogout,
  communities,
}: DashboardSidebarProps) {
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
      {/* Floating dock nav */}
      <div className="flex flex-1 items-center justify-center">
        <FloatingDock
          orientation="vertical"
          desktopClassName="border-raw-border/25 bg-raw-surface/30 w-14 gap-3 py-4 px-2"
          items={dockItems}
        />
      </div>

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
