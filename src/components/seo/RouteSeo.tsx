import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://theartofraw.me";
const routeSeo: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Anonymous Online Communities & Group Chats | raW",
    description: "Join anonymous online communities and 24/7 group chats built around honest conversation, shared interests, live polls, and real connection.",
  },
  "/communities-explained": {
    title: "Anonymous Online Communities & Interest-Based Group Chats | raW",
    description: "Learn how anonymous online communities and interest-based group chats help people speak honestly, find like-minded people, and build real connections.",
  },
  "/polls-explained": {
    title: "Anonymous Live Polls That Help You Find Your Community | raW",
    description: "Answer anonymous live polls, compare your views, and get matched with online communities and group chats that fit your interests.",
  },
  "/faq": { title: "Anonymous Community Chat FAQ | raW", description: "Learn how raW's anonymous online communities, group chats, usernames, avatars, and live polls work." },
  "/security": { title: "Community Chat Safety & Privacy | raW", description: "Learn how raW protects people in anonymous online communities through privacy controls, moderation, reporting, and account security." },
  "/privacy": { title: "Privacy Policy | raW", description: "Read how raW handles account information, anonymous participation, privacy, and data security." },
  "/terms": { title: "Terms of Service | raW", description: "Read the terms for using raW's anonymous online community and group chat platform." },
};

function setMeta(selector: string, value: string) {
  document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
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
    setMeta('meta[name="twitter:title"]', seo.title);
    setMeta('meta[name="twitter:description"]', seo.description);
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);

    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.name = "robots";
      document.head.appendChild(robots);
    }
    robots.content = noIndex ? "noindex, nofollow" : "index, follow";
  }, [pathname]);

  return null;
}
