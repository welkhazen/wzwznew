import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CommunityChatMessageRecord } from "@/lib/communityChat.types";

export interface ReportDraft {
  reason: string;
  details: string;
}

export interface ReportTarget {
  communityId: string;
  communityTitle: string;
  message: CommunityChatMessageRecord;
}

interface CommunityReportDialogProps {
  open: boolean;
  target: ReportTarget | null;
  draft: ReportDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: ReportDraft) => void;
  onSubmit: () => void;
}

export function CommunityReportDialog({
  open,
  target,
  draft,
  onOpenChange,
  onDraftChange,
  onSubmit,
}: CommunityReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {target && (
            <div className="rounded-2xl border border-raw-border/20 bg-raw-surface/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/35">Message under review</p>
              <p className="mt-2 font-display text-sm text-raw-text">{target.message.senderName}</p>
              <p className="mt-2 text-sm leading-relaxed text-raw-silver/55">{target.message.text}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Why should this be reviewed?</label>
            <Input
              value={draft.reason}
              onChange={(event) => onDraftChange({ ...draft, reason: event.target.value })}
              placeholder="Spam, harassment, harmful content, impersonation..."
              className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Extra context</label>
            <Textarea
              value={draft.details}
              onChange={(event) => onDraftChange({ ...draft, details: event.target.value })}
              placeholder="Optional: explain what happened so the moderation team can review faster."
              className="min-h-[110px] rounded-2xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-raw-border/20 px-6 py-5 sm:justify-between">
          <p className="text-xs leading-relaxed text-raw-silver/40">Reports are stored for moderation review.</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} className="rounded-xl bg-red-400 px-4 text-raw-ink hover:bg-red-300">
              Submit report
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
