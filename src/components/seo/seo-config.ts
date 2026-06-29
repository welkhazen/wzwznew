// Single source of truth for per-route SEO, shared by:
//  - RouteSeo.tsx        (client-side <head> updates during SPA navigation)
//  - scripts/prerender-seo.mts (build-time static HTML so non-JS crawlers and
//    social scrapers get the correct canonical/title/OG/JSON-LD per route)
// Keep this file free of React/DOM/Node imports so both can use it.

export const SITE_URL = "https://www.myraw.app";
// Social scrapers (Facebook, X/Twitter, LinkedIn, Slack, WhatsApp) do not render
// SVG OG images — they require a raster format. Use the 1200x630 PNG card.
export const SOCIAL_IMAGE_URL = `${SITE_URL}/og-card.png`;

export type StructuredData = Record<string, unknown>;
export type RouteSeoConfig = {
  title: string;
  description: string;
  structuredData?: (canonicalUrl: string) => StructuredData[];
};

export const routeSeo: Record<string, RouteSeoConfig> = {
  "/": {
    title: "raW | Anonymous Polls, Avatars & Online Communities",
    description: "Join raW to answer anonymous live polls, build an avatar identity, compare honest opinions, and find online communities where you actually belong.",
    structuredData: (canonicalUrl) => [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "raW",
        url: canonicalUrl,
        description: "Answer anonymous live polls, build an avatar identity, and find online communities where you belong.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/faq?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "MobileApplication",
        name: "raW",
        url: canonicalUrl,
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android, Web",
        description: "Anonymous social app for live polls, avatar identities, and interest-based online communities where you can speak honestly and find where you belong.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        image: SOCIAL_IMAGE_URL,
      },
    ],
  },
  "/communities-explained": {
    title: "Anonymous Online Communities & Interest-Based Group Chats | raW",
    description: "Learn how anonymous online communities and interest-based group chats help people speak honestly, find like-minded people, and build real connections.",
  },
  "/polls-explained": {
    title: "Anonymous Live Polls That Help You Find Your Community | raW",
    description: "Answer anonymous live polls, compare your views, and get matched with online communities and group chats that fit your interests.",
  },
  "/faq": {
    title: "Anonymous Community Chat FAQ | raW",
    description: "Learn how raW's anonymous online communities, group chats, usernames, avatars, and live polls work.",
    structuredData: (canonicalUrl) => [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        url: canonicalUrl,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is raW?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "raW is an anonymous social app for live polls, avatar-based identities, and online communities where people can speak honestly without using a real name or personal photo.",
            },
          },
          {
            "@type": "Question",
            name: "How does raW help me find my people?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You answer anonymous polls, compare your views, and explore interest-based communities. Over time, your answers help reveal which group chats match your personality, interests, and experiences.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to show my real identity?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. You can join with a username, choose an avatar, and participate without displaying your real name, personal photo, or offline social profile.",
            },
          },
        ],
      },
    ],
  },
  "/security": { title: "Community Chat Safety & Privacy | raW", description: "Learn how raW protects people in anonymous online communities through privacy controls, moderation, reporting, and account security." },
  "/privacy": { title: "Privacy Policy | raW", description: "Read how raW handles account information, anonymous participation, privacy, and data security." },
  "/terms": { title: "Terms of Service | raW", description: "Read the terms for using raW's anonymous online community and group chat platform." },
};

/** Routes that must not be indexed (private app surface, internal/test routes). */
export function isNoIndex(pathname: string): boolean {
  return (
    !routeSeo[pathname] ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pitch") ||
    pathname.startsWith("/__test") ||
    pathname === "/ask"
  );
}

/** Absolute canonical URL for a known route (falls back to home for unknown). */
export function canonicalFor(pathname: string): string {
  const path = routeSeo[pathname] ? pathname : "/";
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}
