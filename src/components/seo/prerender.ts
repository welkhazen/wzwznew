// Pure string transform used by scripts/prerender-seo.mts to bake per-route
// <head> metadata into the built index.html. No Node/DOM deps so it's unit-testable.
import { SOCIAL_IMAGE_URL, canonicalFor, routeSeo } from "@/components/seo/seo-config";

const escText = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => escText(s).replace(/"/g, "&quot;");
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replace the content="" of a single <meta name|property="key" content="..."> tag. */
function setMetaContent(html: string, attr: "name" | "property", key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${escRe(key)}" content=")[^"]*(")`);
  return html.replace(re, `$1${escAttr(value)}$2`);
}

/**
 * Produce the static HTML for one indexable route from the built base index.html.
 * Rewrites title, description, OG/Twitter title+description+url, canonical, and
 * injects the route's JSON-LD. For non-home routes it strips the homepage-only
 * crawlable `#seo-landing` block so subpages don't ship a duplicate <h1>.
 */
export function buildRouteHtml(baseHtml: string, path: string): string {
  const seo = routeSeo[path];
  if (!seo) throw new Error(`No routeSeo config for "${path}"`);
  const canonical = canonicalFor(path);

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escText(seo.title)}</title>`);
  html = setMetaContent(html, "name", "description", seo.description);
  html = setMetaContent(html, "property", "og:title", seo.title);
  html = setMetaContent(html, "property", "og:description", seo.description);
  html = setMetaContent(html, "property", "og:url", canonical);
  html = setMetaContent(html, "property", "og:image", SOCIAL_IMAGE_URL);
  html = setMetaContent(html, "name", "twitter:title", seo.title);
  html = setMetaContent(html, "name", "twitter:description", seo.description);
  html = setMetaContent(html, "name", "twitter:image", SOCIAL_IMAGE_URL);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escAttr(canonical)}$2`);

  const data = seo.structuredData?.(canonical) ?? [];
  if (data.length > 0) {
    const tag = `<script type="application/ld+json" data-route-seo="route">${JSON.stringify(data)}</script>`;
    html = html.replace("</head>", `    ${tag}\n  </head>`);
  }

  if (path !== "/") {
    const start = html.indexOf('<div id="seo-landing"');
    const root = html.indexOf('<div id="root"');
    if (start !== -1 && root !== -1 && start < root) {
      html = html.slice(0, start) + html.slice(root);
    }
  }

  return html;
}
