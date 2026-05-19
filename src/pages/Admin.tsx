import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Ban, BellRing, CheckCircle2, Copy, Database, Download, Flag, GripVertical, Lock, Plus, Scissors, Shield, Trash2, Upload, Users, XCircle } from "lucide-react";
import { RARITY_CONFIG, RARITY_ORDER, type AvatarRarity } from "@/lib/avatarRarity";
import { fetchPollsFromSupabase, insertPollToSupabase, deletePollFromSupabase, testSupabaseConnection } from "@/lib/supabasePolls";
import { fetchCommunityRequests, updateCommunityRequestStatus } from "@/backend/supabase/controllers/communityRequestController";
import { createCommunityFromRequest } from "@/backend/supabase/controllers/communityController";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRawStore } from "@/store/useRawStore";
import { track } from "@/lib/analytics";
import {
  type AvatarCatalogItem,
  loadAvatarCatalogSupabaseOnly,
  loadFullAvatarCatalog,
  saveAvatarCatalogSupabaseOnly,
  deleteAvatarFromCatalog,
} from "@/lib/avatarCatalog";
import {
  readDailySpinAvatarPool,
  upsertDailySpinAvatarPool,
  writeDailySpinAvatarPool,
  loadDailySpinPoolFromSupabase,
  saveDailySpinPoolToSupabase,
  type DailySpinAvatarPoolItem,
} from "@/lib/dailySpinAvatarPool";
import {
  readLandingNewAvatarsLocal,
  loadLandingNewAvatars,
  saveLandingNewAvatars,
  type LandingNewAvatar,
} from "@/lib/landingNewAvatars";
import { supabase } from "@/lib/supabase";
import { awardXP } from "@/lib/userProgress";
import { apiFetch } from "@/lib/http";
import { WheelOfFortune, type WheelPrize } from "@/components/wheel/WheelOfFortune";
import {
  createAdminPoll,
  deleteAdminPoll,
  formatAdminTimestamp,
  readAdminPolls,
  readChatReports,
  readCommunityJoinRequests,
  readCommunityRequests,
  readIssueReports,
  readPersistedUsers,
  updateUserModerationStatus,
  writeChatReports,
  writeCommunityJoinRequests,
  writeCommunityRequests,
  writeIssueReports,
  type AdminPollRecord,
  type ChatReportRecord,
  type CommunityJoinRequestRecord,
  type CommunityRequestRecord,
  type IssueReportRecord,
  type PersistedUserRecord,
} from "@/lib/adminData";
import { approveCommunityJoinRequest, createCommunityFromApprovedRequest } from "@/lib/communityChat";
import { getAvatar } from "@/lib/avataridentity";

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="rounded-2xl border border-raw-border/30 bg-raw-surface/25 p-4 sm:p-5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-raw-silver/35 sm:text-[11px] sm:tracking-[0.18em]">{label}</p>
      <p className="mt-2 font-display text-2xl text-raw-text sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-raw-silver/45 leading-relaxed sm:mt-2 sm:text-sm">{hint}</p>
    </div>
  );
}

type SlicedAvatarItem = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  blob: Blob;
  manualOffsetX: number;
  manualOffsetY: number;
  manualZoom: number;
  sheetSx: number;
  sheetSy: number;
  sheetCellWidth: number;
  sheetCellHeight: number;
  publishTarget: "level" | "daily-spin";
};

type CutDecision = "pending" | "accepted" | "rejected";

const MAX_SHEET_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SLICE_CELLS = 100;
const AVATAR_STORAGE_BUCKET = (import.meta.env.VITE_SUPABASE_AVATAR_BUCKET as string | undefined) ?? "avatars";
const AVATAR_STORAGE_BUCKET_CANDIDATES = Array.from(
  new Set([AVATAR_STORAGE_BUCKET, "avatars", "avatar", "avatar-catalog"])
);

export default function Admin() {
  const { user, isLoggedIn, isAdmin, sessionLoaded, logout } = useRawStore();
  const [users, setUsers] = useState<PersistedUserRecord[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReportRecord[]>([]);
  const [communityJoinRequests, setCommunityJoinRequests] = useState<CommunityJoinRequestRecord[]>([]);
  const [adminPolls, setAdminPolls] = useState<AdminPollRecord[]>([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [supabaseStatus, setSupabaseStatus] = useState<"idle" | "ok" | "error">("idle");
  const [supabaseMessage, setSupabaseMessage] = useState("");
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [sheetPreviewUrl, setSheetPreviewUrl] = useState<string | null>(null);
  const [sliceRows, setSliceRows] = useState(2);
  const [sliceCols, setSliceCols] = useState(4);
  const [sliceGap, setSliceGap] = useState(0);
  const [autoMeasureGap, setAutoMeasureGap] = useState(true);
  const [isMeasuringGap, setIsMeasuringGap] = useState(false);
  const [namesInput, setNamesInput] = useState("");
  const [autoColsFromNames, setAutoColsFromNames] = useState(false);
  const [autoTrim, setAutoTrim] = useState(false);
  const [cropToSquare, setCropToSquare] = useState(true);
  const [trimPadding, setTrimPadding] = useState(6);
  const [trimThreshold, setTrimThreshold] = useState(28);
  const [slicedAvatars, setSlicedAvatars] = useState<SlicedAvatarItem[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const [assetsFolderName, setAssetsFolderName] = useState<string | null>(null);
  const [avatarCatalogDraft, setAvatarCatalogDraft] = useState<AvatarCatalogItem[]>([]);
  const [isSavingAvatarCatalog, setIsSavingAvatarCatalog] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [isLoadingPolls, setIsLoadingPolls] = useState(false);
  const [pollsLoaded, setPollsLoaded] = useState(false);
  const [dailySpinPoolDraft, setDailySpinPoolDraft] = useState<DailySpinAvatarPoolItem[]>(() => readDailySpinAvatarPool());
  const [newSpinName, setNewSpinName] = useState("");
  const [newSpinImageSrc, setNewSpinImageSrc] = useState("");
  const [isSavingSpinPool, setIsSavingSpinPool] = useState(false);
  const [newAvatarsDraft, setNewAvatarsDraft] = useState<LandingNewAvatar[]>(() => readLandingNewAvatarsLocal());
  const [isSavingNewAvatars, setIsSavingNewAvatars] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [newAvatarImageSrc, setNewAvatarImageSrc] = useState("");
  const [spinPreviewPrize, setSpinPreviewPrize] = useState<WheelPrize | null>(null);
  const [spinDropIndex, setSpinDropIndex] = useState<number | null>(null);
  const [publishInsertAt, setPublishInsertAt] = useState(1);
  const [cutDecisions, setCutDecisions] = useState<Record<string, CutDecision>>({});
  const [reviewCursor, setReviewCursor] = useState(0);
  const [reviewPreviewUrl, setReviewPreviewUrl] = useState<string | null>(null);
  const sheetPreviewUrlRef = useRef<string | null>(null);
  const slicedAvatarsRef = useRef<SlicedAvatarItem[]>([]);
  const assetsDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const gapMeasureRequestIdRef = useRef(0);
  const cropDragRef = useRef<{
    active: boolean;
    id: string;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const revokeSlicedAvatarUrls = useCallback((items: SlicedAvatarItem[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.imageUrl));
  }, []);

  const refreshAdminData = useCallback(async () => {
    setUsers(readPersistedUsers());
    setChatReports(readChatReports());
    setCommunityJoinRequests(readCommunityJoinRequests());
    try {
      const response = await apiFetch("/api/moderation/issue-reports");
      if (!response.ok) {
        throw new Error("Issue reports API failed");
      }
      const body = (await response.json()) as { reports?: IssueReportRecord[] };
      setIssueReports(body.reports ?? []);
    } catch {
      setIssueReports(readIssueReports());
    }
    try {
      const requests = await fetchCommunityRequests();
      setCommunityRequests(requests);
    } catch {
      setCommunityRequests(readCommunityRequests());
    }
  }, []);

  const loadPolls = useCallback(async () => {
    setIsLoadingPolls(true);
    try {
      const result = await testSupabaseConnection();
      setSupabaseStatus(result.ok ? "ok" : "error");
      setSupabaseMessage(result.message);
      if (result.ok) {
        try {
          const polls = await fetchPollsFromSupabase();
          setAdminPolls(polls);
        } catch {
          setAdminPolls(readAdminPolls());
        }
      } else {
        setAdminPolls(readAdminPolls());
      }
      setPollsLoaded(true);
    } finally {
      setIsLoadingPolls(false);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const catalog = await loadFullAvatarCatalog();
      setAvatarCatalogDraft(catalog);
      setPublishInsertAt(catalog.length + 1);
      setCatalogLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check Supabase table access for avatar_catalog.";
      toast({ title: "Could not load avatar catalog", description: msg });
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminData();
    window.addEventListener("focus", refreshAdminData);

    return () => {
      window.removeEventListener("focus", refreshAdminData);
    };
  }, [refreshAdminData]);

  useEffect(() => {
    void loadDailySpinPoolFromSupabase()
      .then((items) => setDailySpinPoolDraft(items))
      .catch(() => {
        // Keep localStorage draft as fallback - no toast needed
      });
  }, []);

  useEffect(() => {
    sheetPreviewUrlRef.current = sheetPreviewUrl;
  }, [sheetPreviewUrl]);

  useEffect(() => {
    slicedAvatarsRef.current = slicedAvatars;
  }, [slicedAvatars]);

  useEffect(() => {
    return () => {
      if (sheetPreviewUrlRef.current) {
        URL.revokeObjectURL(sheetPreviewUrlRef.current);
      }
      revokeSlicedAvatarUrls(slicedAvatarsRef.current);
    };
  }, [revokeSlicedAvatarUrls]);

  const openReports = useMemo(() => chatReports.filter((report) => report.status === "open"), [chatReports]);
  const openIssueReports = useMemo(() => issueReports.filter((report) => report.status === "open"), [issueReports]);
  const parsedNames = useMemo(
    () => namesInput.split("\n").map((line) => line.trim()).filter((line) => line.length > 0),
    [namesInput]
  );
  const pendingRequests = useMemo(
    () => communityRequests.filter((request) => request.status === "pending"),
    [communityRequests]
  );
  const pendingJoinRequests = useMemo(
    () => communityJoinRequests.filter((r) => r.status === "pending"),
    [communityJoinRequests]
  );
  const bannedUsers = useMemo(() => users.filter((entry) => entry.moderationStatus === "banned"), [users]);
  const clampedPublishInsertAt = useMemo(
    () => Math.min(Math.max(1, publishInsertAt), avatarCatalogDraft.length + 1),
    [publishInsertAt, avatarCatalogDraft.length]
  );
  const acceptedSlicedAvatars = useMemo(
    () => slicedAvatars.filter((item) => cutDecisions[item.id] === "accepted"),
    [slicedAvatars, cutDecisions]
  );
  const acceptedLevelAvatars = useMemo(
    () => acceptedSlicedAvatars.filter((item) => item.publishTarget === "level"),
    [acceptedSlicedAvatars]
  );
  const acceptedDailySpinAvatars = useMemo(
    () => acceptedSlicedAvatars.filter((item) => item.publishTarget === "daily-spin"),
    [acceptedSlicedAvatars]
  );
  const pendingReviewCount = useMemo(
    () => slicedAvatars.filter((item) => (cutDecisions[item.id] ?? "pending") === "pending").length,
    [slicedAvatars, cutDecisions]
  );
  const reviewedCount = useMemo(
    () => slicedAvatars.length - pendingReviewCount,
    [slicedAvatars.length, pendingReviewCount]
  );
  const spinPoolPrizes = useMemo<WheelPrize[]>(
    () =>
      dailySpinPoolDraft.map((entry, index) => ({
        id: entry.id,
        label: entry.name,
        shortLabel: entry.name.split(" ")[0]?.toUpperCase() || "AVATAR",
        imageSrc: entry.imageSrc,
        color: index % 2 === 0 ? "#121212" : "#0e0e0e",
        textColor: "#F1C42D",
      })),
    [dailySpinPoolDraft]
  );
  const currentReviewItem = slicedAvatars[reviewCursor] ?? null;

  const handleAddTestXP = () => {
    if (!user) return;

    void awardXP(user.id, 100).then((result) => {
      if (!result) {
        toast({ title: "XP test failed", description: "Could not update local XP." });
        return;
      }

      toast({
        title: "+100 XP added",
        description: `You are now level ${result.level} with ${result.xp.toLocaleString()} XP.`,
      });
    });
  };

  const saveDailySpinPoolDraft = () => {
    setIsSavingSpinPool(true);
    const normalized = dailySpinPoolDraft
      .map((item, index) => ({
        id: (item.id || `daily-spin-${index + 1}`).trim(),
        name: (item.name || `Spin ${index + 1}`).trim(),
        imageSrc: (item.imageSrc || "").trim(),
      }))
      .filter((item) => item.id && item.name && item.imageSrc);
    void saveDailySpinPoolToSupabase(normalized)
      .then((saved) => {
        setDailySpinPoolDraft(saved);
        toast({ title: "Daily spin pool saved", description: `${saved.length} entries are now active.` });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Please try again.";
        toast({ title: "Could not save spin pool", description: msg });
      })
      .finally(() => setIsSavingSpinPool(false));
  };

  const addDailySpinEntry = () => {
    const name = newSpinName.trim();
    const imageSrc = newSpinImageSrc.trim();
    if (!name || !imageSrc) {
      toast({ title: "Missing entry data", description: "Provide both name and image URL." });
      return;
    }

    const baseId = slugify(name) || `daily-spin-${dailySpinPoolDraft.length + 1}`;
    const existingIds = new Set(dailySpinPoolDraft.map((item) => item.id));
    let candidateId = baseId;
    let counter = 2;
    while (existingIds.has(candidateId)) {
      candidateId = `${baseId}-${counter}`;
      counter += 1;
    }

    setDailySpinPoolDraft((previous) => [
      ...previous,
      { id: candidateId, name, imageSrc },
    ]);
    setNewSpinName("");
    setNewSpinImageSrc("");
  };

  const addEntryToSpinPoolAt = (
    entry: { id?: string; name: string; imageSrc: string },
    insertIndex?: number
  ) => {
    const name = entry.name.trim();
    const imageSrc = entry.imageSrc.trim();
    if (!name || !imageSrc) return;

    setDailySpinPoolDraft((previous) => {
      const existingIds = new Set(previous.map((item) => item.id));
      const baseId = slugify(entry.id || name) || `daily-spin-${previous.length + 1}`;
      let candidateId = baseId;
      let counter = 2;
      while (existingIds.has(candidateId)) {
        candidateId = `${baseId}-${counter}`;
        counter += 1;
      }

      const next = [...previous];
      const safeIndex =
        insertIndex === undefined
          ? next.length
          : Math.max(0, Math.min(insertIndex, next.length));
      next.splice(safeIndex, 0, { id: candidateId, name, imageSrc });
      return next;
    });
  };

  const reorderSpinPool = (draggedId: string, targetIndex: number) => {
    setDailySpinPoolDraft((previous) => {
      const currentIndex = previous.findIndex((item) => item.id === draggedId);
      if (currentIndex < 0) return previous;
      const boundedIndex = Math.max(0, Math.min(targetIndex, previous.length - 1));
      if (currentIndex === boundedIndex) return previous;
      const next = [...previous];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(boundedIndex, 0, moved);
      return next;
    });
  };

  const handleSpinPoolDrop = async (rawPayload: string, targetIndex?: number) => {
    try {
      const payload = JSON.parse(rawPayload) as
        | { kind: "spin-item"; id: string }
        | { kind: "catalog-avatar"; id: string }
        | { kind: "cropped-avatar"; id: string };

      if (payload.kind === "spin-item") {
        if (targetIndex === undefined) return;
        reorderSpinPool(payload.id, targetIndex);
        return;
      }

      if (payload.kind === "catalog-avatar") {
        const source = avatarCatalogDraft.find((item) => item.id === payload.id);
        if (!source || !source.imageSrc) return;
        addEntryToSpinPoolAt(
          { id: source.id, name: source.name || source.id, imageSrc: source.imageSrc },
          targetIndex
        );
        return;
      }

      if (payload.kind === "cropped-avatar") {
        const source = slicedAvatars.find((item) => item.id === payload.id);
        if (!source) return;
        const imageSrc = await blobToDataUrl(source.blob);
        addEntryToSpinPoolAt(
          { id: source.id, name: source.name || source.id, imageSrc },
          targetIndex
        );
      }
    } catch {
      toast({ title: "Drop failed", description: "Could not read dragged avatar data." });
    }
  };

  const updateDailySpinEntry = (id: string, patch: Partial<DailySpinAvatarPoolItem>) => {
    setDailySpinPoolDraft((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeDailySpinEntry = (id: string) => {
    const next = dailySpinPoolDraft.filter((item) => item.id !== id);
    setDailySpinPoolDraft(next);
    void saveDailySpinPoolToSupabase(next).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Could not delete spin entry", description: msg });
      // revert on failure
      setDailySpinPoolDraft(dailySpinPoolDraft);
    });
  };

  const addNewAvatar = () => {
    const name = newAvatarName.trim();
    const imageSrc = newAvatarImageSrc.trim();
    if (!name) {
      toast({ title: "Missing name", description: "Provide a name for the new avatar." });
      return;
    }
    const id = `new-avatar-${Date.now()}`;
    setNewAvatarsDraft((prev) => [...prev, { id, name, imageSrc, position: prev.length }]);
    setNewAvatarName("");
    setNewAvatarImageSrc("");
  };

  const removeNewAvatar = (id: string) => {
    setNewAvatarsDraft((prev) => prev.filter((a) => a.id !== id));
  };

  const saveNewAvatarsDraft = () => {
    setIsSavingNewAvatars(true);
    void saveLandingNewAvatars(newAvatarsDraft)
      .then((saved) => {
        setNewAvatarsDraft(saved);
        toast({ title: "Show More avatars saved", description: `${saved.length} avatars now appear in the Show More panel.` });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Please try again.";
        toast({ title: "Could not save", description: msg });
      })
      .finally(() => setIsSavingNewAvatars(false));
  };

  const loadNewAvatarsFromSupabase = () => {
    void loadLandingNewAvatars()
      .then((items) => {
        setNewAvatarsDraft(items);
        toast({ title: "Loaded from Supabase", description: `${items.length} avatars loaded.` });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Please try again.";
        toast({ title: "Could not load", description: msg });
      });
  };

  useEffect(() => {
    let cancelled = false;

    if (!currentReviewItem) {
      setReviewPreviewUrl(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const previewCanvas = document.createElement("canvas");
          previewCanvas.width = currentReviewItem.sheetCellWidth;
          previewCanvas.height = currentReviewItem.sheetCellHeight;
          await drawManualCropToCanvas(currentReviewItem, previewCanvas);
          const previewBlob = await canvasToBlob(previewCanvas);
          const nextUrl = URL.createObjectURL(previewBlob);

          if (cancelled) {
            URL.revokeObjectURL(nextUrl);
            return;
          }

          setReviewPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return nextUrl;
          });
        } catch {
          setReviewPreviewUrl((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return null;
          });
        }
      })();
    }, 40);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentReviewItem, sheetFile, slicedAvatars]);

  useEffect(() => {
    return () => {
      setReviewPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
    };
  }, []);

  useEffect(() => {
    if (!autoColsFromNames) return;
    if (parsedNames.length === 0 || sliceRows < 1) return;
    const computedCols = Math.max(1, Math.ceil(parsedNames.length / sliceRows));
    setSliceCols((current) => (current === computedCols ? current : computedCols));
  }, [autoColsFromNames, parsedNames.length, sliceRows]);

  useEffect(() => {
    if (!autoMeasureGap || !sheetFile) return;
    const timer = window.setTimeout(() => {
      void autoMeasureGapForFile(sheetFile, sliceRows, sliceCols);
    }, 250);
    return () => window.clearTimeout(timer);
    // autoMeasureGapForFile is a local helper that already reads trimThreshold.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMeasureGap, sheetFile, sliceRows, sliceCols, trimThreshold]);

  if (!sessionLoaded) {
    return null;
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-raw-black px-4 py-8 text-raw-text sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-raw-border/30 bg-raw-surface/20 p-5 text-center sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-raw-gold/65">Restricted</p>
          <h1 className="mt-4 font-display text-3xl tracking-wide">Admin access only</h1>
          <p className="mt-4 text-sm text-raw-silver/45">
            This hidden page is only available to accounts marked as admin.
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
    const target = communityRequests.find((r) => r.id === requestId);
    if (!target) return;

    try {
      await updateCommunityRequestStatus(requestId, status, user.username);
      if (status === "approved") {
        const approvedRequest = { ...target, status, reviewedAt: new Date().toISOString(), reviewedBy: user.username };
        await createCommunityFromRequest(approvedRequest);
        track("admin_action_performed", { action: "approve_community", resource_id: requestId });
      } else {
        track("admin_action_performed", { action: "reject_community", resource_id: requestId });
      }
      await refreshAdminData();
      toast({
        title: status === "approved" ? "Community approved" : "Community rejected",
        description: status === "approved"
          ? "The request has been approved and is now live in Communities."
          : "The request has been rejected.",
      });
    } catch {
      toast({ title: "Action failed", description: "Please try again." });
    }
  };

  const handleJoinRequestStatus = (requestId: string, status: "approved" | "rejected") => {
    const target = communityJoinRequests.find((r) => r.id === requestId);
    if (!target) return;

    const nextRequests = communityJoinRequests.map((r) =>
      r.id === requestId
        ? { ...r, status, reviewedAt: new Date().toISOString(), reviewedBy: user.username }
        : r,
    );
    setCommunityJoinRequests(nextRequests);
    writeCommunityJoinRequests(nextRequests);

    if (status === "approved") {
      approveCommunityJoinRequest(target.communityId, target.requesterId, target.requesterName);
      track("admin_action_performed", { action: "approve_join_request", resource_id: requestId });
    } else {
      track("admin_action_performed", { action: "reject_join_request", resource_id: requestId });
    }

    toast({
      title: status === "approved" ? "Access granted" : "Request rejected",
      description: status === "approved"
        ? `@${target.requesterName} has been added to ${target.communityTitle}.`
        : `@${target.requesterName}'s request to join ${target.communityTitle} was rejected.`,
    });
  };

  const handleModeration = (reportId: string, action: "dismissed" | "warned" | "banned") => {
    const targetReport = chatReports.find((report) => report.id === reportId);
    if (!targetReport) {
      return;
    }

    if (action === "warned") {
      updateUserModerationStatus(targetReport.reportedUserId, "warned", user.username, 1);
      track("admin_action_performed", { action: "warn", target_user_id: targetReport.reportedUserId, resource_id: reportId });
    }

    if (action === "banned") {
      updateUserModerationStatus(targetReport.reportedUserId, "banned", user.username);
      track("admin_action_performed", { action: "ban", target_user_id: targetReport.reportedUserId, resource_id: reportId });
    }

    if (action === "dismissed") {
      track("admin_action_performed", { action: "dismiss_report", resource_id: reportId });
    }

    const nextReports = chatReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status: action,
            resolvedAt: new Date().toISOString(),
            resolvedBy: user.username,
          }
        : report
    );

    setChatReports(nextReports);
    writeChatReports(nextReports);
    refreshAdminData();
    toast({
      title: action === "dismissed" ? "Report dismissed" : action === "warned" ? "User warned" : "User banned",
      description: `${targetReport.reportedUsername} has been reviewed by admin.`,
    });
  };

  const handleIssueReportStatus = async (reportId: string, status: "dismissed" | "reviewed") => {
    const targetReport = issueReports.find((report) => report.id === reportId);
    if (!targetReport) {
      return;
    }

    const nextReports = issueReports.map((report) =>
      report.id === reportId
        ? {
            ...report,
            status,
            resolvedAt: new Date().toISOString(),
            resolvedBy: user.username,
          }
        : report
    );

    setIssueReports(nextReports);
    try {
      const response = await apiFetch("/api/moderation/issue-reports", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: reportId, status, resolvedBy: user.username }),
      });
      if (!response.ok) {
        throw new Error("Issue report update failed");
      }
    } catch {
      writeIssueReports(nextReports);
    }
    track("admin_action_performed", { action: status === "reviewed" ? "review_issue_report" : "dismiss_issue_report", resource_id: reportId });
    toast({
      title: status === "reviewed" ? "Issue marked reviewed" : "Issue dismissed",
      description: `${targetReport.issueType} report from @${targetReport.reporterName} was updated.`,
    });
  };

  const handleCreatePoll = async () => {
    const filledOptions = pollOptions.filter((o) => o.trim().length > 0);
    if (!pollQuestion.trim() || filledOptions.length < 2) {
      toast({ title: "Fill in the question and at least 2 options." });
      return;
    }
    const poll = createAdminPoll(pollQuestion, filledOptions);
    setPollQuestion("");
    setPollOptions(["", ""]);
    if (supabaseStatus === "ok") {
      try {
        await insertPollToSupabase(poll);
        const polls = await fetchPollsFromSupabase();
        setAdminPolls(polls);
        toast({ title: "Poll created", description: "Saved to Supabase." });
      } catch {
        setAdminPolls(readAdminPolls());
        toast({ title: "Poll created", description: "Saved locally (Supabase sync failed)." });
      }
    } else {
      setAdminPolls(readAdminPolls());
      toast({ title: "Poll created", description: "Saved locally." });
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    deleteAdminPoll(pollId);
    if (supabaseStatus === "ok") {
      try {
        await deletePollFromSupabase(pollId);
        const polls = await fetchPollsFromSupabase();
        setAdminPolls(polls);
      } catch {
        setAdminPolls(readAdminPolls());
      }
    } else {
      setAdminPolls(readAdminPolls());
    }
    toast({ title: "Poll deleted" });
  };

  const handleSheetFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (nextFile && nextFile.size > MAX_SHEET_FILE_BYTES) {
      toast({ title: "Image too large", description: "Use an image under 10MB." });
      return;
    }

    setSlicedAvatars((previous) => {
      revokeSlicedAvatarUrls(previous);
      return [];
    });
    setCutDecisions({});
    setReviewCursor(0);

    setSheetFile(nextFile);

    if (!nextFile) {
      setSheetPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(nextFile);
    setSheetPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return nextPreviewUrl;
    });

    if (autoMeasureGap) {
      void autoMeasureGapForFile(nextFile, sliceRows, sliceCols);
    }
  };

  const getDefaultNames = (count: number): string[] => {
    return Array.from({ length: count }, (_, index) => parsedNames[index] ?? `Avatar ${index + 1}`);
  };

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const sourceUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(sourceUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(sourceUrl);
        reject(new Error("Could not read image"));
      };
      img.src = sourceUrl;
    });
  };

  const detectForegroundBounds = (image: HTMLImageElement, threshold: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(image, 0, 0);
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;

    const corners = [
      [0, 0],
      [Math.max(0, width - 1), 0],
      [0, Math.max(0, height - 1)],
      [Math.max(0, width - 1), Math.max(0, height - 1)],
    ];

    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    corners.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
    });
    bgR /= corners.length;
    bgG /= corners.length;
    bgB /= corners.length;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha < 10) continue;
        const dr = data[idx] - bgR;
        const dg = data[idx + 1] - bgG;
        const db = data[idx + 2] - bgB;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);
        if (distance < threshold) continue;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) return null;
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  };

  const estimateGapFromBounds = (bounds: { width: number; height: number }, rows: number, cols: number) => {
    if (rows < 1 || cols < 1) return 0;

    const maxGap = Math.floor(Math.min(bounds.width, bounds.height) / 4);
    let bestGap = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let gap = 0; gap <= maxGap; gap += 1) {
      const cellW = (bounds.width - (cols - 1) * gap) / cols;
      const cellH = (bounds.height - (rows - 1) * gap) / rows;
      if (cellW <= 4 || cellH <= 4) continue;
      const score = Math.abs(cellW - cellH) + gap * 0.03;
      if (score < bestScore) {
        bestScore = score;
        bestGap = gap;
      }
    }

    return Math.max(0, bestGap);
  };

  async function autoMeasureGapForFile(file: File, rows: number, cols: number) {
    const requestId = gapMeasureRequestIdRef.current + 1;
    gapMeasureRequestIdRef.current = requestId;
    setIsMeasuringGap(true);

    try {
      const image = await loadImageFromFile(file);
      if (requestId !== gapMeasureRequestIdRef.current) return;

      const bounds = detectForegroundBounds(image, trimThreshold);
      if (!bounds) {
        toast({ title: "Could not measure gap", description: "Using current value." });
        return;
      }

      const measuredGap = estimateGapFromBounds(bounds, rows, cols);
      if (requestId !== gapMeasureRequestIdRef.current) return;
      setSliceGap(measuredGap);
      toast({ title: "Gap measured", description: `Suggested gap: ${measuredGap}px` });
    } catch {
      if (requestId === gapMeasureRequestIdRef.current) {
        toast({ title: "Could not measure gap", description: "Using current value." });
      }
    } finally {
      if (requestId === gapMeasureRequestIdRef.current) {
        setIsMeasuringGap(false);
      }
    }
  }

  const trimCanvasToSubject = (source: HTMLCanvasElement, threshold: number, padding: number): HTMLCanvasElement => {
    const ctx = source.getContext("2d");
    if (!ctx) return source;

    const width = source.width;
    const height = source.height;
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;

    const cornerPixels = [
      [0, 0],
      [Math.max(0, width - 1), 0],
      [0, Math.max(0, height - 1)],
      [Math.max(0, width - 1), Math.max(0, height - 1)],
    ];

    let bgR = 0;
    let bgG = 0;
    let bgB = 0;

    cornerPixels.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
    });

    bgR /= cornerPixels.length;
    bgG /= cornerPixels.length;
    bgB /= cornerPixels.length;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha < 10) continue;

        const dr = data[idx] - bgR;
        const dg = data[idx + 1] - bgG;
        const db = data[idx + 2] - bgB;
        const distance = Math.sqrt(dr * dr + dg * dg + db * db);

        if (distance < threshold) continue;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) {
      return source;
    }

    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const right = Math.min(width - 1, maxX + padding);
    const bottom = Math.min(height - 1, maxY + padding);
    const outWidth = right - left + 1;
    const outHeight = bottom - top + 1;

    // Guardrail: if trim result is suspiciously narrow/small, keep original cell.
    const widthRatio = outWidth / width;
    const heightRatio = outHeight / height;
    const areaRatio = (outWidth * outHeight) / (width * height);
    const aspect = outWidth / outHeight;
    if (widthRatio < 0.62 || heightRatio < 0.45 || areaRatio < 0.45 || aspect < 0.6 || aspect > 1.8) {
      return source;
    }

    if (cropToSquare) {
      const elongated = outHeight > outWidth * 1.25;
      const side = elongated
        ? Math.min(outHeight, Math.max(outWidth, Math.round(outWidth * 1.2)))
        : Math.max(outWidth, outHeight);
      const squareLeft = Math.max(0, Math.min(width - side, Math.round(left + (outWidth - side) / 2)));
      const squareTop = elongated
        ? Math.max(0, Math.min(height - side, top))
        : Math.max(0, Math.min(height - side, Math.round(top + (outHeight - side) / 2)));

      const square = document.createElement("canvas");
      square.width = side;
      square.height = side;
      const squareCtx = square.getContext("2d");
      if (!squareCtx) return source;
      squareCtx.drawImage(source, squareLeft, squareTop, side, side, 0, 0, side, side);
      return square;
    }

    const out = document.createElement("canvas");
    out.width = outWidth;
    out.height = outHeight;
    const outCtx = out.getContext("2d");
    if (!outCtx) return source;
    outCtx.drawImage(source, left, top, outWidth, outHeight, 0, 0, outWidth, outHeight);
    return out;
  };

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not encode image"));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  };

  const handleSliceSheet = async () => {
    if (!sheetFile) {
      toast({ title: "Upload an image first" });
      return;
    }

    if (sliceRows < 1 || sliceCols < 1) {
      toast({ title: "Rows and columns must be at least 1" });
      return;
    }

    const colsToUse = autoColsFromNames && parsedNames.length > 0 ? Math.max(1, Math.ceil(parsedNames.length / sliceRows)) : sliceCols;
    const totalCells = sliceRows * colsToUse;
    if (totalCells > MAX_SLICE_CELLS) {
      toast({ title: "Grid too large", description: `Use at most ${MAX_SLICE_CELLS} cells.` });
      return;
    }

    setIsSlicing(true);

    try {
      const sourceUrl = URL.createObjectURL(sheetFile);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = sourceUrl;
      });

      const bounds = detectForegroundBounds(image, trimThreshold);
      const gridStartX = bounds?.minX ?? 0;
      const gridStartY = bounds?.minY ?? 0;
      const gridWidth = bounds?.width ?? image.width;
      const gridHeight = bounds?.height ?? image.height;

      const totalGapX = sliceGap * (colsToUse - 1);
      const totalGapY = sliceGap * (sliceRows - 1);
      const cellWidth = Math.floor((gridWidth - totalGapX) / colsToUse);
      const cellHeight = Math.floor((gridHeight - totalGapY) / sliceRows);

      if (cellWidth <= 0 || cellHeight <= 0) {
        URL.revokeObjectURL(sourceUrl);
        toast({ title: "Invalid grid/gap for this image" });
        return;
      }

      const cellAspect = cellWidth / cellHeight;
      if (cellAspect < 0.65) {
        URL.revokeObjectURL(sourceUrl);
        toast({
          title: "Cells are too narrow",
          description: "Decrease columns (for this style, try 3 cols with 3 rows).",
        });
        return;
      }

      const defaultNames = getDefaultNames(totalCells);
      const output: SlicedAvatarItem[] = [];

      for (let row = 0; row < sliceRows; row += 1) {
        for (let col = 0; col < colsToUse; col += 1) {
          const sx = gridStartX + col * (cellWidth + sliceGap);
          const sy = gridStartY + row * (cellHeight + sliceGap);
          const canvas = document.createElement("canvas");
          canvas.width = cellWidth;
          canvas.height = cellHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) continue;

          ctx.drawImage(image, sx, sy, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);
          const finalCanvas = autoTrim ? trimCanvasToSubject(canvas, trimThreshold, trimPadding) : canvas;
          const index = row * colsToUse + col;
          const blob = await canvasToBlob(finalCanvas);
          const imageUrl = URL.createObjectURL(blob);
          output.push({
            id: `avatar-${index + 1}`,
            name: defaultNames[index],
            price: "0",
            imageUrl,
            blob,
            manualOffsetX: 0,
            manualOffsetY: 0,
            manualZoom: 1,
            sheetSx: sx,
            sheetSy: sy,
            sheetCellWidth: cellWidth,
            sheetCellHeight: cellHeight,
            publishTarget: "level",
          });
        }
      }

      URL.revokeObjectURL(sourceUrl);
      setSlicedAvatars((previous) => {
        revokeSlicedAvatarUrls(previous);
        return output;
      });
      setCutDecisions(
        output.reduce<Record<string, CutDecision>>((acc, item) => {
          acc[item.id] = "pending";
          return acc;
        }, {})
      );
      setReviewCursor(0);
      toast({
        title: "Sheet sliced",
        description: `${output.length} avatars generated`,
      });
    } catch {
      toast({
        title: "Could not slice image",
        description: "Try another image or adjust rows/cols/gap",
      });
    } finally {
      setIsSlicing(false);
    }
  };

  const updateSlicedName = (id: string, name: string) => {
    setSlicedAvatars((previous) => previous.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const updateSlicedPrice = (id: string, price: string) => {
    setSlicedAvatars((previous) => previous.map((item) => (item.id === id ? { ...item, price } : item)));
  };

  const updateSlicedPublishTarget = (id: string, publishTarget: "level" | "daily-spin") => {
    setSlicedAvatars((previous) => previous.map((item) => (item.id === id ? { ...item, publishTarget } : item)));
  };

  const clampManualZoom = (value: number) => Math.min(2.5, Math.max(0.45, value));

  const updateSlicedManualAdjust = (
    id: string,
    patch: Partial<Pick<SlicedAvatarItem, "manualOffsetX" | "manualOffsetY" | "manualZoom">>
  ) => {
    setSlicedAvatars((previous) => previous.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        manualOffsetX: patch.manualOffsetX ?? item.manualOffsetX,
        manualOffsetY: patch.manualOffsetY ?? item.manualOffsetY,
        manualZoom: patch.manualZoom !== undefined ? clampManualZoom(patch.manualZoom) : item.manualZoom,
      };
    }));
  };

  const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load image for manual crop"));
      img.src = url;
    });
  };

  const drawManualCropToCanvas = async (item: SlicedAvatarItem, canvas: HTMLCanvasElement) => {
    const outW = canvas.width;
    const outH = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not open canvas context");

    if (sheetFile) {
      try {
        const sheetImg = await loadImageFromFile(sheetFile);
        const centerX = item.sheetSx + item.sheetCellWidth / 2 + item.manualOffsetX;
        const centerY = item.sheetSy + item.sheetCellHeight / 2 + item.manualOffsetY;
        const sourceW = item.sheetCellWidth / item.manualZoom;
        const sourceH = item.sheetCellHeight / item.manualZoom;
        const sourceX = Math.max(0, Math.min(sheetImg.width - sourceW, centerX - sourceW / 2));
        const sourceY = Math.max(0, Math.min(sheetImg.height - sourceH, centerY - sourceH / 2));
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(sheetImg, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);
        return;
      } catch {
        // Fallback below if sheet cannot be loaded.
      }
    }

    const currentImg = await loadImageFromUrl(item.imageUrl);
    const sourceW = currentImg.width / item.manualZoom;
    const sourceH = currentImg.height / item.manualZoom;
    const maxX = Math.max(0, currentImg.width - sourceW);
    const maxY = Math.max(0, currentImg.height - sourceH);
    const sourceX = Math.min(maxX, Math.max(0, (currentImg.width - sourceW) / 2 + item.manualOffsetX));
    const sourceY = Math.min(maxY, Math.max(0, (currentImg.height - sourceH) / 2 + item.manualOffsetY));
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(currentImg, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);
  };

  const applyManualCrop = async (itemId: string) => {
    const item = slicedAvatars.find((entry) => entry.id === itemId);
    if (!item) return;

    try {
      const outW = item.sheetCellWidth;
      const outH = item.sheetCellHeight;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      await drawManualCropToCanvas(item, canvas);
      const blob = await canvasToBlob(canvas);
      const imageUrl = URL.createObjectURL(blob);
      let previousUrl: string | null = null;

      setSlicedAvatars((previous) => previous.map((entry) => {
        if (entry.id !== itemId) return entry;
        previousUrl = entry.imageUrl;
        return {
          ...entry,
          blob,
          imageUrl,
          manualOffsetX: 0,
          manualOffsetY: 0,
          manualZoom: 1,
        };
      }));

      if (previousUrl) {
        // Revoke after the next paint to avoid races where React is still committing
        // the old src and the browser attempts to resolve a just-revoked blob URL.
        window.setTimeout(() => URL.revokeObjectURL(previousUrl as string), 250);
      }

      toast({ title: "Manual crop applied" });
    } catch {
      toast({ title: "Could not apply manual crop", description: "Try adjusting less and retry." });
    }
  };

  const startManualDrag = (item: SlicedAvatarItem, clientX: number, clientY: number) => {
    cropDragRef.current = {
      active: true,
      id: item.id,
      startClientX: clientX,
      startClientY: clientY,
      startOffsetX: item.manualOffsetX,
      startOffsetY: item.manualOffsetY,
    };
  };

  const moveManualDrag = (clientX: number, clientY: number) => {
    const drag = cropDragRef.current;
    if (!drag || !drag.active) return;
    const deltaX = clientX - drag.startClientX;
    const deltaY = clientY - drag.startClientY;
    updateSlicedManualAdjust(drag.id, {
      manualOffsetX: drag.startOffsetX - deltaX,
      manualOffsetY: drag.startOffsetY - deltaY,
    });
  };

  const stopManualDrag = () => {
    if (!cropDragRef.current) return;
    cropDragRef.current.active = false;
    cropDragRef.current = null;
  };

  const chooseAssetsFolder = async () => {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
    if (!picker) {
      toast({ title: "Folder save not supported", description: "Use Chrome/Edge to save directly to assets." });
      return;
    }

    try {
      const handle = await picker();
      assetsDirHandleRef.current = handle;
      setAssetsFolderName(handle.name);
      toast({ title: "Folder selected", description: `Saving to ${handle.name}` });
    } catch {
      toast({ title: "Folder selection cancelled" });
    }
  };

  const saveBlobToAssetsFolder = async (fileName: string, blob: Blob): Promise<boolean> => {
    const dir = assetsDirHandleRef.current;
    if (!dir) return false;

    try {
      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  };

  const downloadAvatar = (item: SlicedAvatarItem) => {
    const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || item.id;
    void (async () => {
      const fileName = `${safeName}.png`;
      const saved = await saveBlobToAssetsFolder(fileName, item.blob);
      if (saved) {
        toast({ title: "Saved to assets", description: fileName });
        return;
      }

      const link = document.createElement("a");
      link.href = item.imageUrl;
      link.download = fileName;
      link.click();
    })();
  };

  const saveAllToAssets = async () => {
    if (slicedAvatars.length === 0) {
      toast({ title: "Nothing to save" });
      return;
    }

    if (!assetsDirHandleRef.current) {
      await chooseAssetsFolder();
      if (!assetsDirHandleRef.current) return;
    }

    let savedCount = 0;
    for (const item of slicedAvatars) {
      const safeName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || item.id;
      const ok = await saveBlobToAssetsFolder(`${safeName}.png`, item.blob);
      if (ok) savedCount += 1;
    }

    toast({ title: "Saved avatars", description: `${savedCount}/${slicedAvatars.length} saved to assets folder.` });
  };

  const copyAvatarCatalogJson = async () => {
    const payload = slicedAvatars.map((item, index) => ({
      id: item.id,
      level: index + 1,
      name: item.name,
      price: item.price,
      fileName: `${(item.name || item.id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || item.id}.png`,
    }));

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Catalog copied", description: "Names/prices JSON copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available in this browser." });
    }
  };

  const updateAvatarCatalogDraftItem = (id: string, patch: Partial<AvatarCatalogItem>) => {
    setAvatarCatalogDraft((previous) => previous.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeAvatarCatalogDraftItem = async (id: string) => {
    const previous = avatarCatalogDraft;
    setAvatarCatalogDraft(previous.filter((item) => item.id !== id).map((item, index) => ({ ...item, level: index + 1 })));
    setIsSavingAvatarCatalog(true);
    try {
      await deleteAvatarFromCatalog(id);
      toast({ title: "Avatar removed" });
    } catch (error) {
      setAvatarCatalogDraft(previous);
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Could not delete avatar", description: message });
    } finally {
      setIsSavingAvatarCatalog(false);
    }
  };

  const addAvatarCatalogDraftItem = () => {
    setAvatarCatalogDraft((previous) => {
      const nextLevel = previous.length + 1;
      const theme = getAvatar(Math.min(nextLevel, 10));
      return [
        ...previous,
        {
          id: `avatar-${nextLevel}`,
          level: nextLevel,
          name: `Avatar ${nextLevel}`,
          price: "0",
          imageSrc: "",
          bg: theme.bg,
          figure: theme.figure,
          ring: theme.ring,
          glow: theme.glow,
          isActive: true,
        },
      ];
    });
  };

  const saveAvatarCatalogDraft = async () => {
    if (avatarCatalogDraft.length === 0) {
      toast({ title: "No avatars to save" });
      return;
    }

    setIsSavingAvatarCatalog(true);
    try {
      const normalized = avatarCatalogDraft.map((item, index) => ({
        ...item,
        id: item.id.trim() || `avatar-${index + 1}`,
        name: item.name.trim() || `Avatar ${index + 1}`,
        price: item.price.trim() || "0",
        level: index + 1,
        isActive: true,
      }));
      const saved = await saveAvatarCatalogSupabaseOnly(normalized);
      setAvatarCatalogDraft(saved);
      toast({ title: "Avatar catalog saved", description: `${saved.length} avatars are now live.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Could not save catalog", description: message });
    } finally {
      setIsSavingAvatarCatalog(false);
    }
  };

  const stepReviewCursor = (direction: -1 | 1) => {
    if (slicedAvatars.length === 0) return;
    setReviewCursor((previous) => {
      const next = previous + direction;
      if (next < 0) return 0;
      if (next >= slicedAvatars.length) return slicedAvatars.length - 1;
      return next;
    });
  };

  const setCurrentCutDecision = (decision: Exclude<CutDecision, "pending">) => {
    const current = slicedAvatars[reviewCursor];
    if (!current) return;

    setCutDecisions((previous) => {
      const next = { ...previous, [current.id]: decision };
      const nextPendingIndex = slicedAvatars.findIndex((item, index) => index > reviewCursor && (next[item.id] ?? "pending") === "pending");
      if (nextPendingIndex >= 0) {
        setReviewCursor(nextPendingIndex);
        return next;
      }

      const firstPendingIndex = slicedAvatars.findIndex((item) => (next[item.id] ?? "pending") === "pending");
      if (firstPendingIndex >= 0) {
        setReviewCursor(firstPendingIndex);
      }

      return next;
    });
  };

  const slugify = (value: string): string => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getUniqueAvatarId = (base: string, usedIds: Set<string>): string => {
    const normalizedBase = slugify(base) || "avatar";
    if (!usedIds.has(normalizedBase)) {
      usedIds.add(normalizedBase);
      return normalizedBase;
    }

    let counter = 2;
    while (usedIds.has(`${normalizedBase}-${counter}`)) {
      counter += 1;
    }
    const next = `${normalizedBase}-${counter}`;
    usedIds.add(next);
    return next;
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not encode image as data URL"));
      reader.readAsDataURL(blob);
    });
  };

  const testSupabaseStorage = async () => {
    setIsTestingStorage(true);
    try {
      const probeBlob = new Blob(["raw-storage-probe"], { type: "text/plain" });
      let successBucket: string | null = null;
      let lastErrorMessage = "Storage probe failed";

      for (const bucket of AVATAR_STORAGE_BUCKET_CANDIDATES) {
        const probePath = `health/probe-${Date.now()}.txt`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(probePath, probeBlob, { upsert: false, contentType: "text/plain" });

        if (uploadError) {
          lastErrorMessage = uploadError.message || lastErrorMessage;
          continue;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(probePath);
        await supabase.storage.from(bucket).remove([probePath]);

        successBucket = bucket;
        toast({
          title: "Storage test passed",
          description: `Upload/read/delete works in bucket: ${bucket}${data.publicUrl ? " (public URL available)" : ""}.`,
        });
        break;
      }

      if (!successBucket) {
        toast({
          title: "Storage test failed",
          description: `${lastErrorMessage}. Create bucket '${AVATAR_STORAGE_BUCKET}' and allow upload/read/delete for your admin flow.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown storage error";
      toast({ title: "Storage test failed", description: message });
    } finally {
      setIsTestingStorage(false);
    }
  };

  const uploadAvatarBlobToSupabase = async (
    blob: Blob,
    safeId: string,
    target: "level" | "daily-spin"
  ): Promise<string> => {
    const folder = target === "daily-spin" ? "daily-spin" : "catalog";
    const filePath = `${folder}/${safeId}-${Date.now()}.png`;
    let lastErrorMessage = "Storage upload failed";

    for (const bucket of AVATAR_STORAGE_BUCKET_CANDIDATES) {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          cacheControl: "31536000",
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        const details = [uploadError.message, uploadError.name].filter(Boolean).join(" | ");
        lastErrorMessage = details || lastErrorMessage;
        continue;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (!data.publicUrl) {
        lastErrorMessage = "Storage public URL could not be created";
        continue;
      }

      return data.publicUrl;
    }

    throw new Error(
      `${lastErrorMessage}. Check Supabase Storage: create a bucket (recommended name: ${AVATAR_STORAGE_BUCKET}) and allow upload/read for your admin flow.`
    );
  };

  const publishSlicedAvatarsToCatalog = async () => {
    if (slicedAvatars.length === 0) {
      toast({ title: "Slice avatars first" });
      return;
    }

    if (pendingReviewCount > 0) {
      toast({ title: "Finish cut review", description: "Accept or reject each cut first." });
      return;
    }

    if (acceptedSlicedAvatars.length === 0) {
      toast({ title: "No accepted cuts", description: "Accept at least one avatar to publish." });
      return;
    }

    setIsSavingAvatarCatalog(true);
    try {
      const latestCatalog = await loadAvatarCatalogSupabaseOnly();
      const existing = latestCatalog.map((item) => ({ ...item }));
      const usedIds = new Set(existing.map((item) => item.id));

      const safeIds = acceptedSlicedAvatars.map((item, index) =>
        getUniqueAvatarId(
          item.name || item.id || (item.publishTarget === "daily-spin" ? `daily-spin-${index + 1}` : `avatar-${existing.length + index + 1}`),
          usedIds
        )
      );

      const uploadResults = await Promise.all(
        acceptedSlicedAvatars.map((item, index) =>
          uploadAvatarBlobToSupabase(item.blob, safeIds[index], item.publishTarget === "daily-spin" ? "daily-spin" : "level")
        )
      );

      const nextFromSlice: AvatarCatalogItem[] = [];
      const nextForDailySpin: Array<{ id: string; name: string; imageSrc: string }> = [];
      for (let index = 0; index < acceptedSlicedAvatars.length; index += 1) {
        const item = acceptedSlicedAvatars[index];
        const safeId = safeIds[index];
        const imageSrc = uploadResults[index];
        if (item.publishTarget === "daily-spin") {
          nextForDailySpin.push({
            id: safeId,
            name: item.name.trim() || `Daily Spin ${index + 1}`,
            imageSrc,
          });
          continue;
        }
        const theme = getAvatar(existing.length + index + 1);
        nextFromSlice.push({
          id: safeId,
          level: 0,
          name: item.name.trim() || `Avatar ${existing.length + index + 1}`,
          price: item.price.trim() || "0",
          imageSrc,
          bg: theme.bg,
          figure: theme.figure,
          ring: theme.ring,
          glow: theme.glow,
          isActive: true,
        });
      }

      const clampedInsertAt = Math.min(Math.max(1, publishInsertAt), existing.length + 1);
      const insertIndex = clampedInsertAt - 1;
      const merged = [
        ...existing.slice(0, insertIndex),
        ...nextFromSlice,
        ...existing.slice(insertIndex),
      ].map((item, idx) => ({ ...item, level: idx + 1 }));

      const saved = await saveAvatarCatalogSupabaseOnly(merged);
      if (nextForDailySpin.length > 0) {
        upsertDailySpinAvatarPool(nextForDailySpin);
      }
      setAvatarCatalogDraft(saved);
      setPublishInsertAt(Math.min(saved.length + 1, clampedInsertAt + nextFromSlice.length));
      toast({
        title: "Publish complete",
        description: `${nextFromSlice.length} to levels, ${nextForDailySpin.length} to daily spin pool.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Try again after slicing.";
      toast({ title: "Could not publish avatars", description: message });
    } finally {
      setIsSavingAvatarCatalog(false);
    }
  };

  const renderInsertPeek = (position: number) => {
    if (acceptedLevelAvatars.length === 0) return null;
    if (clampedPublishInsertAt !== position) return null;

    return (
      <div className="rounded-xl border border-raw-gold/35 bg-raw-gold/[0.08] p-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-raw-gold/80">
          Preview: accepted level avatars will be inserted here (before #{position})
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {acceptedLevelAvatars.slice(0, 8).map((item, index) => (
            <div key={`peek-${item.id}-${index}`} className="min-w-[64px] rounded-lg border border-raw-gold/35 bg-raw-black/35 p-1">
              <img src={item.imageUrl} alt={item.name} className="h-10 w-full rounded-md object-contain" />
              <p className="mt-1 truncate text-center text-[9px] text-raw-gold/80">{item.name || `Avatar ${index + 1}`}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-raw-black text-raw-text">
      <div className="border-b border-raw-border/30 bg-raw-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-raw-gold/65">Hidden admin page</p>
            <h1 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">Moderation dashboard</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleAddTestXP}
              className="rounded-xl border border-raw-gold/40 bg-raw-gold/10 px-3 py-2 text-sm font-semibold text-raw-gold transition hover:bg-raw-gold/20 sm:px-4"
            >
              +100 XP
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-raw-border/30 px-3 py-2 text-sm text-raw-silver/70 transition-colors hover:text-raw-text sm:px-4"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button onClick={logout} className="rounded-xl bg-raw-gold px-3 py-2 text-sm font-semibold text-raw-ink sm:px-4">
              Log out
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 sm:space-y-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
          <SummaryCard label="Users" value={users.length} hint="All locally registered accounts, including admin and reported aliases." />
          <SummaryCard label="Pending Requests" value={pendingRequests.length} hint="Community creation requests waiting for admin approval." />
          <SummaryCard label="Join Requests" value={pendingJoinRequests.length} hint="Pending requests to join locked communities." />
          <SummaryCard label="Open Reports" value={openReports.length} hint="Chat reports still awaiting a moderation decision." />
          <SummaryCard label="Issue Reports" value={openIssueReports.length} hint="Screenshot reports sent from the dashboard menu." />
          <SummaryCard label="Banned Users" value={bannedUsers.length} hint="Accounts currently blocked from chatting after review." />
        </div>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Users</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Every locally known user account and its current moderation state.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {users.length === 0 ? (
              <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">No users yet.</div>
            ) : (
              users.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-base text-raw-text">@{entry.username}</p>
                    <p className="mt-1 text-xs text-raw-silver/40 leading-relaxed">
                      Role: {entry.role} · Warnings: {entry.warnings} · Last seen {formatAdminTimestamp(entry.lastSeenAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
                      entry.moderationStatus === "active"
                        ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                        : entry.moderationStatus === "warned"
                          ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                          : "border-red-400/20 bg-red-500/10 text-red-200"
                    }`}>
                      {entry.moderationStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Daily spin pool manager</h2>
              <p className="mt-1 text-sm text-raw-silver/45">
                Use the same wheel on Admin to curate entries: keep, remove, and add items.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border border-raw-border/25 bg-raw-black/35 p-3 sm:p-4">
              {spinPoolPrizes.length > 0 ? (
                <>
                  <WheelOfFortune
                    prizes={spinPoolPrizes}
                    onSpinEnd={(prize) => setSpinPreviewPrize(prize)}
                  />
                  {spinPreviewPrize && (
                    <p className="mt-2 text-center text-xs text-raw-silver/55">
                      Last landed: <span className="text-raw-gold/90">{spinPreviewPrize.label}</span>
                    </p>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-raw-border/20 bg-raw-black/40 p-4 text-sm text-raw-silver/45">
                  No items in daily spin pool yet.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-raw-border/20 bg-raw-black/30 p-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Add new entry</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                  <input
                    type="text"
                    value={newSpinName}
                    onChange={(event) => setNewSpinName(event.target.value)}
                    className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={newSpinImageSrc}
                    onChange={(event) => setNewSpinImageSrc(event.target.value)}
                    className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                    placeholder="Image URL"
                  />
                  <button
                    type="button"
                    onClick={addDailySpinEntry}
                    className="rounded-lg border border-raw-border/25 px-3 py-2 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-raw-border/20 bg-raw-black/30 p-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Drag from cropped avatars</p>
                {slicedAvatars.length === 0 ? (
                  <p className="mt-2 text-xs text-raw-silver/45">Slice avatars first to drag them here.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {slicedAvatars.map((item) => (
                      <button
                        key={`drag-crop-${item.id}`}
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "cropped-avatar", id: item.id }));
                          event.dataTransfer.effectAllowed = "copyMove";
                        }}
                        className="rounded-lg border border-raw-border/25 bg-raw-black/35 p-2 text-left hover:border-raw-gold/40"
                        title="Drag into spin pool"
                      >
                        <img src={item.imageUrl} alt={item.name} className="h-12 w-full rounded-md object-cover" />
                        <p className="mt-1 truncate text-[10px] text-raw-silver/70">{item.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-raw-border/20 bg-raw-black/30 p-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Drag from website avatars</p>
                {avatarCatalogDraft.length === 0 ? (
                  <p className="mt-2 text-xs text-raw-silver/45">No website avatars in catalog.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {avatarCatalogDraft.map((item) => (
                      <div
                        key={`drag-catalog-${item.id}`}
                        className="rounded-lg border border-raw-border/25 bg-raw-black/35 p-2 hover:border-raw-gold/40"
                      >
                        <button
                          type="button"
                          onClick={() => addEntryToSpinPoolAt({ id: item.id, name: item.name || item.id, imageSrc: item.imageSrc || "" })}
                          className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-raw-gold/45 text-raw-gold hover:bg-raw-gold/15"
                          title="Add to spin pool"
                          aria-label={`Add ${item.name} to spin pool`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "catalog-avatar", id: item.id }));
                            event.dataTransfer.effectAllowed = "copyMove";
                          }}
                          className="w-full text-left"
                          title="Drag into spin pool"
                        >
                          <img src={item.imageSrc || ""} alt={item.name} className="h-12 w-full rounded-md object-cover" />
                          <p className="mt-1 truncate text-[10px] text-raw-silver/70">{item.name}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {dailySpinPoolDraft.length === 0 ? (
                <p className="text-sm text-raw-silver/45">No spin entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {dailySpinPoolDraft.map((item, index) => (
                    <div
                      key={item.id}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setSpinDropIndex(index);
                      }}
                      onDragLeave={() => setSpinDropIndex((previous) => (previous === index ? null : previous))}
                      onDrop={(event) => {
                        event.preventDefault();
                        const payload = event.dataTransfer.getData("text/plain");
                        void handleSpinPoolDrop(payload, index);
                        setSpinDropIndex(null);
                      }}
                      className={`grid gap-2 rounded-xl border bg-raw-black/30 p-2 sm:grid-cols-[28px_52px_1fr_1.4fr_auto] sm:items-center ${
                        spinDropIndex === index ? "border-raw-gold/45" : "border-raw-border/20"
                      }`}
                    >
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "spin-item", id: item.id }));
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className="inline-flex h-12 w-6 items-center justify-center rounded-md border border-raw-border/25 text-raw-silver/55 hover:border-raw-gold/40 hover:text-raw-gold"
                        title="Drag to reorder"
                        aria-label={`Drag ${item.name} to reorder`}
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                      <img
                        src={item.imageSrc}
                        alt={item.name}
                        className="h-12 w-12 rounded-lg border border-raw-border/20 bg-raw-black/50 object-cover"
                      />
                      <input
                        type="text"
                        value={item.name}
                        onChange={(event) => updateDailySpinEntry(item.id, { name: event.target.value })}
                        className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={item.imageSrc}
                        onChange={(event) => updateDailySpinEntry(item.id, { imageSrc: event.target.value })}
                        className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                        placeholder="Image URL"
                      />
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeDailySpinEntry(item.id);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-raw-border/25 text-raw-silver/55 hover:border-red-400/40 hover:text-red-300"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copyMove";
                      setSpinDropIndex(dailySpinPoolDraft.length);
                    }}
                    onDragLeave={() => setSpinDropIndex((previous) => (previous === dailySpinPoolDraft.length ? null : previous))}
                    onDrop={(event) => {
                      event.preventDefault();
                      const payload = event.dataTransfer.getData("text/plain");
                      void handleSpinPoolDrop(payload, dailySpinPoolDraft.length);
                      setSpinDropIndex(null);
                    }}
                    className={`rounded-lg border border-dashed px-3 py-2 text-xs text-raw-silver/55 ${
                      spinDropIndex === dailySpinPoolDraft.length ? "border-raw-gold/45 text-raw-gold/85" : "border-raw-border/25"
                    }`}
                  >
                    Drop here to add at end
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveDailySpinPoolDraft}
                  disabled={isSavingSpinPool}
                  className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                >
                  {isSavingSpinPool ? "Saving..." : "Save spin pool"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadDailySpinPoolFromSupabase().then(setDailySpinPoolDraft).catch(() => setDailySpinPoolDraft(readDailySpinAvatarPool()))}
                  className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                >
                  Reload from storage
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Community requests</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Approve or reject requests for new communities before they go live.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {communityRequests.length === 0 ? (
              <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">No requests submitted yet.</div>
            ) : (
              communityRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-raw-text">{request.communityName}</p>
                      <p className="mt-1 text-sm text-raw-silver/45">Requested by @{request.requesterName} · {formatAdminTimestamp(request.submittedAt)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
                      request.status === "pending"
                        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                        : request.status === "approved"
                          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                          : "border-red-400/20 bg-red-500/10 text-red-200"
                    }`}>
                      {request.status}
                    </span>
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

                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Why now</p>
                    <p className="mt-2 text-sm leading-relaxed text-raw-silver/60">{request.whyNow}</p>
                  </div>

                  {request.samplePrompt && (
                    <div className="mt-4 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4 text-sm text-raw-silver/55">
                      “{request.samplePrompt}”
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                      <Button onClick={() => handleRequestStatus(request.id, "approved")} className="rounded-xl bg-emerald-400 px-4 text-raw-ink hover:bg-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button onClick={() => handleRequestStatus(request.id, "rejected")} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Join requests</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Approve or reject user requests to join locked communities.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {communityJoinRequests.length === 0 ? (
              <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">No join requests yet.</div>
            ) : (
              communityJoinRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-raw-text">{request.communityTitle}</p>
                      <p className="mt-1 text-sm text-raw-silver/45">
                        Requested by @{request.requesterName} · {formatAdminTimestamp(request.submittedAt)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
                      request.status === "pending"
                        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                        : request.status === "approved"
                          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                          : "border-red-400/20 bg-red-500/10 text-red-200"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  {request.status === "pending" && (
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                      <Button onClick={() => handleJoinRequestStatus(request.id, "approved")} className="rounded-xl bg-emerald-400 px-4 text-raw-ink hover:bg-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button onClick={() => handleJoinRequestStatus(request.id, "rejected")} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  )}
                  {request.status !== "pending" && (
                    <p className="mt-3 text-xs text-raw-silver/40">
                      Reviewed by @{request.reviewedBy ?? "admin"}{request.reviewedAt ? ` · ${formatAdminTimestamp(request.reviewedAt)}` : ""}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Plus className="h-5 w-5 text-raw-gold/70" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-xl tracking-wide">Create poll</h2>
                {adminPolls.length > 0 && (
                  <span className="inline-flex items-center rounded-full border border-raw-border/35 bg-raw-surface/30 px-2.5 py-0.5 text-[11px] text-raw-silver/60">
                    {adminPolls.length} poll{adminPolls.length !== 1 ? "s" : ""}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] ${
                  supabaseStatus === "ok"
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                    : supabaseStatus === "error"
                      ? "border-red-400/35 bg-red-500/10 text-red-300"
                      : "border-raw-border/30 text-raw-silver/40"
                }`}>
                  <Database className="h-3 w-3" />
                  {supabaseStatus === "ok" ? "Supabase connected" : supabaseStatus === "error" ? `Supabase: ${supabaseMessage}` : "Connecting…"}
                </span>
                <button
                  type="button"
                  onClick={() => void testSupabaseStorage()}
                  disabled={isTestingStorage}
                  className="inline-flex items-center gap-1.5 rounded-full border border-raw-border/30 px-2.5 py-0.5 text-[10px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                >
                  <Database className="h-3 w-3" />
                  {isTestingStorage ? "Testing storage..." : "Test storage"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadPolls()}
                  disabled={isLoadingPolls}
                  className="inline-flex items-center gap-1.5 rounded-full border border-raw-border/30 px-2.5 py-0.5 text-[10px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                >
                  <Database className="h-3 w-3" />
                  {isLoadingPolls ? "Loading..." : pollsLoaded ? "Reload polls" : "Load polls"}
                </button>
              </div>
              <p className="mt-1 text-sm text-raw-silver/45">Add a new poll with its answer options. It will show up in the daily feed.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <input
              type="text"
              placeholder="Poll question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/40"
            />
            {pollOptions.map((option, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder={i === 0 ? "No" : i === 1 ? "Yes" : `Option ${i + 1}`}
                  value={option}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  className="flex-1 rounded-xl border border-raw-border/30 bg-raw-black/50 px-4 py-3 text-sm text-raw-text placeholder-raw-silver/30 outline-none focus:border-raw-gold/40"
                />
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                    className="rounded-xl border border-raw-border/30 px-3 text-raw-silver/40 hover:text-red-400"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-3">
              <button
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="text-xs text-raw-silver/40 hover:text-raw-silver/70"
              >
                + Add option
              </button>
            </div>
            <Button onClick={handleCreatePoll} className="rounded-xl bg-raw-gold px-5 text-raw-ink hover:bg-raw-gold/90">
              <Plus className="h-4 w-4" /> Create poll
            </Button>
          </div>

          {adminPolls.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Existing polls</p>
              {adminPolls.map((poll) => (
                <div key={poll.id} className="flex items-start justify-between gap-4 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4">
                  <div>
                    <p className="text-sm text-raw-text">{poll.question}</p>
                    <p className="mt-1 text-xs text-raw-silver/40">{poll.options.map((o) => o.text).join(" · ")} · {formatAdminTimestamp(poll.createdAt)}</p>
                  </div>
                  <button onClick={() => handleDeletePoll(poll.id)} className="shrink-0 text-raw-silver/30 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Avatar sheet cutter</h2>
              <p className="mt-1 text-sm text-raw-silver/45">
                Upload one image with multiple avatars, split each one out, and keep a name under each result.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[340px_1fr]">
            <div className="space-y-4">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Upload sheet</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-raw-border/40 bg-raw-black/35 px-4 py-6 text-sm text-raw-silver/70 hover:border-raw-gold/40 hover:text-raw-text">
                <Upload className="h-4 w-4" />
                <span>{sheetFile ? sheetFile.name : "Choose image"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSheetFileChange} />
              </label>

              {sheetPreviewUrl && (
                <img src={sheetPreviewUrl} alt="Sheet preview" className="w-full rounded-xl border border-raw-border/30 bg-raw-black/40" />
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Rows</label>
                  <input
                    type="number"
                    min={1}
                    value={sliceRows}
                    onChange={(event) => setSliceRows(Math.max(1, Number(event.target.value) || 1))}
                    className="mt-1 w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Cols</label>
                  <input
                    type="number"
                    min={1}
                    value={sliceCols}
                    onChange={(event) => setSliceCols(Math.max(1, Number(event.target.value) || 1))}
                    className="mt-1 w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Gap(px)</label>
                  <input
                    type="number"
                    min={0}
                    value={sliceGap}
                    onChange={(event) => setSliceGap(Math.max(0, Number(event.target.value) || 0))}
                    className="mt-1 w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-raw-silver/60">
                  <input
                    type="checkbox"
                    checked={autoMeasureGap}
                    onChange={(event) => setAutoMeasureGap(event.target.checked)}
                  />
                  Auto measure gap from image
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!sheetFile) return;
                    void autoMeasureGapForFile(sheetFile, sliceRows, sliceCols);
                  }}
                  disabled={!sheetFile || isMeasuringGap}
                  className="rounded-lg border border-raw-border/30 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                >
                  {isMeasuringGap ? "Measuring..." : "Re-measure gap"}
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-raw-silver/60">
                <input
                  type="checkbox"
                  checked={autoColsFromNames}
                  onChange={(event) => setAutoColsFromNames(event.target.checked)}
                />
                Auto columns from names and rows
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-1 flex items-center gap-2 text-xs text-raw-silver/60">
                  <input
                    type="checkbox"
                    checked={autoTrim}
                    onChange={(event) => setAutoTrim(event.target.checked)}
                  />
                  Auto trim
                </label>
                <label className="col-span-1 flex items-center gap-2 text-xs text-raw-silver/60">
                  <input
                    type="checkbox"
                    checked={cropToSquare}
                    onChange={(event) => setCropToSquare(event.target.checked)}
                    disabled={!autoTrim}
                  />
                  Square crop
                </label>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Trim pad</label>
                  <input
                    type="number"
                    min={0}
                    value={trimPadding}
                    onChange={(event) => setTrimPadding(Math.max(0, Number(event.target.value) || 0))}
                    disabled={!autoTrim}
                    className="mt-1 w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Threshold</label>
                  <input
                    type="number"
                    min={1}
                    max={255}
                    value={trimThreshold}
                    onChange={(event) => setTrimThreshold(Math.min(255, Math.max(1, Number(event.target.value) || 1)))}
                    disabled={!autoTrim}
                    className="mt-1 w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Names (one per line)</label>
                <textarea
                  value={namesInput}
                  onChange={(event) => setNamesInput(event.target.value)}
                  placeholder={"Chrome\nCyborg\nSteampunk\nSolar\nCyorg\nGalactic\nRoyal\nDemon"}
                  className="mt-1 min-h-[120px] w-full rounded-xl border border-raw-border/30 bg-raw-black/50 px-3 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                />
              </div>

              <Button
                onClick={handleSliceSheet}
                disabled={isSlicing || !sheetFile}
                className="rounded-xl bg-raw-gold px-5 text-raw-ink hover:bg-raw-gold/90"
              >
                <Scissors className="h-4 w-4" /> {isSlicing ? "Slicing..." : "Slice image"}
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void chooseAssetsFolder()}
                  className="rounded-xl border border-raw-border/30 px-3 py-2 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                >
                  {assetsFolderName ? `Assets folder: ${assetsFolderName}` : "Choose assets folder"}
                </button>
                <button
                  type="button"
                  onClick={() => void saveAllToAssets()}
                  disabled={slicedAvatars.length === 0}
                  className="rounded-xl border border-raw-border/30 px-3 py-2 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                >
                  Save all to assets
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Output</p>
                <div className="flex flex-wrap items-center gap-2">
                  {slicedAvatars.length > 0 && (
                    <button
                      onClick={copyAvatarCatalogJson}
                      className="inline-flex items-center gap-2 rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy names/prices JSON
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void publishSlicedAvatarsToCatalog()}
                    disabled={slicedAvatars.length === 0 || isSavingAvatarCatalog || pendingReviewCount > 0 || acceptedSlicedAvatars.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                  >
                    <Database className="h-3.5 w-3.5" /> {isSavingAvatarCatalog ? "Publishing..." : "Publish to live catalog"}
                  </button>
                </div>
              </div>
              {pendingReviewCount > 0 && (
                <p className="mt-1 text-[11px] text-raw-silver/45">
                  Finish review first: {pendingReviewCount} cut{pendingReviewCount === 1 ? "" : "s"} still pending.
                </p>
              )}
              {pendingReviewCount === 0 && acceptedSlicedAvatars.length > 0 && acceptedLevelAvatars.length === 0 && (
                <p className="mt-1 text-[11px] text-raw-silver/45">
                  No cuts are targeted to levels right now. Set target to Level avatars if you want insertion into levels.
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                <span>Add mode:</span>
                <span className="rounded-md border border-raw-border/20 px-2 py-1">Keep existing + add new</span>
                <span>Insert at position</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, avatarCatalogDraft.length + 1)}
                  value={publishInsertAt}
                  onChange={(event) => setPublishInsertAt(Math.max(1, Number(event.target.value) || 1))}
                  className="w-20 rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2 py-1.5 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                />
                <button
                  type="button"
                  onClick={() => setPublishInsertAt(Math.max(1, avatarCatalogDraft.length + 1))}
                  className="rounded-lg border border-raw-border/25 px-2 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                >
                  Place at end
                </button>
              </div>
              {slicedAvatars.length > 0 && (
                <div className="mt-3 rounded-xl border border-raw-border/20 bg-raw-black/30 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Cut review (one by one)</p>
                  <p className="mt-1 text-xs text-raw-silver/45">
                    Review each cut: Yes to keep it, No to reject it. Then publish accepted cuts only.
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-raw-silver/55">
                    <span className="rounded-md border border-raw-border/20 px-2 py-1">Total: {slicedAvatars.length}</span>
                    <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-200">Accepted: {acceptedSlicedAvatars.length}</span>
                    <span className="rounded-md border border-raw-gold/25 bg-raw-gold/10 px-2 py-1 text-raw-gold/90">To levels: {acceptedLevelAvatars.length}</span>
                    <span className="rounded-md border border-sky-400/25 bg-sky-500/10 px-2 py-1 text-sky-200">To daily spin: {acceptedDailySpinAvatars.length}</span>
                    <span className="rounded-md border border-raw-border/20 px-2 py-1">Pending: {pendingReviewCount}</span>
                    <span className="rounded-md border border-raw-border/20 px-2 py-1">Reviewed: {reviewedCount}</span>
                  </div>

                  {currentReviewItem && (
                    <div className="mt-3 rounded-xl border border-raw-border/20 bg-raw-black/40 p-3">
                      <p className="text-xs text-raw-silver/55">Now reviewing {reviewCursor + 1}/{slicedAvatars.length}</p>
                      <div
                        className="mt-2 h-44 w-full cursor-move overflow-hidden rounded-xl border border-raw-border/20 bg-raw-black/50"
                        onMouseDown={(event) => startManualDrag(currentReviewItem, event.clientX, event.clientY)}
                        onMouseMove={(event) => moveManualDrag(event.clientX, event.clientY)}
                        onMouseUp={stopManualDrag}
                        onMouseLeave={stopManualDrag}
                        onTouchStart={(event) => {
                          const touch = event.touches[0];
                          if (!touch) return;
                          startManualDrag(currentReviewItem, touch.clientX, touch.clientY);
                        }}
                        onTouchMove={(event) => {
                          const touch = event.touches[0];
                          if (!touch) return;
                          moveManualDrag(touch.clientX, touch.clientY);
                        }}
                        onTouchEnd={stopManualDrag}
                      >
                        <img
                          src={reviewPreviewUrl || currentReviewItem.imageUrl}
                          alt={currentReviewItem.name}
                          className="h-full w-full object-contain"
                          draggable={false}
                        />
                      </div>

                      <div className="mt-2 rounded-lg border border-raw-border/20 bg-raw-black/30 p-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-raw-silver/55">
                          <span>Adjust by hand:</span>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualOffsetY: currentReviewItem.manualOffsetY - 8 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualOffsetY: currentReviewItem.manualOffsetY + 8 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualOffsetX: currentReviewItem.manualOffsetX - 8 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualOffsetX: currentReviewItem.manualOffsetX + 8 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Right
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualZoom: currentReviewItem.manualZoom - 0.12 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Zoom -
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualZoom: currentReviewItem.manualZoom + 0.12 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Zoom +
                          </button>
                          <span className="rounded-md border border-raw-border/25 px-2 py-1 text-raw-silver/65">
                            {Math.round(currentReviewItem.manualZoom * 100)}%
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSlicedManualAdjust(currentReviewItem.id, { manualOffsetX: 0, manualOffsetY: 0, manualZoom: 1 })}
                            className="rounded-md border border-raw-border/25 px-2 py-1 hover:border-raw-gold/40 hover:text-raw-text"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => void applyManualCrop(currentReviewItem.id)}
                            className="rounded-md border border-raw-gold/35 bg-raw-gold/10 px-2 py-1 text-raw-gold hover:bg-raw-gold/20"
                          >
                            Apply crop
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={currentReviewItem.name}
                          onChange={(event) => updateSlicedName(currentReviewItem.id, event.target.value)}
                          className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                          placeholder="Avatar name"
                        />
                        <input
                          type="text"
                          value={currentReviewItem.price}
                          onChange={(event) => updateSlicedPrice(currentReviewItem.id, event.target.value)}
                          className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                          placeholder="Price"
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs text-raw-silver/55">Publish target:</label>
                        <select
                          value={currentReviewItem.publishTarget}
                          onChange={(event) => updateSlicedPublishTarget(currentReviewItem.id, event.target.value as "level" | "daily-spin")}
                          className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-1.5 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                        >
                          <option value="level">Level avatars</option>
                          <option value="daily-spin">Daily spin pool</option>
                        </select>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => stepReviewCursor(-1)}
                          disabled={reviewCursor <= 0}
                          className="rounded-lg border border-raw-border/25 px-3 py-1.5 text-xs text-raw-silver/60 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentCutDecision("rejected")}
                          className="rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                        >
                          No - reject cut
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentCutDecision("accepted")}
                          className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                        >
                          Yes - accept cut
                        </button>
                        <button
                          type="button"
                          onClick={() => stepReviewCursor(1)}
                          disabled={reviewCursor >= slicedAvatars.length - 1}
                          className="rounded-lg border border-raw-border/25 px-3 py-1.5 text-xs text-raw-silver/60 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {slicedAvatars.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-raw-border/20 bg-raw-black/35 p-5 text-sm text-raw-silver/45">
                  No avatars sliced yet. Upload a sheet, set rows/cols, then click Slice image.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {slicedAvatars.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-3">
                      <img src={item.imageUrl} alt={item.name} className="h-36 w-full rounded-xl border border-raw-border/20 bg-raw-black/50 object-contain" />
                      <p className="mt-2 text-center text-xs font-semibold tracking-[0.12em] uppercase text-raw-gold/80">{item.name}</p>
                      <p className={`mt-1 text-center text-[10px] ${
                        cutDecisions[item.id] === "accepted"
                          ? "text-emerald-200"
                          : cutDecisions[item.id] === "rejected"
                            ? "text-red-200"
                            : "text-raw-silver/45"
                      }`}>
                        {cutDecisions[item.id] === "accepted"
                          ? "Accepted"
                          : cutDecisions[item.id] === "rejected"
                            ? "Rejected"
                            : "Pending review"}
                      </p>
                      <p className="mt-1 text-center text-[10px] text-raw-silver/45">
                        Target: {item.publishTarget === "daily-spin" ? "Daily spin" : "Levels"}
                      </p>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(event) => updateSlicedName(item.id, event.target.value)}
                        className="mt-2 w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-center text-sm text-raw-text outline-none focus:border-raw-gold/40"
                      />
                      <input
                        type="text"
                        value={item.price}
                        onChange={(event) => updateSlicedPrice(item.id, event.target.value)}
                        placeholder="Price (e.g. Free, 500 XP, $9.99)"
                        className="mt-2 w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-center text-sm text-raw-text outline-none focus:border-raw-gold/40"
                      />
                      <button
                        onClick={() => downloadAvatar(item)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-raw-border/25 px-2.5 py-2 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                      >
                        <Download className="h-3.5 w-3.5" /> Download PNG
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-raw-border/20 bg-raw-black/25 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Live avatar catalog</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void loadCatalog()}
                      disabled={isLoadingCatalog}
                      className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                    >
                      {isLoadingCatalog ? "Loading..." : catalogLoaded ? "Reload" : "Load catalog"}
                    </button>
                    <button
                      type="button"
                      onClick={addAvatarCatalogDraftItem}
                      disabled={!catalogLoaded}
                      className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                    >
                      + Add avatar
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveAvatarCatalogDraft()}
                      disabled={avatarCatalogDraft.length === 0 || isSavingAvatarCatalog}
                      className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                    >
                      {isSavingAvatarCatalog ? "Saving..." : "Save catalog"}
                    </button>
                  </div>
                </div>

                {!catalogLoaded ? (
                  <p className="mt-3 text-xs text-raw-silver/45">Click "Load catalog" to view and edit avatars.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {avatarCatalogDraft.map((item, index) => (
                      <div key={item.id} className="space-y-2">
                        {renderInsertPeek(index + 1)}
                        <div className={`grid gap-2 rounded-xl border bg-raw-black/30 p-2 sm:grid-cols-[72px_1fr_120px_120px_140px_92px] ${clampedPublishInsertAt === index + 1 ? "border-raw-gold/35" : "border-raw-border/20"}`}>
                          <img src={item.imageSrc || ""} alt={item.name} className="h-16 w-16 rounded-lg border border-raw-border/20 bg-raw-black/45 object-contain" />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => updateAvatarCatalogDraftItem(item.id, { name: event.target.value })}
                              className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                              placeholder="Avatar name"
                            />
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={item.imageSrc || ""}
                                onChange={(event) => updateAvatarCatalogDraftItem(item.id, { imageSrc: event.target.value })}
                                className="min-w-0 flex-1 rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                                placeholder="Image URL or paste data URL"
                              />
                              <label
                                className="flex cursor-pointer items-center justify-center rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2 text-raw-silver/60 transition hover:border-raw-gold/40 hover:text-raw-gold"
                                title="Upload image file"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={async (event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) return;
                                    event.target.value = "";
                                    // Convert to WebP via canvas before uploading
                                    const uploadBlob = await new Promise<Blob>((resolve) => {
                                      const img = new Image();
                                      const url = URL.createObjectURL(file);
                                      img.onload = () => {
                                        URL.revokeObjectURL(url);
                                        const canvas = document.createElement("canvas");
                                        canvas.width = img.naturalWidth;
                                        canvas.height = img.naturalHeight;
                                        canvas.getContext("2d")!.drawImage(img, 0, 0);
                                        canvas.toBlob((blob) => resolve(blob ?? file), "image/webp", 0.92);
                                      };
                                      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
                                      img.src = url;
                                    });
                                    const filePath = `catalog/cat-img-${item.id}-${Date.now()}.webp`;
                                    let uploaded = false;
                                    for (const bucket of AVATAR_STORAGE_BUCKET_CANDIDATES) {
                                      const { error } = await supabase.storage.from(bucket).upload(filePath, uploadBlob, {
                                        cacheControl: "31536000",
                                        contentType: "image/webp",
                                        upsert: true,
                                      });
                                      if (!error) {
                                        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
                                        if (data.publicUrl) {
                                          updateAvatarCatalogDraftItem(item.id, { imageSrc: data.publicUrl });
                                          uploaded = true;
                                          break;
                                        }
                                      }
                                    }
                                    if (!uploaded) {
                                      toast({ title: "Image upload failed", description: "Could not upload to storage." });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={item.price}
                            onChange={(event) => updateAvatarCatalogDraftItem(item.id, { price: event.target.value })}
                            className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                            placeholder="Price"
                          />
                          <input
                            type="text"
                            value={item.id}
                            onChange={(event) => updateAvatarCatalogDraftItem(item.id, { id: event.target.value || `avatar-${index + 1}` })}
                            className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                            placeholder="avatar-id"
                          />
                          <div className="flex flex-col gap-1">
                            <select
                              value={item.rarity ?? "common"}
                              onChange={(event) => updateAvatarCatalogDraftItem(item.id, { rarity: event.target.value as AvatarRarity })}
                              className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                              style={{ borderLeftColor: RARITY_CONFIG[item.rarity ?? "common"].color, borderLeftWidth: 3 }}
                            >
                              {RARITY_ORDER.map((r) => (
                                <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1">
                              <span className="shrink-0 text-[10px] text-raw-silver/45">1 in</span>
                              <input
                                type="number"
                                min={1}
                                value={item.dropWeight ?? 100}
                                onChange={(event) => updateAvatarCatalogDraftItem(item.id, { dropWeight: Math.max(1, Number(event.target.value) || 1) })}
                                className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2 py-1.5 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setPublishInsertAt(index + 1)}
                              className="inline-flex h-9 items-center justify-center rounded-lg border border-raw-border/25 px-2 text-[10px] text-raw-silver/60 hover:border-raw-gold/40 hover:text-raw-text"
                              title="Insert new sliced avatars before this row"
                            >
                              Insert here
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeAvatarCatalogDraftItem(item.id)}
                              disabled={isSavingAvatarCatalog}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-raw-border/25 text-raw-silver/55 hover:border-red-400/40 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {renderInsertPeek(avatarCatalogDraft.length + 1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-raw-gold/70" />
              <div>
                <h2 className="font-display text-xl tracking-wide">Show More avatars</h2>
                <p className="mt-1 text-sm text-raw-silver/45">These avatars appear in the "Show More" drop-down panel on the landing page.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadNewAvatarsFromSupabase}
                className="rounded-lg border border-raw-border/25 px-3 py-1.5 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={saveNewAvatarsDraft}
                disabled={isSavingNewAvatars}
                className="rounded-lg border border-raw-gold/40 bg-raw-gold/10 px-3 py-1.5 text-xs font-semibold text-raw-gold hover:bg-raw-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingNewAvatars ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Add new entry */}
            <div className="rounded-xl border border-raw-border/20 bg-raw-black/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Add new avatar</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.5fr_auto_auto]">
                <input
                  type="text"
                  value={newAvatarName}
                  onChange={(e) => setNewAvatarName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewAvatar()}
                  className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={newAvatarImageSrc}
                  onChange={(e) => setNewAvatarImageSrc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewAvatar()}
                  className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                  placeholder="Image URL"
                />
                <label
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2 text-raw-silver/60 transition hover:border-raw-gold/40 hover:text-raw-gold"
                  title="Upload image"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setNewAvatarImageSrc(String(reader.result));
                      reader.readAsDataURL(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={addNewAvatar}
                  className="rounded-lg border border-raw-border/25 px-3 py-2 text-xs text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Avatar list */}
            {newAvatarsDraft.length === 0 ? (
              <div className="rounded-xl border border-raw-border/20 bg-raw-black/40 p-4 text-sm text-raw-silver/45">
                No avatars yet. Add one above and click Save.
              </div>
            ) : (
              <div className="space-y-2">
                {newAvatarsDraft.map((item) => (
                  <div
                    key={item.id}
                    className="grid items-center gap-2 rounded-xl border border-raw-border/20 bg-raw-black/30 p-2 sm:grid-cols-[52px_1fr_1.5fr_auto]"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-raw-border/25 bg-raw-black/50">
                      {item.imageSrc && <img src={item.imageSrc} alt={item.name} className="h-full w-full object-cover" />}
                    </div>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => setNewAvatarsDraft((prev) => prev.map((a) => a.id === item.id ? { ...a, name: e.target.value } : a))}
                      className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={item.imageSrc}
                      onChange={(e) => setNewAvatarsDraft((prev) => prev.map((a) => a.id === item.id ? { ...a, imageSrc: e.target.value } : a))}
                      className="rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                      placeholder="Image URL"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewAvatar(item.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-raw-border/25 text-raw-silver/55 hover:border-red-400/40 hover:text-red-300"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-raw-silver/30">
              Run in Supabase SQL editor before first use:{" "}
              <code className="rounded bg-raw-surface/30 px-1 text-raw-silver/50">
                CREATE TABLE landing_new_avatars (id text PRIMARY KEY, name text NOT NULL, image_src text NOT NULL DEFAULT &apos;&apos;, position integer NOT NULL DEFAULT 0);
              </code>
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Screenshot reports</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Review user-submitted screenshots and issue notes from the dashboard menu.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {issueReports.length === 0 ? (
              <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">No screenshot reports yet.</div>
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
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
                      report.status === "open"
                        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                        : report.status === "reviewed"
                          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                          : "border-raw-border/30 bg-raw-surface/20 text-raw-silver/60"
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  {report.screenshotDataUrl ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-raw-border/20 bg-raw-surface/20">
                      <img src={report.screenshotDataUrl} alt={report.screenshotName ?? "Reported screenshot"} className="max-h-[420px] w-full object-contain" />
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4 text-sm text-raw-silver/45">
                      No screenshot attached.
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Reporter note</p>
                      <p className="mt-2 text-sm text-raw-silver/60">{report.details || "No extra context provided."}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-raw-silver/35">Page</p>
                      <p className="mt-2 break-all text-sm text-raw-silver/60">{report.pageUrl || "Unknown page"}</p>
                    </div>
                  </div>

                  {report.status === "open" ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button onClick={() => handleIssueReportStatus(report.id, "dismissed")} variant="outline" className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text">
                        <XCircle className="h-4 w-4" /> Dismiss
                      </Button>
                      <Button onClick={() => handleIssueReportStatus(report.id, "reviewed")} className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90">
                        <CheckCircle2 className="h-4 w-4" /> Mark reviewed
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

        <section className="rounded-2xl border border-raw-border/30 bg-raw-surface/20 p-4 sm:rounded-3xl sm:p-6">
          <div className="flex items-center gap-3">
            <Flag className="h-5 w-5 text-raw-gold/70" />
            <div>
              <h2 className="font-display text-xl tracking-wide">Chat reports</h2>
              <p className="mt-1 text-sm text-raw-silver/45">Review reported chat messages, then dismiss, warn, or ban after moderation review.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {chatReports.length === 0 ? (
              <div className="rounded-2xl border border-raw-border/20 bg-raw-black/35 p-4 text-sm text-raw-silver/45">No reports in the queue yet.</div>
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
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${
                      report.status === "open"
                        ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                        : report.status === "dismissed"
                          ? "border-raw-border/30 bg-raw-surface/20 text-raw-silver/60"
                          : report.status === "warned"
                            ? "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
                            : "border-red-400/20 bg-red-500/10 text-red-200"
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4 text-sm text-raw-silver/55">
                    “{report.messageText}”
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
                      <Button onClick={() => handleModeration(report.id, "dismissed")} variant="outline" className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text">
                        <XCircle className="h-4 w-4" /> Dismiss
                      </Button>
                      <Button onClick={() => handleModeration(report.id, "warned")} className="rounded-xl bg-amber-400 px-4 text-raw-ink hover:bg-amber-300">
                        <BellRing className="h-4 w-4" /> Warn user
                      </Button>
                      <Button onClick={() => handleModeration(report.id, "banned")} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
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
      </main>
    </div>
  );
}
