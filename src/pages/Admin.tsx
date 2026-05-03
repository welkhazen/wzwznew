import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Ban, BellRing, CheckCircle2, Copy, Database, Download, Flag, Lock, Plus, Scissors, Shield, Trash2, Upload, Users, XCircle } from "lucide-react";
import { fetchPollsFromSupabase, insertPollToSupabase, deletePollFromSupabase, testSupabaseConnection } from "@/lib/supabasePolls";
import { fetchCommunityRequests, updateCommunityRequestStatus } from "@/backend/supabase/controllers/communityRequestController";
import { createCommunityFromRequest } from "@/backend/supabase/controllers/communityController";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useRawStore } from "@/store/useRawStore";
import { track } from "@/lib/analytics";
import { type AvatarCatalogItem, loadAvatarCatalog, saveAvatarCatalog } from "@/lib/avatarCatalog";
import {
  createAdminPoll,
  deleteAdminPoll,
  formatAdminTimestamp,
  readAdminPolls,
  readChatReports,
  readCommunityJoinRequests,
  readCommunityRequests,
  readPersistedUsers,
  updateUserModerationStatus,
  writeChatReports,
  writeCommunityJoinRequests,
  writeCommunityRequests,
  type AdminPollRecord,
  type ChatReportRecord,
  type CommunityJoinRequestRecord,
  type CommunityRequestRecord,
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
};

const MAX_SHEET_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SLICE_CELLS = 100;

export default function Admin() {
  const { user, isLoggedIn, isAdmin, sessionLoaded, logout } = useRawStore();
  const [users, setUsers] = useState<PersistedUserRecord[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequestRecord[]>([]);
  const [chatReports, setChatReports] = useState<ChatReportRecord[]>([]);
  const [communityJoinRequests, setCommunityJoinRequests] = useState<CommunityJoinRequestRecord[]>([]);
  const [adminPolls, setAdminPolls] = useState<AdminPollRecord[]>([]);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [supabaseStatus, setSupabaseStatus] = useState<"idle" | "ok" | "error">("idle");
  const [supabaseMessage, setSupabaseMessage] = useState("");
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
  const sheetPreviewUrlRef = useRef<string | null>(null);
  const slicedAvatarsRef = useRef<SlicedAvatarItem[]>([]);
  const assetsDirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const gapMeasureRequestIdRef = useRef(0);

  const revokeSlicedAvatarUrls = useCallback((items: SlicedAvatarItem[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.imageUrl));
  }, []);

  const refreshAdminData = useCallback(async () => {
    setUsers(readPersistedUsers());
    setChatReports(readChatReports());
    setCommunityJoinRequests(readCommunityJoinRequests());
    try {
      const requests = await fetchCommunityRequests();
      setCommunityRequests(requests);
    } catch {
      setCommunityRequests(readCommunityRequests());
    }
  }, []);

  const loadPolls = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    refreshAdminData();
    loadPolls();
    window.addEventListener("focus", refreshAdminData);

    return () => {
      window.removeEventListener("focus", refreshAdminData);
    };
  }, [refreshAdminData, loadPolls]);

  useEffect(() => {
    void (async () => {
      const catalog = await loadAvatarCatalog();
      setAvatarCatalogDraft(catalog);
    })();
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
          });
        }
      }

      URL.revokeObjectURL(sourceUrl);
      setSlicedAvatars((previous) => {
        revokeSlicedAvatarUrls(previous);
        return output;
      });
      toast({
        title: "Sheet sliced",
        description: `${output.length} avatars generated`,
      });
    } catch (error) {
      console.error("Image slicing failed", error);
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

  const removeAvatarCatalogDraftItem = (id: string) => {
    setAvatarCatalogDraft((previous) => {
      const filtered = previous.filter((item) => item.id !== id);
      return filtered.map((item, index) => ({ ...item, level: index + 1 }));
    });
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
      const saved = await saveAvatarCatalog(normalized);
      setAvatarCatalogDraft(saved);
      toast({ title: "Avatar catalog saved", description: `${saved.length} avatars are now live.` });
    } catch {
      toast({ title: "Could not save catalog", description: "Please try again." });
    } finally {
      setIsSavingAvatarCatalog(false);
    }
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read avatar image"));
      reader.readAsDataURL(blob);
    });
  };

  const publishSlicedAvatarsToCatalog = async () => {
    if (slicedAvatars.length === 0) {
      toast({ title: "Slice avatars first" });
      return;
    }

    setIsSavingAvatarCatalog(true);
    try {
      const next: AvatarCatalogItem[] = [];

      for (let index = 0; index < slicedAvatars.length; index += 1) {
        const item = slicedAvatars[index];
        const theme = getAvatar(index + 1);
        const imageSrc = await blobToDataUrl(item.blob);
        const safeId = (item.name || item.id)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || `avatar-${index + 1}`;

        next.push({
          id: safeId,
          level: index + 1,
          name: item.name.trim() || `Avatar ${index + 1}`,
          price: item.price.trim() || "0",
          imageSrc,
          bg: theme.bg,
          figure: theme.figure,
          ring: theme.ring,
          glow: theme.glow,
          isActive: true,
        });
      }

      const saved = await saveAvatarCatalog(next);
      setAvatarCatalogDraft(saved);
      toast({ title: "Avatars published", description: `${saved.length} avatars are now in catalog.` });
    } catch {
      toast({ title: "Could not publish avatars", description: "Try again after slicing." });
    } finally {
      setIsSavingAvatarCatalog(false);
    }
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <SummaryCard label="Users" value={users.length} hint="All locally registered accounts, including admin and reported aliases." />
          <SummaryCard label="Pending Requests" value={pendingRequests.length} hint="Community creation requests waiting for admin approval." />
          <SummaryCard label="Join Requests" value={pendingJoinRequests.length} hint="Pending requests to join locked communities." />
          <SummaryCard label="Open Reports" value={openReports.length} hint="Chat reports still awaiting a moderation decision." />
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
                    disabled={slicedAvatars.length === 0 || isSavingAvatarCatalog}
                    className="inline-flex items-center gap-2 rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text disabled:opacity-40"
                  >
                    <Database className="h-3.5 w-3.5" /> {isSavingAvatarCatalog ? "Publishing..." : "Publish to live catalog"}
                  </button>
                </div>
              </div>
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
                      onClick={addAvatarCatalogDraftItem}
                      className="rounded-lg border border-raw-border/25 px-2.5 py-1.5 text-[11px] text-raw-silver/65 hover:border-raw-gold/40 hover:text-raw-text"
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

                {avatarCatalogDraft.length === 0 ? (
                  <p className="mt-3 text-xs text-raw-silver/45">No avatars in catalog yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {avatarCatalogDraft.map((item, index) => (
                      <div key={item.id} className="grid gap-2 rounded-xl border border-raw-border/20 bg-raw-black/30 p-2 sm:grid-cols-[72px_1fr_120px_120px_40px]">
                        <img src={item.imageSrc || ""} alt={item.name} className="h-16 w-16 rounded-lg border border-raw-border/20 bg-raw-black/45 object-contain" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(event) => updateAvatarCatalogDraftItem(item.id, { name: event.target.value })}
                            className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-sm text-raw-text outline-none focus:border-raw-gold/40"
                            placeholder="Avatar name"
                          />
                          <input
                            type="text"
                            value={item.imageSrc || ""}
                            onChange={(event) => updateAvatarCatalogDraftItem(item.id, { imageSrc: event.target.value })}
                            className="w-full rounded-lg border border-raw-border/25 bg-raw-surface/20 px-2.5 py-2 text-xs text-raw-text outline-none focus:border-raw-gold/40"
                            placeholder="Image URL or data URL"
                          />
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
                        <button
                          type="button"
                          onClick={() => removeAvatarCatalogDraftItem(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-raw-border/25 text-raw-silver/55 hover:border-red-400/40 hover:text-red-300"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
