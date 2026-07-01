const BOT_UA = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|Slackbot|LinkedInBot|Discordbot|Pinterest|Googlebot|bingbot|Applebot|Signal|SkypeUriPreview|iMessageLinkPreview|Iframely/i;

export default async function middleware(req: Request): Promise<Response | undefined> {
  const ua = req.headers.get("user-agent") ?? "";
  if (!BOT_UA.test(ua)) return undefined;

  const url = new URL(req.url);
  const invite = url.searchParams.get("invite");
  if (!invite) return undefined;

  const base = "https://www.myraw.app";
  const pageUrl = `${base}/?invite=${invite}`;
  const image = `${base}/og-invite.png`;
  const title = "You've been invited to raW";
  const description = `Use code ${invite} to join — anonymous polls, avatar identities, and real communities. No email, no phone, no real name.`;

  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body></body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export const config = { matcher: "/" };
