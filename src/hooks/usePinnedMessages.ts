import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  MAX_PINNED_MESSAGES,
  PinnedMessageLimitError,
  addUserPinnedMessage,
  getUserPinnedMessages,
  notifyMessagePinned,
  removeUserPinnedMessage,
  type PinnedMessageRecord,
} from "@/backend/supabase/controllers/userExtrasController";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";

export interface PinnedMessagesState {
  ownPinnedMessages: PinnedMessageRecord[];
  setOwnPinnedMessages: React.Dispatch<React.SetStateAction<PinnedMessageRecord[]>>;
  ownPinnedMessageIds: Set<string>;
  pinMessage: (message: CommunityChatMessageRecord) => void;
  unpinMessage: (message: CommunityChatMessageRecord) => void;
  removePinnedMessage: (messageId: string) => Promise<void>;
}

export function usePinnedMessages(
  userId: string,
  selectedCommunity: PersistedCommunityRecord | null,
): PinnedMessagesState {
  const [ownPinnedMessages, setOwnPinnedMessages] = useState<PinnedMessageRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const messages = await getUserPinnedMessages(userId);
        if (!cancelled) setOwnPinnedMessages(messages);
      } catch {
        // best-effort
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const broadcastPinnedMessageUpdated = useCallback(
    (messages: PinnedMessageRecord[]) => {
      window.dispatchEvent(
        new CustomEvent("raw:pinned-message-updated", { detail: { userId, messages } }),
      );
    },
    [userId],
  );

  const ownPinnedMessageIds = useMemo(
    () => new Set(ownPinnedMessages.map((m) => m.messageId)),
    [ownPinnedMessages],
  );

  const removePinnedMessage = useCallback(
    async (messageId: string) => {
      try {
        await removeUserPinnedMessage(userId, messageId);
        const next = ownPinnedMessages.filter((m) => m.messageId !== messageId);
        setOwnPinnedMessages(next);
        broadcastPinnedMessageUpdated(next);
        toast({ title: "Pinned message removed" });
      } catch {
        toast({ title: "Could not remove pinned message", description: "Please try again." });
      }
    },
    [broadcastPinnedMessageUpdated, ownPinnedMessages, userId],
  );

  const pinMessageToProfile = useCallback(
    async (message: CommunityChatMessageRecord, community: PersistedCommunityRecord) => {
      if (ownPinnedMessages.length >= MAX_PINNED_MESSAGES) {
        toast({ title: "Pin limit reached", description: `You can only pin up to ${MAX_PINNED_MESSAGES} messages. Remove one first.` });
        return;
      }
      try {
        const payload = {
          messageId: message.id,
          communityId: community.id,
          communityTitle: community.title,
          senderName: message.senderName,
          messageText: message.text,
          messageCreatedAt: message.createdAt,
        };
        const next_pin = await addUserPinnedMessage(userId, payload);
        const next = [...ownPinnedMessages, next_pin];
        setOwnPinnedMessages(next);
        broadcastPinnedMessageUpdated(next);
        toast({ title: "Pinned to your profile", description: "Others will see this message on your chat profile." });
        if (message.senderId && message.senderId !== userId) {
          notifyMessagePinned({
            recipientUserId: message.senderId,
            messageId: message.id,
            communityId: community.id,
            communityTitle: community.title,
            messageText: message.text,
          }).catch(() => {});
        }
      } catch (error) {
        if (error instanceof PinnedMessageLimitError) {
          toast({ title: "Pin limit reached", description: error.message });
        } else {
          toast({ title: "Could not pin message", description: "Please try again." });
        }
      }
    },
    [broadcastPinnedMessageUpdated, ownPinnedMessages, userId],
  );

  const pinMessage = useCallback(
    (message: CommunityChatMessageRecord) => {
      if (!selectedCommunity) return;
      void pinMessageToProfile(message, selectedCommunity);
    },
    [pinMessageToProfile, selectedCommunity],
  );

  const unpinMessage = useCallback(
    (message: CommunityChatMessageRecord) => {
      void removePinnedMessage(message.id);
    },
    [removePinnedMessage],
  );

  return {
    ownPinnedMessages,
    setOwnPinnedMessages,
    ownPinnedMessageIds,
    pinMessage,
    unpinMessage,
    removePinnedMessage,
  };
}
