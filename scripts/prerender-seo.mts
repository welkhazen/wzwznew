// Post-build step: bake correct per-route <head> (title, description, canonical,
// OG/Twitter, JSON-LD) into static HTML for every indexable route, so non-JS
// crawlers and social scrapers get route-correct metadata without running the SPA.
// Run via `tsx` after `vite build` (see package.json "build").
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildRouteHtml } from "@/components/seo/prerender";
import { routeSeo } from "@/components/seo/seo-config";

const distDir = join(process.cwd(), "dist");

async function main() {
  const baseHtml = await readFile(join(distDir, "index.html"), "utf8");
  const routes = Object.keys(routeSeo);

  for (const route of routes) {
    const html = buildRouteHtml(baseHtml, route);
    const outPath =
      route === "/"
        ? join(distDir, "index.html")
        : join(distDir, route.replace(/^\//, ""), "index.html");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html, "utf8");
  }

  console.log(`prerender-seo: wrote ${routes.length} routes -> ${routes.join(", ")}`);
}

main().catch((err) => {
  console.error("prerender-seo failed:", err);
  process.exit(1);
});
