export interface ChatSendErrorInfo {
  title: string;
  description: string;
  /** false → remove optimistic message; true → mark failed so user can retry */
  retryable: boolean;
}

/**
 * Classify an error thrown by sendMessage (chatController) into a user-facing
 * toast and a retry decision. Blocked-word rejections are permanent — retrying
 * the same text will never succeed, so we remove the optimistic message instead
 * of leaving it in a retryable failed state.
 */
export function getChatSendErrorInfo(error: unknown): ChatSendErrorInfo {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";

  if (msg === "blocked_word" || msg.includes("blocked_word")) {
    return {
      title: "Message blocked",
      description: "That message contains blocked content.",
      retryable: false,
    };
  }

  if (msg === "not_a_member") {
    return {
      title: "Not a member",
      description: "Join the community before sending messages.",
      retryable: false,
    };
  }

  if (msg === "not_allowed" || msg === "unauthorized") {
    return {
      title: "Not allowed",
      description: "You don't have permission to send messages here.",
      retryable: false,
    };
  }

  if (msg === "invalid_text_length") {
    return {
      title: "Message too long",
      description: "Keep messages under 2000 characters.",
      retryable: false,
    };
  }

  // Network / transient errors — allow retry
  return {
    title: "Failed to send message",
    description: "Please try again.",
    retryable: true,
  };
}
