import {
  OPENAI_MODERATION_MODEL,
  type ModerationSignal,
  type ModerationSurface,
} from "@/lib/moderationPolicy";
import { normalizePlainText } from "@/lib/inputSecurity";

export interface OpenAIModerationInput {
  text: string;
  surface: ModerationSurface;
  userId?: string;
  communityId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface PreparedOpenAIModerationRequest {
  model: typeof OPENAI_MODERATION_MODEL;
  input: string;
}

export const OPENAI_MODERATION_ENABLED = false;

export function prepareOpenAIModerationRequest(input: OpenAIModerationInput): PreparedOpenAIModerationRequest {
  return {
    model: OPENAI_MODERATION_MODEL,
    input: normalizePlainText(input.text),
  };
}

export async function moderateWithOpenAI(input: OpenAIModerationInput): Promise<ModerationSignal> {
  const prepared = prepareOpenAIModerationRequest(input);
  void prepared;

  return {
    provider: "openai",
    flagged: false,
    categories: {},
    skipped: true,
    reason: "openai_moderation_not_connected",
  };
}
