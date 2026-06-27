export interface User {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  referralCode?: string | null;
  createdAt: number;
  updatedAt: number;
  passwordChangedAt: number;
}

export interface UserRecord extends User {
  passwordHash: string;
  votedPollIds: Set<string>;
  createdAt: number;
}

export interface ReferralActivationRecord {
  id: string;
  inviterUserId: string;
  referredUserId: string;
  referredUsername: string;
  referralCode: string;
  createdAt: number;
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

export interface AuthSessionData {
  userId?: string;
  anonymousVotes?: string[];
}

export interface BootstrapResponse {
  user: User | null;
  isLoggedIn: boolean;
  polls: Poll[];
  votedPollIds: string[];
  freeVotesUsed: number;
}
