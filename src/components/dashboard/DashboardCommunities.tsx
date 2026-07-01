import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LNTLogo from "@/assets/LNT.webp";
import SYTLogo from "@/assets/logospeak.webp";
import IIJMLogo from "@/assets/itisjustme.webp";
import { AlertTriangle, ArrowLeft, BarChart3, Bell, BellOff, Lock, Plus, Search, Star, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { CommunityBadge } from "@/components/dashboard/CommunityBadge";
import {
  ensureUserRecord,
  formatAdminTimestamp,
  getPersistedUserById,
  writeCommunityJoinRequests,
  type CommunityJoinRequestRecord,
} from "@/lib/adminData";
import { submitChatReport } from "@/backend/supabase/controllers/chatReportsController";
import { canManageCommunity } from "@/lib/communityChat";
import {
  joinCommunity as joinCommunitySupabase,
  leaveCommunity as leaveCommunitySupabase,
  updateCommunityPresentation,
} from "@/backend/supabase/controllers/communityController";
import {
  submitCommunityRequest,
} from "@/backend/supabase/controllers/communityRequestController";
import {
  COMMUNITY_COVER_IMAGES,
  COMMUNITY_COVER_VIDEOS,
} from "@/lib/communityConstants";
import type { CommunityChatMessageRecord, PersistedCommunityRecord } from "@/lib/communityChat.types";
import {
  FREE_COMMUNITY_SLOTS,
  COMMUNITY_UNLOCK_TOKEN_COST,
} from "@/lib/communityAccess";
import { getUserTextModerationMessage, moderateUserText } from "@/lib/inputSecurity";
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
import { useCommunityChat } from "@/hooks/useCommunityChat";
import { useCommunityAccess } from "@/hooks/useCommunityAccess";
import { useCommunityPolls } from "@/hooks/useCommunityPolls";
import { MAX_FAVORITE_COMMUNITIES } from "@/backend/supabase/controllers/userExtrasController";

const WAITLIST_UNLOCK_THRESHOLD = 200;
const MAX_COMMUNITY_MESSAGE_LENGTH = 150;

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

const INITIAL_REPORT_DRAFT: ReportDraft = { reason: "", details: "" };
const INITIAL_COMMUNITY_SETTINGS_DRAFT: CommunitySettingsDraft = { title: "", logoUrl: "" };

const COMMUNITY_LOGOS: Record<string, string> = {
  lnt: LNTLogo,
  syt: SYTLogo,
  iijm: IIJMLogo,
};

const COMMUNITY_REQUEST_FIELD_LABELS: Record<keyof CommunityRequestDraft, string> = {
  communityName: "Community name",
  genre: "Genre",
  focusArea: "Focus area",
  audience: "Audience",
  whyNow: "Why now",
  samplePrompt: "Sample prompt",
};

export function DashboardCommunities({
  user,
  avatarLevel = 1,
  activeCommunityId = null,
  onOpenCommunity,
  onBackToCommunities,
  onCommunitiesChange,
}: DashboardCommunitiesProps) {
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const isGlobalAdmin = user.role === "admin";

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDescs, setExpandedDescs] = useState<Set<string>>(new Set());
  const [leavingCommunityId, setLeavingCommunityId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [communitySettingsDraft, setCommunitySettingsDraft] = useState<CommunitySettingsDraft>(INITIAL_COMMUNITY_SETTINGS_DRAFT);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(INITIAL_REPORT_DRAFT);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [requestSubmitAttempted, setRequestSubmitAttempted] = useState(false);
  const [requestDraft, setRequestDraft] = useState<CommunityRequestDraft>(INITIAL_REQUEST_DRAFT);
  const [showRequestButton, setShowRequestButton] = useState(false);
  const requestBtnText = "Didn't find your community?";
  const [mobileRequestExpanded, setMobileRequestExpanded] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowRequestButton(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // --- Hooks ---
  const chat = useCommunityChat(
    activeCommunityId ?? null,
    user.id,
    user.username,
    avatarLevel,
    searchQuery,
    onCommunitiesChange,
  );

  const canManagePolls = chat.canEditSelectedCommunity || isGlobalAdmin;

  const access = useCommunityAccess(user.id);


  const polls = useCommunityPolls(activeCommunityId ?? null, user.id, canManagePolls);

  // --- Derived ---
  const currentUserRecord = getPersistedUserById(user.id);
  const isUserBanned = (currentUserRecord?.moderationStatus ?? user.moderationStatus) === "banned";
  const warningCount = currentUserRecord?.warnings ?? user.warnings;
  const currentMember = chat.selectedCommunity?.members.find((m) => m.userId === user.id) ?? null;
  const userRequests = chat.communityRequests.filter((r) => r.requesterId === user.id);
  const activePendingRequest = userRequests.find((r) => r.status === "pending") ?? null;
  const joinedCommunityCount = chat.communities.filter((c) => c.members.some((m) => m.userId === user.id)).length;
  const effectiveUnlockCount = Math.max(access.communityAccess.unlockedIds.size, joinedCommunityCount);
  const freeCommunitySlotsRemaining = Math.max(0, FREE_COMMUNITY_SLOTS - effectiveUnlockCount);

  // --- Membership actions ---
  const handleJoinCommunity = useCallback(
    async (communityId: string, shouldOpenPage = false) => {
      const target = chat.communities.find((c) => c.id === communityId);
      if (!target) return;
      try {
        await joinCommunitySupabase(communityId, user.id, user.username);
        chat.lastTouchedCommunityRef.current = `${communityId}:${user.id}`;
        await chat.reload();
        toast({ title: `Joined ${target.title}`, description: "You can now chat in this group and receive notifications." });
        if (shouldOpenPage) onOpenCommunity(communityId);
      } catch {
        toast({ title: "Failed to join", description: "Please try again." });
      }
    },
    [chat, onOpenCommunity, user.id, user.username],
  );

  const handlePaidJoinCommunity = useCallback(
    async (communityId: string, shouldOpenPage = false) => {
      if (unlockingId === communityId) return;
      setUnlockingId(communityId);
      access.optimisticAddUnlock(communityId);
      try {
        await handleJoinCommunity(communityId, shouldOpenPage);
      } finally {
        setUnlockingId(null);
      }
    },
    [access, handleJoinCommunity, unlockingId],
  );

  const handleLeaveCommunity = useCallback(async () => {
    if (!chat.selectedCommunity || !chat.isJoined || leavingCommunityId) return;
    const { id: communityId, title: communityTitle } = chat.selectedCommunity;
    setLeavingCommunityId(communityId);
    try {
      await leaveCommunitySupabase(communityId, user.id);
      chat.lastTouchedCommunityRef.current = "";
      await chat.reload();
      onBackToCommunities?.();
      toast({ title: `Left ${communityTitle}`, description: "This change was saved to your community membership." });
    } catch {
      toast({ title: "Failed to leave", description: "Please try again." });
    } finally {
      setLeavingCommunityId(null);
    }
  }, [chat, leavingCommunityId, onBackToCommunities, user.id]);

  const handleRequestJoinCommunity = useCallback(
    (community: PersistedCommunityRecord) => {
      const existing = chat.communityJoinRequests.find(
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
      chat.setCommunityJoinRequests((prev) => {
        const next = [newRequest, ...prev];
        writeCommunityJoinRequests(next);
        return next;
      });
      toast({ title: "Access request sent", description: `Admin will review your request to join ${community.title}.` });
    },
    [chat, user.id, user.username],
  );

  const handleKickMember = useCallback(
    async (memberId: string, memberName: string) => {
      if (!chat.selectedCommunity || !canManagePolls || memberId === user.id) return;
      const confirmed = await confirm({
        title: `Remove ${memberName}?`,
        description: `They will lose access to ${chat.selectedCommunity.title}.`,
        confirmLabel: "Remove",
        tone: "danger",
      });
      if (!confirmed) return;
      try {
        await leaveCommunitySupabase(chat.selectedCommunity.id, memberId);
        await chat.reload();
        toast({ title: "Member removed", description: `${memberName} was removed from the group.` });
      } catch {
        toast({ title: "Could not remove member", description: "Please try again." });
      }
    },
    [canManagePolls, chat, confirm, user.id],
  );

  const handleUnlockCommunity = useCallback(
    async (communityId: string) => {
      if (unlockingId === communityId) return;
      setUnlockingId(communityId);
      try {
        access.optimisticAddUnlock(communityId);
        await handleJoinCommunity(communityId, true);
      } catch {
        toast({ title: "Could not join group", description: "Please try again." });
      } finally {
        setUnlockingId(null);
      }
    },
    [access, handleJoinCommunity, unlockingId],
  );

  // --- Settings / report / request ---
  const handleCommunitySettingsSave = useCallback(async () => {
    if (!chat.selectedCommunity || !chat.canEditSelectedCommunity) {
      toast({ title: "Creator access required", description: "Only the community creator can change the group name or logo." });
      return;
    }
    const trimmedTitle = communitySettingsDraft.title.trim();
    if (!trimmedTitle) {
      toast({ title: "Name required", description: "Add a community name before saving these changes." });
      return;
    }
    const titleModeration = moderateUserText(trimmedTitle);
    if (!titleModeration.allowed) {
      toast({ title: "Community name blocked", description: getUserTextModerationMessage(titleModeration) });
      return;
    }
    if (!canManageCommunity(chat.selectedCommunity, user.id, user.username)) {
      toast({ title: "Creator access required", description: "Only the community creator can change the group name or logo." });
      return;
    }
    try {
      await updateCommunityPresentation(chat.selectedCommunity.id, {
        title: trimmedTitle,
        logoUrl: communitySettingsDraft.logoUrl,
      });
      await chat.reload();
      setLogoDialogOpen(false);
      toast({ title: "Community updated", description: `${trimmedTitle} now shows the latest name and logo across the app.` });
    } catch {
      toast({ title: "Update failed", description: "Please try again." });
    }
  }, [chat, communitySettingsDraft, user.id, user.username]);

  const handleOpenMessageReport = useCallback(
    (message: CommunityChatMessageRecord) => {
      if (!chat.selectedCommunity) return;
      setReportTarget({ communityId: chat.selectedCommunity.id, communityTitle: chat.selectedCommunity.title, message });
      setReportDraft({ reason: "", details: "" });
      setReportDialogOpen(true);
    },
    [chat.selectedCommunity],
  );

  const handleSubmitReport = useCallback(async () => {
    if (!reportTarget) return;
    const reason = reportDraft.reason.trim();
    if (!reason) {
      toast({ title: "Add a report reason", description: "Tell the admin team why this message should be reviewed." });
      return;
    }
    const reportedUser = ensureUserRecord(reportTarget.message.senderName);
    try {
      const saved = await submitChatReport({
        communityId: reportTarget.communityId,
        communityTitle: reportTarget.communityTitle,
        messageId: reportTarget.message.id,
        messageText: reportTarget.message.text,
        reportedUserId: reportTarget.message.senderId || reportedUser.id,
        reportedUsername: reportTarget.message.senderName,
        reporterId: user.id,
        reporterName: user.username,
        reason,
        details: reportDraft.details.trim(),
      });
      chat.setChatReports((prev) => [saved, ...prev]);
      setReportDialogOpen(false);
      setReportTarget(null);
      setReportDraft(INITIAL_REPORT_DRAFT);
      toast({ title: "Report sent for review", description: `The message from ${reportTarget.message.senderName} is now in the admin review queue.` });
    } catch (error) {
      toast({ title: "Could not send report", description: error instanceof Error ? error.message : "Please try again." });
    }
  }, [chat, reportDraft, reportTarget, user.id, user.username]);

  const handleSubmitCommunityRequest = useCallback(async () => {
    if (activePendingRequest) {
      toast({ title: "Request already pending", description: `Your request for ${activePendingRequest.communityName} is still waiting for admin review.` });
      return;
    }
    const trimmed = {
      communityName: requestDraft.communityName.trim(),
      genre: requestDraft.genre.trim(),
      focusArea: requestDraft.focusArea.trim(),
      audience: requestDraft.audience.trim(),
      whyNow: requestDraft.whyNow.trim(),
      samplePrompt: requestDraft.samplePrompt.trim(),
    };
    if (!trimmed.communityName || !trimmed.genre || !trimmed.focusArea || !trimmed.audience || !trimmed.whyNow) {
      setRequestSubmitAttempted(true);
      toast({ title: "Complete the request form", description: "Fill in all required fields before submitting." });
      return;
    }
    const moderated = { ...trimmed };
    for (const field of Object.keys(trimmed) as Array<keyof CommunityRequestDraft>) {
      if (!trimmed[field]) continue;
      const mod = moderateUserText(trimmed[field]);
      if (!mod.allowed) {
        toast({ title: "Request wording blocked", description: `${COMMUNITY_REQUEST_FIELD_LABELS[field]}: ${getUserTextModerationMessage(mod)}` });
        return;
      }
      moderated[field] = mod.text;
    }
    try {
      const newRequest = await submitCommunityRequest({
        requesterId: user.id,
        requesterName: user.username,
        communityName: moderated.communityName,
        genre: moderated.genre,
        focusArea: moderated.focusArea,
        audience: moderated.audience,
        whyNow: moderated.whyNow,
        samplePrompt: moderated.samplePrompt,
      });
      await chat.reload();
      setRequestDraft(INITIAL_REQUEST_DRAFT);
      setRequestSubmitAttempted(false);
      setRequestFormOpen(false);
      toast({ title: "Request sent to admin", description: `${newRequest.communityName} is now pending review. We will keep you posted in this dashboard.` });
    } catch {
      toast({ title: "Failed to submit request", description: "Please try again." });
    }
  }, [activePendingRequest, chat, requestDraft, user.id, user.username]);

  // --- Render helpers ---
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
        communities={chat.communities}
        userId={user.id}
        logoUrlsByCommunityId={COMMUNITY_LOGOS}
        coverImagesByCommunityId={COMMUNITY_COVER_IMAGES}
        coverVideosByCommunityId={COMMUNITY_COVER_VIDEOS}
        expandedDescriptionIds={expandedDescs}
        joinRequests={chat.communityJoinRequests}
        waitlistJoinedIds={access.waitlistJoinedIds}
        waitlistCounts={access.waitlistCounts}
        waitlistJoiningId={access.waitlistJoiningId}
        waitlistUnlockThreshold={WAITLIST_UNLOCK_THRESHOLD}
        hasSubscriptionAccess={access.communityAccess.hasSubscription}
        unlockedCommunityIds={access.communityAccess.unlockedIds}
        freeCommunitySlotsRemaining={freeCommunitySlotsRemaining}
        unlockingId={unlockingId}
        unlockTokenCost={COMMUNITY_UNLOCK_TOKEN_COST}
        onToggleDescription={(communityId) =>
          setExpandedDescs((prev) => {
            const next = new Set(prev);
            if (next.has(communityId)) next.delete(communityId);
            else next.add(communityId);
            return next;
          })
        }
        onPaidJoinCommunity={(communityId, shouldOpenPage) => { void handlePaidJoinCommunity(communityId, shouldOpenPage); }}
        onJoinWaitlist={(community) => { void access.joinWaitlist(community); }}
        onOpenCommunity={onOpenCommunity}
        onUnlockCommunity={(communityId) => { void handleUnlockCommunity(communityId); }}
      />
    </div>
  );

  const renderChatPage = () => {
    if (!chat.selectedCommunity) return null;
    const { selectedCommunity } = chat;
    const isFavorite = access.favoriteCommunityIds.includes(selectedCommunity.id);
    const favLimitHit = !isFavorite && access.favoriteCommunityIds.length >= MAX_FAVORITE_COMMUNITIES;
    const joinReq = chat.communityJoinRequests.find(
      (r) => r.communityId === selectedCommunity.id && r.requesterId === user.id,
    );

    return (
      <motion.div
        className="fixed inset-x-0 top-14 z-30 flex flex-col overflow-hidden sm:static sm:inset-auto sm:z-auto sm:block sm:h-auto sm:overflow-visible sm:space-y-6"
        style={{ bottom: "max(72px, calc(56px + env(safe-area-inset-bottom)))" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        {/* Desktop header */}
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
            <div className="flex items-center gap-1.5 rounded-full border border-raw-border/30 px-3 py-1 text-[11px] text-raw-silver/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              {chat.onlineNow} online now
            </div>
            {chat.unreadCount > 0 && (
              <div className="rounded-full border border-raw-gold/20 bg-raw-gold/[0.08] px-3 py-1 text-[11px] text-raw-gold/75">
                {chat.unreadCount} unread
              </div>
            )}
            {!chat.isJoined && !selectedCommunity.locked && (
              <button
                onClick={() => { void handlePaidJoinCommunity(selectedCommunity.id); }}
                className="flex items-center gap-2 rounded-full bg-raw-gold px-3 py-1.5 text-[11px] font-semibold text-raw-ink transition-colors hover:bg-raw-gold/90"
              >
                Join Group
              </button>
            )}
            {!chat.isJoined && selectedCommunity.locked && (() => {
              if (joinReq?.status === "approved") return (
                <button onClick={() => { void handlePaidJoinCommunity(selectedCommunity.id); }} className="flex items-center gap-2 rounded-full bg-raw-gold px-3 py-1.5 text-[11px] font-semibold text-raw-ink transition-colors hover:bg-raw-gold/90">Join Group</button>
              );
              if (joinReq?.status === "pending" || joinReq?.status === "rejected") return (
                <div className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1 text-[11px] text-amber-200/80">
                  {joinReq.status === "pending" ? "Access request pending" : "Rejected by admin"}
                </div>
              );
              return (
                <button onClick={() => handleRequestJoinCommunity(selectedCommunity)} className="flex items-center gap-2 rounded-full border border-raw-gold/30 bg-transparent px-3 py-1.5 text-[11px] text-raw-gold transition-colors hover:bg-raw-gold/10">
                  <Lock className="h-3.5 w-3.5" /> Join Waiting List
                </button>
              );
            })()}
            {chat.canEditSelectedCommunity && (
              <>
                <button onClick={() => setMembersDialogOpen(true)} className="flex items-center gap-2 rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold">
                  <Users className="h-3.5 w-3.5" /> Members
                </button>
                <button onClick={() => polls.setCommunityPollsExpanded((e) => !e)} className="flex items-center gap-2 rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold">
                  <BarChart3 className="h-3.5 w-3.5" /> Poll Results
                </button>
                <button
                  onClick={() => { setCommunitySettingsDraft({ title: selectedCommunity.title, logoUrl: selectedCommunity.logoUrl ?? "" }); setLogoDialogOpen(true); }}
                  className="rounded-full border border-raw-border/30 px-3 py-1.5 text-[11px] text-raw-silver/55 transition-colors hover:border-raw-gold/20 hover:text-raw-gold"
                >
                  Edit Group
                </button>
              </>
            )}
            {chat.isJoined && (
              <button
                type="button"
                onClick={() => { if (!favLimitHit) void access.toggleFavorite(selectedCommunity.id); }}
                disabled={favLimitHit}
                aria-pressed={isFavorite}
                title={isFavorite ? "Remove from favorites" : favLimitHit ? "Favorites limit reached (3)" : "Add to favorites"}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                  isFavorite ? "border-raw-gold/55 bg-raw-gold/15 text-raw-gold"
                  : favLimitHit ? "border-raw-border/25 bg-raw-black/30 text-raw-silver/35"
                  : "border-raw-border/30 text-raw-silver/55 hover:border-raw-gold/30 hover:text-raw-gold"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
                <span>{isFavorite ? "Favorited" : "Favorite"}</span>
              </button>
            )}
            {chat.isJoined && (
              <button
                onClick={() => { void handleLeaveCommunity(); }}
                disabled={leavingCommunityId === selectedCommunity.id}
                className="rounded-full border border-red-400/25 bg-red-500/[0.06] px-3 py-1.5 text-[11px] font-semibold text-red-200/80 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {leavingCommunityId === selectedCommunity.id ? "Leaving..." : "Leave"}
              </button>
            )}
            <button
              onClick={() => { if (currentMember) chat.setNotifications(!currentMember.notificationsEnabled); }}
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
            isUserBanned ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
          }`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {isUserBanned ? "Account banned after moderation review" : `${warningCount} warning${warningCount === 1 ? "" : "s"} on your account`}
          </div>
        )}

        {selectedCommunity.locked && !chat.isJoined && (
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
        )}

        {(!selectedCommunity.locked || chat.isJoined) && (
          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden sm:flex-none sm:h-[calc(100dvh_-_260px)] sm:min-h-[360px]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:h-full sm:rounded-2xl sm:border sm:border-raw-border/20 sm:bg-raw-black/35">
              {polls.visibleCommunityPolls.length > 0 && (
                <div className="border-b border-raw-border/15 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => polls.setCommunityPollsExpanded((e) => !e)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-raw-gold/25 bg-raw-gold/[0.04] px-3 py-2 text-left"
                    aria-expanded={polls.communityPollsExpanded}
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] uppercase tracking-[0.18em] text-raw-gold/75">Polls</span>
                      <span className="block truncate text-sm font-semibold text-raw-text">
                        {polls.visibleCommunityPolls.length === 1 ? polls.visibleCommunityPolls[0].question : `${polls.visibleCommunityPolls.length} active polls`}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-raw-border/30 px-2 py-0.5 text-[10px] text-raw-silver/55">
                      {polls.communityPollsExpanded ? "Hide" : "Answer"}
                    </span>
                  </button>
                  {polls.communityPollsExpanded && (
                    <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
                      {polls.visibleCommunityPolls.map((poll) => {
                        const totalVotes = poll.totalVotes;
                        return (
                          <div key={`poll-panel-${poll.id}`} className="rounded-2xl border border-raw-gold/25 p-3">
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-raw-text">{poll.question}</p>
                                <p className="mt-0.5 text-[10px] text-raw-silver/45">{totalVotes} {totalVotes === 1 ? "vote" : "votes"} · anonymous results only</p>
                              </div>
                              {canManagePolls && (
                                <button onClick={() => { void polls.deletePoll(poll.id); }} className="rounded-full border border-raw-border/30 p-1.5 text-raw-silver/45 hover:border-red-400/40 hover:text-red-300" aria-label="Archive poll">
                                  <X className="h-3.5 w-3.5" />
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
                                    onClick={() => { void polls.votePoll(poll.id, option.id); }}
                                    className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? "border-raw-gold/60 bg-raw-gold/15 text-raw-text" : "border-raw-border/25 bg-raw-black/30 text-raw-silver/80 hover:border-raw-gold/40"}`}
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

              <div className="flex items-center gap-2 border-b border-raw-border/15 px-3 py-2">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-raw-border/25 bg-raw-surface/40 px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-raw-silver/40" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search this group chat"
                    className="w-full bg-transparent text-sm text-raw-text placeholder:text-raw-silver/30 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="rounded-full p-0.5 text-raw-silver/40 hover:text-raw-text">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <CommunityMessageTimeline
                containerRef={chat.messagesContainerRef}
                polls={polls.communityPolls}
                groupedMessages={chat.groupedMessages}
                activeMessageCount={chat.activeMessages.length}
                isLoading={chat.messagesLoading}
                canManagePolls={canManagePolls}
                userId={user.id}
                username={user.username}
                senderAvatarLevels={chat.senderAvatarLevels}
                onDeletePoll={polls.deletePoll}
                onVotePoll={polls.votePoll}
                onRetryMessage={chat.retryMessage}
                onLikeMessage={chat.likeMessage}
                onOpenMessageReport={handleOpenMessageReport}
                onBlockMessageSender={chat.blockSender}
                onOpenSenderProfile={chat.openSenderProfile}
              />

              <CommunityMessageComposer
                inputRef={chat.messageInputRef}
                draft={chat.messageDraft}
                maxLength={MAX_COMMUNITY_MESSAGE_LENGTH}
                members={selectedCommunity?.members ?? []}
                mentionQuery={chat.mentionQuery}
                mentionIndex={chat.mentionIndex}
                canManagePolls={canManagePolls}
                disabled={isUserBanned}
                onDraftChange={chat.setMessageDraft}
                onMentionQueryChange={chat.setMentionQuery}
                onMentionIndexChange={chat.setMentionIndex}
                onOpenPollComposer={polls.openPollComposer}
                onSendMessage={chat.sendMessage}
              />
            </div>

          </div>
        )}
      </motion.div>
    );
  };

  if (activeCommunityId && chat.isInitialCommunitiesLoading && !chat.selectedCommunity) {
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

  if (activeCommunityId && !chat.selectedCommunity) {
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

        {!activeCommunityId && (
          <motion.button
            onClick={() => { if (mobileRequestExpanded) { setRequestFormOpen(true); setMobileRequestExpanded(false); } else { setMobileRequestExpanded(true); } }}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed right-4 z-50 flex items-center gap-2 rounded-full bg-raw-gold py-3 text-sm font-semibold text-raw-ink shadow-xl hover:bg-raw-gold/90 md:hidden overflow-hidden"
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", paddingLeft: mobileRequestExpanded ? "1rem" : "0.75rem", paddingRight: mobileRequestExpanded ? "1.25rem" : "0.75rem" }}
          >
            <Plus className="h-5 w-5 shrink-0" />
            <AnimatePresence>
              {mobileRequestExpanded && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }} className="whitespace-nowrap">
                  Request a Community
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        <AnimatePresence>
          {showRequestButton && !activeCommunityId && (
            <motion.button
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={() => { setRequestFormOpen(true); toast({ title: "Request a new community", description: "Fill out the form to suggest a new community for review." }); }}
              className="fixed right-4 z-50 hidden items-center gap-2 rounded-2xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink shadow-xl hover:bg-raw-gold/90 focus:outline-none md:flex"
              style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            >
              <motion.span key={requestBtnText} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.4 }}>
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
          members={chat.selectedCommunity?.members ?? []}
          currentUserId={user.id}
          canManagePolls={canManagePolls}
          onOpenChange={setMembersDialogOpen}
          onKickMember={(memberId, username) => { void handleKickMember(memberId, username); }}
        />

        <CommunityProfileDialog
          open={chat.profileDialogOpen}
          target={chat.profileTarget}
          communities={chat.communities}
          logoUrlsByCommunityId={COMMUNITY_LOGOS}
          senderAvatarLevels={chat.senderAvatarLevels}
          onOpenChange={chat.setProfileDialogOpen}
          onOpenCommunity={onOpenCommunity}
        />

        <CommunityRequestDialog
          open={requestFormOpen}
          draft={requestDraft}
          submitAttempted={requestSubmitAttempted}
          username={user.username}
          onOpenChange={setRequestFormOpen}
          onSubmitAttemptedChange={setRequestSubmitAttempted}
          onDraftFieldChange={(field, value) => setRequestDraft((prev) => ({ ...prev, [field]: value }))}
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
          open={polls.pollComposerOpen}
          question={polls.pollQuestion}
          optionDrafts={polls.pollOptionDrafts}
          submitting={polls.pollSubmitting}
          onOpenChange={polls.setPollComposerOpen}
          onQuestionChange={polls.setPollQuestion}
          onOptionChange={polls.updatePollOption}
          onSubmit={() => { void polls.submitPoll(activeCommunityId ?? "", user.id, user.username); }}
        />
      </div>
    </>
  );
}
