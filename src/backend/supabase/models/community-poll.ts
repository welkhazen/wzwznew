export interface CommunityPollOptionRow {
  id: string;
  community_poll_id: string;
  label: string;
  position: number;
}

export interface CommunityPollVoteRow {
  id: string;
  community_poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface CommunityPollRow {
  id: string;
  community_id: string;
  question: string;
  created_by_user_id: string;
  created_by_username: string;
  created_at: string;
  community_poll_options?: CommunityPollOptionRow[];
  community_poll_votes?: CommunityPollVoteRow[];
}

export interface CommunityPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface CommunityPollRecord {
  id: string;
  communityId: string;
  question: string;
  createdByUserId: string;
  createdByUsername: string;
  createdAt: string;
  options: CommunityPollOption[];
  /** option id the current user selected, if any */
  userVoteOptionId: string | null;
  /** total votes across all options */
  totalVotes: number;
}

export interface CreateCommunityPollInput {
  communityId: string;
  question: string;
  options: string[];
  createdByUserId: string;
  createdByUsername: string;
}
