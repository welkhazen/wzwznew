import { ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CommunityRequestDraft {
  communityName: string;
  genre: string;
  focusArea: string;
  audience: string;
  whyNow: string;
  samplePrompt: string;
}

interface CommunityRequestDialogProps {
  open: boolean;
  draft: CommunityRequestDraft;
  submitAttempted: boolean;
  username: string;
  onOpenChange: (open: boolean) => void;
  onSubmitAttemptedChange: (submitAttempted: boolean) => void;
  onDraftFieldChange: <K extends keyof CommunityRequestDraft>(field: K, value: CommunityRequestDraft[K]) => void;
  onSubmit: () => void;
}

export function CommunityRequestDialog({
  open,
  draft,
  submitAttempted,
  username,
  onOpenChange,
  onSubmitAttemptedChange,
  onDraftFieldChange,
  onSubmit,
}: CommunityRequestDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) onSubmitAttemptedChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent bottomSheet className="flex flex-col bg-raw-black p-0 text-raw-text border-raw-border/40">
        {/* Header â€” fixed */}
        <div className="shrink-0 border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-5 py-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-lg tracking-wide text-raw-text">Request a new community</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-raw-silver/45">
              Goes to admin review. Approved requests become live in-app communities.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                Community name <span className="text-primary">*</span>
              </label>
              <Input
                value={draft.communityName}
                onChange={(event) => onDraftFieldChange("communityName", event.target.value)}
                placeholder="Creator Burnout Circle"
                className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${submitAttempted && !draft.communityName.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
              />
              {submitAttempted && !draft.communityName.trim() && (
                <p className="text-[11px] text-primary/80">Required</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                Genre <span className="text-primary">*</span>
              </label>
              <Input
                value={draft.genre}
                onChange={(event) => onDraftFieldChange("genre", event.target.value)}
                placeholder="e.g. Mental Health, Tech, Sports"
                className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${submitAttempted && !draft.genre.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
              />
              {submitAttempted && !draft.genre.trim() && (
                <p className="text-[11px] text-primary/80">Required</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
                Focus area <span className="text-primary">*</span>
              </label>
              <Input
                value={draft.focusArea}
                onChange={(event) => onDraftFieldChange("focusArea", event.target.value)}
                placeholder="Theme this room centers on"
                className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${submitAttempted && !draft.focusArea.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
              />
              {submitAttempted && !draft.focusArea.trim() && (
                <p className="text-[11px] text-primary/80">Required</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
              Who is this for? <span className="text-primary">*</span>
            </label>
            <Input
              value={draft.audience}
              onChange={(event) => onDraftFieldChange("audience", event.target.value)}
              placeholder="Who would join and benefit?"
              className={`h-10 rounded-xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${submitAttempted && !draft.audience.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
            />
            {submitAttempted && !draft.audience.trim() && (
              <p className="text-[11px] text-primary/80">Required</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">
              Why should admin approve it? <span className="text-primary">*</span>
            </label>
            <Textarea
              value={draft.whyNow}
              onChange={(event) => onDraftFieldChange("whyNow", event.target.value)}
              placeholder="Explain the need and what conversations it unlocks."
              className={`min-h-[90px] rounded-2xl bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25 ${submitAttempted && !draft.whyNow.trim() ? "border-primary/60 focus-visible:ring-primary/30" : "border-raw-border/30"}`}
            />
            {submitAttempted && !draft.whyNow.trim() && (
              <p className="text-[11px] text-primary/80">Required</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Sample opening prompt</label>
            <Textarea
              value={draft.samplePrompt}
              onChange={(event) => onDraftFieldChange("samplePrompt", event.target.value)}
              placeholder="Optional: opening topic that sets the tone."
              className="min-h-[72px] rounded-2xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Community image / video</label>
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-raw-border/35 bg-raw-surface/20 px-4 py-4 text-sm text-raw-silver/35 cursor-not-allowed"
            >
              <ImagePlus className="h-4 w-4 shrink-0" />
              <span>Upload <span className="text-[10px] uppercase tracking-wider text-raw-silver/25 ml-1">Coming soon</span></span>
            </button>
          </div>
        </div>

        {/* Footer â€” sticky */}
        <div className="shrink-0 border-t border-raw-border/20 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-raw-silver/40">Requesting as @{username}.</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => { onOpenChange(false); onSubmitAttemptedChange(false); }}
              className="flex-1 sm:flex-none rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              className="flex-1 sm:flex-none rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90"
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
