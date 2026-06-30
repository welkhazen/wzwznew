import { useEffect } from "react";
import { supabase } from "@/backend/supabase/client";
import {
  mapCommunityMessage,
  type DbCommunityMessage,
} from "@/backend/supabase/controllers/chatController";
import {
  removeCommunityMessage,
  upsertCommunityMessage,
} from "@/lib/communityChatState";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";

type Updater = (mutate: (current: PersistedCommunityRecord[]) => PersistedCommunityRecord[]) => void;

/**
 * Subscribe to live community_messages INSERT/UPDATE/DELETE across every
 * community the current user can see. The handler routes each event to the
 * right community via payload.new / payload.old's community_id, so previews
 * + unread counts + open chat all stay in sync without per-room channels.
 *
 * Extracted from DashboardCommunities so the realtime contract is testable
 * in isolation (Supabase channel mock → handler invocations).
 */
export function useCommunityMessagesRealtime(updateCommunities: Updater): void {
  useEffect(() => {
    const channel = supabase
      .channel("community-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        (payload) => {
          if (import.meta.env.DEV) {
            console.debug("[realtime] community_messages", payload.eventType, payload.new ?? payload.old);
          }
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string; community_id?: string } | null;
            if (oldRow?.id && oldRow.community_id) {
              updateCommunities((current) =>
                removeCommunityMessage(current, oldRow.community_id!, oldRow.id!),
              );
            }
            return;
          }
          const nextMessage = mapCommunityMessage(payload.new as DbCommunityMessage);
          if (!nextMessage.communityId) return;
          updateCommunities((current) =>
            upsertCommunityMessage(current, nextMessage.communityId, nextMessage),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [updateCommunities]);
}
