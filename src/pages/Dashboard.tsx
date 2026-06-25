import { FloatingDock } from "@/components/ui/floating-dock";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { readCommunityChats } from "@/lib/communityChat";
import { hydrateChatIdentityFromServer } from "@/lib/identitySelection";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import { fetchCommunities } from "@/backend/supabase/controllers/communityController";
import { readCachedCommunities, writeCachedCommunities } from "@/lib/communityCache";
import { getUserFavoriteCommunities, getUserPinnedMessages, removeUserPinnedMessage, type PinnedMessageRecord } from "@/backend/supabase/controllers/userExtrasController";
import { Home as HomeIcon, MessageCircle, Target, Trophy, Store } from "lucide-react";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import IIJMLogo from "@/assets/itisjustme.webp";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { DashboardNav, type DashboardTab } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DashboardStore } from "@/components/dashboard/DashboardStore";
import { DashboardSectionShell } from "@/components/dashboard/DashboardSectionShell";
import { CommunityHoldSwitcher, getCommunityHoldSwitcherTargets } from "@/components/dashboard/CommunityHoldSwitcher";
import { NotificationConsentPrompt } from "@/components/notifications/NotificationConsentPrompt";
import { LevelUpCelebration } from "@/components/ui/LevelUpCelebration";
import { useUserProgress } from "@/store/useUserProgress";
import { XP_REWARDS } from "@/lib/userProgress";
import { getTodayKey } from "@/store/useRawStore.storage";
import type { User, Poll } from "@/store/useRawStore";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";

const DashboardPolls = lazy(() =>
  import("@/components/dashboard/DashboardPolls").then((module) => ({ default: module.DashboardPolls }))
);
const DashboardCommunities = lazy(() =>
  import("@/components/dashboard/DashboardCommunities").then((module) => ({ default: module.DashboardCommunities }))
);
const DashboardChallenges = lazy(() =>
  import("@/components/dashboard/DashboardChallenges").then((module) => ({ default: module.DashboardChallenges }))
);
const DashboardDailySpin = lazy(() =>
  import("@/components/dashboard/DashboardDailySpin").then((module) => ({ default: module.DashboardDailySpin }))
);
const DashboardProfile = lazy(() =>
  import("@/components/dashboard/DashboardProfile").then((module) => ({ default: module.DashboardProfile }))
);
const DashboardWallet = lazy(() =>
  import("@/components/dashboard/DashboardWallet").then((module) => ({ default: module.DashboardWallet }))
);
const DashboardSettings = lazy(() =>
  import("@/components/dashboard/DashboardSettings").then((module) => ({ default: module.DashboardSettings }))
);
const DashboardInventory = lazy(() =>
  import("@/components/dashboard/DashboardInventory").then((module) => ({ default: module.DashboardInventory }))
);

// Eagerly preload the two most-visited tab chunks so they are ready before the
// user taps. The remaining addon chunks are warmed during browser idle (see the
// effect in Dashboard) so first-time switches stay instant without competing
// with the initial paint.
void import("@/components/dashboard/DashboardCommunities");
void import("@/components/dashboard/DashboardPolls");
// DashboardDailySpin is shown on the home tab (default view), so preload it
// eagerly rather than deferring to idle — it needs to be ready immediately.
void import("@/components/dashboard/DashboardDailySpin");

// Remaining lazy addon chunks. Add new lazy addons here so they get the same
// idle-preload treatment and never flash the Suspense fallback on first switch.
const DEFERRED_ADDON_PRELOADERS: Array<() => Promise<unknown>> = [
  () => import("@/components/dashboard/DashboardChallenges"),
  () => import("@/components/dashboard/DashboardInventory"),
  () => import("@/components/dashboard/DashboardProfile"),
  () => import("@/components/dashboard/DashboardWallet"),
  () => import("@/components/dashboard/DashboardSettings"),
];

const COMMUNITY_LOGOS: Record<string, string> = {
  lnt: LNTLogo,
  syt: SYTLogo,
  iijm: IIJMLogo,
};

// Mobile long-press gesture tuning for the community dock switcher: how long a
// press must be held to open the switcher, and how far a finger may drift
// before the press is treated as a scroll/tap and cancelled.
const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

const dashboardSectionFallback = (
  <DashboardSectionShell>
    <div className="flex min-h-[240px] items-center justify-center text-sm text-raw-silver/60">
      Loading dashboard section…
    </div>
  </DashboardSectionShell>
);

interface DashboardProps {
  user: User;
  polls: Poll[];
  votedPolls: Set<string>;
  avatarLevel: number;
  setAvatarLevel: (level: number) => void;
  ownedAvatarLevels: Set<number>;
  unlockAvatarLevel: (level: number) => Promise<boolean>;
  markAvatarOwned: (level: number) => void;
  avatarPricesByLevel: Record<number, string>;
  avatarCatalog: AvatarCatalogItem[];
  dailyAnsweredCount: number;
  dailyPollLimit: number;
  isDailyPollLimitReached: boolean;
  tokenBalance: number;
  addTokens: (amount: number) => void;
  unlockExtraPolls: () => void;
  vote: (pollId: string, optionId: string) => void;
  onLogout: () => void;
}

export default function Dashboard({
  user,
  polls,
  votedPolls,
  avatarLevel,
  setAvatarLevel,
  ownedAvatarLevels,
  unlockAvatarLevel,
  markAvatarOwned,
  avatarPricesByLevel,
  avatarCatalog,
  dailyAnsweredCount,
  dailyPollLimit,
  isDailyPollLimitReached,
  tokenBalance,
  addTokens,
  unlockExtraPolls,
  vote,
  onLogout,
}: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { progress, leveledUpTo, clearLevelUp, award, awardOnce } = useUserProgress(user.id);
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  // Seed from the persistent cache so the user sees their communities
  // instantly on remount instead of a cold spinner.
  const [dashboardCommunities, setDashboardCommunities] = useState<PersistedCommunityRecord[]>(
    () => readCachedCommunities()?.data ?? [],
  );
  const [favoriteCommunityIds, setFavoriteCommunityIds] = useState<string[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessageRecord[]>([]);
  const [isHome, setIsHome] = useState(true);
  const [mobileCommunityPickerOpen, setMobileCommunityPickerOpen] = useState(false);
  const [mobileCommunityAnchorRect, setMobileCommunityAnchorRect] = useState<DOMRect | null>(null);
  const [mobileCommunityCenterId, setMobileCommunityCenterId] = useState<string | null>(null);
  const [hoveredHoldCommunityId, setHoveredHoldCommunityId] = useState<string | null>(null);
  const mobileCommunityPressTimerRef = useRef<number | null>(null);
  const mobileCommunityPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const mobileCommunityHoveredRef = useRef<string | null>(null);
  const mobileCommunityLongPressRef = useRef(false);
  const mobileCommunitySuppressClickRef = useRef(false);
  const communityRouteMatch = matchPath("/dashboard/communities/:communityId", location.pathname);
  const activeCommunityId = communityRouteMatch?.params.communityId ?? null;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.getElementById("seo-landing")?.remove();
  }, []);

  useEffect(() => {
    if (activeCommunityId) {
      setActiveTab("communities");
      setIsHome(false);
      return;
    }

    if (location.pathname !== "/dashboard") {
      return;
    }
  }, [activeCommunityId, location.pathname]);

  // Preload communities at the Dashboard level so the home "Trending"
  // section renders without waiting for the user to visit the Communities tab.
  // Always revalidates in the background — the seeded cache stays visible
  // until fresh data arrives, then we swap and persist.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchCommunities();
        if (!cancelled) {
          setDashboardCommunities(list);
          writeCachedCommunities(list);
        }
      } catch {
        // Tab-level fetch will retry; the cached list (if any) stays on screen.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Run once on mount.
  }, []);

  // Warm the remaining addon chunks during browser idle so a first-time tab
  // switch never flashes the Suspense fallback. import() is cached, so each
  // preloader is a no-op once its chunk has already loaded.
  useEffect(() => {
    const warm = () => {
      for (const preload of DEFERRED_ADDON_PRELOADERS) void preload();
    };
    const idle = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof idle.requestIdleCallback === "function") {
      const id = idle.requestIdleCallback(warm);
      return () => idle.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(warm, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void awardOnce("daily-login", getTodayKey(), XP_REWARDS.DAILY_LOGIN);
  }, [awardOnce]);

  // Pull the chat-identity selection + private avatar from Supabase so they
  // follow the account across devices (both are otherwise localStorage-only).
  useEffect(() => {
    void hydrateChatIdentityFromServer(user.id);
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const ids = await getUserFavoriteCommunities(user.id);
        if (!cancelled) setFavoriteCommunityIds(ids);
      } catch {
        // Favorites are best-effort; sidebar/radial fall back to recent joined.
      }
    })();
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; ids?: string[] }>).detail;
      if (!detail || detail.userId !== user.id || !Array.isArray(detail.ids)) return;
      setFavoriteCommunityIds(detail.ids);
    };
    window.addEventListener("raw:favorite-communities-updated", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("raw:favorite-communities-updated", onChange);
    };
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const messages = await getUserPinnedMessages(user.id);
        if (!cancelled) setPinnedMessages(messages);
      } catch {
        // Pinned profile messages are best-effort; the profile still renders.
      }
    })();
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; messages?: PinnedMessageRecord[] }>).detail;
      if (!detail || detail.userId !== user.id) return;
      setPinnedMessages(detail.messages ?? []);
    };
    window.addEventListener("raw:pinned-message-updated", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("raw:pinned-message-updated", onChange);
    };
  }, [user.id]);

  const handleRemovePinnedMessage = async (messageId: string) => {
    const previous = pinnedMessages;
    const next = previous.filter((message) => message.messageId !== messageId);
    setPinnedMessages(next);
    try {
      await removeUserPinnedMessage(user.id, messageId);
      window.dispatchEvent(new CustomEvent("raw:pinned-message-updated", {
        detail: { userId: user.id, messages: next },
      }));
    } catch {
      setPinnedMessages(previous);
    }
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleHomeClick = () => {
    setIsHome(true);
    navigate("/dashboard");
  };

  const handleOpenCommunity = (communityId: string) => {
    setActiveTab("communities");
    setIsHome(false);
    navigate(`/dashboard/communities/${communityId}`);
  };

  const handleBackToCommunities = () => {
    setActiveTab("communities");
    setIsHome(false);
    navigate("/dashboard");
  };

  const activeCommunityTitle = useMemo(() => {
    if (!activeCommunityId) return undefined;
    return dashboardCommunities.find((c) => c.id === activeCommunityId)?.title;
  }, [activeCommunityId, dashboardCommunities]);
  const joinedMobileCommunities = useMemo(() => {
    const joined = dashboardCommunities
      .filter((community) => community.members.some((member) => member.userId === user.id))
      .sort((a, b) => {
        const aMember = a.members.find((member) => member.userId === user.id);
        const bMember = b.members.find((member) => member.userId === user.id);
        return (Date.parse(bMember?.lastSeenAt ?? bMember?.joinedAt ?? "") || 0)
          - (Date.parse(aMember?.lastSeenAt ?? aMember?.joinedAt ?? "") || 0);
      });
    if (favoriteCommunityIds.length === 0) return joined.slice(0, 3);
    const byId = new Map(joined.map((c) => [c.id, c] as const));
    return favoriteCommunityIds
      .map((id) => byId.get(id))
      .filter((c): c is PersistedCommunityRecord => Boolean(c))
      .slice(0, 3);
  }, [dashboardCommunities, favoriteCommunityIds, user.id]);
  const mobileWheelCenterCommunity = useMemo(() => {
    if (joinedMobileCommunities.length === 0) return null;
    return joinedMobileCommunities.find((community) => community.id === mobileCommunityCenterId)
      ?? joinedMobileCommunities.find((community) => community.id === activeCommunityId)
      ?? joinedMobileCommunities[0];
  }, [activeCommunityId, joinedMobileCommunities, mobileCommunityCenterId]);
  const clearMobileCommunityPressTimer = () => {
    if (mobileCommunityPressTimerRef.current !== null) {
      window.clearTimeout(mobileCommunityPressTimerRef.current);
      mobileCommunityPressTimerRef.current = null;
    }
  };

  const getMobileCommunityPressPoint = (event: React.TouchEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
    return { x: event.clientX, y: event.clientY };
  };

  const handleMobileCommunityPressStart = (event: React.TouchEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
    if ("pointerType" in event && event.pointerType === "mouse") return;
    if (mobileCommunityPressTimerRef.current !== null) return;
    const point = getMobileCommunityPressPoint(event);
    if (!point) return;
    mobileCommunityPressStartRef.current = point;
    const rect = event.currentTarget.getBoundingClientRect();
    mobileCommunityLongPressRef.current = false;
    mobileCommunityPressTimerRef.current = window.setTimeout(() => {
      mobileCommunityPressTimerRef.current = null;
      if (joinedMobileCommunities.length === 0) return;
      const currentCommunity = joinedMobileCommunities.find((c) => c.id === activeCommunityId) ?? joinedMobileCommunities[0];
      setMobileCommunityCenterId(currentCommunity.id);
      setMobileCommunityAnchorRect(rect);
      mobileCommunityLongPressRef.current = true;
      mobileCommunitySuppressClickRef.current = true;
      setMobileCommunityPickerOpen(true);
    }, LONG_PRESS_MS);
  };

  const closeMobileCommunitySwitcher = () => {
    clearMobileCommunityPressTimer();
    mobileCommunityPressStartRef.current = null;
    mobileCommunityHoveredRef.current = null;
    setHoveredHoldCommunityId(null);
    setMobileCommunityPickerOpen(false);
  };

  const handleMobileCommunityPressEnd = () => {
    clearMobileCommunityPressTimer();
    mobileCommunityPressStartRef.current = null;
  };

  const handleMobileCommunityPressMove = (event: React.TouchEvent<HTMLElement> | React.PointerEvent<HTMLElement>) => {
    if (mobileCommunityLongPressRef.current) return;
    const start = mobileCommunityPressStartRef.current;
    const point = getMobileCommunityPressPoint(event);
    if (!start || !point) return;
    if (Math.hypot(point.x - start.x, point.y - start.y) > MOVE_CANCEL_PX) {
      clearMobileCommunityPressTimer();
      mobileCommunityPressStartRef.current = null;
    }
  };

  useEffect(() => {
    if (!mobileCommunityPickerOpen) return;
    const closeOnResize = () => closeMobileCommunitySwitcher();
    const closeOnKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileCommunitySwitcher();
    };
    window.addEventListener("resize", closeOnResize);
    window.addEventListener("keydown", closeOnKey);
    return () => {
      window.removeEventListener("resize", closeOnResize);
      window.removeEventListener("keydown", closeOnKey);
    };
    // closeMobileCommunitySwitcher intentionally omitted from deps — the
    // listeners only need to fire once per open/close transition and the
    // function is stable across the renders that matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileCommunityPickerOpen]);

  const handleProfileClick = () => {
    setActiveTab("profile");
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleBillingClick = () => {
    setActiveTab("wallet");
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleSettingsClick = () => {
    setActiveTab("settings");
    setIsHome(false);
    navigate("/dashboard");
  };

  const handleBackToDashboardHome = () => {
    setIsHome(true);
    navigate("/dashboard");
  };

  const handleDailySpinAward = (amount: number) => {
    if (user.role === "admin") {
      return award(amount);
    }

    return awardOnce("daily-spin", getTodayKey(), amount).then(() => undefined);
  };

  const renderContent = () => {
    if (isHome || activeTab === "home") {
      return (
        <DashboardSectionShell>
          <DashboardHome
            userId={user.id}
            username={user.username}
            avatarLevel={avatarLevel}
            polls={polls}
            votedPolls={votedPolls}
            dailyAnsweredCount={dailyAnsweredCount}
            dailyPollLimit={dailyPollLimit}
            xp={progress?.xp ?? 0}
            xpLevel={progress?.level ?? 1}
            onNavigate={handleTabChange}
            onOpenCommunity={handleOpenCommunity}
            communities={dashboardCommunities}
            isAdmin={user.role === "admin"}
            onAwardXP={handleDailySpinAward}
            onAvatarWon={markAvatarOwned}
          />
        </DashboardSectionShell>
      );
    }

    switch (activeTab) {
      case "polls":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardPolls
              polls={polls}
              votedPolls={votedPolls}
              userId={user.id}
              username={user.username}
              dailyAnsweredCount={dailyAnsweredCount}
              dailyPollLimit={dailyPollLimit}
              isDailyPollLimitReached={isDailyPollLimitReached}
              tokenBalance={tokenBalance}
              onUnlockExtra={unlockExtraPolls}
              onVote={(pollId, optionId) => {
                vote(pollId, optionId);
                void award(XP_REWARDS.POLL_VOTE);
              }}
            />
          </Suspense>
        );
      case "communities":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell className="p-2 sm:p-3">
              <DashboardCommunities
                user={user}
                avatarLevel={avatarLevel}
                tokenBalance={tokenBalance}
                activeCommunityId={activeCommunityId}
                onOpenCommunity={handleOpenCommunity}
                onBackToCommunities={handleBackToCommunities}
                onCommunitiesChange={setDashboardCommunities}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "challenges":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardChallenges
                userId={user.id}
                isAdmin={user.role === "admin"}
                avatarLevel={avatarLevel}
                pollsAnswered={votedPolls.size}
                dailyAnsweredCount={dailyAnsweredCount}
                dailyPollLimit={dailyPollLimit}
                onAwardXP={handleDailySpinAward}
                onClaimXP={(source, claimKey, amount) => awardOnce(source, claimKey, amount)}
                onAwardTokens={(amount) => addTokens(amount)}
                onAvatarWon={markAvatarOwned}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "daily-spin":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardDailySpin
                userId={user.id}
                isAdmin={user.role === "admin"}
                onAwardXP={handleDailySpinAward}
                onAvatarWon={markAvatarOwned}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "inventory":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardInventory
                avatarLevel={avatarLevel}
                onAvatarChange={setAvatarLevel}
                ownedAvatarLevels={ownedAvatarLevels}
                avatarCatalog={avatarCatalog}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "store":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardStore
                avatarCatalog={avatarCatalog}
                ownedAvatarLevels={ownedAvatarLevels}
                onUnlockAvatar={unlockAvatarLevel}
                onAvatarPurchased={markAvatarOwned}
                avatarPricesByLevel={avatarPricesByLevel}
                tokenBalance={tokenBalance}
                userId={user.id}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "wallet":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardWallet />
            </DashboardSectionShell>
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardProfile
                userId={user.id}
                username={user.username}
                avatarLevel={avatarLevel}
                onAvatarChange={setAvatarLevel}
                ownedAvatarLevels={ownedAvatarLevels}
                onUnlockAvatar={unlockAvatarLevel}
                avatarPricesByLevel={avatarPricesByLevel}
                pollsAnswered={votedPolls.size}
                xp={progress?.xp ?? 0}
                xpLevel={progress?.level ?? 1}
                pinnedMessages={pinnedMessages}
                onRemovePinnedMessage={handleRemovePinnedMessage}
                polls={polls}
                tokenBalance={tokenBalance}
                onLogout={onLogout}
              />
            </DashboardSectionShell>
          </Suspense>
        );
      case "settings":
        return (
          <Suspense fallback={dashboardSectionFallback}>
            <DashboardSectionShell>
              <DashboardSettings userId={user.id} onLogout={onLogout} onBackToDashboard={handleBackToDashboardHome} />
            </DashboardSectionShell>
          </Suspense>
        );
      default:
        return (
          <DashboardSectionShell>
            <DashboardHome
              userId={user.id}
              username={user.username}
              avatarLevel={avatarLevel}
              polls={polls}
              votedPolls={votedPolls}
              dailyAnsweredCount={dailyAnsweredCount}
              dailyPollLimit={dailyPollLimit}
              xp={progress?.xp ?? 0}
              xpLevel={progress?.level ?? 1}
              onNavigate={handleTabChange}
              onOpenCommunity={handleOpenCommunity}
              communities={dashboardCommunities}
              isAdmin={user.role === "admin"}
              onAwardXP={handleDailySpinAward}
              onAvatarWon={markAvatarOwned}
            />
          </DashboardSectionShell>
        );
    }
  };

  return (
    <div
      className="dashboard-enhanced-bg relative min-h-screen overflow-hidden bg-raw-black"
    >
      {leveledUpTo !== null && (
        <LevelUpCelebration newLevel={leveledUpTo} onClose={clearLevelUp} />
      )}
      <NotificationConsentPrompt userId={user.id} />
      <DashboardNav
        userId={user.id}
        username={user.username}
        avatarLevel={avatarLevel}
        onProfileClick={handleProfileClick}
        onBillingClick={handleBillingClick}
        onSettingsClick={handleSettingsClick}
        onLogout={onLogout}
        communityTitle={activeCommunityTitle}
        onBack={handleBackToCommunities}
        communities={dashboardCommunities}
        xp={progress?.xp ?? 0}
        level={progress?.level ?? 1}
      />

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userId={user.id}
        username={user.username}
        avatarLevel={avatarLevel}
        onHomeClick={handleHomeClick}
        isHome={isHome}
        onLogout={onLogout}
        communities={dashboardCommunities}
        favoriteCommunityIds={favoriteCommunityIds}
        onOpenCommunity={handleOpenCommunity}
      />

      {/* FloatingDock for mobile navigation */}
      <FloatingDock
        items={[
          {
            title: "Home",
            icon: <HomeIcon className="h-5 w-5" />,
            href: "#",
            onClick: handleHomeClick,
            active: isHome,
          },
          {
            title: "Communities",
            icon: <MessageCircle className="h-5 w-5" />,
            href: "#",
            onClick: () => {
              if (mobileCommunitySuppressClickRef.current) {
                mobileCommunitySuppressClickRef.current = false;
                return;
              }
              if (mobileCommunityPickerOpen) {
                closeMobileCommunitySwitcher();
                return;
              }
              handleTabChange("communities");
            },
            onPointerDown: handleMobileCommunityPressStart,
            onPointerMove: handleMobileCommunityPressMove,
            onPointerUp: handleMobileCommunityPressEnd,
            onPointerLeave: handleMobileCommunityPressEnd,
            onTouchStart: handleMobileCommunityPressStart,
            onTouchEnd: handleMobileCommunityPressEnd,
            onTouchCancel: handleMobileCommunityPressEnd,
            onTouchMove: handleMobileCommunityPressMove,
            onContextMenu: (event) => event.preventDefault(),
            active: !isHome && activeTab === "communities",
          },
          {
            title: "Polls",
            icon: <Target className="h-5 w-5" />,
            href: "#",
            onClick: () => handleTabChange("polls"),
            active: !isHome && activeTab === "polls",
          },
          {
            title: "Challenges",
            icon: <Trophy className="h-5 w-5" />,
            href: "#",
            onClick: () => handleTabChange("challenges"),
            active: !isHome && activeTab === "challenges",
          },
          {
            title: "Store",
            icon: <Store className="h-5 w-5" />,
            href: "#",
            onClick: () => handleTabChange("store"),
            active: !isHome && activeTab === "store",
          },
        ]}
      />

      <CommunityHoldSwitcher
        open={mobileCommunityPickerOpen}
        anchorRect={mobileCommunityAnchorRect}
        currentCommunity={mobileWheelCenterCommunity}
        joinedCommunities={joinedMobileCommunities}
        hoveredCommunityId={hoveredHoldCommunityId}
        logoUrlsByCommunityId={COMMUNITY_LOGOS}
        onSelectCommunity={(communityId) => {
          closeMobileCommunitySwitcher();
          handleOpenCommunity(communityId);
        }}
        onClose={closeMobileCommunitySwitcher}
      />

      {/* Main content */}
      <main className="relative z-10 pt-14 pb-28 lg:pl-[80px] lg:pb-8">
        <div className="dashboard-content-shell mx-auto max-w-4xl px-4 py-5 sm:px-5 sm:py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

