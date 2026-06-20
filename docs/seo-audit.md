# SEO Audit — www.myraw.app

**Date:** 2026-06-09
**Scope:** Technical + on-page SEO of the raW web app (`www.myraw.app`)
**Method:** Source-of-truth review of the deployed code (`index.html`, `vercel.json`,
`public/robots.txt`, `public/sitemap.xml`, `src/components/seo/RouteSeo.tsx`, route/page
components). The live site could not be fetched from the audit environment (outbound network
is blocked by policy — both hosts returned `403 host_not_allowed` from the sandbox, not the
real server), so findings are drawn from the code that is actually shipped to production.

---

> **Status (2026-06-13):** The 🔴 critical domain mismatch (#1) and the 🟡 medium sitemap
> (#7) and viewport-zoom (#8) items have been **fixed in this PR** — all canonical/OG/JSON-LD/
> sitemap/robots references now use `https://www.myraw.app`. The 🟠 high items (#2–#4: SSR/
> prerendering and the "Enter raW" gate) are larger architectural changes left as
> recommendations. Note: support emails (`support@theartofraw.me`) and one footer brand label
> (`FinalCTA.tsx`) still reference `theartofraw.me` — these are contact/brand copy, not SEO
> signals, and were intentionally left for product to decide.

## Summary

| Severity | Count | Headline |
| --- | --- | --- |
| 🔴 Critical | 1 | Every page declares its canonical/OG/sitemap URL as `theartofraw.me`, not `myraw.app` |
| 🟠 High | 3 | Pure client-side rendering; home content gated behind an "Enter raW" splash; meta set post-render |
| 🟡 Medium | 4 | No per-page structured data; logo used as social image; sitemap quality; zoom disabled |
| 🟢 Good | — | robots.txt, security headers, PWA manifest, font preconnect, noindex on private routes |

The single most important issue is the **domain mismatch**: if the production site is
`www.myraw.app`, the site is currently telling Google that the "real" version of every page
lives on `theartofraw.me`. Fixing that should precede everything else.

---

## 🔴 Critical

### 1. Cross-domain canonical / OG / sitemap point to `theartofraw.me`, not `myraw.app`

The brand domain is referenced inconsistently across the codebase:

- `index.html` — `<link rel="canonical" href="https://theartofraw.me/">`, `og:url`,
  `og:image`, and the Organization JSON-LD `url`/`logo` all use `theartofraw.me`.
- `src/components/seo/RouteSeo.tsx:4` — `const SITE_URL = "https://theartofraw.me"`, which
  **rewrites the canonical and `og:url` of every route to `theartofraw.me` on each navigation.**
- `public/sitemap.xml` — every `<loc>` is `https://theartofraw.me/...`.
- `public/robots.txt` — `Sitemap: https://theartofraw.me/sitemap.xml`.

Meanwhile `public/llms.txt` explicitly declares `Canonical domain: https://www.myraw.app`
(updated 2026-05-23). The two disagree.

**Impact:** A canonical tag pointing at a different host tells search engines "index that host
instead of this one." If `myraw.app` is the live domain, this actively suppresses `myraw.app`
from the index and either (a) consolidates all ranking signals onto `theartofraw.me`, or (b)
creates duplicate-content confusion if both resolve. Sitemaps that list a different host than
the one serving them are typically ignored.

**Fix:** Decide the single canonical host (the task implies `www.myraw.app`). Then:
- Set one `SITE_URL`/origin constant and use it everywhere (`index.html`, `RouteSeo.tsx`,
  `sitemap.xml`, `robots.txt`, JSON-LD, `og:url`, `og:image`).
- 301-redirect the non-canonical host to the canonical one at the edge (Vercel domain
  redirect), so only one host ever responds 200.
- Re-submit the corrected sitemap in Google Search Console for the canonical property.

---

## 🟠 High

### 2. Content is 100% client-side rendered — no SSR or prerendering

`vite.config.ts` is a standard Vite SPA build (no SSR, no prerender plugin); `index.html` ships
an empty `<div id="root">` and all markup is injected by `src/main.tsx` at runtime.

The marketing/content routes (`/faq`, `/communities-explained`, `/polls-explained`,
`/security`, `/terms`, `/privacy`) read like SEO landing pages but exist **only after JS runs**.

**Impact:** Googlebot can render JS, but it does so on a delay and within a crawl budget; Bing,
social-card scrapers, and AI/LLM crawlers largely do **not** execute JS and will see a nearly
empty document. For routes whose entire purpose is to rank, this is a major handicap.

**Fix (lowest-effort first):**
- Prerender the static marketing routes at build time (e.g. `vite-plugin-prerender` /
  `react-snap` / `vite-plugin-ssg`, or move them to a framework with SSG). These pages have no
  per-user state, so static HTML is ideal.
- This also fixes finding #4 automatically (real meta in the served HTML).

### 3. Home page (`/`) hides its real content behind an "Enter raW" gate

`src/components/landing/EnterRawGate.tsx` is the initial home render. Its only `<h1>` is
*"this is raW"* (keyword-free), and the substantive landing content (`LandingShell`) is
lazy-imported **only after the user clicks "Enter raW"** (`EnterRawGate.tsx:18`).

**Impact:** The most valuable page returns a thin, keyword-poor document to crawlers. The
descriptive copy about anonymous communities, polls, and matching — the stuff that should rank —
is never in the crawlable DOM because crawlers don't click buttons.

**Fix:** Render the primary landing headline and above-the-fold value copy in the initial DOM
(keep the animated gate as a visual layer, but don't make indexable content depend on a click),
or prerender `/` with the full landing markup. Give the home page a descriptive `<h1>` containing
the primary keyword (e.g. "Anonymous online communities & 24/7 group chats").

### 4. Meta tags are mutated imperatively in `useEffect` after render

`RouteSeo.tsx` updates `document.title`, description, canonical, OG, and robots via
`document.head.querySelector(...).setAttribute(...)` inside a `useEffect`.

**Impact:** Any crawler that doesn't execute JS sees the **static `index.html` values on every
route** — i.e. the home title/description/canonical are served for `/faq`, `/security`, etc.,
producing duplicate titles and descriptions sitewide and a canonical that's wrong for every
subpage. (It also still resolves to the wrong domain — see #1.)

**Fix:** Solved by prerendering/SSR (#2). Short of that, ensure each prerendered/served route
contains its correct, route-specific meta in the initial HTML rather than only patching it later.

---

## 🟡 Medium

### 5. No per-page structured data
Only one `Organization` JSON-LD block exists (in `index.html`). Opportunities being missed:
- `FAQPage` schema on `/faq` (eligible for FAQ rich results).
- `WebSite` + `SearchAction` (sitelinks search box) on the home page.
- `BreadcrumbList` on content pages.

### 6. `og:image` is the 512×512 logo, not a social card
`og:image`/`twitter:image` point at `raw-logo-512.png`. Social platforms expect a ~1200×630
landscape card. The square logo yields cropped/low-impact previews (and currently sits on the
wrong domain — #1). Add a dedicated 1200×630 OG image.

### 7. Sitemap quality
`public/sitemap.xml` uses `<priority>` (effectively ignored by Google) and omits `<lastmod>`,
and is hand-maintained (easy to drift from `App.tsx` routes). After the domain fix, add
`<lastmod>`, drop `<priority>`, and ideally generate it from the route list at build time.

### 8. Viewport disables zoom
`index.html:5` sets `maximum-scale=1.0` on the viewport, which blocks pinch-zoom. This is an
accessibility issue Lighthouse flags ("[Aria] user-scalable / maximum-scale") and a minor
quality signal. Drop `maximum-scale=1.0` unless there's a hard product reason.

---

## 🟢 Working well (keep)

- `public/robots.txt` is present, permissive for major bots, and references a sitemap (host aside).
- `RouteSeo.tsx` correctly applies `noindex, nofollow` to private/internal routes
  (`/dashboard*`, `/pitch*`, `/__test*`, `/ask`) and unknown paths — good hygiene.
- Strong security headers in `vercel.json` (HSTS w/ preload, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- PWA manifest, maskable icon, theme-color, and apple-touch metadata are complete.
- Performance hygiene: `preconnect`/`preload` for Google Fonts, `dns-prefetch` for third
  parties, immutable caching for hashed `/assets/*`, code-split vendor chunks.
- `lang="en"` is set on `<html>`; analytics scripts are correctly gated behind env-var checks.
- `public/llms.txt` is a thoughtful addition for AI crawlers (just align its canonical claim
  with the rest of the site once #1 is resolved).

---

## Recommended order of work

1. **Pick one canonical host and fix every reference to it** (#1) + add a 301 from the other
   host. Nothing else matters until search engines see `myraw.app` as canonical.
2. **Prerender the static marketing routes and the home above-the-fold** (#2, #3, #4) so real
   HTML/meta ship without JS.
3. Add `FAQPage` + `WebSite/SearchAction` structured data (#5) and a proper OG card (#6).
4. Clean up the sitemap (#7) and the viewport zoom flag (#8).
