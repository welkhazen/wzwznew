import { describe, expect, it } from "vitest";
import {
  OPENAI_MODERATION_MODEL,
  decideModerationAction,
  type ModerationSignal,
} from "@/lib/moderationPolicy";
import {
  moderateWithOpenAI,
  prepareOpenAIModerationRequest,
} from "@/backend/moderation/openaiModeration";

describe("moderation policy", () => {
  it("blocks severe flagged categories", () => {
    const signal: ModerationSignal = {
      provider: "openai",
      flagged: true,
      categories: { "self-harm/instructions": true },
    };

    expect(decideModerationAction(signal)).toMatchObject({
      action: "block",
      shouldPost: false,
      shouldCreateReview: true,
    });
  });

  it("holds review categories", () => {
    const signal: ModerationSignal = {
      provider: "openai",
      flagged: true,
      categories: { hate: true },
    };

    expect(decideModerationAction(signal)).toMatchObject({
      action: "hold",
      shouldPost: false,
      shouldCreateReview: true,
    });
  });

  it("allows skipped OpenAI moderation while the connector is disabled", async () => {
    const result = await moderateWithOpenAI({
      text: "hello community",
      surface: "community_chat",
      userId: "user-1",
    });

    expect(result).toEqual({
      provider: "openai",
      flagged: false,
      categories: {},
      skipped: true,
      reason: "openai_moderation_not_connected",
    });
  });

  it("prepares the future OpenAI moderation request without sending it", () => {
    expect(prepareOpenAIModerationRequest({
      text: "  hello   world  ",
      surface: "general_feed",
    })).toEqual({
      model: OPENAI_MODERATION_MODEL,
      input: "hello world",
    });
  });
});
