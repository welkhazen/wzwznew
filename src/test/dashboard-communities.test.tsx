import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardCommunities } from "@/components/dashboard/DashboardCommunities";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import type { User } from "@/store/types";

const testUser: User = {
  id: "user-me",
  username: "me",
  role: "member",
  moderationStatus: "active",
  warnings: 0,
};

const testCommunity: PersistedCommunityRecord = {
  id: "joined",
  abbr: "JR",
  title: "Joined Room",
  description: "A joined room for smoke testing.",
  topic: "relationships",
  status: "Active",
  locked: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  members: [
    {
      userId: "user-me",
      username: "me",
      joinedAt: "2026-01-01T00:00:00.000Z",
      lastSeenAt: "2026-01-01T00:00:00.000Z",
      notificationsEnabled: true,
    },
  ],
  messages: [
    {
      id: "message-1",
      communityId: "joined",
      senderId: "user-me",
      senderName: "me",
      text: "hello from chat",
      createdAt: "2026-01-01T12:00:00.000Z",
      likedBy: [],
    },
  ],
};

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/hooks/use-confirm-dialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    dialog: null,
  }),
}));

vi.mock("@/backend/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

vi.mock("@/backend/supabase/controllers/communityController", () => ({
  fetchCommunities: vi.fn(async () => [testCommunity]),
  fetchCommunityMessages: vi.fn(async () => testCommunity.messages),
  joinCommunity: vi.fn(),
  leaveCommunity: vi.fn(),
  touchMemberActivity: vi.fn(async () => undefined),
  markCommunityRead: vi.fn(async () => undefined),
  setCommunityNotifications: vi.fn(async () => undefined),
  updateCommunityPresentation: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/communityRequestController", () => ({
  fetchCommunityRequests: vi.fn(async () => []),
  submitCommunityRequest: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/waitlistController", () => ({
  fetchWaitlistSummary: vi.fn(async () => ({ counts: {}, joinedCommunityIds: new Set<string>() })),
  joinCommunityWaitlist: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/communityPollController", () => ({
  fetchCommunityPolls: vi.fn(async () => []),
  createCommunityPoll: vi.fn(),
  voteOnCommunityPoll: vi.fn(),
  deleteCommunityPoll: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/chatController", () => ({
  sendMessage: vi.fn(),
  likeMessage: vi.fn(),
  mapCommunityMessage: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/chatReportsController", () => ({
  submitChatReport: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/userController", () => ({
  getPublicUserProfile: vi.fn(),
}));

vi.mock("@/backend/supabase/controllers/userExtrasController", () => ({
  MAX_FAVORITE_COMMUNITIES: 3,
  getUserFavoriteCommunities: vi.fn(async () => []),
  setUserFavoriteCommunities: vi.fn(),
}));

vi.mock("@/lib/communityAccess", () => ({
  loadCommunityAccess: vi.fn(async () => ({ hasSubscription: false, unlockedIds: new Set<string>() })),
  FREE_COMMUNITY_SLOTS: 2,
  COMMUNITY_UNLOCK_TOKEN_COST: 10,
}));

vi.mock("@/lib/communityPushNotifications", () => ({
  sendCommunityPushNotification: vi.fn(),
}));

describe("DashboardCommunities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("renders the directory view", async () => {
    render(
      <ThemeProvider>
        <DashboardCommunities
          user={testUser}
          onOpenCommunity={vi.fn()}
        />
      </ThemeProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Communities" })).toBeInTheDocument();
    expect(screen.getByText("Joined Room")).toBeInTheDocument();
  });

  it("opens the request community dialog", async () => {
    render(
      <ThemeProvider>
        <DashboardCommunities
          user={testUser}
          onOpenCommunity={vi.fn()}
        />
      </ThemeProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Request a Community/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Request a new community" })).toBeInTheDocument();
  });

  it("renders the chat page when activeCommunityId matches a loaded community", async () => {
    render(
      <ThemeProvider>
        <DashboardCommunities
          user={testUser}
          activeCommunityId="joined"
          onOpenCommunity={vi.fn()}
          onBackToCommunities={vi.fn()}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Joined Room" })).toBeInTheDocument();
    });
    expect(screen.getByText("hello from chat")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });
});
