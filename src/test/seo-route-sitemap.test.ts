/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("SEO route inventory", () => {
  it("does not advertise legal pages that are not routed", () => {
    const removedLegalPaths = [
      "/community-guidelines",
      "/safety",
      "/report-content",
      "/appeals",
      "/cookie-policy",
    ];
    const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
    const routeSeo = readFileSync(resolve(process.cwd(), "src/components/seo/RouteSeo.tsx"), "utf8");

    for (const path of removedLegalPaths) {
      expect(sitemap).not.toContain(path);
      expect(routeSeo).not.toContain(`"${path}"`);
    }
  });
});
