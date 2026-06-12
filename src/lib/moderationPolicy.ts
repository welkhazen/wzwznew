export const OPENAI_MODERATION_MODEL = "omni-moderation-latest";

export type ModerationSurface =
  | "community_chat"
  | "general_feed"
  | "poll_comment"
  | "landing_question"
  | "username";

export type ModerationCategory =
  | "sexual"
  | "sexual/minors"
  | "harassment"
  | "harassment/threatening"
  | "hate"
  | "hate/threatening"
  | "illicit"
  | "illicit/violent"
  | "self-harm"
  | "self-harm/intent"
  | "self-harm/instructions"
  | "violence"
  | "violence/graphic";

export type ModerationDecisionAction = "allow" | "warn" | "hold" | "block";

export interface ModerationSignal {
  provider: "local" | "openai";
  flagged: boolean;
  categories: Partial<Record<ModerationCategory, boolean>>;
  categoryScores?: Partial<Record<ModerationCategory, number>>;
  skipped?: boolean;
  reason?: string;
}

export interface ModerationDecision {
  action: ModerationDecisionAction;
  shouldPost: boolean;
  shouldNotifyUser: boolean;
  shouldCreateReview: boolean;
  userMessage?: string;
  primaryCategory?: ModerationCategory;
}

const BLOCK_CATEGORIES = new Set<ModerationCategory>([
  "sexual/minors",
  "hate/threatening",
  "illicit/violent",
  "self-harm/intent",
  "self-harm/instructions",
  "violence/graphic",
]);

const HOLD_CATEGORIES = new Set<ModerationCategory>([
  "harassment/threatening",
  "hate",
  "illicit",
  "self-harm",
  "violence",
]);

const WARN_CATEGORIES = new Set<ModerationCategory>([
  "harassment",
  "sexual",
]);

export function getFlaggedModerationCategories(signal: ModerationSignal): ModerationCategory[] {
  return (Object.entries(signal.categories) as Array<[ModerationCategory, boolean]>)
    .filter(([, flagged]) => flagged)
    .map(([category]) => category);
}

export function decideModerationAction(signal: ModerationSignal): ModerationDecision {
  if (signal.skipped || !signal.flagged) {
    return {
      action: "allow",
      shouldPost: true,
      shouldNotifyUser: false,
      shouldCreateReview: false,
    };
  }

  const categories = getFlaggedModerationCategories(signal);
  const primaryCategory = categories[0];

  if (categories.some((category) => BLOCK_CATEGORIES.has(category))) {
    return {
      action: "block",
      shouldPost: false,
      shouldNotifyUser: true,
      shouldCreateReview: true,
      primaryCategory,
      userMessage: "This cannot be posted because it may break safety rules.",
    };
  }

  if (categories.some((category) => HOLD_CATEGORIES.has(category))) {
    return {
      action: "hold",
      shouldPost: false,
      shouldNotifyUser: true,
      shouldCreateReview: true,
      primaryCategory,
      userMessage: "This needs review before it can be posted.",
    };
  }

  if (categories.some((category) => WARN_CATEGORIES.has(category))) {
    return {
      action: "warn",
      shouldPost: true,
      shouldNotifyUser: true,
      shouldCreateReview: true,
      primaryCategory,
      userMessage: "This may be reviewed by the moderation team.",
    };
  }

  return {
    action: "hold",
    shouldPost: false,
    shouldNotifyUser: true,
    shouldCreateReview: true,
    primaryCategory,
    userMessage: "This needs review before it can be posted.",
  };
}
