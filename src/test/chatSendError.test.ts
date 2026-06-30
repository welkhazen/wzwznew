import { describe, expect, it } from "vitest";
import { getChatSendErrorInfo } from "@/lib/chatSendError";

describe("getChatSendErrorInfo", () => {
  it("blocked_word error is non-retryable with specific message", () => {
    const result = getChatSendErrorInfo(new Error("blocked_word"));
    expect(result.title).toBe("Message blocked");
    expect(result.description).toBe("That message contains blocked content.");
    expect(result.retryable).toBe(false);
  });

  it("also matches when error message contains blocked_word", () => {
    const result = getChatSendErrorInfo(new Error("P0001: blocked_word"));
    expect(result.title).toBe("Message blocked");
    expect(result.retryable).toBe(false);
  });

  it("not_a_member is non-retryable", () => {
    const result = getChatSendErrorInfo(new Error("not_a_member"));
    expect(result.retryable).toBe(false);
    expect(result.title).toBe("Not a member");
  });

  it("not_allowed is non-retryable", () => {
    const result = getChatSendErrorInfo(new Error("not_allowed"));
    expect(result.retryable).toBe(false);
  });

  it("unauthorized is non-retryable", () => {
    const result = getChatSendErrorInfo(new Error("unauthorized"));
    expect(result.retryable).toBe(false);
  });

  it("invalid_text_length is non-retryable", () => {
    const result = getChatSendErrorInfo(new Error("invalid_text_length"));
    expect(result.retryable).toBe(false);
  });

  it("network/unknown errors are retryable", () => {
    const result = getChatSendErrorInfo(new Error("Failed to fetch"));
    expect(result.title).toBe("Failed to send message");
    expect(result.description).toBe("Please try again.");
    expect(result.retryable).toBe(true);
  });

  it("non-Error unknowns are retryable", () => {
    expect(getChatSendErrorInfo(null).retryable).toBe(true);
    expect(getChatSendErrorInfo("some string error").retryable).toBe(true);
    expect(getChatSendErrorInfo(42).retryable).toBe(true);
  });

  it("string 'blocked_word' is classified correctly", () => {
    const result = getChatSendErrorInfo("blocked_word");
    expect(result.retryable).toBe(false);
    expect(result.title).toBe("Message blocked");
  });
});
