import { supabaseAdmin } from "./supabaseClient";

type AuditLevel = "info" | "warn";

export function audit(event: string, payload: Record<string, unknown>, level: AuditLevel = "info") {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }

  if (supabaseAdmin) {
    supabaseAdmin
      .from("audit_logs")
      .insert({ event, level, payload, occurred_at: entry.ts })
      .then(({ error }) => {
        if (error) console.error("[audit] failed to persist:", error.message);
      });
  }
}
