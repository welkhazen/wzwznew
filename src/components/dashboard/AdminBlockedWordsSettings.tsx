import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  addBlockedWord,
  fetchBlockedWords,
  removeBlockedWord,
  type BlockedWordRecord,
} from "@/lib/api/blockedWords";

type SaveState = "idle" | "saving" | "saved" | "error";

export function AdminBlockedWordsSettings() {
  const { toast } = useToast();
  const [blockedWords, setBlockedWords] = useState<BlockedWordRecord[]>([]);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadBlockedWords() {
    setLoading(true);
    setLoadError("");
    try {
      setBlockedWords(await fetchBlockedWords());
    } catch {
      setLoadError("Could not load blocked words. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBlockedWords();
  }, []);

  async function handleSave() {
    const nextTerm = term.trim();
    if (!nextTerm) {
      setSaveState("error");
      toast({ title: "Add a blocked word", description: "Enter a word or phrase before saving." });
      return;
    }

    setSaveState("saving");
    try {
      const saved = await addBlockedWord(nextTerm);
      setBlockedWords((current) => {
        const withoutDuplicate = current.filter((word) => word.id !== saved.id);
        return [...withoutDuplicate, saved].sort((a, b) => a.normalizedTerm.localeCompare(b.normalizedTerm));
      });
      setTerm("");
      setSaveState("saved");
      toast({ title: "Blocked word saved", description: `"${saved.term}" is now managed by admin.` });
    } catch {
      setSaveState("error");
      toast({ title: "Could not save blocked word", description: "Please try again." });
    }
  }

  async function handleRemove(word: BlockedWordRecord) {
    setRemovingId(word.id);
    try {
      await removeBlockedWord(word.id);
      setBlockedWords((current) => current.filter((item) => item.id !== word.id));
      toast({ title: "Blocked word removed", description: `"${word.term}" is no longer blocked by admin.` });
    } catch {
      toast({ title: "Could not remove blocked word", description: "Please try again." });
    } finally {
      setRemovingId(null);
    }
  }

  const saveDisabled = saveState === "saving" || !term.trim();

  return (
    <div className="overflow-hidden rounded-2xl border border-raw-border/30 bg-raw-surface/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-raw-border/20 px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-raw-text">Blocked words</p>
          <p className="mt-1 text-xs text-raw-silver/40">Manage global terms blocked by admin moderation.</p>
        </div>
        <button
          type="button"
          onClick={() => { void loadBlockedWords(); }}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-raw-border/30 bg-raw-black/30 text-raw-silver/70 transition-colors hover:text-raw-gold disabled:opacity-40"
          aria-label="Refresh blocked words"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-4 px-4 pb-4 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              if (saveState !== "saving") setSaveState("idle");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !saveDisabled) {
                event.preventDefault();
                void handleSave();
              }
            }}
            placeholder="Word or phrase"
            className="min-h-11 flex-1 rounded-xl border border-raw-border/30 bg-raw-black/40 px-3 text-sm text-raw-text placeholder:text-raw-silver/25 focus:border-raw-gold/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => { void handleSave(); }}
            disabled={saveDisabled}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-raw-gold px-4 text-sm font-semibold text-raw-ink transition-opacity disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Save word
          </button>
        </div>

        <div aria-live="polite" className="min-h-5 text-xs text-raw-silver/50">
          {saveState === "saving" && "Saving blocked word..."}
          {saveState === "saved" && "Saved. The list is up to date."}
          {saveState === "error" && "Could not complete that change."}
          {loadError && <span className="text-red-300">{loadError}</span>}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-raw-border/25 bg-raw-surface/20 px-4 py-6 text-center text-sm text-raw-silver/40">
            Loading blocked words...
          </div>
        ) : blockedWords.length === 0 ? (
          <div className="rounded-2xl border border-raw-border/25 bg-raw-surface/20 px-4 py-6 text-center text-sm text-raw-silver/40">
            No blocked words saved yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {blockedWords.map((word) => (
              <li
                key={word.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-raw-border/25 bg-raw-surface/25 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-raw-text">{word.term}</p>
                  <p className="mt-0.5 text-xs text-raw-silver/35">Saved {new Date(word.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { void handleRemove(word); }}
                  disabled={removingId === word.id}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/15 disabled:opacity-40"
                  aria-label={`Remove ${word.term}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
