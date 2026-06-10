import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import IIJMLogo from "@/assets/itisjustme.webp";
import { AlertTriangle, ArrowLeft, BarChart3, Bell, BellOff, ImagePlus, Lock, PanelRight, Plus, Search, Star, Trash2, UserMinus, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { CommunityBadge } from "@/components/dashboard/CommunityBadge";
import {
  ensureUserRecord,
  formatAdminTimestamp,
  getPersistedUserById,
  readCommunityJoinRequests,
  type ChatReportRecord,
  type CommunityJoinRequestRecord,
  writeCommunityJoinRequests,
} from "@/lib/adminData";
import { submitChatReport } from "@/backend/supabase/controllers/chatReportsController";
import {
  canManageCommunity,
  countUnreadMessages,
  countOnlineMembers,
  formatChatDayLabel,
} from "@/lib/communityChat";
import {
  fetchCommunities,
  fetchCommunityMessages,
  joinCommunity as joinCommunitySupabase,
  leaveCommunity as leaveCommunitySupabase,
  touchMemberActivity,
  markCommunityRead as markCommunityReadSupabase,
  setCommunityNotifications as setCommunityNotificationsSupabase,
  updateCommunityPresentation,
} from "@/backend/supabase/controllers/communityController";
import {
  sendMessage as sendMessageSupabase,
  likeMessage,
  mapCommunityMessage,
  type DbCommunityMessage,
} from "@/backend/supabase/controllers/chatController";
import { supabase } from "@/backend/supabase/client";
import {
  fetchCommunityPolls,
  createCommunityPoll,
  voteOnCommunityPoll,
  deleteCommunityPoll,
} from "@/backend/supabase/controllers/communityPollController";
import type { CommunityPollRecord } from "@/backend/supabase/models/community-poll";
import { submitCommunityRequest, fetchCommunityRequests } from "@/backend/supabase/controllers/communityRequestController";
import {
  fetchWaitlistSummary,
  joinCommunityWaitlist,
} from "@/backend/supabase/controllers/waitlistController";
import {
  COMMUNITY_COVER_IMAGES,
  COMMUNITY_COVER_VIDEOS,
} from "@/lib/communityConstants";
import { buildDefaultCommunities } from "@/lib/communityChat.seed";
import { readCachedMessages, writeCachedMessages } from "@/lib/communityCache";
import { sendCommunityPushNotification } from "@/lib/communityPushNotifications";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";
import {
  appendOptimisticMessage,
  getMessageSenderBlockKey,
  markCommunityMessageFailed,
  mergeCommunityMessageList,
  replaceCommunityMessage,
  setCommunityMessages,
} from "@/lib/communityChatState";
import { useCommunityMessagesRealtime } from "@/hooks/useCommunityMessagesRealtime";
import {
  loadCommunityAccess,
  FREE_COMMUNITY_SLOTS,
  COMMUNITY_UNLOCK_TOKEN_COST,
  type CommunityAccess,
} from "@/lib/communityAccess";
import { readAvatarCatalogLocal } from "@/lib/avatarCatalog";
import { getPrivateAvatarLevel } from "@/lib/avataridentity";
import { getPublicUserProfile, type PublicUserProfile } from "@/backend/supabase/controllers/userController";
import {
  MAX_FAVORITE_COMMUNITIES,
  MAX_PINNED_MESSAGES,
  PinnedMessageLimitError,
  getUserFavoriteCommunities,
  getUserPinnedMessages,
  setUserFavoriteCommunities,
  addUserPinnedMessage,
  removeUserPinnedMessage,
  notifyMessagePinned,
  type PinnedMessageRecord,
} from "@/backend/supabase/controllers/userExtrasController";
import {
  getCommunitySenderBlockKey,
  readBlockedCommunitySenders,
  writeBlockedCommunitySenders,
} from "@/lib/blockedCommunitySenders";
import { getUserTextModerationMessage, moderateUserText } from "@/lib/inputSecurity";
import { useTheme } from "@/providers/useTheme";
import type { User } from "@/store/types";
import { CommunityMessageTimeline } from "@/components/dashboard/CommunityMessageTimeline";
import { CommunityMessageComposer } from "@/components/dashboard/CommunityMessageComposer";
import { CommunityRoomList } from "@/components/dashboard/CommunityRoomList";
import { CommunitySettingsDialog } from "@/components/dashboard/CommunitySettingsDialog";
import { CommunityMembersDialog } from "@/components/dashboard/CommunityMembersDialog";
import { CommunityProfileDialog } from "@/components/dashboard/CommunityProfileDialog";
import { CommunityRequestDialog } from "@/components/dashboard/CommunityRequestDialog";
import { CommunityReportDialog } from "@/components/dashboard/CommunityReportDialog";
import { CommunityPollComposerDialog } from "@/components/dashboard/CommunityPollComposerDialog";
import { GeneralFeedBox } from "@/components/dashboard/GeneralFeedBox";

const WAITLIST_UNLOCK_THRESHOLD = 200;
const MESSAGE_PAGE_SIZE = 10;
const MAX_COMMUNITY_MESSAGE_LENGTH = 150;
const CHAT_IDENTITY_PREFIX = "raw.chat.identity.v1.";
const CHAT_IDENTITY_CHANGED_EVENT = "raw:chat-identity-changed";

interface DashboardCommunitiesProps {
  user: User;
  avatarLevel?: number;
  activeCommunityId?: string | null;
  onOpenCommunity: (communityId: string) => void;
  onBackToCommunities?: () => void;
  onCommunitiesChange?: (communities: PersistedCommunityRecord[]) => void;
}

interface CommunityRequestDraft {
  communityName: string;
  genre: string;
  focusArea: string;
  audience: string;
  whyNow: string;
  samplePrompt: string;
}

interface ReportDraft {
  reason: string;
  details: string;
}

interface ReportTarget {
  communityId: string;
  communityTitle: string;
  message: CommunityChatMessageRecord;
}

interface CommunitySettingsDraft {
  title: string;
  logoUrl: string;
}

const INITIAL_REQUEST_DRAFT: CommunityRequestDraft = {
  communityName: "",
  genre: "",
  focusArea: "",
  audience: "",
  whyNow: "",
  samplePrompt: "",
};

const INITIAL_REPORT_DRAFT: ReportDraft = {
  reason: "",
  details: "",
};

const INITIAL_COMMUNITY_SETTINGS_DRAFT: CommunitySettingsDraft = {
  title: "",
  logoUrl: "",
};

const createEmptyWaitlistSummary = () => ({ counts: {}, joinedCommunityIds: new Set<string>() });

const COMMUNITY_LOGOS: Record<string, string> = {
  lnt: LNTLogo,
  syt: SYTLogo,
  iijm: IIJMLogo,
};

export function DashboardCommunities({
  user,
  avatarLevel = 1,
  activeCommunityId = null,
  onOpenCommunity,
  onBackToCommunities,
  onCommunitiesChange,
}: DashboardCommunitiesProps) {
  const { mode } = useTheme();
  const isLight = mode === "light";

  const [searchQuery, setSearchQuery] = useState("");
  const [communities, setCommunities] = useState<PersistedCommunityRecord[]>([]);
  // --- Floating request button state/hooks ---
  const [showRequestButton, setShowRequestButton] = useState(false);
  const [requestBtnText, setRequestBtnText] = useState("Didn't find your community?");
  const [mobileRequestExpanded, setMobileRequestExpanded] = useState(false);
  const [isInitialCommunitiesLoading, setIsInitialCommunitiesLoading] = useState(true);

  // Show button after scrolling 400px
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 400) {
        setShowRequestButton(true);
      } else {
        setShowRequestButton(false);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Collapse mobile request button when tapping outside
  useEffect(() => {
    if (!mobileRequestExpanded) return;
    const handler = () => setMobileRequestExpanded(false);
    const timeout = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => { clearTimeout(timeout); document.removeEventListener("click", handler); };
  }, [mobileRequestExpanded]);

  // Animate text change after 2s
  useEffect(() => {
    if (!showRequestButton) {
      setRequestBtnText("Didn't find your community?");
      return;
    }
    const timeout = setTimeout(() => {
      setRequestBtnText("Request to create yours now");
    }, 2000);
    return () => clearTimeout(timeout);
  }, [showRequestButton]);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestSubmitAttempted, setRequestSubmitAttempted] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [communitySettingsDraft, setCommunitySettingsDraft] = useState<CommunitySettingsDraft>(INITIAL_COMMUNITY_SETTINGS_DRAFT);
  const [requestDraft, setRequestDraft] = useState<CommunityRequestDraft>(INITIAL_REQUEST_DRAFT);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(INITIAL_REPORT_DRAFT);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<{
    message: CommunityChatMessageRecord;
    profile: PublicUserProfile | null;
    loading: boolean;
  } | null>(null);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [communityJoinRequests, setCommunityJoinRequests] = useState<CommunityJoinRequestRecord[]>([]);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [waitlistJoinedIds, setWaitlistJoinedIds] = useState<Set<string>>(new Set());
  const [waitlistJoiningId, setWaitlistJoiningId] = useState<string | null>(null);
  const [communityAccess, setCommunityAccess] = useState<CommunityAccess>({ hasSubscription: false, unlockedIds: new Set<string>() });
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [favoriteCommunityIds, setFavoriteCommunityIds] = useState<string[]>([]);
  const [ownPinnedMessages, setOwnPinnedMessages] = useState<PinnedMessageRecord[]>([]);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [selectedChatAlias, setSelectedChatAlias] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(`${CHAT_IDENTITY_PREFIX}${user.id}`);
  });
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [expandedDescs, setExpandedDescs] = useState<Set<string>>(new Set());
  const [communityPolls, setCommunityPolls] = useState<CommunityPollRecord[]>([]);
  const [communityPollsAvailable, setCommunityPollsAvailable] = useState(true);
  const [communityPollsExpanded, setCommunityPollsExpanded] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [hiddenAnsweredPollIds, setHiddenAnsweredPollIds] = useState<Set<string>>(new Set());
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptionDrafts, setPollOptionDrafts] = useState<string[]>(["", ""]);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [blockedSenderKeys, setBlockedSenderKeys] = useState<string[]>(() => readBlockedCommunitySenders(user.id));
  const [senderAvatarLevels, setSenderAvatarLevels] = useState<Record<string, number>>({});
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSelectedChatAlias(window.localStorage.getItem(`${CHAT_IDENTITY_PREFIX}${user.id}`));
    const handleIdentityChange = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; alias?: string | null }>).detail;
      if (detail?.userId !== user.id) return;
      setSelectedChatAlias(detail.alias ?? null);
    };
    window.addEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
    return () => window.removeEventListener(CHAT_IDENTITY_CHANGED_EVENT, handleIdentityChange);
  }, [user.id]);
  const [messagesError, setMessagesError] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const lastTouchedCommunityRef = useRef<string>("");
  const latestMessagesRequestRef = useRef(0);
  const loadedMessagesCommunityRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  const preserveScrollAfterOlderLoadRef = useRef<{ previousHeight: number } | null>(null);

    const updateCommunities = useCallback((updater: (communities: PersistedCommunityRecord[]) => PersistedCommunityRecord[]) => {
      setCommunities((previous) => {
        const next = updater(previous);
        onCommunitiesChange?.(next);
        return next;
      });
    }, [onCommunitiesChange]);

    const reloadChatData = useCallback(async () => {
      try {
        if (activeCommunityId) {
          setMessagesLoading(true);
          setMessagesError(false);
        }

        const [communitiesData, requestsData, waitlistData, accessData, activeCommunityMessages] = await Promise.all([
          fetchCommunities(),
          fetchCommunityRequests(user.id),
          fetchWaitlistSummary(user.id).catch(() => createEmptyWaitlistSummary()),
          loadCommunityAccess(user.id).catch(() => ({ hasSubscription: false, unlockedIds: new Set<string>() })),
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
        }
        setCommunities((previous) => {
          const next = communitiesData.map((community) => ({
            ...community,
            messages: community.id === activeCommunityId && activeCommunityMessages
              ? activeCommunityMessages
              : previous.find((item) => item.id === community.id)?.messages ?? community.messages,
          }));
          onCommunitiesChange?.(next);
          return next;
        });
        setCommunityRequests(requestsData);
        setCommunityJoinRequests(readCommunityJoinRequests());
        setWaitlistCounts(waitlistData.counts);
        setWaitlistJoinedIds(waitlistData.joinedCommunityIds);
        setCommunityAccess(accessData);
      } finally {
        setMessagesLoading(false);
        setIsInitialCommunitiesLoading(false);
      }
    }, [activeCommunityId, onCommunitiesChange, user.id]);

    const fallbackCommunities = useMemo(() => buildDefaultCommunities(), []);
    const selectedCommunity = useMemo(() => {
      if (!activeCommunityId) return null;
      return (
        communities.find((community) => community.id === activeCommunityId)
        ?? fallbackCommunities.find((community) => community.id === activeCommunityId)
        ?? null
      );
    }, [activeCommunityId, communities, fallbackCommunities]);
    const userRequests = useMemo(
      () => communityRequests.filter((request) => request.requesterId === user.id),
      [communityRequests, user.id]
    );
    const activePendingRequest = userRequests.find((request) => request.status === "pending") ?? null;
    const currentUserRecord = useMemo(() => getPersistedUserById(user.id), [user.id]);
    const isUserBanned = (currentUserRecord?.moderationStatus ?? user.moderationStatus) === "banned";
    const warningCount = currentUserRecord?.warnings ?? user.warnings;
    const currentMember = selectedCommunity?.members.find((member) => member.userId === user.id) ?? null;
    const isJoined = Boolean(currentMember);
    const canEditSelectedCommunity = selectedCommunity ? canManageCommunity(selectedCommunity, user.id, user.username) : false;
    const isGlobalAdmin = user.role === "admin";
    const canManagePolls = canEditSelectedCommunity || isGlobalAdmin;
    const onlineNow = selectedCommunity ? countOnlineMembers(selectedCommunity) : 0;
    const visibleMembers = selectedCommunity?.members.slice(0, 5) ?? [];
    const unreadCount = selectedCommunity && isJoined ? countUnreadMessages(selectedCommunity, user.id) : 0;

    useEffect(() => {
      setBlockedSenderKeys(readBlockedCommunitySenders(user.id));
    }, [user.id]);

    const blockedSenderKeySet = useMemo(() => new Set(blockedSenderKeys), [blockedSenderKeys]);
    const activeMessages = useMemo(
      () => (selectedCommunity?.messages ?? []).filter((message) => !blockedSenderKeySet.has(getMessageSenderBlockKey(message))),
      [blockedSenderKeySet, selectedCommunity]
    );

    const loadLatestMessages = useCallback(async () => {
      if (!activeCommunityId) {
        setHasOlderMessages(false);
        setMessagesLoading(false);
        setMessagesError(false);
        return;
      }
      if (loadedMessagesCommunityRef.current === activeCommunityId) {
        return;
      }

      const requestId = latestMessagesRequestRef.current + 1;
      latestMessagesRequestRef.current = requestId;

      // Hydrate from the persistent cache first so the room appears
      // instantly. We only show the spinner if there's no cache at all —
      // otherwise the network fetch revalidates in the background.
      const cached = readCachedMessages(activeCommunityId);
      if (cached) {
        const communityId = activeCommunityId;
        setHasOlderMessages(cached.data.length === MESSAGE_PAGE_SIZE);
        updateCommunities((current) =>
          setCommunityMessages(current, communityId, cached.data),
        );
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
          // Only surface the error UI when there was nothing cached to fall back on.
          setMessagesError(true);
        }
      } finally {
        if (latestMessagesRequestRef.current === requestId) {
          setMessagesLoading(false);
        }
      }
    }, [activeCommunityId, updateCommunities]);

    const loadOlderMessages = useCallback(async () => {
      if (!activeCommunityId || isLoadingOlderMessages || activeMessages.length === 0 || !hasOlderMessages) {
        return;
      }

      setIsLoadingOlderMessages(true);
      preserveScrollAfterOlderLoadRef.current = {
        previousHeight: messagesContainerRef.current?.scrollHeight ?? 0,
      };
      try {
        const olderMessages = await fetchCommunityMessages(activeCommunityId, {
          before: activeMessages[0].createdAt,
          limit: MESSAGE_PAGE_SIZE,
        });
        setHasOlderMessages(olderMessages.length === MESSAGE_PAGE_SIZE);
        updateCommunities((current) => {
          const existing = current.find((community) => community.id === activeCommunityId)?.messages ?? [];
          return setCommunityMessages(current, activeCommunityId, mergeCommunityMessageList(existing, olderMessages));
        });
      } finally {
        setIsLoadingOlderMessages(false);
      }
    }, [activeCommunityId, activeMessages, hasOlderMessages, isLoadingOlderMessages, updateCommunities]);

    useEffect(() => {
      void loadLatestMessages();
    }, [loadLatestMessages, selectedCommunity?.id]);

    const messageSenderIds = useMemo(() => {
      const ids = new Set<string>();
      activeMessages.forEach((message) => {
        if (message.senderId) ids.add(message.senderId);
      });
      return Array.from(ids).sort();
    }, [activeMessages]);

    useEffect(() => {
      const catalog = readAvatarCatalogLocal();
      const levelsById: Record<string, number> = { [user.id]: avatarLevel };
      for (const senderId of messageSenderIds) {
        try {
          const selectedId = window.localStorage.getItem(`raw.avatar.selected.v1.${senderId}`);
          const index = selectedId ? catalog.findIndex((item) => item.id === selectedId) : -1;
          if (index >= 0) levelsById[senderId] = index + 1;
        } catch {
          // Keep default avatar if local selection cannot be read.
        }
      }
      setSenderAvatarLevels(levelsById);

      const lookupIds = messageSenderIds.filter((senderId) => senderId !== user.id);
      if (lookupIds.length === 0) return;
      let cancelled = false;
      void supabase
        .from("user_avatar_selection")
        .select("user_id, avatar_id")
        .in("user_id", lookupIds)
        .then(({ data }) => {
          if (cancelled || !data) return;
          setSenderAvatarLevels((previous) => {
            const next = { ...previous, [user.id]: avatarLevel };
            data.forEach((row) => {
              const index = catalog.findIndex((item) => item.id === row.avatar_id);
              if (index >= 0) next[row.user_id] = index + 1;
            });
            return next;
          });
        });
      return () => {
        cancelled = true;
      };
    }, [avatarLevel, messageSenderIds, user.id]);

    const filteredMessages = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return activeMessages;
      }

      return activeMessages.filter((message) => {
        const haystacks = [message.senderName, message.text, message.replyToSenderName, message.replyToText]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystacks.includes(query);
      });
    }, [activeMessages, searchQuery]);
    const latestMessage = activeMessages[activeMessages.length - 1];
    const groupedMessages = useMemo(() => {
      const groups: Array<{ label: string; messages: CommunityChatMessageRecord[] }> = [];

      filteredMessages.forEach((message) => {
        const label = formatChatDayLabel(message.createdAt);
        const currentGroup = groups[groups.length - 1];
        if (!currentGroup || currentGroup.label !== label) {
          groups.push({ label, messages: [message] });
          return;
        }

        currentGroup.messages.push(message);
      });

      return groups;
    }, [filteredMessages]);

    const directoryCommunities = useMemo(() => {
      return communities;
    }, [communities]);
    const joinedCommunityCount = useMemo(
      () => directoryCommunities.filter((community) => community.members.some((member) => member.userId === user.id)).length,
      [directoryCommunities, user.id]
    );
    const effectiveUnlockCount = Math.max(communityAccess.unlockedIds.size, joinedCommunityCount);
    const freeCommunitySlotsRemaining = Math.max(0, FREE_COMMUNITY_SLOTS - effectiveUnlockCount);
    useEffect(() => {
      setSearchQuery("");
      setCommunityPollsExpanded(false);
      setHiddenAnsweredPollIds(new Set());
    }, [activeCommunityId]);

    const reloadCommunityPolls = useCallback(async () => {
      if (!activeCommunityId || !communityPollsAvailable) {
        setCommunityPolls([]);
        return;
      }
      try {
        const polls = await fetchCommunityPolls(activeCommunityId, user.id);
        setCommunityPolls(polls);
      } catch (error) {
        const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: number }).status) : null;
        if (status === 404) {
          setCommunityPollsAvailable(false);
          setCommunityPolls([]);
          return;
        }
        console.error("Failed to load community polls", error);
      }
    }, [activeCommunityId, communityPollsAvailable, user.id]);

    useEffect(() => {
      void reloadCommunityPolls();
    }, [reloadCommunityPolls]);

    useEffect(() => {
      if (!activeCommunityId || !communityPollsAvailable) return;
      const channel = supabase
        .channel(`community-polls:${activeCommunityId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "community_polls", filter: `community_id=eq.${activeCommunityId}` },
          () => { void reloadCommunityPolls(); },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "community_poll_votes" },
          () => { void reloadCommunityPolls(); },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "community_poll_options" },
          () => { void reloadCommunityPolls(); },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }, [activeCommunityId, communityPollsAvailable, reloadCommunityPolls]);

    const handleOpenPollComposer = useCallback(() => {
      setPollQuestion("");
      setPollOptionDrafts(["", ""]);
      setPollComposerOpen(true);
    }, []);

    const handleUpdatePollOption = useCallback((index: number, value: string) => {
      setPollOptionDrafts((drafts) => drafts.map((draft, i) => (i === index ? value : draft)));
    }, []);

    const handleSubmitPoll = useCallback(async () => {
      if (!selectedCommunity || !canManagePolls) return;
      const trimmedOptions = pollOptionDrafts.map((option) => option.trim()).filter(Boolean);
      const questionModeration = moderateUserText(pollQuestion);
      if (!pollQuestion.trim()) {
        toast({ title: "Add a question", description: "Polls need a question to ask the room." });
        return;
      }
      if (!questionModeration.allowed) {
        toast({ title: "Poll question blocked", description: getUserTextModerationMessage(questionModeration) });
        return;
      }
      if (trimmedOptions.length < 2) {
        toast({ title: "Add at least two options", description: "Members need something to choose between." });
        return;
      }
      const moderatedOptions: string[] = [];
      for (const option of trimmedOptions) {
        const optionModeration = moderateUserText(option);
        if (!optionModeration.allowed) {
          toast({ title: "Poll option blocked", description: getUserTextModerationMessage(optionModeration) });
          return;
        }
        moderatedOptions.push(optionModeration.text);
      }

      setPollSubmitting(true);
      try {
        await createCommunityPoll({
          communityId: selectedCommunity.id,
          question: questionModeration.text,
          options: moderatedOptions,
          createdByUserId: user.id,
          createdByUsername: user.username,
        });
        setPollComposerOpen(false);
        await reloadCommunityPolls();
        toast({ title: "Poll posted", description: "Your poll is live in the room." });
      } catch (error) {
        console.error("Failed to create poll", error);
        toast({ title: "Couldn't post poll", description: "Please try again in a moment." });
      } finally {
        setPollSubmitting(false);
      }
    }, [canManagePolls, pollOptionDrafts, pollQuestion, reloadCommunityPolls, selectedCommunity, user.id, user.username]);

    const handleVoteOnPoll = useCallback(async (pollId: string, optionId: string) => {
      const previous = communityPolls;
      // Optimistic update: shift the vote count.
      setCommunityPolls((polls) => polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        const wasOption = poll.userVoteOptionId;
        if (wasOption === optionId) return poll;
        const nextOptions = poll.options.map((option) => {
          if (option.id === optionId) return { ...option, votes: option.votes + 1 };
          if (option.id === wasOption) return { ...option, votes: Math.max(0, option.votes - 1) };
          return option;
        });
        const totalVotes = wasOption ? poll.totalVotes : poll.totalVotes + 1;
        return { ...poll, options: nextOptions, userVoteOptionId: optionId, totalVotes };
      }));

      try {
        await voteOnCommunityPoll(pollId, optionId, user.id);
        await reloadCommunityPolls();
        window.setTimeout(() => {
          setHiddenAnsweredPollIds((previous) => new Set([...previous, pollId]));
        }, 4500);
      } catch (error) {
        console.error("Failed to vote on poll", error);
        setCommunityPolls(previous);
        toast({ title: "Couldn't record vote", description: "Please try again in a moment." });
      }
    }, [communityPolls, reloadCommunityPolls, user.id]);

    const handleDeletePoll = useCallback(async (pollId: string) => {
      if (!canManagePolls) return;
      const previous = communityPolls;
      setCommunityPolls((polls) => polls.filter((poll) => poll.id !== pollId));
      try {
        await deleteCommunityPoll(pollId);
      } catch (error) {
        console.error("Failed to delete poll", error);
        setCommunityPolls(previous);
        toast({ title: "Couldn't delete poll", description: "Please try again in a moment." });
      }
    }, [canManagePolls, communityPolls]);

    const visibleCommunityPolls = useMemo(
      () => communityPolls.filter((poll) => !hiddenAnsweredPollIds.has(poll.id)),
      [communityPolls, hiddenAnsweredPollIds],
    );

    const handleKickMember = useCallback(async (memberId: string, memberName: string) => {
      if (!selectedCommunity || !canManagePolls || memberId === user.id) return;
      const confirmed = await confirm({
        title: `Remove ${memberName}?`,
        description: `They will lose access to ${selectedCommunity.title}.`,
        confirmLabel: "Remove",
        tone: "danger",
      });
      if (!confirmed) return;

      try {
        await leaveCommunitySupabase(selectedCommunity.id, memberId);
        await reloadChatData();
        toast({ title: "Member removed", description: `${memberName} was removed from the group.` });
      } catch {
        toast({ title: "Could not remove member", description: "Please try again." });
      }
    }, [canManagePolls, confirm, reloadChatData, selectedCommunity, user.id]);

    useEffect(() => {
      reloadChatData();

      const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key.startsWith("raw.community") || event.key === "raw.chat-reports.v1") {
          reloadChatData();
        }
      };

      window.addEventListener("focus", reloadChatData);
      window.addEventListener("storage", handleStorage);

      return () => {
        window.removeEventListener("focus", reloadChatData);
        window.removeEventListener("storage", handleStorage);
      };
    }, [reloadChatData]);

    useCommunityMessagesRealtime(updateCommunities);

    useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const ids = await getUserFavoriteCommunities(user.id);
          if (!cancelled) setFavoriteCommunityIds(ids);
        } catch {
          // Best-effort.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user.id]);

    useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const messages = await getUserPinnedMessages(user.id);
          if (!cancelled) setOwnPinnedMessages(messages);
        } catch {
          // Best-effort.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user.id]);

    const broadcastFavoritesUpdated = useCallback((ids: string[]) => {
      window.dispatchEvent(new CustomEvent("raw:favorite-communities-updated", {
        detail: { userId: user.id, ids },
      }));
    }, [user.id]);

    const broadcastPinnedMessageUpdated = useCallback((messages: PinnedMessageRecord[]) => {
      window.dispatchEvent(new CustomEvent("raw:pinned-message-updated", {
        detail: { userId: user.id, messages },
      }));
    }, [user.id]);

    const handleToggleFavorite = useCallback(async (communityId: string) => {
      const isFavorite = favoriteCommunityIds.includes(communityId);
      let next: string[];
      if (isFavorite) {
        next = favoriteCommunityIds.filter((id) => id !== communityId);
      } else {
        if (favoriteCommunityIds.length >= MAX_FAVORITE_COMMUNITIES) {
          toast({ title: "Favorites full", description: `You can pick up to ${MAX_FAVORITE_COMMUNITIES} favorite communities.` });
          return;
        }
        next = [...favoriteCommunityIds, communityId];
      }
      const previous = favoriteCommunityIds;
      setFavoriteCommunityIds(next);
      broadcastFavoritesUpdated(next);
      try {
        await setUserFavoriteCommunities(user.id, next);
      } catch {
        setFavoriteCommunityIds(previous);
        broadcastFavoritesUpdated(previous);
        toast({ title: "Could not update favorites", description: "Please try again." });
      }
    }, [broadcastFavoritesUpdated, favoriteCommunityIds, user.id]);

    const handlePinMessageToProfile = useCallback(async (message: CommunityChatMessageRecord, community: PersistedCommunityRecord) => {
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
        const nextPinnedMessage = await addUserPinnedMessage(user.id, payload);
        const next = [...ownPinnedMessages, nextPinnedMessage];
        setOwnPinnedMessages(next);
        broadcastPinnedMessageUpdated(next);
        toast({ title: "Pinned to your profile", description: "Others will see this message on your chat profile." });
        if (message.senderId && message.senderId !== user.id) {
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
    }, [broadcastPinnedMessageUpdated, ownPinnedMessages, user.id]);

    const handlePinMessage = useCallback((message: CommunityChatMessageRecord) => {
      if (!selectedCommunity) return;
      void handlePinMessageToProfile(message, selectedCommunity);
    }, [handlePinMessageToProfile, selectedCommunity]);

    const handleRemovePinnedMessage = useCallback(async (messageId: string) => {
      try {
        await removeUserPinnedMessage(user.id, messageId);
        const next = ownPinnedMessages.filter((m) => m.messageId !== messageId);
        setOwnPinnedMessages(next);
        broadcastPinnedMessageUpdated(next);
        toast({ title: "Pinned message removed" });
      } catch {
        toast({ title: "Could not remove pinned message", description: "Please try again." });
      }
    }, [broadcastPinnedMessageUpdated, ownPinnedMessages, user.id]);

    const handleOpenSenderProfile = useCallback((message: CommunityChatMessageRecord) => {
      setProfileDialogOpen(true);
      setProfileTarget({ message, profile: null, loading: true });
      getPublicUserProfile(message.senderId)
        .then((profile) => {
          const isPublicSender = profile?.username?.toLowerCase() === message.senderName.toLowerCase();
          setProfileTarget((current) => (
            current?.message.id === message.id ? { message, profile: isPublicSender ? profile : null, loading: false } : current
          ));
        })
        .catch(() => {
          setProfileTarget((current) => (
            current?.message.id === message.id ? { message, profile: null, loading: false } : current
          ));
        });
    }, []);

    useEffect(() => {
      if (!selectedCommunity || !isJoined) {
        return;
      }

      const touchKey = `${selectedCommunity.id}:${user.id}`;
      if (lastTouchedCommunityRef.current === touchKey) {
        return;
      }

      lastTouchedCommunityRef.current = touchKey;
      touchMemberActivity(selectedCommunity.id, user.id, user.username)
        .then(() => reloadChatData())
        .catch(() => {});
    }, [isJoined, reloadChatData, selectedCommunity, user.id, user.username]);

    useEffect(() => {
      if (!selectedCommunity || !isJoined || unreadCount === 0) {
        return;
      }

      markCommunityReadSupabase(selectedCommunity.id, user.id)
        .then(() => reloadChatData())
        .catch(() => {});
    }, [isJoined, reloadChatData, selectedCommunity, unreadCount, user.id]);

    useLayoutEffect(() => {
      if (!messagesContainerRef.current || searchQuery.trim()) {
        return;
      }

      if (preserveScrollAfterOlderLoadRef.current) {
        const { previousHeight } = preserveScrollAfterOlderLoadRef.current;
        preserveScrollAfterOlderLoadRef.current = null;
        messagesContainerRef.current.scrollTop += messagesContainerRef.current.scrollHeight - previousHeight;
        return;
      }

      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }, [activeMessages, activeCommunityId, searchQuery]);

    const handleJoinCommunity = async (communityId: string, shouldOpenPage = false) => {
      const targetCommunity = communities.find((community) => community.id === communityId);
      if (!targetCommunity) {
        return;
      }

      try {
        await joinCommunitySupabase(communityId, user.id, user.username);
        lastTouchedCommunityRef.current = `${communityId}:${user.id}`;
        await reloadChatData();
        toast({
          title: `Joined ${targetCommunity.title}`,
          description: "You can now chat in this group and receive notifications.",
        });
        if (shouldOpenPage) {
          onOpenCommunity(communityId);
        }
      } catch {
        toast({ title: "Failed to join", description: "Please try again." });
      }
    };

    const handlePaidJoinCommunity = async (communityId: string, shouldOpenPage = false) => {
      const targetCommunity = communities.find((community) => community.id === communityId);
      if (!targetCommunity || unlockingId === communityId) {
        return;
      }

      setUnlockingId(communityId);
      try {
        setCommunityAccess((prev) => ({
          ...prev,
          unlockedIds: new Set([...prev.unlockedIds, communityId]),
        }));
        await handleJoinCommunity(communityId, shouldOpenPage);
      } finally {
        setUnlockingId(null);
      }
    };

    const handleLeaveCommunity = async () => {
      if (!selectedCommunity || !isJoined || leavingCommunityId) {
        return;
      }

      const communityId = selectedCommunity.id;
      const communityTitle = selectedCommunity.title;
      setLeavingCommunityId(communityId);

      try {
        await leaveCommunitySupabase(communityId, user.id);
        lastTouchedCommunityRef.current = "";
        await reloadChatData();
        onBackToCommunities?.();
        toast({
          title: `Left ${communityTitle}`,
          description: "This change was saved to your community membership.",
        });
      } catch {
        toast({ title: "Failed to leave", description: "Please try again." });
      } finally {
        setLeavingCommunityId(null);
      }
    };

    const handleRequestJoinCommunity = (community: PersistedCommunityRecord) => {
      const existing = communityJoinRequests.find(
        (r) => r.communityId === community.id && r.requesterId === user.id,
      );
      if (existing) {
        toast({ title: "Request already sent", description: "Admin will review your access request." });
        return;
      }
      const newRequest: CommunityJoinRequestRecord = {
        id: `join-request-${Date.now()}`,
        communityId: community.id,
        communityTitle: community.title,
        requesterId: user.id,
        requesterName: user.username,
        submittedAt: new Date().toISOString(),
        status: "pending",
      };
      setCommunityJoinRequests((prev) => {
        const next = [newRequest, ...prev];
        writeCommunityJoinRequests(next);
        return next;
      });
      toast({
        title: "Access request sent",
        description: `Admin will review your request to join ${community.title}.`,
      });
    };

    const handleJoinWaitlist = async (community: PersistedCommunityRecord) => {
      if (waitlistJoinedIds.has(community.id) || waitlistJoiningId === community.id) {
        return;
      }
      setWaitlistJoiningId(community.id);
      const previousCount = waitlistCounts[community.id] ?? 0;
      setWaitlistCounts((prev) => ({ ...prev, [community.id]: previousCount + 1 }));
      setWaitlistJoinedIds((prev) => {
        const next = new Set(prev);
        next.add(community.id);
        return next;
      });
      try {
        const newCount = await joinCommunityWaitlist(community.id, user.id, user.username);
        setWaitlistCounts((prev) => ({ ...prev, [community.id]: newCount }));
        toast({
          title: "You're on the waitlist",
          description: `${newCount}/${WAITLIST_UNLOCK_THRESHOLD} signed up to unlock ${community.title}.`,
        });
      } catch {
        setWaitlistCounts((prev) => ({ ...prev, [community.id]: previousCount }));
        setWaitlistJoinedIds((prev) => {
          const next = new Set(prev);
          next.delete(community.id);
          return next;
        });
        toast({ title: "Failed to join waitlist", description: "Please try again." });
      } finally {
        setWaitlistJoiningId((current) => (current === community.id ? null : current));
      }
    };

    const handleUnlockCommunity = async (communityId: string) => {
      if (unlockingId === communityId) return;
      setUnlockingId(communityId);
      try {
        setCommunityAccess((prev) => ({
          ...prev,
          unlockedIds: new Set([...prev.unlockedIds, communityId]),
        }));
        await handleJoinCommunity(communityId, true);
      } catch {
        toast({ title: "Could not join group", description: "Please try again." });
      } finally {
        setUnlockingId(null);
      }
    };

    const sendOptimisticMessage = useCallback(async (trimmedMessage: string, retryingMessage?: CommunityChatMessageRecord) => {
      if (!selectedCommunity) {
        return;
      }

      const sendAvatarLevel = selectedChatAlias ? getPrivateAvatarLevel(user.id) : avatarLevel;

      const optimisticMessage = retryingMessage ?? {
        id: `optimistic-${Date.now()}`,
        communityId: selectedCommunity.id,
        senderId: user.id,
        senderName: selectedChatAlias ?? user.username,
        senderAvatarLevel: sendAvatarLevel,
        text: trimmedMessage,
        createdAt: new Date().toISOString(),
        deliveryStatus: "pending" as const,
        likedBy: [],
      };

      updateCommunities((current) => appendOptimisticMessage(current, selectedCommunity.id, optimisticMessage));
      try {
        const mentionRecipientIds = selectedCommunity.members
          .filter((member) =>
            member.userId !== user.id &&
            member.notificationsEnabled &&
            new RegExp(`(^|\\s)@${member.username}\\b`, "i").test(trimmedMessage)
          )
          .map((member) => member.userId);

        if (!isJoined) {
          await joinCommunitySupabase(selectedCommunity.id, user.id, user.username);
          lastTouchedCommunityRef.current = `${selectedCommunity.id}:${user.id}`;
        }

        const savedMessage = await sendMessageSupabase(selectedCommunity.id, {
          text: trimmedMessage,
          identityAlias: selectedChatAlias,
          avatarLevel: sendAvatarLevel,
        });
        updateCommunities((current) => replaceCommunityMessage(current, selectedCommunity.id, optimisticMessage.id, savedMessage));
        setMessageDraft("");
        setMentionQuery(null);
        void sendCommunityPushNotification({
          recipientUserIds: mentionRecipientIds,
          title: `@${user.username} mentioned you`,
          body: `${selectedCommunity.title}: ${trimmedMessage}`,
          url: `${window.location.origin}/dashboard/communities/${selectedCommunity.id}`,
        });
      } catch {
        updateCommunities((current) => markCommunityMessageFailed(current, selectedCommunity.id, optimisticMessage.id));
        toast({ title: "Failed to send message", description: "Please try again." });
      }
    }, [isJoined, selectedChatAlias, selectedCommunity, updateCommunities, user.id, user.username]);

    const handleSendMessage = useCallback(async () => {
      if (!selectedCommunity) {
        return;
      }

      if (isUserBanned) {
        toast({
          title: "Chat access restricted",
          description: "Your account is currently banned from posting while admin review remains in effect.",
        });
        return;
      }

      const trimmedMessage = messageDraft.trim();
      if (!trimmedMessage) {
        return;
      }
      if (trimmedMessage.length > MAX_COMMUNITY_MESSAGE_LENGTH) {
        toast({ title: "Message too long", description: `Max ${MAX_COMMUNITY_MESSAGE_LENGTH} characters.` });
        return;
      }
      await sendOptimisticMessage(trimmedMessage);
    }, [isUserBanned, messageDraft, selectedCommunity, sendOptimisticMessage]);

    const handleRetryMessage = useCallback(async (message: CommunityChatMessageRecord) => {
      if (message.deliveryStatus !== "failed") return;
      await sendOptimisticMessage(message.text, message);
    }, [sendOptimisticMessage]);

    const handleLikeMessage = useCallback(async (message: CommunityChatMessageRecord) => {
      const likedBy = message.likedBy ?? [];
      const isAddingLike = !likedBy.includes(user.id);
      try {
        await likeMessage(message.id, user.id);
        await reloadChatData();
        if (isAddingLike && message.senderId !== user.id && message.senderName !== user.username) {
          const recipient = selectedCommunity?.members.find((member) => member.userId === message.senderId);
          if (recipient?.notificationsEnabled) {
            void sendCommunityPushNotification({
              recipientUserIds: [message.senderId],
              title: `${user.username} liked your message`,
              body: `${selectedCommunity?.title ?? "Community"}: ${message.text}`,
              url: `${window.location.origin}/dashboard/communities/${message.communityId}`,
            });
          }
        }
      } catch {
        toast({ title: "Failed to update like", description: "Please try again." });
      }
    }, [reloadChatData, selectedCommunity, user.id, user.username]);

    const handleCommunitySettingsSave = async () => {
      if (!selectedCommunity || !canEditSelectedCommunity) {
        toast({
          title: "Creator access required",
          description: "Only the community creator can change the group name or logo.",
        });
        return;
      }

      const trimmedTitle = communitySettingsDraft.title.trim();
      if (!trimmedTitle) {
        toast({
          title: "Name required",
          description: "Add a community name before saving these changes.",
        });
        return;
      }
      const titleModeration = moderateUserText(trimmedTitle);
      if (!titleModeration.allowed) {
        toast({ title: "Community name blocked", description: getUserTextModerationMessage(titleModeration) });
        return;
      }

      if (!canManageCommunity(selectedCommunity, user.id, user.username)) {
        toast({
          title: "Creator access required",
          description: "Only the community creator can change the group name or logo.",
        });
        return;
      }

      try {
        await updateCommunityPresentation(selectedCommunity.id, {
          title: trimmedTitle,
          logoUrl: communitySettingsDraft.logoUrl,
        });
        await reloadChatData();
        setLogoDialogOpen(false);
        toast({
          title: "Community updated",
          description: `${trimmedTitle} now shows the latest name and logo across the app.`,
        });
      } catch {
        toast({ title: "Update failed", description: "Please try again." });
      }
    };

    const handleSubmitReport = async () => {
      if (!reportTarget) {
        return;
      }

      const reason = reportDraft.reason.trim();
      const details = reportDraft.details.trim();
      if (!reason) {
        toast({
          title: "Add a report reason",
          description: "Tell the admin team why this message should be reviewed.",
        });
        return;
      }

      const reportedUser = ensureUserRecord(reportTarget.message.senderName);
      const reportedUsername = reportTarget.message.senderName;
      try {
        const saved = await submitChatReport({
          communityId: reportTarget.communityId,
          communityTitle: reportTarget.communityTitle,
          messageId: reportTarget.message.id,
          messageText: reportTarget.message.text,
          reportedUserId: reportTarget.message.senderId || reportedUser.id,
          reportedUsername,
          reporterId: user.id,
          reporterName: user.username,
          reason,
          details,
        });
        setChatReports((previous) => [saved, ...previous]);
        setReportDialogOpen(false);
        setReportTarget(null);
        setReportDraft(INITIAL_REPORT_DRAFT);
        toast({
          title: "Report sent for review",
          description: `The message from ${reportedUsername} is now in the admin review queue.`,
        });
      } catch (error) {
        toast({
          title: "Could not send report",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    };

    const handleOpenMessageReport = useCallback((message: CommunityChatMessageRecord) => {
      if (!selectedCommunity) return;
      setReportTarget({
        communityId: selectedCommunity.id,
        communityTitle: selectedCommunity.title,
        message,
      });
      setReportDraft({ reason: "", details: "" });
      setReportDialogOpen(true);
    }, [selectedCommunity]);

    const handleBlockMessageSender = useCallback((message: CommunityChatMessageRecord) => {
      if (message.senderId === user.id || message.senderName === user.username) {
        toast({
          title: "Can't block yourself",
          description: "This menu only blocks messages from other members.",
        });
        return;
      }

      const senderKey = getMessageSenderBlockKey(message);
      setBlockedSenderKeys((previous) => {
        if (previous.includes(senderKey)) return previous;
        const next = [...previous, senderKey];
        writeBlockedCommunitySenders(user.id, next);
        return next;
      });
      toast({
        title: `${message.senderName} blocked`,
        description: "Their messages are hidden from your community chat view.",
      });
    }, [user.id, user.username]);

    const updateRequestDraft = <K extends keyof CommunityRequestDraft>(field: K, value: CommunityRequestDraft[K]) => {
      setRequestDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

    const handleSubmitCommunityRequest = async () => {
      if (activePendingRequest) {
        toast({
          title: "Request already pending",
          description: `Your request for ${activePendingRequest.communityName} is still waiting for admin review.`,
        });
        return;
      }

      const trimmedDraft = {
        communityName: requestDraft.communityName.trim(),
        genre: requestDraft.genre.trim(),
        focusArea: requestDraft.focusArea.trim(),
        audience: requestDraft.audience.trim(),
        whyNow: requestDraft.whyNow.trim(),
        samplePrompt: requestDraft.samplePrompt.trim(),
      };

      if (!trimmedDraft.communityName || !trimmedDraft.genre || !trimmedDraft.focusArea || !trimmedDraft.audience || !trimmedDraft.whyNow) {
        setRequestSubmitAttempted(true);
        toast({
          title: "Complete the request form",
          description: "Fill in all required fields before submitting.",
        });
        return;
      }

      const moderatedDraft = { ...trimmedDraft };
      for (const field of Object.keys(trimmedDraft) as Array<keyof CommunityRequestDraft>) {
        if (!trimmedDraft[field]) {
          continue;
        }

        const moderation = moderateUserText(trimmedDraft[field]);
        if (!moderation.allowed) {
          toast({
            title: "Request wording blocked",
            description: `${COMMUNITY_REQUEST_FIELD_LABELS[field]}: ${getUserTextModerationMessage(moderation)}`,
          });
          return;
        }
        moderatedDraft[field] = moderation.text;
      }

      try {
        const newRequest = await submitCommunityRequest({
          requesterId: user.id,
          requesterName: user.username,
          communityName: moderatedDraft.communityName,
          genre: moderatedDraft.genre,
          focusArea: moderatedDraft.focusArea,
          audience: moderatedDraft.audience,
          whyNow: moderatedDraft.whyNow,
          samplePrompt: moderatedDraft.samplePrompt,
        });
        await reloadChatData();
        setRequestDraft(INITIAL_REQUEST_DRAFT);
        setRequestSubmitAttempted(false);
        setRequestFormOpen(false);
        toast({
          title: "Request sent to admin",
          description: `${newRequest.communityName} is now pending review. We will keep you posted in this dashboard.`,
        });
      } catch {
        toast({ title: "Failed to submit request", description: "Please try again." });
      }
    };

    const renderDirectoryView = () => (
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-xl tracking-wide text-raw-text sm:text-2xl">Communities</h1>
            <p className="mt-2 text-xs text-raw-silver/40 sm:text-sm">
              Join any room from here to start chatting with like minded peers. Don't see a community that fits? Request a new one and we'll review it for you.
            </p>
            {(warningCount > 0 || isUserBanned) && (
              <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                isUserBanned
                  ? "border-red-400/20 bg-red-500/10 text-red-200"
                  : "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
              }`}>
                <AlertTriangle className="h-3.5 w-3.5" />
                {isUserBanned ? "Account banned after moderation review" : `${warningCount} warning${warningCount === 1 ? "" : "s"} on your account`}
              </div>
            )}
          </div>

          <Button
            onClick={() => setRequestFormOpen(true)}
            className="hidden h-11 w-full shrink-0 rounded-xl bg-raw-gold px-4 text-sm font-semibold text-raw-ink hover:bg-raw-gold/90 md:flex md:w-auto"
          >
            <Plus className="h-4 w-4" /> Request a Community
          </Button>
        </div>

        {activePendingRequest && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/85">Community request in queue</p>
                <p className="mt-2 font-display text-base text-raw-text">{activePendingRequest.communityName}</p>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-raw-silver/50">
                  Admin review is pending. Once approved, the team can turn this into a live room with moderation and onboarding rules.
                </p>
              </div>
              <div className="rounded-full border border-amber-300/20 px-3 py-1 text-[11px] text-amber-200/80">
                Submitted {formatAdminTimestamp(activePendingRequest.submittedAt)}
              </div>
            </div>
          </div>
        )}

        <CommunityRoomList
          communities={directoryCommunities}
          userId={user.id}
          logoUrlsByCommunityId={COMMUNITY_LOGOS}
          coverImagesByCommunityId={COMMUNITY_COVER_IMAGES}
          coverVideosByCommunityId={COMMUNITY_COVER_VIDEOS}
          expandedDescriptionIds={expandedDescs}
          joinRequests={communityJoinRequests}
          waitlistJoinedIds={waitlistJoinedIds}
          waitlistCounts={waitlistCounts}
          waitlistJoiningId={waitlistJoiningId}
          waitlistUnlockThreshold={WAITLIST_UNLOCK_THRESHOLD}
          hasSubscriptionAccess={communityAccess.hasSubscription}
          unlockedCommunityIds={communityAccess.unlockedIds}
          freeCommunitySlotsRemaining={freeCommunitySlotsRemaining}
          unlockingId={unlockingId}
          unlockTokenCost={COMMUNITY_UNLOCK_TOKEN_COST}
          onToggleDescription={(communityId) => setExpandedDescs((previous) => {
            const next = new Set(previous);
            if (next.has(communityId)) next.delete(communityId);
            else next.add(communityId);
            return next;
          })}
          onPaidJoinCommunity={(communityId, shouldOpenPage) => { void handlePaidJoinCommunity(communityId, shouldOpenPage); }}
          onJoinWaitlist={(community) => { void handleJoinWaitlist(community); }}
          onOpenCommunity={onOpenCommunity}
          onUnlockCommunity={(communityId) => { void handleUnlockCommunity(communityId); }}
        />
      </div>
    );

    const renderChatPage = () => {
      if (!selectedCommunity) {
        return null;
      }

      return (
        <motion.div
          className="fixed inset-x-0 top-14 z-30 flex flex-col overflow-hidden sm:static sm:inset-auto sm:z-auto sm:block sm:h-auto sm:overflow-visible sm:space-y-6"
          style={{ bottom: "max(72px, calc(56px + env(safe-area-inset-bottom)))" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          {/* Desktop: full header card */}
          <div className="hidden sm:flex sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 sm:rounded-3xl sm:border sm:border-raw-border/30 sm:bg-raw-surface/25 sm:p-5">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <button
                onClick={() => onBackToCommunities?.()}
                className="mt-1 shrink-0 rounded-full border border-raw-border/30 p-2 text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <CommunityBadge abbr={selectedCommunity.abbr} title={selectedCommunity.title} logoUrl={COMMUNITY_LOGOS[selectedCommunity.id] ?? selectedCommunity.logoUrl} />
              <div className="min-w-0">
                <h1 className="font-display text-2xl tracking-wide text-raw-text">{selectedCommunity.title}</h1>
                <p className="mt-2 text-sm text-raw-silver/45">{selectedCommunity.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-raw-border/30 px-3 py-1 text-[11px] text-raw-silver/40">
                {onlineNow} online now
              </div>
              {unreadCount > 0 && (
                <div className="rounded-full border border-raw-gold/20 bg-raw-gold/[0.08] px-3 py-1 text-[11px] text-raw-gold/75">
                  {unreadCount} unread
                </div>
              )}
              {!isJoined && !selectedCommunity.locked && (
                <button
                  onClick={() => handlePaidJoinCommunity(selectedCommunity.id)}
                  className="flex items-center gap-2 rounded-full bg-raw-gold px-3 py-1.5 text-[11px] font-semibold text-raw-ink transition-colors hover:bg-raw-gold/90"
                >
                  Join Group
                </button>
              )}
              {!isJoined && selectedCommunity.locked && (() => {
                const joinReq = communityJoinRequests.find(
                  (r) => r.communityId === selectedCommunity.id && r.requesterId === user.id,
                );
                if (joinReq?.status === "approved") {
                  return (
                    <button
                      onClick={() => handlePaidJoinCommunity(selectedCommunity.id)}
                      className="flex items-center gap-2 rounded-full bg-raw-gold px-3 py-1.5 text-[11px] font-semibold text-raw-ink transition-colors hover:bg-raw-gold/90"
                    >
                      Join Group
                    </button>
                  );
                }
                if (joinReq?.status === "pending" || joinReq?.status === "rejected") {
                  return (
                    <div className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[11px] text-amber-200/80">
                      {joinReq.status === "pending" ? "Access request pending" : "Rejected by admin"}
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => handleRequestJoinCommunity(selectedCommunity)}
                    className="flex items-center gap-2 rounded-full border border-raw-gold/30 bg-transparent px-3 py-1.5 text-[11px] text-raw-gold transition-colors hover:bg-raw-gold/10"
                  >
                    <Lock className="h-3.5 w-3.5" /> Join Waiting List
                  </button>
                );
              })()}
              {canEditSelectedCommunity && (
                <>
                <button
                  onClick={() => setMembersDialogOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold"
                >
                  <Users className="h-3.5 w-3.5" /> Members
                </button>
                <button
                  onClick={() => setCommunityPollsExpanded((expanded) => !expanded)}
                  className="flex items-center gap-2 rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Poll Results
                </button>
                <button
                  onClick={() => {
                    setCommunitySettingsDraft({
                      title: selectedCommunity.title,
                      logoUrl: selectedCommunity.logoUrl ?? "",
                    });
                    setLogoDialogOpen(true);
                  }}
                  className="rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold"
                >
                  Edit Group
                </button>
                </>
              )}
              {isJoined && (() => {
                const isFavorite = favoriteCommunityIds.includes(selectedCommunity.id);
                const favLimitHit = !isFavorite && favoriteCommunityIds.length >= MAX_FAVORITE_COMMUNITIES;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (favLimitHit) return;
                      void handleToggleFavorite(selectedCommunity.id);
                    }}
                    disabled={favLimitHit}
                    aria-pressed={isFavorite}
                    title={isFavorite ? "Remove from favorites" : favLimitHit ? "Favorites limit reached (3)" : "Add to favorites"}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                      isFavorite
                        ? "border-raw-gold/55 bg-raw-gold/15 text-raw-gold"
                        : favLimitHit
                          ? "border-raw-border/25 bg-raw-black/30 text-raw-silver/35"
                          : "border-raw-border/30 text-raw-silver/55 hover:border-raw-gold/30 hover:text-raw-gold"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                    <span>{isFavorite ? "Favorited" : "Favorite"}</span>
                  </button>
                );
              })()}
              {isJoined && (
                <button
                  onClick={handleLeaveCommunity}
                  disabled={leavingCommunityId === selectedCommunity.id}
                  className="rounded-full border border-red-400/25 bg-red-500/[0.06] px-3 py-1.5 text-[11px] font-semibold text-red-200/80 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {leavingCommunityId === selectedCommunity.id ? "Leaving..." : "Leave"}
                </button>
              )}
              <button
                onClick={() => {
                  if (!currentMember) return;
                  setCommunityNotificationsSupabase(selectedCommunity.id, user.id, !currentMember.notificationsEnabled)
                    .then(() => reloadChatData())
                    .catch(() => {});
                }}
                disabled={!currentMember}
                className="flex items-center gap-2 rounded-full border border-raw-gold/20 bg-raw-gold/[0.05] px-3 py-1.5 text-[11px] text-raw-gold/70 transition-colors hover:bg-raw-gold/[0.09] disabled:opacity-60"
              >
                {currentMember?.notificationsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                <span>{currentMember?.notificationsEnabled ? "Notifications On" : "Notifications Off"}</span>
              </button>
            </div>
          </div>

          {(warningCount > 0 || isUserBanned) && (
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
              isUserBanned
                ? "border-red-400/20 bg-red-500/10 text-red-200"
                : "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
            }`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {isUserBanned ? "Account banned after moderation review" : `${warningCount} warning${warningCount === 1 ? "" : "s"} on your account`}
            </div>
          )}

          {selectedCommunity.locked && !isJoined && (() => {
            const joinReq = communityJoinRequests.find(
              (r) => r.communityId === selectedCommunity.id && r.requesterId === user.id,
            );
            return (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-raw-border/20 bg-raw-black/35 py-16 text-center">
                <Lock className="h-8 w-8 text-raw-gold/40" />
                <div>
                  <p className="font-display text-base text-raw-text">Members only</p>
                  <p className="mt-2 max-w-sm text-sm text-raw-silver/45">
                    {joinReq?.status === "pending"
                      ? "Your request is pending admin review. You'll be added once approved."
                      : joinReq?.status === "rejected"
                        ? "Your join request was not approved. Contact admin for more info."
                        : "This community requires admin approval to join."}
                  </p>
                </div>
                {!joinReq && (
                  <button
                    onClick={() => handleRequestJoinCommunity(selectedCommunity)}
                    className="flex items-center gap-2 rounded-xl border border-raw-gold/30 bg-transparent px-5 py-2.5 text-sm text-raw-gold transition-colors hover:bg-raw-gold/10"
                  >
                    <Lock className="h-4 w-4" /> Join Waiting List
                  </button>
                )}
              </div>
            );
          })()}

          {(!selectedCommunity.locked || isJoined) && (
          <div className={`flex flex-1 min-h-0 flex-col gap-4 overflow-hidden sm:flex-none sm:h-[calc(100dvh_-_260px)] sm:min-h-[360px] ${feedOpen ? "sm:grid sm:grid-cols-[1fr_360px] sm:items-stretch" : ""}`}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:h-full sm:rounded-2xl sm:border sm:border-raw-border/20 sm:bg-raw-black/35">
            {visibleCommunityPolls.length > 0 && (
              <div className="border-b border-raw-border/15 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setCommunityPollsExpanded((expanded) => !expanded)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-raw-gold/25 bg-raw-gold/[0.04] px-3 py-2 text-left"
                  aria-expanded={communityPollsExpanded}
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-raw-gold/75">
                      Polls · Pinned
                    </span>
                    <span className="block truncate text-sm font-semibold text-raw-text">
                      {visibleCommunityPolls.length === 1 ? visibleCommunityPolls[0].question : `${visibleCommunityPolls.length} active polls`}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-raw-border/30 px-2 py-0.5 text-[10px] text-raw-silver/55">
                    {communityPollsExpanded ? "Hide" : "Answer"}
                  </span>
                </button>

                {communityPollsExpanded && (
                  <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {visibleCommunityPolls.map((poll) => {
                      const totalVotes = poll.totalVotes;
                      return (
                        <div key={`poll-panel-${poll.id}`} className="rounded-2xl border border-raw-gold/25 p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-raw-text">{poll.question}</p>
                              <p className="mt-0.5 text-[10px] text-raw-silver/45">
                                {totalVotes} {totalVotes === 1 ? "vote" : "votes"} · anonymous results only
                              </p>
                            </div>
                            {canManagePolls && (
                              <button
                                onClick={() => { void handleDeletePoll(poll.id); }}
                                className="rounded-full border border-raw-border/30 p-1.5 text-raw-silver/45 hover:border-red-400/40 hover:text-red-300"
                                aria-label="Archive poll"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {poll.options.map((option) => {
                              const isSelected = poll.userVoteOptionId === option.id;
                              const pct = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => { void handleVoteOnPoll(poll.id, option.id); }}
                                  className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                    isSelected
                                      ? "border-raw-gold/60 bg-raw-gold/15 text-raw-text"
                                      : "border-raw-border/25 bg-raw-black/30 text-raw-silver/80 hover:border-raw-gold/40"
                                  }`}
                                >
                                  <div className="absolute inset-y-0 left-0 bg-raw-gold/15" style={{ width: `${pct}%` }} aria-hidden />
                                  <div className="relative flex items-center justify-between gap-2">
                                    <span className="font-medium">{option.text}</span>
                                    <span className="text-[11px] text-raw-silver/55">{option.votes} · {pct}%</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* Search bar */}
            <div className="flex items-center gap-3 border-b border-raw-border/15 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-raw-silver/35" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search this group chat"
                className="w-full bg-transparent text-sm text-raw-text placeholder:text-raw-silver/25 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="rounded-full p-1 text-raw-silver/40 hover:text-raw-text">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Feed toggle — sits in the search bar, desktop only */}
              <button
                onClick={() => setFeedOpen((o) => !o)}
                title={feedOpen ? "Close feed" : "Open general feed"}
                className={`hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors ${
                  feedOpen
                    ? "border-raw-gold/40 bg-raw-gold/10 text-raw-gold"
                    : "border-raw-border/30 text-raw-silver/45 hover:border-raw-gold/20 hover:text-raw-gold"
                }`}
              >
                <PanelRight className="h-3.5 w-3.5" />
                <span>Feed</span>
              </button>
            </div>

            <CommunityMessageTimeline
              containerRef={messagesContainerRef}
              polls={communityPolls}
              groupedMessages={groupedMessages}
              activeMessageCount={activeMessages.length}
              canManagePolls={canManagePolls}
              userId={user.id}
              username={user.username}
              senderAvatarLevels={senderAvatarLevels}
              onDeletePoll={handleDeletePoll}
              onVotePoll={handleVoteOnPoll}
              onRetryMessage={handleRetryMessage}
              onLikeMessage={handleLikeMessage}
              onPinMessage={handlePinMessage}
              onOpenMessageReport={handleOpenMessageReport}
              onBlockMessageSender={handleBlockMessageSender}
            />

            <CommunityMessageComposer
              inputRef={messageInputRef}
              draft={messageDraft}
              maxLength={MAX_COMMUNITY_MESSAGE_LENGTH}
              members={selectedCommunity?.members ?? []}
              mentionQuery={mentionQuery}
              mentionIndex={mentionIndex}
              canManagePolls={canManagePolls}
              disabled={isUserBanned}
              onDraftChange={setMessageDraft}
              onMentionQueryChange={setMentionQuery}
              onMentionIndexChange={setMentionIndex}
              onOpenPollComposer={handleOpenPollComposer}
              onSendMessage={handleSendMessage}
            />
          </div>

          {/* Feed panel — visible only on sm+ when feedOpen */}
          {feedOpen && (
            <div className="hidden sm:flex sm:flex-col sm:h-full sm:overflow-hidden sm:rounded-2xl sm:border sm:border-raw-border/20 sm:bg-raw-black/35">
              <GeneralFeedBox
                userId={user.id}
                isLight={false}
                compact
                showHeader={false}
                fillHeight
                communityId={selectedCommunity?.id}
              />
            </div>
          )}
          </div>
          )}
        </motion.div>
      );
    };

    if (activeCommunityId && isInitialCommunitiesLoading && !selectedCommunity) {
      return (
        <motion.div
          className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="h-6 w-40 animate-pulse rounded-full bg-raw-surface/60" />
          <div className="mt-4 h-56 animate-pulse rounded-2xl bg-raw-black/35" />
        </motion.div>
      );
    }

    if (activeCommunityId && !selectedCommunity) {
      return (
        <div className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-8 text-center text-raw-silver/50">
          <p className="font-display text-lg text-raw-text">This community could not be found.</p>
          <button
            onClick={() => onBackToCommunities?.()}
            className="mt-4 rounded-xl bg-raw-gold px-4 py-2 text-sm font-semibold text-raw-ink"
          >
            Back to communities
          </button>
        </div>
      );
    }

    return (
      <>
      {confirmDialog}
      <div className="space-y-8">
        {activeCommunityId ? renderChatPage() : renderDirectoryView()}

        {/* Mobile-only request button above dock (near profile) */}
        {!activeCommunityId && (
          <motion.button
            onClick={() => {
              if (mobileRequestExpanded) {
                setRequestFormOpen(true);
                setMobileRequestExpanded(false);
              } else {
                setMobileRequestExpanded(true);
              }
            }}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed right-4 z-50 flex items-center gap-2 rounded-full bg-raw-gold py-3 text-sm font-semibold text-raw-ink shadow-xl hover:bg-raw-gold/90 md:hidden overflow-hidden"
            style={{
              bottom: "calc(5rem + env(safe-area-inset-bottom))",
              paddingLeft: mobileRequestExpanded ? "1rem" : "0.75rem",
              paddingRight: mobileRequestExpanded ? "1.25rem" : "0.75rem",
            }}
          >
            <Plus className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {mobileRequestExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  Request a Community
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Animated floating request button (bottom left) */}
        <AnimatePresence>
          {showRequestButton && !activeCommunityId && (
            <motion.button
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={() => {
                setRequestFormOpen(true);
                toast({
                  title: "Request a new community",
                  description: "Fill out the form to suggest a new community for review.",
                });
              }}
              className="fixed right-4 z-50 hidden items-center gap-2 rounded-2xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink shadow-xl hover:bg-raw-gold/90 focus:outline-none md:flex"
              style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <motion.span
                key={requestBtnText}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4 }}
              >
                {requestBtnText}
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        <CommunitySettingsDialog
          open={logoDialogOpen}
          draft={communitySettingsDraft}
          onOpenChange={setLogoDialogOpen}
          onDraftChange={setCommunitySettingsDraft}
          onSave={handleCommunitySettingsSave}
        />

        <CommunityMembersDialog
          open={membersDialogOpen}
          members={selectedCommunity?.members ?? []}
          currentUserId={user.id}
          canManagePolls={canManagePolls}
          onOpenChange={setMembersDialogOpen}
          onKickMember={(memberId, username) => { void handleKickMember(memberId, username); }}
        />

        <CommunityProfileDialog
          open={profileDialogOpen}
          target={profileTarget}
          communities={communities}
          logoUrlsByCommunityId={COMMUNITY_LOGOS}
          senderAvatarLevels={senderAvatarLevels}
          onOpenChange={setProfileDialogOpen}
          onOpenCommunity={onOpenCommunity}
        />

        <CommunityRequestDialog
          open={requestFormOpen}
          draft={requestDraft}
          submitAttempted={requestSubmitAttempted}
          username={user.username}
          onOpenChange={setRequestFormOpen}
          onSubmitAttemptedChange={setRequestSubmitAttempted}
          onDraftFieldChange={updateRequestDraft}
          onSubmit={handleSubmitCommunityRequest}
        />

        <CommunityReportDialog
          open={reportDialogOpen}
          target={reportTarget}
          draft={reportDraft}
          onOpenChange={setReportDialogOpen}
          onDraftChange={setReportDraft}
          onSubmit={handleSubmitReport}
        />

        <CommunityPollComposerDialog
          open={pollComposerOpen}
          question={pollQuestion}
          optionDrafts={pollOptionDrafts}
          submitting={pollSubmitting}
          onOpenChange={setPollComposerOpen}
          onQuestionChange={setPollQuestion}
          onOptionChange={handleUpdatePollOption}
          onSubmit={() => { void handleSubmitPoll(); }}
        />
      </div>
      </>
    );
  }
