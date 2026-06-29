import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  SOCIAL_IMAGE_URL,
  canonicalFor,
  isNoIndex,
  routeSeo,
  type StructuredData,
} from "@/components/seo/seo-config";

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
    const canonicalUrl = canonicalFor(pathname);
    const noIndex = isNoIndex(pathname);

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
