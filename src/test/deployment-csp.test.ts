import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
const vercelConfig = JSON.parse(readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8"));

function getCspSources(directive: string): string[] {
  const csp = vercelConfig.headers
    .flatMap((route: { headers: Array<{ key: string; value: string }> }) => route.headers)
    .find((header: { key: string }) => header.key === "Content-Security-Policy")?.value as string | undefined;

  const directives = csp?.split(";").map((entry) => entry.trim().split(/\s+/)) ?? [];
  const sourceList =
    directives.find(([name]) => name === directive) ??
    (directive === "script-src-elem" ? directives.find(([name]) => name === "script-src") : undefined);

  return sourceList?.slice(1) ?? [];
}

describe("deployment Content Security Policy", () => {
  it("allows every external script loaded directly by index.html", () => {
    const document = new DOMParser().parseFromString(indexHtml, "text/html");
    const externalScriptOrigins = [...document.querySelectorAll<HTMLScriptElement>("script[src]")]
      .map((script) => script.getAttribute("src"))
      .filter((src): src is string => src?.startsWith("http") ?? false)
      .map((src) => new URL(src).origin);

    expect(externalScriptOrigins).not.toHaveLength(0);
    expect(getCspSources("script-src-elem")).toEqual(expect.arrayContaining(externalScriptOrigins));
  });
});
