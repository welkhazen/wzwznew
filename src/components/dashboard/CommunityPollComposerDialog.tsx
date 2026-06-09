import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CommunityPollComposerDialogProps {
  open: boolean;
  question: string;
  optionDrafts: string[];
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onQuestionChange: (question: string) => void;
  onOptionChange: (index: number, value: string) => void;
  onSubmit: () => void;
}

export function CommunityPollComposerDialog({
  open,
  question,
  optionDrafts,
  submitting,
  onOpenChange,
  onQuestionChange,
  onOptionChange,
  onSubmit,
}: CommunityPollComposerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-raw-border/30 bg-raw-black/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-raw-text">Post a poll to the room</DialogTitle>
          <DialogDescription className="text-raw-silver/60">
            Only the community owner and admins can post polls. Members get one vote each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-raw-silver/55">Question</label>
            <Input
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              placeholder="What do you want to ask the room?"
              maxLength={200}
              className="border-raw-border/30 bg-raw-surface/30 text-raw-text"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-[0.16em] text-raw-silver/55">Options</label>
            <div className="space-y-2">
              {optionDrafts.map((option, index) => (
                <Input
                  key={index}
                  value={option}
                  onChange={(event) => onOptionChange(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={80}
                  className="border-raw-border/30 bg-raw-surface/30 text-raw-text"
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-raw-silver/70 hover:text-raw-text"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="rounded-xl bg-raw-gold px-4 text-raw-ink hover:bg-raw-gold/90"
            >
              {submitting ? "Postingâ€¦" : "Post poll"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
