import { supabase } from '../client';
import type {
  CommunityPollRecord,
  CommunityPollRow,
  CommunityPollOptionRow,
  CommunityPollVoteRow,
  CreateCommunityPollInput,
} from '../models/community-poll';

function mapPoll(row: CommunityPollRow, currentUserId: string | null): CommunityPollRecord {
  const options = [...((row.community_poll_options as CommunityPollOptionRow[]) ?? [])]
    .sort((a, b) => a.position - b.position);
  const votes = (row.community_poll_votes as CommunityPollVoteRow[]) ?? [];

  const votesByOption = new Map<string, number>();
  let userVoteOptionId: string | null = null;
  for (const vote of votes) {
    votesByOption.set(vote.option_id, (votesByOption.get(vote.option_id) ?? 0) + 1);
    if (currentUserId && vote.user_id === currentUserId) {
      userVoteOptionId = vote.option_id;
    }
  }

  return {
    id: row.id,
    communityId: row.community_id,
    question: row.question,
    createdByUserId: row.created_by_user_id,
    createdByUsername: row.created_by_username,
    createdAt: row.created_at,
    options: options.map((opt) => ({
      id: opt.id,
      text: opt.label,
      votes: votesByOption.get(opt.id) ?? 0,
    })),
    userVoteOptionId,
    totalVotes: votes.length,
  };
}

export async function fetchCommunityPolls(
  communityId: string,
  currentUserId: string | null,
): Promise<CommunityPollRecord[]> {
  const { data, error } = await supabase
    .from('community_polls')
    .select('*, community_poll_options(*), community_poll_votes(*)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as CommunityPollRow[]).map((row) => mapPoll(row, currentUserId));
}

export async function createCommunityPoll(
  input: CreateCommunityPollInput,
): Promise<CommunityPollRecord> {
  const cleanedOptions = input.options
    .map((option) => option.trim())
    .filter((option) => option.length > 0);

  if (!input.question.trim()) {
    throw new Error('Poll question is required.');
  }
  if (cleanedOptions.length < 2) {
    throw new Error('Polls need at least two options.');
  }

  const { data: pollRow, error: pollError } = await supabase
    .from('community_polls')
    .insert({
      community_id: input.communityId,
      question: input.question.trim(),
      created_by_user_id: input.createdByUserId,
      created_by_username: input.createdByUsername,
    })
    .select()
    .single();

  if (pollError) throw pollError;

  const { error: optionsError } = await supabase
    .from('community_poll_options')
    .insert(
      cleanedOptions.map((label, position) => ({
        community_poll_id: (pollRow as { id: string }).id,
        label,
        position,
      })),
    );

  if (optionsError) throw optionsError;

  const { data: full, error: fetchError } = await supabase
    .from('community_polls')
    .select('*, community_poll_options(*), community_poll_votes(*)')
    .eq('id', (pollRow as { id: string }).id)
    .single();

  if (fetchError) throw fetchError;
  return mapPoll(full as CommunityPollRow, input.createdByUserId);
}

export async function voteOnCommunityPoll(
  pollId: string,
  optionId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('community_poll_votes')
    .upsert(
      { community_poll_id: pollId, option_id: optionId, user_id: userId },
      { onConflict: 'community_poll_id,user_id' },
    );
  if (error) throw error;
}

export async function deleteCommunityPoll(pollId: string): Promise<void> {
  // Cascade handles options and votes.
  const { error } = await supabase
    .from('community_polls')
    .delete()
    .eq('id', pollId);
  if (error) throw error;
}
