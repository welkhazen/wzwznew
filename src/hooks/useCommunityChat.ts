import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { canManageCommunity, countOnlineMembers, countUnreadMessages, formatChatDayLabel } from "@/lib/communityChat";
import {
  fetchCommunities,
  fetchCommunityMessages,
  markCommunityRead as markCommunityReadSupabase,
  setCommunityNotifications as setCommunityNotificationsSupabase,
  touchMemberActivity,
} from "@/backend/supabase/controllers/communityController";
import {
  fetchCommunityRequests,
} from "@/backend/supabase/controllers/communityRequestController";
import {
  likeMessage,
  sendMessage as sendMessageSupabase,
} from "@/backend/supabase/controllers/chatController";
import { supabase } from "@/backend/supabase/client";
import { getUserTextModerationMessage, moderateUserText } from "@/lib/inputSecurity";
import { buildAvatarIdToLevelMap, readAvatarCatalogLocal } from "@/lib/avatarCatalog";
import { getPrivateAvatarLevel } from "@/lib/avataridentity";
import { CHAT_IDENTITY_CHANGED_EVENT, readSelectedChatAlias } from "@/lib/identitySelection";
import { readCachedCommunities, readCachedMessages, writeCachedCommunities, writeCachedMessages } from "@/lib/communityCache";
import { sendCommunityPushNotification } from "@/lib/communityPushNotifications";
import {
  appendOptimisticMessage,
  getMessageSenderBlockKey,
  markCommunityMessageFailed,
  mergeCommunityMessageList,
  removeCommunityMessage,
  replaceCommunityMessage,
  setCommunityMessages,
  updateMessageLike,
} from "@/lib/communityChatState";
import { buildDefaultCommunities } from "@/lib/communityChat.seed";
import { readBlockedCommunitySenders, writeBlockedCommunitySenders } from "@/lib/blockedCommunitySenders";
import { getChatSendErrorInfo } from "@/lib/chatSendError";
import { readCommunityJoinRequests, type ChatReportRecord, type CommunityJoinRequestRecord } from "@/lib/adminData";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";
import type { CommunityRequestRecord } from "@/lib/adminData";
import { useCommunityMessagesRealtime } from "@/hooks/useCommunityMessagesRealtime";
import { joinCommunity as joinCommunitySupabase } from "@/backend/supabase/controllers/communityController";
import { getPublicUserProfile, type PublicUserProfile } from "@/backend/supabase/controllers/userController";

const MESSAGE_PAGE_SIZE = 10;
const MAX_COMMUNITY_MESSAGE_LENGTH = 150;

export interface CommunityChatState {
  communities: PersistedCommunityRecord[];
  setCommunities: React.Dispatch<React.SetStateAction<PersistedCommunityRecord[]>>;
  updateCommunities: (updater: (c: PersistedCommunityRecord[]) => PersistedCommunityRecord[]) => void;
  selectedCommunity: PersistedCommunityRecord | null;
  isInitialCommunitiesLoading: boolean;
  messagesLoading: boolean;
  messagesError: boolean;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  communityRequests: CommunityRequestRecord[];
  setCommunityRequests: React.Dispatch<React.SetStateAction<CommunityRequestRecord[]>>;
  communityJoinRequests: CommunityJoinRequestRecord[];
  setCommunityJoinRequests: React.Dispatch<React.SetStateAction<CommunityJoinRequestRecord[]>>;
  chatReports: ChatReportRecord[];
  setChatReports: React.Dispatch<React.SetStateAction<ChatReportRecord[]>>;
  messageDraft: string;
  setMessageDraft: React.Dispatch<React.SetStateAction<string>>;
  selectedChatAlias: string | null;
  mentionQuery: string | null;
  setMentionQuery: React.Dispatch<React.SetStateAction<string | null>>;
  mentionIndex: number;
  setMentionIndex: React.Dispatch<React.SetStateAction<number>>;
  blockedSenderKeys: string[];
  blockedSenderKeySet: Set<string>;
  senderAvatarLevels: Record<string, number>;
  activeMessages: CommunityChatMessageRecord[];
  groupedMessages: Array<{ label: string; messages: CommunityChatMessageRecord[] }>;
  isJoined: boolean;
  canManagePolls: boolean;
  onlineNow: number;
  unreadCount: number;
  visibleMembers: PersistedCommunityRecord["members"];
  canEditSelectedCommunity: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messageInputRef: React.RefObject<HTMLInputElement>;
  profileDialogOpen: boolean;
  profileTarget: { message: CommunityChatMessageRecord; profile: PublicUserProfile | null; loading: boolean } | null;
  setProfileDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lastTouchedCommunityRef: React.MutableRefObject<string>;
  reload: () => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendMessage: () => Promise<void>;
  retryMessage: (message: CommunityChatMessageRecord) => Promise<void>;
  likeMessage: (message: CommunityChatMessageRecord) => Promise<void>;
  blockSender: (message: CommunityChatMessageRecord) => void;
  openSenderProfile: (message: CommunityChatMessageRecord) => void;
  setNotifications: (enabled: boolean) => void;
}

export function useCommunityChat(
  activeCommunityId: string | null,
  userId: string,
  username: string,
  avatarLevel: number,
  searchQuery: string,
  onCommunitiesChange?: (communities: PersistedCommunityRecord[]) => void,
): CommunityChatState {
  const cachedCommunities = useMemo(() => readCachedCommunities(), []);

  const [communities, setCommunities] = useState<PersistedCommunityRecord[]>(cachedCommunities?.data ?? []);
  const [isInitialCommunitiesLoading, setIsInitialCommunitiesLoading] = useState(!cachedCommunities);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [communityJoinRequests, setCommunityJoinRequests] = useState<CommunityJoinRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(() => readSelectedChatAlias(userId));
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [blockedSenderKeys, setBlockedSenderKeys] = useState<string[]>(() => readBlockedCommunitySenders(userId));
  const [senderAvatarLevels, setSenderAvatarLevels] = useState<Record<string, number>>({});
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<{
    message: CommunityChatMessageRecord;
    profile: PublicUserProfile | null;
    loading: boolean;
  } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const lastTouchedCommunityRef = useRef<string>("");
  const latestMessagesRequestRef = useRef(0);
  const loadedMessagesCommunityRef = useRef<string | null>(null);
  const preserveScrollAfterOlderLoadRef = useRef<{ previousHeight: number } | null>(null);
  const isNearBottomRef = useRef(true);
  const justSentMessageRef = useRef(false);
  const avatarLevelCacheRef = useRef<Map<string, number>>(new Map());
  const onCommunitiesChangeRef = useRef(onCommunitiesChange);

  const fallbackCommunities = useMemo(() => buildDefaultCommunities(), []);

  const selectedCommunity = useMemo(() => {
    if (!activeCommunityId) return null;
    return (
      communities.find((c) => c.id === activeCommunityId)
      ?? fallbackCommunities.find((c) => c.id === activeCommunityId)
      ?? null
    );
  }, [activeCommunityId, communities, fallbackCommunities]);

  const isJoined = Boolean(selectedCommunity?.members.find((m) => m.userId === userId));
  const canEditSelectedCommunity = selectedCommunity ? canManageCommunity(selectedCommunity, userId, username) : false;
  const canManagePolls = canEditSelectedCommunity;
  const onlineNow = selectedCommunity ? countOnlineMembers(selectedCommunity) : 0;
  const visibleMembers = selectedCommunity?.members.slice(0, 5) ?? [];
  const unreadCount = selectedCommunity && isJoined ? countUnreadMessages(selectedCommunity, userId) : 0;

  useEffect(() => {
    setBlockedSenderKeys(readBlockedCommunitySenders(userId));
  }, [userId]);

  const blockedSenderKeySet = useMemo(() => new Set(blockedSenderKeys), [blockedSenderKeys]);

  const activeMessages = useMemo(
    () => (selectedCommunity?.messages ?? []).filter((m) => !blockedSenderKeySet.has(getMessageSenderBlockKey(m))),
    [blockedSenderKeySet, selectedCommunity],
  );

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeMessages;
    return activeMessages.filter((m) => {
      const hay = [m.senderName, m.text, m.replyToSenderName, m.replyToText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [activeMessages, searchQuery]);

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; messages: CommunityChatMessageRecord[] }> = [];
    filteredMessages.forEach((message) => {
      const label = formatChatDayLabel(message.createdAt);
      const current = groups[groups.length - 1];
      if (!current || current.label !== label) {
        groups.push({ label, messages: [message] });
      } else {
        current.messages.push(message);
      }
    });
    return groups;
  }, [filteredMessages]);

  // Keep ref in sync so updateCommunities can stay stable (no re-subscription on every render)
  useEffect(() => { onCommunitiesChangeRef.current = onCommunitiesChange; });

  const updateCommunities = useCallback(
    (updater: (c: PersistedCommunityRecord[]) => PersistedCommunityRecord[]) => {
      setCommunities((prev) => {
        const next = updater(prev);
        onCommunitiesChangeRef.current?.(next);
        return next;
      });
    },
    [], // stable — reads onCommunitiesChange via ref
  );

  const reload = useCallback(async () => {
    try {
      if (activeCommunityId) {
        const cached = readCachedMessages(activeCommunityId);
        if (cached) {
          updateCommunities((current) => setCommunityMessages(current, activeCommunityId, cached.data));
          setHasOlderMessages(cached.data.length === MESSAGE_PAGE_SIZE);
        } else {
          setMessagesLoading(true);
        }
        setMessagesError(false);
      }

      const [communitiesData, requestsData, activeCommunityMessages] = await Promise.all([
        fetchCommunities(),
        fetchCommunityRequests(userId),
        activeCommunityId
          ? fetchCommunityMessages(activeCommunityId, { limit: MESSAGE_PAGE_SIZE }).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (activeCommunityId && activeCommunityMessages === null) {
        setMessagesError(true);
      }
      if (activeCommunityId && activeCommunityMessages) {
        loadedMessagesCommunityRef.current = activeCommunityId;
        setHasOlderMessages(activeCommunityMessages.length === MESSAGE_PAGE_SIZE);
        writeCachedMessages(activeCommunityId, activeCommunityMessages);
      }
      setCommunities((previous) => {
        const next = communitiesData.map((community) => ({
          ...community,
          messages:
            community.id === activeCommunityId && activeCommunityMessages
              ? activeCommunityMessages
              : previous.find((item) => item.id === community.id)?.messages ?? community.messages,
        }));
        writeCachedCommunities(communitiesData);
        onCommunitiesChange?.(next);
        return next;
      });
      setCommunityRequests(requestsData);
      setCommunityJoinRequests(readCommunityJoinRequests());
    } finally {
      setMessagesLoading(false);
      setIsInitialCommunitiesLoading(false);
    }
  }, [activeCommunityId, onCommunitiesChange, userId, updateCommunities]);

  const loadLatestMessages = useCallback(async () => {
    if (!activeCommunityId) {
      setHasOlderMessages(false);
      setMessagesLoading(false);
      setMessagesError(false);
      return;
    }
    if (loadedMessagesCommunityRef.current === activeCommunityId) return;

    const requestId = latestMessagesRequestRef.current + 1;
    latestMessagesRequestRef.current = requestId;

    const cached = readCachedMessages(activeCommunityId);
    if (cached) {
      const communityId = activeCommunityId;
      setHasOlderMessages(cached.data.length === MESSAGE_PAGE_SIZE);
      updateCommunities((current) => setCommunityMessages(current, communityId, cached.data));
      setMessagesLoading(false);
      setMessagesError(false);
    } else {
      setMessagesLoading(true);
      setMessagesError(false);
    }

    try {
      const communityId = activeCommunityId;
      const messages = await fetchCommunityMessages(communityId, { limit: MESSAGE_PAGE_SIZE });
      if (latestMessagesRequestRef.current !== requestId) return;
      loadedMessagesCommunityRef.current = communityId;
      setHasOlderMessages(messages.length === MESSAGE_PAGE_SIZE);
      updateCommunities((current) => setCommunityMessages(current, communityId, messages));
      writeCachedMessages(communityId, messages);
    } catch {
      if (latestMessagesRequestRef.current === requestId && !cached) {
        setMessagesError(true);
      }
    } finally {
      if (latestMessagesRequestRef.current === requestId) {
        setMessagesLoading(false);
      }
    }
  }, [activeCommunityId, updateCommunities]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeCommunityId || isLoadingOlderMessages || activeMessages.length === 0 || !hasOlderMessages) return;
    setIsLoadingOlderMessages(true);
    preserveScrollAfterOlderLoadRef.current = {
      previousHeight: messagesContainerRef.current?.scrollHeight ?? 0,
    };
    try {
      const older = await fetchCommunityMessages(activeCommunityId, {
        before: activeMessages[0].createdAt,
        limit: MESSAGE_PAGE_SIZE,
      });
      setHasOlderMessages(older.length === MESSAGE_PAGE_SIZE);
      updateCommunities((current) => {
        const existing = current.find((c) => c.id === activeCommunityId)?.messages ?? [];
        return setCommunityMessages(current, activeCommunityId, mergeCommunityMessageList(existing, older));
      });
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [activeCommunityId, activeMessages, hasOlderMessages, isLoadingOlderMessages, updateCommunities]);

  useEffect(() => {
    void loadLatestMessages();
  }, [loadLatestMessages, selectedCommunity?.id]);

  useEffect(() => {
    void reload();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("raw.community") || event.key === "raw.chat-reports.v1") {
        void reload();
      }
    };
    window.addEventListener("focus", reload);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("focus", reload);
      window.removeEventListener("storage", handleStorage);
    };
  }, [reload]);

  useCommunityMessagesRealtime(updateCommunities);

  useEffect(() => {
    if (!selectedCommunity || !isJoined) return;
    const touchKey = `${selectedCommunity.id}:${userId}`;
    if (lastTouchedCommunityRef.current === touchKey) return;
    lastTouchedCommunityRef.current = touchKey;
    touchMemberActivity(selectedCommunity.id, userId, username).catch(() => {});
  }, [isJoined, selectedCommunity, userId, username]);

  useEffect(() => {
    if (!selectedCommunity || !isJoined || unreadCount === 0) return;
    markCommunityReadSupabase(selectedCommunity.id, userId).catch(() => {});
  }, [isJoined, selectedCommunity, unreadCount, userId]);

  // Track whether user is near the bottom of the chat container
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      isNearBottomRef.current = container.scrollTop + container.clientHeight >= container.scrollHeight - 150;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []); // once on mount — container ref is stable

  // Reset near-bottom flag when switching communities so new room always scrolls
  useEffect(() => {
    isNearBottomRef.current = true;
  }, [activeCommunityId]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || searchQuery.trim()) return;
    if (preserveScrollAfterOlderLoadRef.current) {
      const { previousHeight } = preserveScrollAfterOlderLoadRef.current;
      preserveScrollAfterOlderLoadRef.current = null;
      container.scrollTop += container.scrollHeight - previousHeight;
      return;
    }
    // Only auto-scroll when near bottom or user just sent a message
    if (!isNearBottomRef.current && !justSentMessageRef.current) return;
    justSentMessageRef.current = false;
    container.scrollTop = container.scrollHeight;
  }, [activeMessages, activeCommunityId, searchQuery]);

  // Avatar levels
  const messageSenderIds = useMemo(() => {
    const ids = new Set<string>();
    activeMessages.forEach((m) => { if (m.senderId) ids.add(m.senderId); });
    return Array.from(ids).sort();
  }, [activeMessages]);

  useEffect(() => {
    const catalog = readAvatarCatalogLocal();
    const idToLevel = buildAvatarIdToLevelMap(catalog);
    const cache = avatarLevelCacheRef.current;

    // Always keep own level current
    cache.set(userId, avatarLevel);

    // Read localStorage only for senders not yet cached
    for (const senderId of messageSenderIds) {
      if (cache.has(senderId)) continue;
      try {
        const selectedId = window.localStorage.getItem(`raw.avatar.selected.v1.${senderId}`);
        if (selectedId) {
          const level = idToLevel.get(selectedId);
          if (level !== undefined) cache.set(senderId, level);
        }
      } catch {
        // keep default
      }
    }

    // Snapshot current levels for render
    const levelsById: Record<string, number> = { [userId]: avatarLevel };
    for (const id of messageSenderIds) {
      const level = cache.get(id);
      if (level !== undefined) levelsById[id] = level;
    }
    setSenderAvatarLevels(levelsById);

    // Only query Supabase for senders not already in cache
    const uncachedIds = messageSenderIds.filter((id) => id !== userId && !cache.has(id));
    if (uncachedIds.length === 0) return;

    let cancelled = false;
    void supabase
      .from("user_avatar_selection")
      .select("user_id, avatar_id")
      .in("user_id", uncachedIds)
      .then(({ data }) => {
        if (cancelled || !data) return;
        data.forEach((row) => {
          const level = idToLevel.get(row.avatar_id);
          if (level !== undefined) cache.set(row.user_id, level);
        });
        setSenderAvatarLevels((prev) => {
          const next = { ...prev, [userId]: avatarLevel };
          data.forEach((row) => {
            const level = idToLevel.get(row.avatar_id);
            if (level !== undefined) next[row.user_id] = level;
          });
          return next;
        });
      });
    return () => { cancelled = true; };
  }, [avatarLevel, messageSenderIds, userId]);

  // Chat identity
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSelectedChatAlias(readSelectedChatAlias(userId));
    const handleIdentityChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; alias?: string | null }>).detail;
      if (detail?.userId !== userId) return;
      setSelectedChatAlias(detail.alias ?? null);
    };
    window.addEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
    return () => window.removeEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
  }, [userId]);

  const sendOptimisticMessage = useCallback(
    async (trimmedMessage: string, retryingMessage?: CommunityChatMessageRecord) => {
      if (!selectedCommunity) return;
      const sendAvatarLevel = selectedChatAlias ? getPrivateAvatarLevel(userId) : avatarLevel;
      const optimisticMessage = retryingMessage ?? {
        id: `optimistic-${Date.now()}`,
        communityId: selectedCommunity.id,
        senderId: userId,
        senderName: selectedChatAlias ?? username,
        senderAvatarLevel: sendAvatarLevel,
        text: trimmedMessage,
        createdAt: new Date().toISOString(),
        deliveryStatus: "sending" as const,
        likedBy: [],
      };
      justSentMessageRef.current = true;
      updateCommunities((current) => appendOptimisticMessage(current, selectedCommunity.id, optimisticMessage));
      try {
        const mentionRecipientIds = selectedCommunity.members
          .filter(
            (m) =>
              m.userId !== userId &&
              m.notificationsEnabled &&
              new RegExp(`(^|\\s)@${m.username}\\b`, "i").test(trimmedMessage),
          )
          .map((m) => m.userId);
        if (!isJoined) {
          await joinCommunitySupabase(selectedCommunity.id, userId, username);
          lastTouchedCommunityRef.current = `${selectedCommunity.id}:${userId}`;
        }
        const saved = await sendMessageSupabase(selectedCommunity.id, {
          text: trimmedMessage,
          identityAlias: selectedChatAlias,
          avatarLevel: sendAvatarLevel,
        });
        updateCommunities((current) =>
          replaceCommunityMessage(current, selectedCommunity.id, optimisticMessage.id, saved),
        );
        setMessageDraft("");
        setMentionQuery(null);
        void sendCommunityPushNotification({
          recipientUserIds: mentionRecipientIds,
          title: `@${username} mentioned you`,
          body: `${selectedCommunity.title}: ${trimmedMessage}`,
          url: `${window.location.origin}/dashboard/communities/${selectedCommunity.id}`,
        });
      } catch (err) {
        const { title, description, retryable } = getChatSendErrorInfo(err);
        if (retryable) {
          updateCommunities((current) =>
            markCommunityMessageFailed(current, selectedCommunity.id, optimisticMessage.id),
          );
        } else {
          updateCommunities((current) =>
            removeCommunityMessage(current, selectedCommunity.id, optimisticMessage.id),
          );
        }
        toast({ title, description });
      }
    },
    [avatarLevel, isJoined, selectedChatAlias, selectedCommunity, updateCommunities, userId, username],
  );

  const sendMessage = useCallback(async () => {
    if (!selectedCommunity) return;
    const trimmed = messageDraft.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMUNITY_MESSAGE_LENGTH) {
      toast({ title: "Message too long", description: `Max ${MAX_COMMUNITY_MESSAGE_LENGTH} characters.` });
      return;
    }
    const moderation = moderateUserText(trimmed);
    if (!moderation.allowed) {
      toast({ title: "Message blocked", description: getUserTextModerationMessage(moderation) });
      return;
    }
    await sendOptimisticMessage(trimmed);
  }, [messageDraft, selectedCommunity, sendOptimisticMessage]);

  const retryMessage = useCallback(
    async (message: CommunityChatMessageRecord) => {
      if (message.deliveryStatus !== "failed") return;
      await sendOptimisticMessage(message.text, message);
    },
    [sendOptimisticMessage],
  );

  const likeMessageHandler = useCallback(
    async (message: CommunityChatMessageRecord) => {
      const likedBy = message.likedBy ?? [];
      const isAddingLike = !likedBy.includes(userId);

      // Optimistic update
      const nextLikedBy = isAddingLike
        ? [...likedBy, userId]
        : likedBy.filter((id) => id !== userId);
      updateCommunities((current) =>
        updateMessageLike(current, message.communityId, message.id, nextLikedBy),
      );

      try {
        await likeMessage(message.id, userId);
        // Realtime UPDATE reconciles final state — no reload needed
        if (isAddingLike && message.senderId !== userId && message.senderName !== username) {
          const recipient = selectedCommunity?.members.find((m) => m.userId === message.senderId);
          if (recipient?.notificationsEnabled) {
            void sendCommunityPushNotification({
              recipientUserIds: [message.senderId],
              title: `${username} liked your message`,
              body: `${selectedCommunity?.title ?? "Community"}: ${message.text}`,
              url: `${window.location.origin}/dashboard/communities/${message.communityId}`,
            });
          }
        }
      } catch {
        // Roll back optimistic update
        updateCommunities((current) =>
          updateMessageLike(current, message.communityId, message.id, likedBy),
        );
        toast({ title: "Failed to update like", description: "Please try again." });
      }
    },
    [selectedCommunity, updateCommunities, userId, username],
  );

  const blockSender = useCallback(
    (message: CommunityChatMessageRecord) => {
      if (message.senderId === userId || message.senderName === username) {
        toast({ title: "Can't block yourself", description: "This menu only blocks messages from other members." });
        return;
      }
      const senderKey = getMessageSenderBlockKey(message);
      setBlockedSenderKeys((prev) => {
        if (prev.includes(senderKey)) return prev;
        const next = [...prev, senderKey];
        writeBlockedCommunitySenders(userId, next);
        return next;
      });
      toast({ title: `${message.senderName} blocked`, description: "Their messages are hidden from your community chat view." });
    },
    [userId, username],
  );

  const openSenderProfile = useCallback((message: CommunityChatMessageRecord) => {
    setProfileDialogOpen(true);
    setProfileTarget({ message, profile: null, loading: true });
    getPublicUserProfile(message.senderId)
      .then((profile) => {
        const isPublicSender = profile?.username?.toLowerCase() === message.senderName.toLowerCase();
        setProfileTarget((current) =>
          current?.message.id === message.id
            ? { message, profile: isPublicSender ? profile : null, loading: false }
            : current,
        );
      })
      .catch(() => {
        setProfileTarget((current) =>
          current?.message.id === message.id ? { message, profile: null, loading: false } : current,
        );
      });
  }, []);

  const setNotifications = useCallback(
    (enabled: boolean) => {
      if (!selectedCommunity) return;
      setCommunityNotificationsSupabase(selectedCommunity.id, userId, enabled)
        .then(() => reload())
        .catch(() => {});
    },
    [reload, selectedCommunity, userId],
  );

  return {
    communities,
    setCommunities,
    updateCommunities,
    selectedCommunity,
    isInitialCommunitiesLoading,
    messagesLoading,
    messagesError,
    hasOlderMessages,
    isLoadingOlderMessages,
    communityRequests,
    setCommunityRequests,
    communityJoinRequests,
    setCommunityJoinRequests,
    chatReports,
    setChatReports,
    messageDraft,
    setMessageDraft,
    selectedChatAlias,
    mentionQuery,
    setMentionQuery,
    mentionIndex,
    setMentionIndex,
    blockedSenderKeys,
    blockedSenderKeySet,
    senderAvatarLevels,
    activeMessages,
    groupedMessages,
    isJoined,
    canManagePolls,
    onlineNow,
    unreadCount,
    visibleMembers,
    canEditSelectedCommunity,
    messagesContainerRef,
    messageInputRef,
    profileDialogOpen,
    profileTarget,
    setProfileDialogOpen,
    lastTouchedCommunityRef,
    reload,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    likeMessage: likeMessageHandler,
    blockSender,
    openSenderProfile,
    setNotifications,
  };
}
