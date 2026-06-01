export interface User {
  id: string;
  username: string;
  role: "member" | "admin";
  moderationStatus: "active" | "warned" | "banned";
  warnings: number;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  locked: boolean;
}

export type OnboardingStep = "avatar" | "polls" | "communities" | "marketplace" | "ready";
