import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.myraw.app";
const SOCIAL_IMAGE_URL = `${SITE_URL}/og-card.svg`;

type StructuredData = Record<string, unknown>;
type RouteSeoConfig = {
  title: string;
  description: string;
  structuredData?: (canonicalUrl: string) => StructuredData[];
};

const routeSeo: Record<string, RouteSeoConfig> = {
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
  "/community-guidelines": { title: "Community Guidelines | raW", description: "Read the community rules that keep raW's anonymous polls, avatars, and community chats safer and more respectful." },
  "/safety": { title: "Safety Center | raW", description: "Learn how raW handles safety, moderation, reporting, and responsible participation in anonymous online communities." },
  "/report-content": { title: "Report Content | raW", description: "Learn how to report unsafe or inappropriate content in raW's anonymous community chats." },
  "/appeals": { title: "Appeals | raW", description: "Learn how raW members can appeal moderation decisions and request a review." },
  "/cookie-policy": { title: "Cookie Policy | raW", description: "Read how raW uses cookies and similar technologies for security, analytics, and product functionality." },
};

function setMeta(selector: string, value: string) {
  document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
}

function setStructuredData(id: string, data: StructuredData[]) {
  const selector = `script[data-route-seo="${id}"]`;
  const existingScript = document.head.querySelector<HTMLScriptElement>(selector);

  if (data.length === 0) {
    existingScript?.remove();
    return;
  }

  const script = existingScript ?? document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.routeSeo = id;
  script.textContent = JSON.stringify(data);

  if (!existingScript) {
    document.head.appendChild(script);
  }
}

export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = routeSeo[pathname] ?? routeSeo["/"];
    const canonicalPath = routeSeo[pathname] ? pathname : "/";
    const canonicalUrl = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
    const noIndex = !routeSeo[pathname] || pathname.startsWith("/dashboard") || pathname.startsWith("/pitch") || pathname.startsWith("/__test") || pathname === "/ask";

    document.title = seo.title;
    setMeta('meta[name="description"]', seo.description);
    setMeta('meta[property="og:title"]', seo.title);
    setMeta('meta[property="og:description"]', seo.description);
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:image"]', SOCIAL_IMAGE_URL);
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);
    setMeta('meta[name="twitter:image"]', SOCIAL_IMAGE_URL);
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = noIndex ? "noindex, nofollow" : "index, follow";

    const structuredData = seo.structuredData?.(canonicalUrl) ?? [];
    setStructuredData("route", structuredData);
  }, [pathname]);

  return null;
}
