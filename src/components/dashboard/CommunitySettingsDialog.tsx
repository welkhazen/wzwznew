import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CommunitySettingsDraft {
  title: string;
  logoUrl: string;
}

interface CommunitySettingsDialogProps {
  open: boolean;
  draft: CommunitySettingsDraft;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (draft: CommunitySettingsDraft) => void;
  onSave: () => void;
}

export function CommunitySettingsDialog({
  open,
  draft,
  onOpenChange,
  onDraftChange,
  onSave,
}: CommunitySettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-raw-border/40 bg-raw-black p-0 text-raw-text sm:max-w-lg sm:rounded-3xl">
        <div className="border-b border-raw-border/20 bg-gradient-to-br from-raw-gold/[0.08] via-raw-black to-raw-black px-6 py-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-display text-xl tracking-wide text-raw-text">Edit community details</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-raw-silver/45">
              Only the community creator can change the group name or logo.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Community name</label>
            <Input
              value={draft.title}
              onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
              placeholder="Community name"
              className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.16em] text-raw-silver/40">Logo URL</label>
            <Input
              value={draft.logoUrl}
              onChange={(event) => onDraftChange({ ...draft, logoUrl: event.target.value })}
              placeholder="https://example.com/community-logo.png"
              className="h-11 rounded-xl border-raw-border/30 bg-raw-surface/30 text-raw-text placeholder:text-raw-silver/25"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-raw-border/20 px-6 py-5 sm:justify-between">
          <p className="text-xs text-raw-silver/40">Leave empty to remove the current logo.</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-raw-border/30 bg-transparent text-raw-silver/70 hover:bg-raw-surface/30 hover:text-raw-text"
            >
              Cancel
            </Button>
            <Button onClick={onSave} className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
