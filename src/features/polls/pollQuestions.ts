export interface PollQuestionSeed {
  id: string;
  question: string;
  yesVotes: number;
  noVotes: number;
}

// Placeholder seed list for local/dev fallback.
// Replace or append entries here whenever you upload your own poll questions.
export const POLL_QUESTION_SEEDS: PollQuestionSeed[] = [
  {
    id: "poll-1",
    question: "Is it wrong to flirt with someone who is in a relationship?",
    yesVotes: 810,
    noVotes: 190,
  },
  {
    id: "poll-2",
    question: "Do you think you would take a bullet for someone you love?",
    yesVotes: 790,
    noVotes: 210,
  },
  {
    id: "poll-3",
    question: "Do you feel more yourself when no one is judging?",
    yesVotes: 810,
    noVotes: 190,
  },
];
