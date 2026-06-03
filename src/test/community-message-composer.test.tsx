import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommunityMessageComposer } from "@/components/dashboard/CommunityMessageComposer";
import type { CommunityChatMemberRecord } from "@/lib/communityChat.types";

const members: CommunityChatMemberRecord[] = [
  {
    userId: "user-alice",
    username: "alice",
    joinedAt: "2026-01-01T00:00:00.000Z",
    lastSeenAt: "2026-01-01T00:00:00.000Z",
    notificationsEnabled: true,
  },
  {
    userId: "user-bob",
    username: "bob",
    joinedAt: "2026-01-01T00:00:00.000Z",
    lastSeenAt: "2026-01-01T00:00:00.000Z",
    notificationsEnabled: true,
  },
];

function renderComposer(overrides: Partial<React.ComponentProps<typeof CommunityMessageComposer>> = {}) {
  const props: React.ComponentProps<typeof CommunityMessageComposer> = {
    inputRef: createRef<HTMLInputElement>(),
    draft: "",
    maxLength: 240,
    members,
    mentionQuery: null,
    mentionIndex: 0,
    canManagePolls: false,
    disabled: false,
    onDraftChange: vi.fn(),
    onMentionQueryChange: vi.fn(),
    onMentionIndexChange: vi.fn(),
    onOpenPollComposer: vi.fn(),
    onSendMessage: vi.fn(),
    ...overrides,
  };

  render(<CommunityMessageComposer {...props} />);
  return props;
}

describe("CommunityMessageComposer", () => {
  it("renders the input and send button", () => {
    renderComposer();

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("calls the draft callback while typing", () => {
    const props = renderComposer();

    fireEvent.change(screen.getByPlaceholderText("Type a message..."), {
      target: { value: "hello room" },
    });

    expect(props.onDraftChange).toHaveBeenCalledWith("hello room");
  });

  it("pressing Enter sends the message", () => {
    const props = renderComposer({ draft: "hello" });

    fireEvent.keyDown(screen.getByPlaceholderText("Type a message..."), { key: "Enter" });

    expect(props.onSendMessage).toHaveBeenCalledTimes(1);
  });

  it("disables the input and send button when posting is disabled", () => {
    renderComposer({ disabled: true });

    expect(screen.getByPlaceholderText("Type a message...")).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("Chat posting is disabled for this account.")).toBeInTheDocument();
  });

  it("shows mention suggestions when a mention query exists", () => {
    renderComposer({ draft: "@a", mentionQuery: "a" });

    expect(screen.getByRole("button", { name: "@alice" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "@bob" })).not.toBeInTheDocument();
  });

  it("clicking a mention inserts the selected username", () => {
    const props = renderComposer({ draft: "hi @a", mentionQuery: "a" });

    fireEvent.mouseDown(screen.getByRole("button", { name: "@alice" }));

    expect(props.onDraftChange).toHaveBeenCalledWith("hi @alice ");
    expect(props.onMentionQueryChange).toHaveBeenCalledWith(null);
  });

  it("shows the poll button only when poll management is allowed", () => {
    const { rerender } = render(
      <CommunityMessageComposer
        inputRef={createRef<HTMLInputElement>()}
        draft=""
        maxLength={240}
        members={members}
        mentionQuery={null}
        mentionIndex={0}
        canManagePolls={false}
        disabled={false}
        onDraftChange={vi.fn()}
        onMentionQueryChange={vi.fn()}
        onMentionIndexChange={vi.fn()}
        onOpenPollComposer={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Post a poll" })).not.toBeInTheDocument();

    rerender(
      <CommunityMessageComposer
        inputRef={createRef<HTMLInputElement>()}
        draft=""
        maxLength={240}
        members={members}
        mentionQuery={null}
        mentionIndex={0}
        canManagePolls={true}
        disabled={false}
        onDraftChange={vi.fn()}
        onMentionQueryChange={vi.fn()}
        onMentionIndexChange={vi.fn()}
        onOpenPollComposer={vi.fn()}
        onSendMessage={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Post a poll" })).toBeInTheDocument();
  });
});
