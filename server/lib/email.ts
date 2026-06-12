import { env } from "../config/env";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type TemplateName = "magic_link" | "streak_at_risk" | "weekly_digest" | "community_invite";

/** Escape a string for safe insertion into HTML content or attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and escape a URL for use in an HTML href attribute.
 * Only http/https URLs are allowed; anything else falls back to "#".
 */
function safeHref(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "#";
    }
  } catch {
    return "#";
  }
  return escapeHtml(url);
}

async function sendWithResend(payload: EmailPayload): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Resend email provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Resend send failed (${response.status}): ${reason}`);
  }
}

async function sendWithPostmark(payload: EmailPayload): Promise<void> {
  if (!env.POSTMARK_SERVER_TOKEN || !env.EMAIL_FROM) {
    throw new Error("Postmark email provider is not configured.");
  }

  const response = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": env.POSTMARK_SERVER_TOKEN,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: env.EMAIL_FROM,
      To: payload.to,
      Subject: payload.subject,
      HtmlBody: payload.html,
      TextBody: payload.text,
    }),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Postmark send failed (${response.status}): ${reason}`);
  }
}

async function deliver(payload: EmailPayload): Promise<void> {
  if (env.EMAIL_PROVIDER === "none") {
    console.info("email.skipped", { to: payload.to, subject: payload.subject });
    return;
  }

  if (env.EMAIL_PROVIDER === "resend") {
    await sendWithResend(payload);
    return;
  }

  await sendWithPostmark(payload);
}

export async function sendTransactionalEmail(
  template: TemplateName,
  to: string,
  data: Record<string, string>
): Promise<void> {
  switch (template) {
    case "magic_link": {
      const href = safeHref(data.link ?? "");
      const displayLink = escapeHtml(data.link ?? "");
      await deliver({
        to,
        subject: "Your magic sign-in link",
        html: `<p>Use this secure sign-in link:</p><p><a href="${href}">${displayLink}</a></p><p>This link expires in 10 minutes.</p>`,
        text: `Use this secure sign-in link: ${data.link ?? ""} (expires in 10 minutes).`,
      });
      return;
    }
    case "streak_at_risk": {
      const username = escapeHtml(data.username ?? "there");
      const streakDays = escapeHtml(data.streakDays ?? "0");
      await deliver({
        to,
        subject: "Your streak is at risk",
        html: `<p>Hey ${username}, your ${streakDays}-day streak will reset if you miss today.</p><p>Answer one poll now to keep it alive.</p>`,
        text: `Hey ${data.username ?? "there"}, your ${data.streakDays ?? "0"}-day streak will reset if you miss today. Answer one poll now to keep it alive.`,
      });
      return;
    }
    case "weekly_digest": {
      const summary = escapeHtml(data.summary ?? "No summary available");
      await deliver({
        to,
        subject: "Your weekly raW digest",
        html: `<p>Here is your weekly digest:</p><ul><li>${summary}</li></ul>`,
        text: `Weekly digest: ${data.summary ?? "No summary available"}`,
      });
      return;
    }
    case "community_invite": {
      const inviter = escapeHtml(data.inviter ?? "A friend");
      const communityName = escapeHtml(data.communityName ?? "raW Community");
      const inviteHref = safeHref(data.inviteLink ?? "");
      await deliver({
        to,
        subject: `${data.inviter ?? "A friend"} invited you to ${data.communityName ?? "raW Community"}`,
        html: `<p>${inviter} invited you to join <strong>${communityName}</strong>.</p><p><a href="${inviteHref}">Join community</a></p>`,
        text: `${data.inviter ?? "A friend"} invited you to ${data.communityName ?? "raW Community"}. Join: ${data.inviteLink ?? ""}`,
      });
      return;
    }
    default:
      return;
  }
}
