import { supabaseServerClient } from "../_lib/supabaseServerClient";

export const config = { runtime: "edge" };

const supabase = supabaseServerClient;

const statuses = new Set(["open", "dismissed", "reviewed"]);
const MAX_SCREENSHOT_LENGTH = 3_000_000;

type IssueReportPayload = {
  reporterId?: unknown;
  reporterName?: unknown;
  issueType?: unknown;
  details?: unknown;
  screenshotDataUrl?: unknown;
  screenshotName?: unknown;
  pageUrl?: unknown;
  userAgent?: unknown;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function mapReport(row: Record<string, unknown>) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    issueType: row.issue_type,
    details: row.details,
    screenshotDataUrl: row.screenshot_data_url ?? undefined,
    screenshotName: row.screenshot_name ?? undefined,
    pageUrl: row.page_url,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    status: row.status,
    resolvedAt: row.resolved_at ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
  };
}

export default async function handler(request: Request): Promise<Response> {
  if (!supabase) {
    return json({ error: "supabase_not_configured" }, 503);
  }

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("issue_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return json({ error: "failed_to_load_issue_reports" }, 500);
    }

    return json({ reports: (data ?? []).map((row) => mapReport(row as Record<string, unknown>)) });
  }

  if (request.method === "POST") {
    let body: IssueReportPayload;
    try {
      body = (await request.json()) as IssueReportPayload;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const reporterId = cleanString(body.reporterId, 120);
    const reporterName = cleanString(body.reporterName, 80);
    const issueType = cleanString(body.issueType, 80);
    const details = cleanString(body.details, 2000);
    const screenshotDataUrl = cleanString(body.screenshotDataUrl, MAX_SCREENSHOT_LENGTH);

    if (!reporterId || !reporterName || !issueType || (!details && !screenshotDataUrl)) {
      return json({ error: "invalid_issue_report" }, 400);
    }

    const { data, error } = await supabase
      .from("issue_reports")
      .insert({
        reporter_id: reporterId,
        reporter_name: reporterName,
        issue_type: issueType,
        details,
        screenshot_data_url: screenshotDataUrl || null,
        screenshot_name: cleanString(body.screenshotName, 180) || null,
        page_url: cleanString(body.pageUrl, 500),
        user_agent: cleanString(body.userAgent, 500),
      })
      .select("*")
      .single();

    if (error || !data) {
      return json({ error: "failed_to_create_issue_report" }, 500);
    }

    return json({ report: mapReport(data as Record<string, unknown>) }, 201);
  }

  if (request.method === "PATCH") {
    let body: { id?: unknown; status?: unknown; resolvedBy?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const id = cleanString(body.id, 80);
    const status = cleanString(body.status, 20);
    if (!id || !statuses.has(status) || status === "open") {
      return json({ error: "invalid_issue_report_status" }, 400);
    }

    const { data, error } = await supabase
      .from("issue_reports")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: cleanString(body.resolvedBy, 80) || "admin",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return json({ error: "failed_to_update_issue_report" }, 500);
    }

    return json({ report: mapReport(data as Record<string, unknown>) });
  }

  return json({ error: "method_not_allowed" }, 405);
}
