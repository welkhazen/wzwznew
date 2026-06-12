import { moderateUserText } from "@/lib/inputSecurity";
import {
  decideModerationAction,
  type ModerationDecision,
  type ModerationSignal,
} from "@/lib/moderationPolicy";
import {
  moderateWithOpenAI,
  type OpenAIModerationInput,
} from "./openaiModeration";

export interface PreparedModerationResult {
  cleanText: string;
  localSignal: ModerationSignal;
  openAISignal: ModerationSignal;
  decision: ModerationDecision;
}

export async function prepareContentModeration(input: OpenAIModerationInput): Promise<PreparedModerationResult> {
  const localModeration = moderateUserText(input.text);
  const localSignal: ModerationSignal = {
    provider: "local",
    flagged: !localModeration.allowed,
    categories: {},
    skipped: false,
    reason: localModeration.violations[0]?.type,
  };

  const openAISignal = await moderateWithOpenAI({
    ...input,
    text: localModeration.text,
  });

  const decision = decideModerationAction(localSignal.flagged ? localSignal : openAISignal);

  return {
    cleanText: localModeration.text,
    localSignal,
    openAISignal,
    decision,
  };
}
