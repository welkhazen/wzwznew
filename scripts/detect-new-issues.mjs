#!/usr/bin/env node
// Deterministic "new issues" detector for the autofix review system.
//
// Surfaces correctness regressions introduced by the current change set so the
// Claude review layer can turn them into a CEO-readable checklist:
//   - TypeScript errors located in files this change touched
//   - ESLint errors/warnings in those same files
//   - npm audit high/critical advisories
//
// Writes a simplified Markdown report to stdout, to $GITHUB_STEP_SUMMARY (when
// running in CI), and to the path given by --out (default: autofix-report.md).
//
// Always exits 0. This is a *report*, not a gate, and it never edits code —
// nothing is fixed until the CEO approves specific items on the PR.

import { execFileSync } from "node:child_process";
import { writeFileSync, appendFileSync, existsSync } from "node:fs";

const OUT = (() => {
  const i = process.argv.indexOf("--out");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : "autofix-report.md";
})();

const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

// Run a binary with an explicit argument array (no shell). This avoids any
// shell interpretation of values we interpolate — notably file paths that come
// from `git diff` and could contain spaces or shell metacharacters.
function run(bin, args) {
  try {
    return { ok: true, out: execFileSync(bin, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function resolveBase() {
  if (process.env.BASE_REF) {
    const r = run("git", ["merge-base", "HEAD", process.env.BASE_REF]);
    if (r.ok && r.out.trim()) return r.out.trim();
  }
  for (const candidate of ["origin/main", "origin/preview", "main"]) {
    const r = run("git", ["merge-base", "HEAD", candidate]);
    if (r.ok && r.out.trim()) return r.out.trim();
  }
  return "HEAD~1";
}

const base = resolveBase();
const changed = run("git", ["diff", "--name-only", `${base}...HEAD`]).out
  .split("\n")
  .map((s) => s.trim())
  .filter((f) => f && CODE_EXT.test(f));
const changedSet = new Set(changed);
// Deleted files still appear in the diff; drop them before linting so ESLint
// doesn't abort on a missing path and silently lose all results.
const changedExisting = changed.filter((f) => existsSync(f));

// ---- TypeScript ------------------------------------------------------------
// Run every project config that exists, not just the root one: the root
// `tsc --noEmit` (what CI runs) often reports 0 because the app sources are
// checked under tsconfig.app.json. We union the results so real component-level
// type errors are caught, then dedupe by file:line:code.
const TS_PROJECTS = ["tsconfig.app.json", "tsconfig.node.json"].filter(existsSync);
const tsCommands = TS_PROJECTS.length
  ? TS_PROJECTS.map((p) => ["tsc", "-p", p, "--noEmit"])
  : [["tsc", "--noEmit"]];
const tsSeen = new Set();
const tsAll = [];
for (const args of tsCommands) {
  for (const m of run("npx", args).out
    .split("\n")
    .map((l) => l.match(/^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$/))
    .filter(Boolean)) {
    const e = { file: m[1], line: Number(m[2]), col: Number(m[3]), code: m[4], msg: m[5] };
    const key = `${e.file}:${e.line}:${e.code}`;
    if (tsSeen.has(key)) continue;
    tsSeen.add(key);
    tsAll.push(e);
  }
}
const tsNew = tsAll.filter((e) => changedSet.has(e.file));

// ---- ESLint (changed files that still exist) -------------------------------
const lintNew = [];
if (changedExisting.length) {
  const r = run("npx", ["eslint", "--no-error-on-unmatched-pattern", "--format", "json", ...changedExisting]);
  const start = r.out.indexOf("[");
  if (start !== -1) {
    try {
      for (const file of JSON.parse(r.out.slice(start))) {
        for (const m of file.messages) {
          lintNew.push({
            file: file.filePath.replace(`${process.cwd()}/`, ""),
            line: m.line ?? 0,
            severity: m.severity === 2 ? "error" : "warning",
            rule: m.ruleId ?? "(parse)",
            msg: m.message,
          });
        }
      }
    } catch {
      // No parseable linter output — skip rather than fail the run.
    }
  }
}

// ---- npm audit (high / critical only) --------------------------------------
let auditHigh = 0;
let auditCritical = 0;
{
  const r = run("npm", ["audit", "--json"]);
  try {
    const v = JSON.parse(r.out).metadata?.vulnerabilities ?? {};
    auditHigh = v.high ?? 0;
    auditCritical = v.critical ?? 0;
  } catch {
    /* offline or no lockfile — skip */
  }
}

// ---- Build the simplified report -------------------------------------------
const tsErrors = tsNew;
const lintErrors = lintNew.filter((l) => l.severity === "error");
const lintWarns = lintNew.filter((l) => l.severity === "warning");
const total = tsErrors.length + lintErrors.length + lintWarns.length + auditHigh + auditCritical;

const lines = [];
lines.push("## 🔎 Deterministic scan (correctness layer)");
lines.push("");
lines.push(`Comparing \`HEAD\` against \`${base.slice(0, 12)}\` — ${changed.length} code file(s) changed.`);
lines.push("");
lines.push("| Check | Issues in changed files |");
lines.push("| --- | --- |");
lines.push(`| TypeScript errors | ${tsErrors.length} |`);
lines.push(`| ESLint errors | ${lintErrors.length} |`);
lines.push(`| ESLint warnings | ${lintWarns.length} |`);
lines.push(`| Dependency advisories (high/critical) | ${auditHigh + auditCritical} |`);
lines.push("");

if (tsErrors.length) {
  lines.push("<details><summary><b>TypeScript errors in changed files (the review layer flags which are newly introduced)</b></summary>\n");
  for (const e of tsErrors.slice(0, 50)) {
    lines.push(`- \`${e.file}:${e.line}\` **${e.code}** — ${e.msg}`);
  }
  lines.push("\n</details>");
  lines.push("");
}
if (lintErrors.length || lintWarns.length) {
  lines.push("<details><summary><b>ESLint findings in changed files</b></summary>\n");
  for (const l of [...lintErrors, ...lintWarns].slice(0, 50)) {
    lines.push(`- ${l.severity === "error" ? "❌" : "⚠️"} \`${l.file}:${l.line}\` ${l.rule ? `(\`${l.rule}\`)` : ""} — ${l.msg}`);
  }
  lines.push("\n</details>");
  lines.push("");
}
if (total === 0) {
  lines.push("✅ No new correctness issues detected by the deterministic layer.");
  lines.push("");
}
lines.push(`<!-- autofix:tsAll=${tsAll.length} tsNew=${tsErrors.length} lintErr=${lintErrors.length} lintWarn=${lintWarns.length} audit=${auditHigh + auditCritical} -->`);

const report = lines.join("\n");

writeFileSync(OUT, `${report}\n`);
process.stdout.write(`${report}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  } catch {
    /* summary is best-effort */
  }
}
