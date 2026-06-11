import { describe, expect, it } from "vitest";
import { APP_CANONICAL_HOST, buildCanonicalAppUrl } from "@/lib/canonicalHost";

describe("canonical app host", () => {
  it("uses the www app host for app redirects", () => {
    expect(APP_CANONICAL_HOST).toBe("www.myraw.app");
  });

  it("preserves route, query, and hash when building the canonical URL", () => {
    expect(buildCanonicalAppUrl({
      protocol: "https:",
      pathname: "/dashboard/communities/abc",
      search: "?tab=chat",
      hash: "#latest",
    })).toBe("https://www.myraw.app/dashboard/communities/abc?tab=chat#latest");
  });
});
