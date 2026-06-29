import { describe, expect, it } from "vitest";
import { buildRouteHtml } from "@/components/seo/prerender";

// Minimal stand-in for the built dist/index.html (homepage head + crawlable block).
const BASE = `<!doctype html><html><head>
<title>Anonymous Online Communities &amp; Group Chats | raW</title>
<meta name="description" content="home desc" />
<meta property="og:title" content="home" />
<meta property="og:description" content="home" />
<meta property="og:url" content="https://www.myraw.app/" />
<meta property="og:image" content="https://www.myraw.app/og-card.png" />
<meta name="twitter:title" content="home" />
<meta name="twitter:description" content="home" />
<meta name="twitter:image" content="https://www.myraw.app/og-card.png" />
<link rel="canonical" href="https://www.myraw.app/" />
</head><body>
<div id="seo-landing" class="seo-only"><h1>home only h1</h1></div>
<div id="root"></div>
</body></html>`;

describe("buildRouteHtml", () => {
  it("rewrites title/canonical/og:url for a subpage and injects its JSON-LD", () => {
    const html = buildRouteHtml(BASE, "/faq");
    expect(html).toContain("<title>Anonymous Community Chat FAQ | raW</title>");
    expect(html).toContain('<link rel="canonical" href="https://www.myraw.app/faq" />');
    expect(html).toContain('content="https://www.myraw.app/faq"'); // og:url
    expect(html).toContain('"@type":"FAQPage"'); // route JSON-LD injected
  });

  it("strips the homepage-only seo-landing block on subpages (no duplicate h1)", () => {
    const html = buildRouteHtml(BASE, "/communities-explained");
    expect(html).not.toContain("home only h1");
    expect(html).not.toContain('id="seo-landing"');
    expect(html).toContain('<div id="root">'); // SPA mount point preserved
  });

  it("keeps the crawlable block on home and injects WebSite + MobileApplication", () => {
    const html = buildRouteHtml(BASE, "/");
    expect(html).toContain("home only h1");
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"MobileApplication"');
    expect(html).toContain('<link rel="canonical" href="https://www.myraw.app/" />');
  });

  it("HTML-escapes ampersands in titles", () => {
    const html = buildRouteHtml(BASE, "/security");
    expect(html).toContain("Community Chat Safety &amp; Privacy | raW");
  });
});
