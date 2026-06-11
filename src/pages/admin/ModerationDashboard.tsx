import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/providers/useTheme";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: string;
  community_title: string | null;
  message_text: string | null;
  reporter_name: string | null;
  reported_username: string | null;
  reason: string;
  details: string | null;
  created_at: string;
};

type Flag = {
  id: string;
  verdict: string;
  reason: string;
  matched_word: string | null;
  created_at: string;
  community_messages: {
    id: string;
    text: string;
    sender_name: string;
    community_id: string;
  } | null;
};

type BannedWord = {
  id: string;
  word: string;
  action: string;
  category: string;
  created_at: string;
};

type Tab = "reports" | "flags" | "words";

export default function ModerationDashboard() {
  const { mode } = useTheme();
  const { toast } = useToast();
  const isLight = mode === "light";

  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newWordAction, setNewWordAction] = useState<"warn" | "hold" | "block">("block");

  const bg = isLight ? "#fff" : "rgb(var(--raw-black))";
  const cardBg = isLight ? "#faf6e8" : "rgba(255,255,255,0.04)";
  const border = isLight ? "rgba(180,140,0,0.2)" : "rgba(255,255,255,0.08)";

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === "reports") {
        const res = await fetch("/api/moderation/reports", { credentials: "same-origin" });
        if (res.ok) setReports((await res.json()).reports);
      } else if (t === "flags") {
        const res = await fetch("/api/moderation/flags", { credentials: "same-origin" });
        if (res.ok) setFlags((await res.json()).flags);
      } else {
        const res = await fetch("/api/moderation/banned-words", { credentials: "same-origin" });
        if (res.ok) setWords((await res.json()).words);
      }
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void fetchTab(tab); }, [tab, fetchTab]);

  async function resolveReport(id: string, status: string, deleteMessage = false) {
    const res = await fetch(`/api/moderation/reports/${id}/resolve`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, deleteMessage }),
    });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast({ title: `Report ${status}` });
    } else {
      toast({ title: "Action failed", variant: "destructive" });
    }
  }

  async function approveFlag(id: string) {
    const res = await fetch(`/api/moderation/flags/${id}/approve`, {
      method: "POST", credentials: "same-origin",
    });
    if (res.ok) {
      setFlags((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Message approved" });
    }
  }

  async function removeFlag(id: string) {
    const res = await fetch(`/api/moderation/flags/${id}/remove`, {
      method: "POST", credentials: "same-origin",
    });
    if (res.ok) {
      setFlags((prev) => prev.filter((f) => f.id !== id));
      toast({ title: "Message removed" });
    }
  }

  async function addBannedWord() {
    if (!newWord.trim()) return;
    const res = await fetch("/api/moderation/banned-words", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: newWord.trim(), action: newWordAction, category: "general" }),
    });
    if (res.ok) {
      setNewWord("");
      void fetchTab("words");
      toast({ title: "Word added" });
    } else {
      const body = await res.json().catch(() => ({}));
      toast({ title: (body as { error?: string }).error ?? "Failed to add word", variant: "destructive" });
    }
  }

  async function deleteWord(id: string) {
    const res = await fetch(`/api/moderation/banned-words/${id}`, {
      method: "DELETE", credentials: "same-origin",
    });
    if (res.ok) {
      setWords((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Word removed" });
    }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: bg }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl text-raw-gold tracking-wide">Moderation Dashboard</h1>
          <Link to="/dashboard" className="text-sm text-raw-silver/60 hover:text-raw-gold transition">
            ← Dashboard
          </Link>
        </div>

        <div className="mb-6 flex gap-2 border-b" style={{ borderColor: border }}>
          {(["reports", "flags", "words"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
                tab === t
                  ? "border-raw-gold text-raw-gold"
                  : "border-transparent text-raw-silver/60 hover:text-raw-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-raw-silver/50">Loading…</p>}

        {/* Reports */}
        {tab === "reports" && !loading && (
          <div className="space-y-3">
            {reports.length === 0 && <p className="text-sm text-raw-silver/50">No open reports.</p>}
            {reports.map((r) => (
              <div key={r.id} className="rounded-xl border p-4" style={{ background: cardBg, borderColor: border }}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-raw-gold/70 uppercase tracking-wide">{r.reason}</p>
                    <p className="text-sm text-raw-text mt-0.5">{r.message_text ?? "(no message)"}</p>
                    <p className="text-xs text-raw-silver/50 mt-1">
                      {r.reporter_name} reported {r.reported_username} · {r.community_title}
                    </p>
                    {r.details && <p className="text-xs text-raw-silver/40 mt-0.5">{r.details}</p>}
                  </div>
                  <span className="text-xs text-raw-silver/40 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => resolveReport(r.id, "dismissed")} className="rounded border border-raw-border/30 px-3 py-1 text-xs hover:bg-white/5 transition">Dismiss</button>
                  <button onClick={() => resolveReport(r.id, "reviewed")} className="rounded border border-blue-500/40 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/10 transition">Mark reviewed</button>
                  <button onClick={() => resolveReport(r.id, "warned")} className="rounded border border-yellow-500/40 px-3 py-1 text-xs text-yellow-400 hover:bg-yellow-500/10 transition">Warn user</button>
                  <button onClick={() => resolveReport(r.id, "banned")} className="rounded border border-red-500/40 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition">Ban user</button>
                  <button onClick={() => resolveReport(r.id, "reviewed", true)} className="rounded border border-orange-500/40 px-3 py-1 text-xs text-orange-400 hover:bg-orange-500/10 transition">Delete message</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Flags */}
        {tab === "flags" && !loading && (
          <div className="space-y-3">
            {flags.length === 0 && <p className="text-sm text-raw-silver/50">No pending flags.</p>}
            {flags.map((f) => (
              <div key={f.id} className="rounded-xl border p-4" style={{ background: cardBg, borderColor: border }}>
                <div className="mb-2">
                  <span className={`text-xs uppercase font-semibold ${f.verdict === "hold" ? "text-yellow-400" : "text-red-400"}`}>{f.verdict}</span>
                  {f.matched_word && <span className="text-xs text-raw-silver/50 ml-2">matched: "{f.matched_word}"</span>}
                  <p className="text-sm text-raw-text mt-1">{f.community_messages?.text ?? "(deleted)"}</p>
                  <p className="text-xs text-raw-silver/50 mt-0.5">by {f.community_messages?.sender_name ?? "unknown"}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approveFlag(f.id)} className="rounded border border-green-500/40 px-3 py-1 text-xs text-green-400 hover:bg-green-500/10 transition">Approve</button>
                  <button onClick={() => removeFlag(f.id)} className="rounded border border-red-500/40 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition">Remove message</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Banned words */}
        {tab === "words" && !loading && (
          <div>
            <div className="mb-4 flex gap-2">
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="New word or phrase…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm bg-transparent text-raw-text placeholder:text-raw-silver/40"
                style={{ borderColor: border }}
                onKeyDown={(e) => { if (e.key === "Enter") void addBannedWord(); }}
              />
              <select
                value={newWordAction}
                onChange={(e) => setNewWordAction(e.target.value as "warn" | "hold" | "block")}
                className="rounded-lg border px-3 py-2 text-sm bg-transparent text-raw-text"
                style={{ borderColor: border }}
              >
                <option value="warn">warn</option>
                <option value="hold">hold</option>
                <option value="block">block</option>
              </select>
              <button
                onClick={addBannedWord}
                className="rounded-lg border border-raw-gold/40 px-4 py-2 text-sm text-raw-gold hover:bg-raw-gold/10 transition"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {words.length === 0 && <p className="text-sm text-raw-silver/50">No banned words.</p>}
              {words.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border px-4 py-2" style={{ background: cardBg, borderColor: border }}>
                  <div>
                    <span className="text-sm text-raw-text font-mono">{w.word}</span>
                    <span className={`ml-3 text-xs ${w.action === "block" ? "text-red-400" : w.action === "hold" ? "text-yellow-400" : "text-blue-400"}`}>{w.action}</span>
                    <span className="ml-2 text-xs text-raw-silver/40">{w.category}</span>
                  </div>
                  <button onClick={() => deleteWord(w.id)} className="text-xs text-raw-silver/40 hover:text-red-400 transition">remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
