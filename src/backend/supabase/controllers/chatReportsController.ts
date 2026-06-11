import { supabase } from "@/backend/supabase/client";
import type { ChatReportRecord, ChatReportStatus } from "@/lib/adminData";

interface ChatReportRow {
  id: string;
  community_id: string | null;
  community_title: string | null;
  message_id: string | null;
  message_text: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  reported_user_id: string | null;
  reported_username: string | null;
  reason: string;
  details: string | null;
  status: ChatReportStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

function rowToRecord(row: ChatReportRow): ChatReportRecord {
  return {
    id: row.id,
    communityId: row.community_id ?? "",
    communityTitle: row.community_title ?? "",
    messageId: row.message_id ?? "",
    messageText: row.message_text ?? "",
    reporterId: row.reporter_id ?? "",
    reporterName: row.reporter_name ?? "",
    reportedUserId: row.reported_user_id ?? "",
    reportedUsername: row.reported_username ?? "",
    reason: row.reason,
    details: row.details ?? "",
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
  };
}

export async function submitChatReport(
  input: Omit<ChatReportRecord, "id" | "createdAt" | "status">,
): Promise<ChatReportRecord> {
  const { data, error } = await supabase
    .from("chat_reports")
    .insert({
      community_id: input.communityId,
      community_title: input.communityTitle,
      message_id: input.messageId,
      message_text: input.messageText,
      reporter_id: input.reporterId || null,
      reporter_name: input.reporterName,
      reported_user_id: input.reportedUserId || null,
      reported_username: input.reportedUsername,
      reason: input.reason,
      details: input.details,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to submit report");
  return rowToRecord(data as ChatReportRow);
}

export async function listChatReports(): Promise<ChatReportRecord[]> {
  const { data, error } = await supabase
    .from("chat_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((row) => rowToRecord(row as ChatReportRow));
}

export async function updateChatReportStatus(
  reportId: string,
  status: Exclude<ChatReportStatus, "open">,
  resolvedBy: string,
): Promise<ChatReportRecord> {
  const { data, error } = await supabase
    .from("chat_reports")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq("id", reportId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update report");
  return rowToRecord(data as ChatReportRow);
}

export async function applyUserModeration(
  userId: string,
  status: "warned" | "banned",
  moderatedBy: string,
): Promise<void> {
  const patch: Record<string, unknown> = {
    moderation_status: status,
    moderated_by: moderatedBy,
    last_moderated_at: new Date().toISOString(),
  };
  if (status === "warned") {
    const { data } = await supabase.from("users").select("warnings").eq("id", userId).single();
    patch.warnings = ((data as { warnings?: number } | null)?.warnings ?? 0) + 1;
  }
  const { error } = await supabase.from("users").update(patch).eq("id", userId);
  if (error) throw error;
}

export function subscribeToChatReports(onChange: () => void): () => void {
  const channel = supabase
    .channel("chat-reports-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "chat_reports" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
