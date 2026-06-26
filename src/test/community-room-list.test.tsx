import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommunityRoomList } from "@/components/dashboard/CommunityRoomList";
import type { CommunityJoinRequestRecord } from "@/lib/adminData";
import type { CommunityChatMemberRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";

const member: CommunityChatMemberRecord = {
  userId: "user-me",
  username: "me",
  joinedAt: "2026-01-01T00:00:00.000Z",
  lastSeenAt: "2026-01-01T00:00:00.000Z",
  notificationsEnabled: true,
};

function community(overrides: Partial<PersistedCommunityRecord>): PersistedCommunityRecord {
  return {
    id: "community-1",
    abbr: "C1",
    title: "Late Night Talks",
    description: "A community for late night conversations.",
    topic: "relationships",
    status: "Active",
    locked: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    members: [],
    messages: [],
    ...overrides,
  };
}

function renderRoomList(overrides: Partial<React.ComponentProps<typeof CommunityRoomList>> = {}) {
  const props: React.ComponentProps<typeof CommunityRoomList> = {
    communities: [
      community({ id: "joined", title: "Joined Room", abbr: "JR", members: [member] }),
      community({ id: "locked", title: "Locked Room", abbr: "LR", locked: true }),
    ],
    userId: "user-me",
    logoUrlsByCommunityId: {},
    coverImagesByCommunityId: {},
    coverVideosByCommunityId: {},
    expandedDescriptionIds: new Set(),
    joinRequests: [],
    waitlistJoinedIds: new Set(),
    waitlistCounts: {},
    waitlistJoiningId: null,
    waitlistUnlockThreshold: 10,
    hasSubscriptionAccess: false,
    unlockedCommunityIds: new Set(),
    freeCommunitySlotsRemaining: 0,
    unlockingId: null,
    unlockTokenCost: 50,
    onToggleDescription: vi.fn(),
    onPaidJoinCommunity: vi.fn(),
    onJoinWaitlist: vi.fn(),
    onOpenCommunity: vi.fn(),
    onUnlockCommunity: vi.fn(),
    ...overrides,
  };

  render(<CommunityRoomList {...props} />);
  return props;
}

describe("CommunityRoomList", () => {
  it("renders community cards", () => {
    renderRoomList();

    expect(screen.getByText("Joined Room")).toBeInTheDocument();
    expect(screen.getByText("Locked Room")).toBeInTheDocument();
  });

  it("joined communities show Open Chat", () => {
    renderRoomList({ communities: [community({ id: "joined", title: "Joined Room", members: [member] })] });

    expect(screen.getByRole("button", { name: "Open Chat" })).toBeInTheDocument();
  });

  it("locked communities show the waitlist state", () => {
    renderRoomList({
      communities: [community({ id: "locked", title: "Locked Room", locked: true })],
      waitlistJoinedIds: new Set(["locked"]),
      waitlistCounts: { locked: 4 },
    });

    expect(screen.getByRole("button", { name: /On Waitlist/i })).toBeDisabled();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("/10")).toBeInTheDocument();
  });

  it("unjoined unlocked cards with a free slot call onUnlockCommunity via the free button", () => {
    const props = renderRoomList({
      communities: [community({ id: "public", title: "Public Room", locked: false })],
      freeCommunitySlotsRemaining: 1,
    });

    fireEvent.click(screen.getByRole("button", { name: "Open Chat — Free" }));

    expect(props.onUnlockCommunity).toHaveBeenCalledWith("public");
  });

  it("clicking Open Chat calls onOpenCommunity for joined communities", () => {
    const props = renderRoomList({
      communities: [community({ id: "joined", title: "Joined Room", members: [member] })],
    });

    fireEvent.click(screen.getByRole("button", { name: "Open Chat" }));

    expect(props.onOpenCommunity).toHaveBeenCalledWith("joined");
  });

  it("waitlist button calls onJoinWaitlist", () => {
    const lockedCommunity = community({ id: "locked", title: "Locked Room", locked: true });
    const props = renderRoomList({ communities: [lockedCommunity] });

    fireEvent.click(screen.getByRole("button", { name: /Join Waitlist/i }));

    expect(props.onJoinWaitlist).toHaveBeenCalledWith(lockedCommunity);
  });

  it("approved locked communities call the paid join callback", () => {
    const approvedRequest: CommunityJoinRequestRecord = {
      id: "request-1",
      communityId: "locked",
      communityTitle: "Locked Room",
      requesterId: "user-me",
      requesterName: "me",
      submittedAt: "2026-01-01T00:00:00.000Z",
      status: "approved",
    };
    const props = renderRoomList({
      communities: [community({ id: "locked", title: "Locked Room", locked: true })],
      joinRequests: [approvedRequest],
    });

    fireEvent.click(screen.getByRole("button", { name: /Join Group/ }));

    expect(props.onPaidJoinCommunity).toHaveBeenCalledWith("locked", true);
  });

  it("unjoined unlocked cards with no free slots call the paid join callback", () => {
    const props = renderRoomList({
      communities: [community({ id: "public", title: "Public Room", locked: false })],
    });

    fireEvent.click(screen.getByRole("button", { name: "Join" }));

    expect(props.onPaidJoinCommunity).toHaveBeenCalledWith("public", true);
  });
});
