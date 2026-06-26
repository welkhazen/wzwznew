import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  BellRing,
  CheckCircle2,
  Flag,
  ListPlus,
  MessageSquareWarning,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRawStore } from "@/store/useRawStore";
import {
  createAdminPoll,
  deleteAdminPoll,
  formatAdminTimestamp,
  readAdminPolls,
  readBlockedWords,
  readChatReports,
  readCommunityRequests,
  readIssueReports,
  readPersistedUsers,
  updateUserModerationStatus,
  writeBlockedWords,
  writeChatReports,
  writeCommunityRequests,
  writeIssueReports,
  type AdminPollRecord,
  type ChatReportRecord,
  type CommunityRequestRecord,
  type IssueReportRecord,
  type PersistedUserRecord,
} from "@/lib/adminData";
import { createCommunityFromRequest } from "@/backend/supabase/controllers/communityController";
import {
  fetchCommunityRequests,
  updateCommunityRequestStatus,
} from "@/backend/supabase/controllers/communityRequestController";
import {
  applyUserModeration,
  listChatReports,
  updateChatReportStatus,
} from "@/backend/supabase/controllers/chatReportsController";

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/25 p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-raw-silver/35">{label}</p>
      <p className="mt-3 font-display text-3xl text-raw-text">{value}</p>
      <p className="mt-2 text-sm text-raw-silver/45">{hint}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active" || status === "approved" || status === "reviewed"
      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
      : status === "pending" || status === "open" || status === "warned"
        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
        : status === "dismissed"
          ? "border-raw-border/30 bg-raw-surface/20 text-raw-silver/60"
          : "border-red-400/20 bg-red-500/10 text-red-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${tone}`}>
      {status}
    </span>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">
      {children}
    </div>
  );
}

function splitPollOptions(value: string): string[] {
  return [...new Set(value.split(/[\n,]+/).map((option) => option.trim()).filter(Boolean))];
}

export default function Admin() {
  const { user, isLoggedIn, isAdmin, logout } = useRawStore();
  const [users, setUsers] = useState<PersistedUserRecord[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReportRecord[]>([]);
  const [adminPolls, setAdminPolls] = useState<AdminPollRecord[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [blockedWordDraft, setBlockedWordDraft] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState("");
  const [loadingRemote, setLoadingRemote] = useState(false);

  const refreshAdminData = useCallback(async () => {
    setUsers(readPersistedUsers());
    setIssueReports(readIssueReports());
    setAdminPolls(readAdminPolls());
    setBlockedWords(readBlockedWords());

    setLoadingRemote(true);
    try {
      const [requests, reports] = await Promise.all([
        fetchCommunityRequests().catch(() => readCommunityRequests()),
        listChatReports().catch(() => readChatReports()),
      ]);
      setCommunityRequests(requests);
      setChatReports(reports);
      writeCommunityRequests(requests);
      writeChatReports(reports);
    } finally {
      setLoadingRemote(false);
    }
  }, []);

  useEffect(() => {
    void refreshAdminData();
    window.addEventListener("focus", refreshAdminData);
    return () => window.removeEventListener("focus", refreshAdminData);
  }, [refreshAdminData]);

  const openReports = useMemo(() => chatReports.filter((report) => report.status === "open"), [chatReports]);
  const openIssues = useMemo(() => issueReports.filter((report) => report.status === "open"), [issueReports]);
  const pendingRequests = useMemo(
    () => communityRequests.filter((request) => request.status === "pending"),
    [communityRequests],
  );
  const bannedUsers = useMemo(() => users.filter((entry) => entry.moderationStatus === "banned"), [users]);

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-raw-black px-6 py-10 text-raw-text">
        <div className="mx-auto max-w-3xl rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-raw-gold/65">Restricted</p>
          <h1 className="mt-4 font-display text-3xl tracking-wide">Admin access only</h1>
          <p className="mt-4 text-sm text-raw-silver/45">
            This page is only available to accounts marked as admin.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/dashboard" className="rounded-xl bg-raw-gold px-5 py-3 text-sm font-semibold text-raw-ink">
              Back to dashboard
            </Link>
            <button
              onClick={logout}
              className="rounded-xl border border-raw-border/30 px-5 py-3 text-sm text-raw-silver/70"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRequestStatus = async (requestId: string, status: "approved" | "rejected") => {
    const now = new Date().toISOString();
    const nextRequests = communityRequests.map((request) =>
      request.id === requestId
        ? { ...request, status, reviewedAt: now, reviewedBy: user.username }
        : request,
    );
    const reviewedRequest = nextRequests.find((request) => request.id === requestId) ?? null;

    setCommunityRequests(nextRequests);
    writeCommunityRequests(nextRequests);
    try {
      await updateCommunityRequestStatus(requestId, status, user.username);
      if (status === "approved" && reviewedRequest) {
        await createCommunityFromRequest(reviewedRequest);
      }
      toast({
        title: status === "approved" ? "Community approved" : "Community rejected",
        description: status === "approved" ? "The request is now live in Communities." : "The request was rejected.",
      });
    } catch {
      toast({ title: "Saved locally", description: "Remote update failed, but the admin queue was updated locally." });
    }
  };

  const handleModeration = async (reportId: string, action: "dismissed" | "warned" | "banned") => {
    const targetReport = chatReports.find((report) => report.id === reportId);
    if (!targetReport) return;

    if (action === "warned" || action === "banned") {
      updateUserModerationStatus(targetReport.reportedUserId, action, user.username, action === "warned" ? 1 : 0);
      await applyUserModeration(targetReport.reportedUserId, action, user.username).catch(() => undefined);
    }

    const nextReports = chatReports.map((report) =>
      report.id === reportId
        ? { ...report, status: action, resolvedAt: new Date().toISOString(), resolvedBy: user.username }
        : report,
    );

    setChatReports(nextReports);
    writeChatReports(nextReports);
    await updateChatReportStatus(reportId, action, user.username).catch(() => undefined);
    toast({
      title: action === "dismissed" ? "Report dismissed" : action === "warned" ? "User warned" : "User banned",
      description: `${targetReport.reportedUsername} has been reviewed.`,
    });
    void refreshAdminData();
  };

  const handleIssueStatus = (reportId: string, status: "dismissed" | "reviewed") => {
    const nextReports = issueReports.map((report) =>
      report.id === reportId
        ? { ...report, status, resolvedAt: new Date().toISOString(), resolvedBy: user.username }
        : report,
    );
    setIssueReports(nextReports);
    writeIssueReports(nextReports);
  };

  const handleAddBlockedWord = () => {
    const word = blockedWordDraft.trim().toLocaleLowerCase();
    if (!word) return;
    const nextWords = [...new Set([...blockedWords, word])].sort();
    setBlockedWords(nextWords);
    writeBlockedWords(nextWords);
    setBlockedWordDraft("");
  };

  const handleRemoveBlockedWord = (word: string) => {
    const nextWords = blockedWords.filter((entry) => entry !== word);
    setBlockedWords(nextWords);
    writeBlockedWords(nextWords);
  };

  const handleCreatePoll = () => {
    const question = pollQuestion.trim();
    const options = splitPollOptions(pollOptions);
    if (question.length < 6 || options.length < 2) {
      toast({ title: "Poll needs a question and at least two options." });
      return;
    }
    const poll = createAdminPoll(question, options);
    setAdminPolls([poll, ...adminPolls]);
    setPollQuestion("");
    setPollOptions("");
    toast({ title: "Poll created", description: "It is saved to the admin poll list." });
  };

  const handleDeletePoll = (pollId: string) => {
    deleteAdminPoll(pollId);
    setAdminPolls(adminPolls.filter((poll) => poll.id !== pollId));
  };

  return (
    <div className="min-h-screen bg-raw-black text-raw-text">
      <div className="border-b border-raw-border/30 bg-raw-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-raw-gold/65">Admin page</p>
            <h1 className="mt-2 font-display text-3xl tracking-wide">Moderation dashboard</h1>
            {loadingRemote && <p className="mt-1 text-xs text-raw-silver/40">Refreshing remote queues...</p>}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-raw-border/30 px-4 py-2 text-sm text-raw-silver/70 transition-colors hover:text-raw-text"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button onClick={logout} className="rounded-xl bg-raw-gold px-4 py-2 text-sm font-semibold text-raw-ink">
              Log out
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Users" value={users.length} hint="Known local accounts and moderation state." />
          <SummaryCard label="Pending Requests" value={pendingRequests.length} hint="Community creation requests waiting for review." />
          <SummaryCard label="Open Reports" value={openReports.length} hint="Chat reports awaiting a moderation decision." />
          <SummaryCard label="Admin Polls" value={adminPolls.length} hint="Polls managed from this admin page." />
        </div>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <ListPlus className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Polls</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Create and remove admin-managed polls.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(14rem,0.6fr)_auto]">
            <input
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Poll question"
              className="min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/35 px-3 text-sm outline-none focus:border-raw-gold/50"
            />
            <textarea
              value={pollOptions}
              onChange={(event) => setPollOptions(event.target.value)}
              placeholder={"Options, one per line"}
              className="min-h-11 rounded-xl border border-raw-border/30 bg-raw-black/35 px-3 py-2 text-sm outline-none focus:border-raw-gold/50"
            />
            <Button onClick={handleCreatePoll} className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90">
              Add poll
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {adminPolls.length === 0 ? (
              <EmptyState>No admin polls yet.</EmptyState>
            ) : (
              adminPolls.map((poll) => (
                <div key={poll.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4">
                  <div>
                    <p className="font-display text-base text-raw-text">{poll.question}</p>
                    <p className="mt-1 text-xs text-raw-silver/40">
                      {poll.options.map((option) => option.text).join(" / ")} · {formatAdminTimestamp(poll.createdAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeletePoll(poll.id)}
                    variant="outline"
                    className="rounded-xl border-red-400/30 bg-transparent text-red-200 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Blocked words</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Terms added here are used by the existing text moderation system.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={blockedWordDraft}
              onChange={(event) => setBlockedWordDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAddBlockedWord();
              }}
              placeholder="Add blocked word"
              className="min-h-11 flex-1 rounded-xl border border-raw-border/30 bg-raw-black/35 px-3 text-sm outline-none focus:border-raw-gold/50"
            />
            <Button onClick={handleAddBlockedWord} className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90">
              Add word
            </Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {blockedWords.length === 0 ? (
              <p className="text-sm text-raw-silver/45">No blocked words yet.</p>
            ) : (
              blockedWords.map((word) => (
                <span key={word} className="inline-flex items-center gap-2 rounded-full border border-raw-border/25 bg-raw-black/35 px-3 py-1.5 text-xs text-raw-silver/70">
                  {word}
                  <button onClick={() => handleRemoveBlockedWord(word)} className="text-red-200/70 hover:text-red-200" aria-label={`Remove ${word}`}>
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Users</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Every locally known user account and its current moderation state.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {users.length === 0 ? (
              <EmptyState>No users yet.</EmptyState>
            ) : (
              users.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4">
                  <div>
                    <p className="font-display text-base text-raw-text">@{entry.username}</p>
                    <p className="mt-1 text-xs text-raw-silver/40">
                      Role: {entry.role} · Warnings: {entry.warnings} · Last seen {formatAdminTimestamp(entry.lastSeenAt)}
                    </p>
                  </div>
                  <StatusPill status={entry.moderationStatus} />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Community requests</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Approve or reject requests for new communities before they go live.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {communityRequests.length === 0 ? (
              <EmptyState>No requests submitted yet.</EmptyState>
            ) : (
              communityRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-raw-text">{request.communityName}</p>
                      <p className="mt-1 text-sm text-raw-silver/45">
                        Requested by @{request.requesterName} · {formatAdminTimestamp(request.submittedAt)}
                      </p>
                    </div>
                    <StatusPill status={request.status} />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Focus</p>
                      <p className="mt-2 text-sm text-raw-silver/60">{request.focusArea}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Audience</p>
                      <p className="mt-2 text-sm text-raw-silver/60">{request.audience}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-raw-silver/60">{request.whyNow}</p>
                  {request.samplePrompt && (
                    <div className="mt-4 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4 text-sm text-raw-silver/55">
                      "{request.samplePrompt}"
                    </div>
                  )}
                  {request.status === "pending" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => void handleRequestStatus(request.id, "approved")} className="rounded-xl bg-emerald-400 px-4 text-raw-ink hover:bg-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button onClick={() => void handleRequestStatus(request.id, "rejected")} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Chat reports</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Review reported chat messages, then dismiss, warn, or ban.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {chatReports.length === 0 ? (
              <EmptyState>No reports in the queue yet.</EmptyState>
            ) : (
              chatReports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-raw-text">{report.communityTitle}</p>
                      <p className="mt-1 text-sm text-raw-silver/45">
                        Reported by @{report.reporterName} against @{report.reportedUsername} · {formatAdminTimestamp(report.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4 text-sm text-raw-silver/55">
                    "{report.messageText}"
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Reason</p>
                      <p className="mt-2 text-sm text-raw-silver/60">{report.reason}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Reporter note</p>
                      <p className="mt-2 text-sm text-raw-silver/60">{report.details || "No extra context provided."}</p>
                    </div>
                  </div>
                  {report.status === "open" ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => void handleModeration(report.id, "dismissed")} variant="outline" className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text">
                        <XCircle className="h-4 w-4" /> Dismiss
                      </Button>
                      <Button onClick={() => void handleModeration(report.id, "warned")} className="rounded-xl bg-amber-400 px-4 text-raw-ink hover:bg-amber-300">
                        <BellRing className="h-4 w-4" /> Warn user
                      </Button>
                      <Button onClick={() => void handleModeration(report.id, "banned")} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
                        <Ban className="h-4 w-4" /> Ban user
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-raw-silver/40">
                      Reviewed by @{report.resolvedBy ?? "admin"}{report.resolvedAt ? ` · ${formatAdminTimestamp(report.resolvedAt)}` : ""}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-6">
          <div className="flex items-center gap-3">
            <MessageSquareWarning className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Issue reports</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Reports sent from the dashboard support/report flow.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {issueReports.length === 0 ? (
              <EmptyState>No issue reports yet.</EmptyState>
            ) : (
              issueReports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-raw-text">{report.issueType}</p>
                      <p className="mt-1 text-sm text-raw-silver/45">
                        Sent by @{report.reporterName} · {formatAdminTimestamp(report.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-raw-silver/60">{report.details}</p>
                  <p className="mt-2 break-all text-xs text-raw-silver/35">{report.pageUrl}</p>
                  {report.status === "open" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => handleIssueStatus(report.id, "reviewed")} className="rounded-xl bg-emerald-400 px-4 text-raw-ink hover:bg-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Mark reviewed
                      </Button>
                      <Button onClick={() => handleIssueStatus(report.id, "dismissed")} variant="outline" className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text">
                        <XCircle className="h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
