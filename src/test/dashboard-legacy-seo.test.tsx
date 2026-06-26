import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "@/pages/Dashboard";
import type { User, Poll } from "@/store/useRawStore";
import type { AvatarCatalogItem } from "@/lib/avatarCatalog";

vi.mock("@/components/ui/floating-dock", () => ({
  FloatingDock: () => <nav data-testid="mobile-dock" />,
}));

vi.mock("@/components/dashboard/DashboardNav", () => ({
  DashboardNav: () => <nav data-testid="dashboard-nav" />,
}));

vi.mock("@/components/dashboard/DashboardSidebar", () => ({
  DashboardSidebar: () => <aside data-testid="dashboard-sidebar" />,
}));

vi.mock("@/components/dashboard/DashboardHome", () => ({
  DashboardHome: () => <section data-testid="dashboard-home" />,
}));

vi.mock("@/components/dashboard/DashboardCommunities", () => ({
  DashboardCommunities: () => <section data-testid="dashboard-communities" />,
}));

vi.mock("@/components/dashboard/DashboardPolls", () => ({
  DashboardPolls: () => <section data-testid="dashboard-polls" />,
}));

vi.mock("@/components/dashboard/DashboardDailySpin", () => ({
  DashboardDailySpin: () => <section data-testid="dashboard-daily-spin" />,
}));

vi.mock("@/components/dashboard/DashboardStore", () => ({
  DashboardStore: () => <section data-testid="dashboard-store" />,
}));

vi.mock("@/components/dashboard/DashboardSectionShell", () => ({
  DashboardSectionShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/dashboard/CommunityHoldSwitcher", () => ({
  CommunityHoldSwitcher: () => null,
  getCommunityHoldSwitcherTargets: () => [],
}));

vi.mock("@/components/notifications/NotificationConsentPrompt", () => ({
  NotificationConsentPrompt: () => null,
}));

vi.mock("@/components/ui/LevelUpCelebration", () => ({
  LevelUpCelebration: () => null,
}));

vi.mock("@/backend/supabase/controllers/communityController", () => ({
  fetchCommunities: vi.fn(async () => []),
}));

vi.mock("@/backend/supabase/controllers/userExtrasController", () => ({
  getUserFavoriteCommunities: vi.fn(async () => []),
  getUserPinnedMessages: vi.fn(async () => []),
  removeUserPinnedMessage: vi.fn(async () => undefined),
}));

vi.mock("@/lib/communityChat", () => ({
  readCommunityChats: vi.fn(() => []),
}));

vi.mock("@/lib/communityCache", () => ({
  readCachedCommunities: vi.fn(() => null),
  writeCachedCommunities: vi.fn(),
}));

vi.mock("@/lib/identitySelection", () => ({
  CHAT_IDENTITY_CHANGED_EVENT: "raw:chat-identity-changed",
  hydrateChatIdentityFromServer: vi.fn(async () => undefined),
  readSelectedChatAlias: vi.fn(() => null),
  writeSelectedChatAlias: vi.fn(),
}));

vi.mock("@/store/useUserProgress", () => ({
  useUserProgress: () => ({
    progress: { xp: 0, level: 1 },
    leveledUpTo: null,
    clearLevelUp: vi.fn(),
    award: vi.fn(async () => undefined),
    awardOnce: vi.fn(async () => undefined),
  }),
}));

const user: User = {
  id: "user-1",
  username: "tester",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
  onboardingCompleted: true,
  profilePublic: true,
};

const props = {
  user,
  polls: [] as Poll[],
  votedPolls: new Set<string>(),
  avatarLevel: 1,
  setAvatarLevel: vi.fn(),
  ownedAvatarLevels: new Set<number>([1]),
  unlockAvatarLevel: vi.fn(async () => true),
  markAvatarOwned: vi.fn(),
  avatarPricesByLevel: {} as Record<number, string>,
  avatarCatalog: [] as AvatarCatalogItem[],
  dailyAnsweredCount: 0,
  dailyPollLimit: 7,
  isDailyPollLimitReached: false,
  tokenBalance: 0,
  addTokens: vi.fn(),
  unlockExtraPolls: vi.fn(),
  vote: vi.fn(),
  onLogout: vi.fn(),
};

describe("Dashboard legacy SEO cleanup", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="seo-landing" class="seo-only">stale landing copy</div><div id="root"></div>';
    vi.clearAllMocks();
  });

  it("removes static SEO landing content from authenticated dashboard DOM", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Dashboard {...props} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.getElementById("seo-landing")).not.toBeInTheDocument();
    });
  });
});
