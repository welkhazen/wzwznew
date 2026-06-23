import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommunityMessageTimeline } from "@/components/dashboard/CommunityMessageTimeline";
import type { CommunityPollRecord } from "@/backend/supabase/models/community-poll";
import type { CommunityChatMessageRecord } from "@/lib/communityChat.types";

const ownMessage: CommunityChatMessageRecord = {
  id: "message-own",
  communityId: "community-1",
  senderId: "user-me",
  senderName: "me",
  text: "I like this room",
  createdAt: "2026-01-01T12:00:00.000Z",
  likedBy: [],
};

const otherMessage: CommunityChatMessageRecord = {
  id: "message-other",
  communityId: "community-1",
  senderId: "user-ana",
  senderName: "ana",
  text: "hello @me",
  createdAt: "2026-01-01T12:01:00.000Z",
  likedBy: [],
};

const failedMessage: CommunityChatMessageRecord = {
  ...ownMessage,
  id: "message-failed",
  text: "try again",
  deliveryStatus: "failed",
};

const poll: CommunityPollRecord = {
  id: "poll-1",
  communityId: "community-1",
  question: "Pick one?",
  createdByUserId: "user-me",
  createdByUsername: "me",
  createdAt: "2026-01-01T12:02:00.000Z",
  options: [
    { id: "option-yes", text: "Yes", votes: 2 },
    { id: "option-no", text: "No", votes: 1 },
  ],
  userVoteOptionId: null,
  totalVotes: 3,
};

function renderTimeline(overrides: Partial<React.ComponentProps<typeof CommunityMessageTimeline>> = {}) {
  const props: React.ComponentProps<typeof CommunityMessageTimeline> = {
    containerRef: createRef<HTMLDivElement>(),
    polls: [],
    groupedMessages: [
      {
        label: "Today",
        messages: [ownMessage, otherMessage],
      },
    ],
    activeMessageCount: 2,
    messagesLoading: false,
    messagesError: false,
    canManagePolls: false,
    userId: "user-me",
    username: "me",
    senderAvatarLevels: {},
    onDeletePoll: vi.fn(),
    onVotePoll: vi.fn(),
    onRetryMessage: vi.fn(),
    onLikeMessage: vi.fn(),
    onOpenSenderProfile: vi.fn(),
    onOpenMessageReport: vi.fn(),
    onBlockMessageSender: vi.fn(),
    pinnedMessageIds: new Set<string>(),
    onPinMessage: vi.fn(),
    onUnpinMessage: vi.fn(),
    ...overrides,
  };

  render(<CommunityMessageTimeline {...props} />);
  return props;
}

describe("CommunityMessageTimeline", () => {
  it("renders grouped messages for own and other senders", () => {
    renderTimeline();

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("I like this room")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("@me")).toBeInTheDocument();
  });

  it("renders polls and votes when an option is clicked", () => {
    const props = renderTimeline({ polls: [poll] });

    fireEvent.click(screen.getByRole("button", { name: /Yes/i }));

    expect(screen.getByText("Pick one?")).toBeInTheDocument();
    expect(screen.getAllByText((_, element) => element?.textContent?.includes("3 votes") ?? false).length).toBeGreaterThan(0);
    expect(props.onVotePoll).toHaveBeenCalledWith("poll-1", "option-yes");
  });

  it("calls the like callback when liking a message", () => {
    const props = renderTimeline();

    fireEvent.click(screen.getAllByRole("button", { name: "Like" })[0]);

    expect(props.onLikeMessage).toHaveBeenCalledWith(ownMessage);
  });

  it("calls retry for a failed message", () => {
    const props = renderTimeline({
      groupedMessages: [{ label: "Today", messages: [failedMessage] }],
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(props.onRetryMessage).toHaveBeenCalledWith(failedMessage);
  });

  it("message actions can report and block another sender", async () => {
    const props = renderTimeline({
      groupedMessages: [{ label: "Today", messages: [otherMessage] }],
    });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Report/i }));
    expect(props.onOpenMessageReport).toHaveBeenCalledWith(otherMessage);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: /Block/i }));
    expect(props.onBlockMessageSender).toHaveBeenCalledWith(otherMessage);
  });

  it("does not show message actions for own messages held in moderation review", () => {
    renderTimeline({
      groupedMessages: [{ label: "Today", messages: [{ ...ownMessage, moderationStatus: "hold" }] }],
    });

    expect(screen.queryByRole("button", { name: "Message actions" })).not.toBeInTheDocument();
  });

  it("does not show message actions for own messages", () => {
    renderTimeline({
      groupedMessages: [{ label: "Today", messages: [ownMessage] }],
      pinnedMessageIds: new Set([ownMessage.id]),
    });

    expect(screen.queryByRole("button", { name: "Message actions" })).not.toBeInTheDocument();
  });

  it("renders the empty quiet state", () => {
    renderTimeline({
      groupedMessages: [],
      activeMessageCount: 0,
      messagesLoading: true,
    });

    expect(screen.getByText("This group is quiet right now. Join and start the first real conversation.")).toBeInTheDocument();
  });
});
