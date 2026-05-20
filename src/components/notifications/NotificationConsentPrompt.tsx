import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotificationConsent } from "@/hooks/useNotificationConsent";

interface NotificationConsentPromptProps {
  userId: string;
}

function platformLabel(platform: string): string {
  if (platform === "apple-ios") return "Apple notifications";
  if (platform === "samsung-android") return "Samsung notifications";
  return "notifications";
}

export function NotificationConsentPrompt({ userId }: NotificationConsentPromptProps) {
  const { dismiss, platform, requestPermission, shouldPrompt } = useNotificationConsent(userId);

  return (
    <Dialog open={shouldPrompt} onOpenChange={(open) => { if (!open) void dismiss(); }}>
      <DialogContent className="border-raw-border bg-raw-surface text-raw-text">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center border border-raw-gold/30 bg-raw-gold/10 text-raw-gold">
            <Bell className="h-5 w-5" />
          </div>
          <DialogTitle>Turn on {platformLabel(platform)}</DialogTitle>
          <DialogDescription className="text-raw-silver/60">
            Get alerts for likes, mentions, new communities, streak reminders, and important account updates. On iPhone, install raW to your Home Screen first for full push alerts.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={dismiss}>
            Not now
          </Button>
          <Button onClick={requestPermission}>
            Allow notifications
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
