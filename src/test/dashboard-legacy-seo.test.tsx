import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "@/pages/Dashboard";
import type { User } from "@/store/types";

vi.mock("@/components/ui/floating-dock", () => ({
  FloatingDock: () => null,
}));

vi.mock("@/lib/identitySelection", () => ({
  hydrateChatIdentityFromServer: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/communityController", () => ({
  fetchCommunities: vi.fn(async () => []),
}));

vi.mock("@/lib/communityCache", () => ({
  readCachedCommunities: vi.fn(() => null),
  writeCachedCommunities: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/userExtrasController", () => ({
  getUserFavoriteCommunities: vi.fn(async () => []),
  getUserPinnedMessages: vi.fn(async () => []),
  removeUserPinnedMessage: vi.fn(),
}));

vi.mock("@/components/dashboard/DashboardNav", () => ({
  DashboardNav: () => <nav aria-label="Dashboard navigation" />,
}));

vi.mock("@/components/dashboard/DashboardSidebar", () => ({
  DashboardSidebar: () => <aside aria-label="Dashboard sidebar" />,
}));

vi.mock("@/components/dashboard/DashboardHome", () => ({
  DashboardHome: () => <section>Dashboard home</section>,
}));

vi.mock("@/components/dashboard/DashboardSectionShell", () => ({
  DashboardSectionShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/dashboard/CommunityHoldSwitcher", () => ({
  CommunityHoldSwitcher: () => null,
}));

vi.mock("@/components/notifications/NotificationConsentPrompt", () => ({
  NotificationConsentPrompt: () => null,
}));

vi.mock("@/components/ui/LevelUpCelebration", () => ({
  LevelUpCelebration: () => null,
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

vi.mock("@/components/dashboard/DashboardPolls", () => ({
  DashboardPolls: () => <section>Polls</section>,
}));

vi.mock("@/components/dashboard/DashboardCommunities", () => ({
  DashboardCommunities: () => <section>Communities</section>,
}));

vi.mock("@/components/dashboard/DashboardChallenges", () => ({
  DashboardChallenges: () => <section>Challenges</section>,
}));

vi.mock("@/components/dashboard/DashboardDailySpin", () => ({
  DashboardDailySpin: () => <section>Daily spin</section>,
}));

vi.mock("@/components/dashboard/DashboardProfile", () => ({
  DashboardProfile: () => <section>Profile</section>,
}));

vi.mock("@/components/dashboard/DashboardWallet", () => ({
  DashboardWallet: () => <section>Wallet</section>,
}));

vi.mock("@/components/dashboard/DashboardSettings", () => ({
  DashboardSettings: () => <section>Settings</section>,
}));

vi.mock("@/components/dashboard/DashboardInventory", () => ({
  DashboardInventory: () => <section>Inventory</section>,
}));

vi.mock("@/components/dashboard/DashboardStore", () => ({
  DashboardStore: () => <section>Store</section>,
}));

const testUser: User = {
  id: "user-1",
  username: "anonymous",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
};

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Dashboard
        user={testUser}
        polls={[]}
        votedPolls={new Set()}
        avatarLevel={1}
        setAvatarLevel={vi.fn()}
        ownedAvatarLevels={new Set()}
        unlockAvatarLevel={vi.fn(async () => true)}
        markAvatarOwned={vi.fn()}
        avatarPricesByLevel={{}}
        avatarCatalog={[]}
        dailyAnsweredCount={0}
        dailyPollLimit={7}
        isDailyPollLimitReached={false}
        tokenBalance={0}
        addTokens={vi.fn()}
        unlockExtraPolls={vi.fn()}
        vote={vi.fn()}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
    { container: document.getElementById("root")! },
  );
}

describe("Dashboard legacy SEO fallback cleanup", () => {
  it("removes the static landing SEO block outside the app root", async () => {
    document.body.innerHTML = `
      <div id="seo-landing" class="seo-only">
        <h1>Anonymous Online Communities & 24/7 Group Chats | raW</h1>
        <a href="/polls-explained">How polls work</a>
      </div>
      <div id="root"></div>
    `;

    renderDashboard();

    expect(screen.getByText("Dashboard home")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.getElementById("seo-landing")).not.toBeInTheDocument();
    });
  });
});
