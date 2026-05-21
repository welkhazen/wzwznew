import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import IIJMLogo from "@/assets/itisjustme.webp";
import { AlertTriangle, ArrowLeft, Bell, BellOff, Heart, ImagePlus, Lock, Plus, Search, Send, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { CommunityBadge } from "@/components/dashboard/CommunityBadge";

import {
  ensureUserRecord,
  formatAdminTimestamp,
  getPersistedUserById,
  readChatReports,
  readCommunityJoinRequests,
  writeChatReports,
  writeCommunityJoinRequests,
} from "@/lib/adminData";
import {
  canManageCommunity,
  countUnreadMessages,
  countOnlineMembers,
  formatChatDayLabel,
  formatChatTimestamp,
  leaveCommunityChat,
  updateCommunityPresentation,
} from "@/lib/communityChat";
import {
  fetchCommunities,
  joinCommunity as joinCommunitySupabase,
  leaveCommunity as leaveCommunitySupabase,
  touchMemberActivity,
  markCommunityRead as markCommunityReadSupabase,
  setCommunityNotifications as setCommunityNotificationsSupabase,
} from "@/backend/supabase/controllers/communityController";
import { sendMessage as sendMessageSupabase, likeMessage } from "@/backend/supabase/controllers/chatController";
import { submitCommunityRequest, fetchCommunityRequests } from "@/backend/supabase/controllers/communityRequestController";
import {
  fetchWaitlistSummary,
  joinCommunityWaitlist,
} from "@/backend/supabase/controllers/waitlistController";
import {
  COMMUNITY_COVER_IMAGES,
  COMMUNITY_COVER_VIDEOS,
} from "@/lib/communityConstants";
import { sendCommunityPushNotification } from "@/lib/communityPushNotifications";
import type { PersistedCommunityRecord } from "@/lib/communityChat.types";
import {
  loadCommunityAccess,
  unlockCommunity,
  FREE_COMMUNITY_SLOTS,
  COMMUNITY_UNLOCK_TOKEN_COST,
  type CommunityAccess,
} from "@/lib/communityAccess";

const WAITLIST_UNLOCK_THRESHOLD = 200;

export function DashboardCommunities(props) {
      // Main search query state (fix ReferenceError)
      const [searchQuery, setSearchQuery] = useState("");
    // Main community state (fix ReferenceError)
    const [communities, setCommunities] = useState([]);
  // Destructure props for clarity and to avoid ReferenceError
  const {
    user,
    activeCommunityId = null,
    onOpenCommunity,
    onBackToCommunities,
    onCommunitiesChange,
  } = props;
  // --- Floating request button state/hooks ---
  const [showRequestButton, setShowRequestButton] = useState(false);
  const [requestBtnText, setRequestBtnText] = useState("Didn't find your community?");
  const [mobileRequestExpanded, setMobileRequestExpanded] = useState(false);

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
// ...existing code...

interface DashboardCommunitiesProps {
  user: User;
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

// ...existing code continues inside the function above...
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestSubmitAttempted, setRequestSubmitAttempted] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [communitySettingsDraft, setCommunitySettingsDraft] = useState<CommunitySettingsDraft>(INITIAL_COMMUNITY_SETTINGS_DRAFT);
  const [requestDraft, setRequestDraft] = useState<CommunityRequestDraft>(INITIAL_REQUEST_DRAFT);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(INITIAL_REPORT_DRAFT);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [communityJoinRequests, setCommunityJoinRequests] = useState<CommunityJoinRequestRecord[]>([]);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [waitlistJoinedIds, setWaitlistJoinedIds] = useState<Set<string>>(new Set());
  const [waitlistJoiningId, setWaitlistJoiningId] = useState<string | null>(null);
  const [communityAccess, setCommunityAccess] = useState<CommunityAccess>({ hasSubscription: false, unlockedIds: new Set<string>() });
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [expandedDescs, setExpandedDescs] = useState<Set<string>>(new Set());
  const lastTouchedCommunityRef = useRef<string>("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

    const reloadChatData = useCallback(async () => {
      const [communitiesData, requestsData, waitlistData, accessData] = await Promise.all([
        fetchCommunities(),
        fetchCommunityRequests(user.id),
        fetchWaitlistSummary(user.id).catch(() => createEmptyWaitlistSummary()),
        loadCommunityAccess(user.id).catch(() => ({ hasSubscription: false, unlockedIds: new Set<string>() })),
      ]);
      setCommunities(communitiesData);
      onCommunitiesChange?.(communitiesData);
      setCommunityRequests(requestsData);
      setChatReports(readChatReports());
      setCommunityJoinRequests(readCommunityJoinRequests());
      setWaitlistCounts(waitlistData.counts);
      setWaitlistJoinedIds(waitlistData.joinedCommunityIds);
      setCommunityAccess(accessData);
    }, [onCommunitiesChange, user.id]);

    const selectedCommunity = useMemo(
      () => activeCommunityId ? communities.find((community) => community.id === activeCommunityId) ?? null : null,
      [activeCommunityId, communities]
    );
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
    const onlineNow = selectedCommunity ? countOnlineMembers(selectedCommunity) : 0;
    const visibleMembers = selectedCommunity?.members.slice(0, 5) ?? [];
    const unreadCount = selectedCommunity && isJoined ? countUnreadMessages(selectedCommunity, user.id) : 0;

    const activeMessages = useMemo(() => selectedCommunity?.messages ?? [], [selectedCommunity]);
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

    useEffect(() => {
      setSearchQuery("");
    }, [activeCommunityId]);

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

    const handleLeaveCommunity = async () => {
      if (!selectedCommunity || !isJoined || leavingCommunityId) {
        return;
      }

      const communityId = selectedCommunity.id;
      const communityTitle = selectedCommunity.title;
      setLeavingCommunityId(communityId);

      try {
        await leaveCommunitySupabase(communityId, user.id);
        leaveCommunityChat(communityId, user.id);
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
        const result = await unlockCommunity(user.id, communityId);
        if (!result.ok) {
          if (result.error === "insufficient_tokens") {
            toast({
              title: "Not enough tokens",
              description: `You need ${COMMUNITY_UNLOCK_TOKEN_COST} tokens. Buy more in Billing.`,
            });
            return;
          }
          // RPC missing or network error — open anyway, access check will re-run on next load
          onOpenCommunity(communityId);
          return;
        }
        setCommunityAccess((prev) => ({
          ...prev,
          unlockedIds: new Set([...prev.unlockedIds, communityId]),
        }));
        onOpenCommunity(communityId);
      } catch {
        // Fallback: open the community rather than blocking the user
        onOpenCommunity(communityId);
      } finally {
        setUnlockingId(null);
      }
    };

    const handleSendMessage = async () => {
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

        await sendMessageSupabase(selectedCommunity.id, {
          senderId: user.id,
          senderName: user.username,
          text: trimmedMessage,
        });
        await reloadChatData();
        setMessageDraft("");
        setMentionQuery(null);
        void sendCommunityPushNotification({
          recipientUserIds: mentionRecipientIds,
          title: `@${user.username} mentioned you`,
          body: `${selectedCommunity.title}: ${trimmedMessage}`,
          url: `${window.location.origin}/dashboard/communities/${selectedCommunity.id}`,
        });
      } catch {
        toast({ title: "Failed to send message", description: "Please try again." });
      }
    };

    const handleLikeMessage = async (message: CommunityChatMessageRecord) => {
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
    };

    const handleCommunitySettingsSave = () => {
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

      const updatedCommunity = updateCommunityPresentation(selectedCommunity.id, {
        actorUserId: user.id,
        actorUsername: user.username,
        title: trimmedTitle,
        logoUrl: communitySettingsDraft.logoUrl,
      });

      if (!updatedCommunity) {
        toast({
          title: "Creator access required",
          description: "Only the community creator can change the group name or logo.",
        });
        return;
      }

      reloadChatData();
      setLogoDialogOpen(false);
      toast({
        title: "Community updated",
        description: `${updatedCommunity.title} now shows the latest name and logo across the app.`,
      });
    };

    const handleSubmitReport = () => {
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
      const nextReport: ChatReportRecord = {
        id: `chat-report-${Date.now()}`,
        communityId: reportTarget.communityId,
        communityTitle: reportTarget.communityTitle,
        messageId: reportTarget.message.id,
        messageText: reportTarget.message.text,
        reportedUserId: reportTarget.message.senderId || reportedUser.id,
        reportedUsername: reportTarget.message.senderName,
        reporterId: user.id,
        reporterName: user.username,
        reason,
        details,
        createdAt: new Date().toISOString(),
        status: "open",
      };

      setChatReports((previous) => {
        const nextReports = [nextReport, ...previous];
        writeChatReports(nextReports);
        return nextReports;
      });
      setReportDialogOpen(false);
      setReportTarget(null);
      setReportDraft(INITIAL_REPORT_DRAFT);
      toast({
        title: "Report sent for review",
        description: `The message from ${nextReport.reportedUsername} is now in the admin review queue.`,
      });
    };

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

      try {
        const newRequest = await submitCommunityRequest({
          requesterId: user.id,
          requesterName: user.username,
          communityName: trimmedDraft.communityName,
          genre: trimmedDraft.genre,
          focusArea: trimmedDraft.focusArea,
          audience: trimmedDraft.audience,
          whyNow: trimmedDraft.whyNow,
          samplePrompt: trimmedDraft.samplePrompt,
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

        <div className="grid grid-cols-2 items-stretch gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {directoryCommunities.map((community) => {
            const joined = community.members.some((member) => member.userId === user.id);
            // Count joined communities toward free quota so existing members don't get unlimited free slots on new communities
            const joinedCount = directoryCommunities.filter(c => c.members.some(m => m.userId === user.id)).length;
            const effectiveUnlockCount = Math.max(communityAccess.unlockedIds.size, joinedCount);
            const communityUnreadCount = joined ? countUnreadMessages(community, user.id) : 0;
            const coverImage = COMMUNITY_COVER_IMAGES[community.id] ?? community.logoUrl;
            const coverVideo = COMMUNITY_COVER_VIDEOS[community.id];
            const isExpanded = expandedDescs.has(community.id);
            const descLong = community.description.length > 120;

            return (
              <div key={community.id} className="flex flex-col overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/35 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
                {/* Cover image */}
                <div className="relative h-28 sm:h-44 shrink-0 overflow-hidden border-b border-raw-border/25">
                  {coverVideo ? (
                    <video src={coverVideo} className="h-full w-full object-cover" autoPlay loop muted playsInline preload="auto" />
                  ) : coverImage ? (
                    <img src={coverImage} alt={`${community.title} cover`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-raw-gold/12 via-raw-surface/30 to-raw-black/70" />
                  )}
                  {!coverVideo && <div className="absolute inset-0 bg-gradient-to-t from-raw-black/85 via-raw-black/30 to-transparent" />}
                  <div className="absolute bottom-2 right-2 rounded-full border border-raw-border/40 bg-raw-black/60 px-2 py-0.5 text-[9px] text-raw-silver/70 backdrop-blur-sm">
                    {joined ? "Joined" : community.locked ? "Locked" : "Not joined"}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-5">
                  {/* Title row */}
                  <div className="flex items-center gap-2">
                    <CommunityBadge abbr={community.abbr} title={community.title} logoUrl={COMMUNITY_LOGOS[community.id] ?? community.logoUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-display text-xs sm:text-base tracking-wide text-raw-text leading-tight">{community.title}</p>
                        {communityUnreadCount > 0 && (
                          <span className="rounded-full bg-raw-gold px-1.5 py-0.5 text-[9px] font-semibold text-raw-ink">
                            {communityUnreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] uppercase tracking-[0.14em] text-raw-gold/65">{community.status}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-2">
                    <p className={`text-[11px] sm:text-sm leading-relaxed text-raw-silver/50 line-clamp-2 sm:${!isExpanded && descLong ? "line-clamp-3" : ""}`}>
                      {community.description}
                    </p>
                    {descLong && (
                      <button
                        onClick={() => setExpandedDescs((prev) => {
                          const next = new Set(prev);
                          if (isExpanded) next.delete(community.id);
                          else next.add(community.id);
                          return next;
                        })}
                        className="mt-0.5 hidden sm:block text-xs text-raw-gold/60 hover:text-raw-gold"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>

                  {/* Members row */}
                  <div className="mt-2 sm:mt-4 flex items-center gap-2 text-[10px] text-raw-silver/35">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {community.members.length}
                    </span>
                    {!community.locked && (
                      <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" /> {countOnlineMembers(community)}
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="mt-auto pt-3">
                    {community.locked && !joined ? (() => {
                      const joinReq = communityJoinRequests.find(
                        (r) => r.communityId === community.id && r.requesterId === user.id,
                      );
                      if (joinReq?.status === "approved") {
                        return (
                          <Button
                            onClick={() => handleJoinCommunity(community.id, true)}
                            className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90"
                          >
                            Open Chat
                          </Button>
                        );
                      }
                      const onWaitlist = waitlistJoinedIds.has(community.id);
                      const waitlistCount = waitlistCounts[community.id] ?? 0;
                      const isJoining = waitlistJoiningId === community.id;
                      return (
                        <div className="space-y-1.5">
                          <Button
                            onClick={() => handleJoinWaitlist(community)}
                            disabled={onWaitlist || isJoining}
                            className="w-full rounded-xl border border-raw-gold/30 bg-transparent px-2 py-2 text-xs text-raw-gold hover:bg-raw-gold/10 disabled:opacity-70"
                          >
                            <Lock className="h-3 w-3" /> {onWaitlist ? "On Waitlist" : "Join Waitlist"}
                          </Button>
                          <p className="text-center text-[10px] text-raw-silver/45">
                            <span className="text-raw-gold/80">{waitlistCount}</span>
                            <span className="text-raw-silver/35">/{WAITLIST_UNLOCK_THRESHOLD}</span>
                            <span className="ml-1">to unlock</span>
                          </p>
                        </div>
                      );
                    })() : (() => {
                      const isUnlocked = joined || communityAccess.hasSubscription || communityAccess.unlockedIds.has(community.id);
                      const canGetFree = !isUnlocked && effectiveUnlockCount < FREE_COMMUNITY_SLOTS;
                      const freeRemaining = Math.max(0, FREE_COMMUNITY_SLOTS - effectiveUnlockCount);
                      const isUnlocking = unlockingId === community.id;
                      if (isUnlocked) {
                        return (
                          <Button
                            onClick={() => onOpenCommunity(community.id)}
                            className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90"
                          >
                            Open Chat
                          </Button>
                        );
                      }
                      if (canGetFree) {
                        return (
                          <div className="space-y-1.5">
                            <Button
                              onClick={() => handleUnlockCommunity(community.id)}
                              disabled={isUnlocking}
                              className="w-full rounded-xl bg-raw-gold px-2 py-2 text-xs text-raw-ink hover:bg-raw-gold/90 disabled:opacity-70"
                            >
                              {isUnlocking ? "Opening…" : "Open Chat — Free"}
                            </Button>
                            <p className="text-center text-[10px] text-raw-silver/40">
                              {freeRemaining} free slot{freeRemaining === 1 ? "" : "s"} remaining
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-1.5">
                          <Button
                            onClick={() => handleUnlockCommunity(community.id)}
                            disabled={isUnlocking}
                            className="w-full rounded-xl border border-raw-gold/40 bg-transparent px-2 py-2 text-xs text-raw-gold hover:bg-raw-gold/10 disabled:opacity-70"
                          >
                            <Lock className="h-3 w-3" /> {isUnlocking ? "Unlocking…" : `Unlock — ${COMMUNITY_UNLOCK_TOKEN_COST} tokens`}
                          </Button>
                          <p className="text-center text-[10px] text-raw-silver/40">or subscribe for all access</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    const renderChatPage = () => {
      if (!selectedCommunity) {
        return null;
      }

      return (
        <div
          className="fixed inset-x-0 top-14 z-30 flex flex-col overflow-hidden sm:static sm:inset-auto sm:z-auto sm:block sm:h-auto sm:overflow-visible sm:space-y-6"
          style={{ bottom: "max(72px, calc(56px + env(safe-area-inset-bottom)))" }}
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
                  onClick={() => handleJoinCommunity(selectedCommunity.id)}
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
                      onClick={() => handleJoinCommunity(selectedCommunity.id)}
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
              )}
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
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden sm:rounded-2xl sm:border sm:border-raw-border/20 sm:bg-raw-black/35 sm:flex-none sm:h-[calc(100dvh_-_260px)] sm:min-h-[360px]">
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
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {groupedMessages.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="sticky top-0 z-10 flex justify-center py-1">
                    <span className="rounded-full border border-raw-border/20 bg-raw-black/85 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-raw-silver/40 backdrop-blur">
                      {group.label}
                    </span>
                  </div>
                  {group.messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id || message.senderName === user.username;
                    const likedBy = message.likedBy ?? [];
                    const alreadyLiked = likedBy.includes(user.id);
                    const likeCount = likedBy.length;

                    return (
                      <div key={message.id} className="group/msg relative w-full rounded-xl px-3.5 py-2.5 backdrop-blur-sm"
                        style={isOwnMessage ? {
                          background: "rgb(var(--raw-accent) / 0.10)",
                          border: "1px solid rgb(var(--raw-accent) / 0.25)",
                        } : {
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {message.replyToText && (
                          <div className="mb-1.5 rounded-lg border border-raw-border/20 bg-raw-black/20 px-2.5 py-1.5 text-xs text-raw-silver/55">
                            <p className="font-medium text-raw-gold/75">↩ {message.replyToSenderName}</p>
                            <p className="mt-0.5 truncate">{message.replyToText}</p>
                          </div>
                        )}
                        <p className={`text-sm leading-snug ${message.deletedAt ? "italic text-raw-silver/45" : ""}`}>
                          <span
                            className="mr-0.5 font-semibold uppercase tracking-wide text-[11px]"
                            style={{ color: isOwnMessage ? "rgb(var(--raw-accent))" : "rgb(var(--raw-accent) / 0.65)" }}
                          >
                            {message.senderName}:
                          </span>
                          {" "}
                          <span className={isOwnMessage ? "text-raw-text" : "text-raw-silver/75"}>
                            {message.text.split(/(@\w+)/g).map((part, i) =>
                              /^@\w+$/.test(part)
                                ? <span key={i} className="font-semibold text-raw-gold">{part}</span>
                                : part
                            )}
                          </span>
                          <span className="ml-2 text-[9px] text-raw-silver/25">{formatChatTimestamp(message.createdAt)}</span>
                          {message.pinned && <span className="ml-1 text-[9px] text-raw-gold/60">· Pinned</span>}
                        </p>
                        {!message.deletedAt && (
                          <button
                            onClick={() => { void handleLikeMessage(message); }}
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-all ${alreadyLiked ? "border-raw-gold/45 bg-raw-gold/10 text-raw-gold opacity-100" : "border-raw-border/20 text-raw-silver/40 opacity-0 group-hover/msg:opacity-100"}`}
                          >
                            <Heart className={`h-2.5 w-2.5 ${alreadyLiked ? "fill-current" : ""}`} />
                            {likeCount > 0 && <span>{likeCount}</span>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {!groupedMessages.length && !activeMessages.length && (
                <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
                  This group is quiet right now. Join and start the first real conversation.
                </div>
              )}
              {!groupedMessages.length && activeMessages.length > 0 && (
                <div className="flex h-full items-center justify-center text-sm text-raw-silver/35">
                  No messages match your search.
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-raw-border/15 px-3 py-3">
              {isUserBanned && (
                <div className="mb-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                  Chat posting is disabled for this account.
                </div>
              )}
              {mentionQuery !== null && (() => {
                const members = selectedCommunity?.members ?? [];
                const filtered = members.filter((m) => m.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6);
                if (!filtered.length) return null;
                return (
                  <div className="mb-2 rounded-xl border border-raw-border/30 bg-raw-black/90 overflow-hidden">
                    {filtered.map((m, i) => (
                      <button
                        key={m.userId}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const atIdx = messageDraft.lastIndexOf("@");
                          const newVal = messageDraft.slice(0, atIdx) + `@${m.username} `;
                          setMessageDraft(newVal);
                          setMentionQuery(null);
                          setTimeout(() => messageInputRef.current?.focus(), 0);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm text-raw-text hover:bg-raw-surface/40 ${i === mentionIndex ? "bg-raw-surface/30" : ""}`}
                      >
                        @{m.username}
                      </button>
                    ))}
                  </div>
                );
              })()}
              <div className="flex gap-2">
                <input
                  ref={messageInputRef}
                  value={messageDraft}
                  onChange={(event) => {
                    const val = event.target.value;
                    setMessageDraft(val);
                    const atIdx = val.lastIndexOf("@");
                    if (atIdx !== -1 && (atIdx === 0 || val[atIdx - 1] === " ")) {
                      setMentionQuery(val.slice(atIdx + 1));
                      setMentionIndex(0);
                    } else {
                      setMentionQuery(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (mentionQuery !== null) {
                      const members = (selectedCommunity?.members ?? []).filter((m) => m.username.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 6);
                      if (event.key === "ArrowDown") { event.preventDefault(); setMentionIndex((i) => Math.min(i + 1, members.length - 1)); return; }
                      if (event.key === "ArrowUp") { event.preventDefault(); setMentionIndex((i) => Math.max(i - 1, 0)); return; }
                      if ((event.key === "Enter" || event.key === "Tab") && members[mentionIndex]) {
                        event.preventDefault();
                        const atIdx = messageDraft.lastIndexOf("@");
                        setMessageDraft(messageDraft.slice(0, atIdx) + `@${members[mentionIndex].username} `);
                        setMentionQuery(null);
                        return;
                      }
                      if (event.key === "Escape") { setMentionQuery(null); return; }
                    }
                    if (event.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  disabled={isUserBanned}
                  className="flex-1 rounded-xl border border-raw-border/30 bg-raw-surface/30 px-4 py-2.5 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isUserBanned}
                  className="flex items-center gap-1.5 rounded-xl bg-raw-gold px-4 py-2.5 text-sm font-semibold text-raw-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      );
    };

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
              className="fixed left-4 z-50 flex items-center gap-2 rounded-2xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink shadow-xl hover:bg-raw-gold/90 focus:outline-none"
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

        <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
          <DialogContent className="border border-raw-border/40 bg-raw-black p-0 text-raw-text sm:max-w-lg sm:rounded-3xl">
            <div className="border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-6 py-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="font-display text-xl tracking-wide text-raw-text">Edit community details</DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-raw-silver/45">
                  Only the community creator can change the group name or logo.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Community name</label>
                <Input
                  value={communitySettingsDraft.title}
                  onChange={(event) => setCommunitySettingsDraft((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Community name"
                  className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Logo URL</label>
                <Input
                  value={communitySettingsDraft.logoUrl}
                  onChange={(event) => setCommunitySettingsDraft((previous) => ({ ...previous, logoUrl: event.target.value }))}
                  placeholder="https://example.com/community-logo.png"
                  className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-raw-border/20 px-6 py-5 sm:justify-between">
              <p className="text-xs text-raw-silver/40">Leave empty to remove the current logo.</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLogoDialogOpen(false)}
                  className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
                >
                  Cancel
                </Button>
                <Button onClick={handleCommunitySettingsSave} className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={requestFormOpen} onOpenChange={(open) => { setRequestFormOpen(open); if (!open) setRequestSubmitAttempted(false); }}>
          <DialogContent bottomSheet className="flex flex-col bg-raw-black p-0 text-raw-text border-raw-border/40">
            {/* Header — fixed */}
            <div className="shrink-0 border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-5 py-4">
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle className="font-display text-lg tracking-wide text-raw-text">Request a new community</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-raw-silver/45">
                  Goes to admin review. Approved requests become live in-app communities.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto space-y-4 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                    Community name <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={requestDraft.communityName}
                    onChange={(event) => updateRequestDraft("communityName", event.target.value)}
                    placeholder="Creator Burnout Circle"
                    className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${requestSubmitAttempted && !requestDraft.communityName.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
                  />
                  {requestSubmitAttempted && !requestDraft.communityName.trim() && (
                    <p className="text-[11px] text-primary/80">Required</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                    Genre <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={requestDraft.genre}
                    onChange={(event) => updateRequestDraft("genre", event.target.value)}
                    placeholder="e.g. Mental Health, Tech, Sports"
                    className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${requestSubmitAttempted && !requestDraft.genre.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
                  />
                  {requestSubmitAttempted && !requestDraft.genre.trim() && (
                    <p className="text-[11px] text-primary/80">Required</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                    Focus area <span className="text-primary">*</span>
                  </label>
                  <Input
                    value={requestDraft.focusArea}
                    onChange={(event) => updateRequestDraft("focusArea", event.target.value)}
                    placeholder="Theme this room centers on"
                    className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${requestSubmitAttempted && !requestDraft.focusArea.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
                  />
                  {requestSubmitAttempted && !requestDraft.focusArea.trim() && (
                    <p className="text-[11px] text-primary/80">Required</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                  Who is this for? <span className="text-primary">*</span>
                </label>
                <Input
                  value={requestDraft.audience}
                  onChange={(event) => updateRequestDraft("audience", event.target.value)}
                  placeholder="Who would join and benefit?"
                  className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${requestSubmitAttempted && !requestDraft.audience.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
                />
                {requestSubmitAttempted && !requestDraft.audience.trim() && (
                  <p className="text-[11px] text-primary/80">Required</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                  Why should admin approve it? <span className="text-primary">*</span>
                </label>
                <Textarea
                  value={requestDraft.whyNow}
                  onChange={(event) => updateRequestDraft("whyNow", event.target.value)}
                  placeholder="Explain the need and what conversations it unlocks."
                  className={`min-h-[90px] rounded-2xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${requestSubmitAttempted && !requestDraft.whyNow.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
                />
                {requestSubmitAttempted && !requestDraft.whyNow.trim() && (
                  <p className="text-[11px] text-primary/80">Required</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Sample opening prompt</label>
                <Textarea
                  value={requestDraft.samplePrompt}
                  onChange={(event) => updateRequestDraft("samplePrompt", event.target.value)}
                  placeholder="Optional: opening topic that sets the tone."
                  className="min-h-[72px] rounded-2xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Community image / video</label>
                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-raw-border/35 bg-raw-surface/20 px-4 py-4 text-sm text-raw-silver/35 cursor-not-allowed"
                >
                  <ImagePlus className="h-4 w-4 shrink-0" />
                  <span>Upload <span className="text-[10px] uppercase tracking-wider text-raw-silver/25 ml-1">Coming soon</span></span>
                </button>
              </div>
            </div>

            {/* Footer — sticky */}
            <div className="shrink-0 border-t border-raw-border/20 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-raw-silver/40">Requesting as @{user.username}.</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setRequestFormOpen(false); setRequestSubmitAttempted(false); }}
                  className="flex-1 sm:flex-none rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCommunityRequest}
                  className="flex-1 sm:flex-none rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90"
                >
                  Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="border border-raw-border/40 bg-raw-black p-0 text-raw-text sm:max-w-xl sm:rounded-3xl">
            <div className="border-b border-raw-border/20 bg-gradient-to-br from-red-500/[0.08] via-raw-black to-raw-black px-6 py-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="font-display text-xl tracking-wide text-raw-text">Report this message</DialogTitle>
                <DialogDescription className="max-w-xl text-sm leading-relaxed text-raw-silver/45">
                  Admin can review reports here, then warn or ban the user if the report is valid.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="space-y-5 px-6 py-6">
              {reportTarget && (
                <div className="rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/35">Message under review</p>
                  <p className="mt-2 font-display text-sm text-raw-text">{reportTarget.message.senderName}</p>
                  <p className="mt-2 text-sm leading-relaxed text-raw-silver/55">{reportTarget.message.text}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Why should this be reviewed?</label>
                <Input
                  value={reportDraft.reason}
                  onChange={(event) => setReportDraft((previous) => ({ ...previous, reason: event.target.value }))}
                  placeholder="Spam, harassment, harmful content, impersonation..."
                  className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Extra context</label>
                <Textarea
                  value={reportDraft.details}
                  onChange={(event) => setReportDraft((previous) => ({ ...previous, details: event.target.value }))}
                  placeholder="Optional: explain what happened so admin can review faster."
                  className="min-h-[110px] rounded-2xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-raw-border/20 px-6 py-5 sm:justify-between">
              <p className="text-xs leading-relaxed text-raw-silver/40">Reports are stored for admin review in the hidden admin page.</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReportDialogOpen(false)}
                  className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitReport} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
                  Submit report
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
