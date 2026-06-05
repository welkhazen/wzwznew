import { supabase } from '../client';
import type { CommunityRequestRecord } from '@/lib/adminData';
import { assertUserTextAllowed } from '@/lib/inputSecurity';

type DbRequest = {
  id: string;
  requester_id: string;
  requester_name: string;
  community_name: string;
  genre: string;
  focus_area: string;
  audience: string;
  why_now: string;
  sample_prompt: string;
  submitted_at: string;
  status: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

function mapRequest(r: DbRequest): CommunityRequestRecord {
  return {
    id: r.id,
    requesterId: r.requester_id,
    requesterName: r.requester_name,
    communityName: r.community_name,
    genre: r.genre,
    focusArea: r.focus_area,
    audience: r.audience,
    whyNow: r.why_now,
    samplePrompt: r.sample_prompt,
    submittedAt: r.submitted_at,
    status: r.status as 'pending' | 'approved' | 'rejected',
    reviewedAt: r.reviewed_at ?? undefined,
    reviewedBy: r.reviewed_by ?? undefined,
  };
}

export async function submitCommunityRequest(params: {
  requesterId: string;
  requesterName: string;
  communityName: string;
  genre: string;
  focusArea: string;
  audience: string;
  whyNow: string;
  samplePrompt: string;
}): Promise<CommunityRequestRecord> {
  const communityName = assertUserTextAllowed(params.communityName);
  const genre = assertUserTextAllowed(params.genre);
  const focusArea = assertUserTextAllowed(params.focusArea);
  const audience = assertUserTextAllowed(params.audience);
  const whyNow = assertUserTextAllowed(params.whyNow);
  const samplePrompt = params.samplePrompt.trim() ? assertUserTextAllowed(params.samplePrompt) : "";

  const { data, error } = await supabase
    .from('community_requests')
    .insert({
      requester_id: params.requesterId,
      requester_name: params.requesterName,
      community_name: communityName,
      genre,
      focus_area: focusArea,
      audience,
      why_now: whyNow,
      sample_prompt: samplePrompt,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRequest(data as DbRequest);
}

export async function fetchCommunityRequests(requesterId?: string): Promise<CommunityRequestRecord[]> {
  let query = supabase
    .from('community_requests')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (requesterId) {
    query = query.eq('requester_id', requesterId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as DbRequest[]).map(mapRequest);
}

export async function updateCommunityRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('community_requests')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: reviewedBy })
    .eq('id', requestId);
  if (error) throw error;
}
