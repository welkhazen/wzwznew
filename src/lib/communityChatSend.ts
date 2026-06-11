import type { CommunityChatMessageRecord, SendCommunityMessageInput } from "@/lib/communityChat.types";

type JoinCommunity = (communityId: string, userId: string, username: string) => Promise<void>;
type SendCommunityMessageRemote = (communityId: string, input: SendCommunityMessageInput) => Promise<CommunityChatMessageRecord>;

interface SendDashboardCommunityMessageInput extends SendCommunityMessageInput {
  communityId: string;
  username: string;
  isJoined: boolean;
}

interface SendDashboardCommunityMessageDependencies {
  joinCommunity: JoinCommunity;
  sendMessage: SendCommunityMessageRemote;
}

export interface SendDashboardCommunityMessageResult {
  message: CommunityChatMessageRecord;
  usedLocalFallback: boolean;
}

export async function sendDashboardCommunityMessage(
  input: SendDashboardCommunityMessageInput,
  { joinCommunity, sendMessage }: SendDashboardCommunityMessageDependencies,
): Promise<SendDashboardCommunityMessageResult> {
  if (!input.isJoined) {
    await joinCommunity(input.communityId, input.senderId, input.username);
  }
  const message = await sendMessage(input.communityId, input);
  return { message, usedLocalFallback: false };
}
