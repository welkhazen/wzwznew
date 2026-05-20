import { apiFetch } from "@/lib/http";

interface CommunityPushInput {
  recipientUserIds: string[];
  title: string;
  body: string;
  url?: string;
}

export async function sendCommunityPushNotification({
  recipientUserIds,
  title,
  body,
  url,
}: CommunityPushInput): Promise<void> {
  const recipients = [...new Set(recipientUserIds.filter(Boolean))];
  if (recipients.length === 0) return;

  await apiFetch("/api/notifications/community-push", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      recipientUserIds: recipients,
      title,
      body,
      url: url ?? `${window.location.origin}/dashboard`,
    }),
  }).catch(() => undefined);
}
