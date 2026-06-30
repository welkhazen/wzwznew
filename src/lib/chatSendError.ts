export interface ChatSendErrorInfo {
  title: string;
  description: string;
  /** false → remove optimistic message; true → mark failed so user can retry */
  retryable: boolean;
}

const SEND_ERROR_MAP: Record<string, ChatSendErrorInfo> = {
  not_a_member: { title: "Not a member", description: "Join the community before sending messages.", retryable: false },
  not_allowed:  { title: "Not allowed",  description: "You don't have permission to send messages here.", retryable: false },
  unauthorized: { title: "Not allowed",  description: "You don't have permission to send messages here.", retryable: false },
  invalid_text_length: { title: "Message too long", description: "Keep messages under 2000 characters.", retryable: false },
};

const BLOCKED_WORD_INFO: ChatSendErrorInfo = {
  title: "Message blocked",
  description: "That message contains blocked content.",
  retryable: false,
};

const DEFAULT_SEND_ERROR: ChatSendErrorInfo = {
  title: "Failed to send message",
  description: "Please try again.",
  retryable: true,
};

/**
 * Classify an error thrown by sendMessage (chatController) into a user-facing
 * toast and a retry decision. Blocked-word rejections are permanent — retrying
 * the same text will never succeed, so we remove the optimistic message instead
 * of leaving it in a retryable failed state.
 */
export function getChatSendErrorInfo(error: unknown): ChatSendErrorInfo {
  const msg =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (msg === "blocked_word" || msg.includes("blocked_word")) return BLOCKED_WORD_INFO;
  return SEND_ERROR_MAP[msg] ?? DEFAULT_SEND_ERROR;
}
