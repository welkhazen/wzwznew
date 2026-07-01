#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const remote = process.env.DAILY_SCAN_REMOTE ?? 'origin';
const branch = process.env.DAILY_SCAN_BRANCH ?? 'main';
const windowHours = Number(process.env.DAILY_SCAN_WINDOW_HOURS ?? '24');
const runChecks = args.has('--run-checks') || process.env.DAILY_SCAN_RUN_CHECKS === '1';
const now = new Date();
const since = `${windowHours} hours ago`;
const targetRef = `${remote}/${branch}`;
const beirutTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Beirut',
  dateStyle: 'full',
  timeStyle: 'short',
}).format(now);

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.allowFailure ? 'pipe' : 'inherit'],
    ...options,
  }).trim();
}

function tryGit(args) {
  try {
    return git(args, { allowFailure: true });
  } catch {
    return '';
  }
}

function commandExists(commandArgs) {
  return spawnSync(commandArgs[0], commandArgs.slice(1), { stdio: 'ignore' }).status === 0;
}

function runCheck(label, command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8' });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  return {
    label,
    command: [command, ...commandArgs].join(' '),
    ok: result.status === 0,
    output: output.slice(0, 4000),
  };
}

const remotes = tryGit(['remote']).split('\n').filter(Boolean);
const hasRemote = remotes.includes(remote);
const fetchNotes = [];
if (hasRemote) {
  try {
    git(['fetch', '--prune', remote, `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`]);
    fetchNotes.push(`Fetched ${targetRef}.`);
  } catch (error) {
    fetchNotes.push(`Fetch failed for ${targetRef}: ${error instanceof Error ? error.message : String(error)}`);
  }
} else {
  fetchNotes.push(`Remote '${remote}' is not configured; using local HEAD.`);
}

const scanRef = tryGit(['rev-parse', '--verify', targetRef]) ? targetRef : 'HEAD';
const baseCommit = tryGit(['rev-list', '-1', `--before=${since}`, scanRef]);
const range = baseCommit ? `${baseCommit}..${scanRef}` : scanRef;

const commitLines = tryGit([
  'log',
  '--first-parent',
  `--since=${since}`,
  '--date=iso-local',
  '--pretty=format:%h | %ad | %s',
  scanRef,
]).split('\n').filter(Boolean);

const allCommitCount = Number(tryGit(['rev-list', '--count', `--since=${since}`, scanRef]) || '0');
const diffStat = baseCommit ? tryGit(['diff', '--stat', range]) : '';
const nameStatus = baseCommit ? tryGit(['diff', '--name-status', range]) : '';
const changedRows = nameStatus.split('\n').filter(Boolean).map((line) => {
  const parts = line.split('\t');
  return { status: parts[0], path: parts[parts.length - 1] };
});
const changedFiles = changedRows.map((row) => row.path);
const migrationFiles = changedFiles.filter((file) => file.startsWith('supabase/migrations/'));
const authRlsSecurityFiles = changedFiles.filter((file) => (
  file.includes('auth') ||
  file.includes('middleware') ||
  file.includes('security') ||
  file.includes('supabase/') ||
  file.includes('userController') ||
  file.includes('userExtrasController') ||
  file.includes('inputSecurity') ||
  file.includes('RLS')
));
const publicEndpointOrFormFiles = changedRows.filter((row) => {
  const path = row.path;
  return row.status.startsWith('A') && (
    path.startsWith('api/') ||
    path === 'middleware.ts' ||
    path.includes('Form') ||
    path.includes('Modal') ||
    path.includes('Banner') ||
    path.includes('donation') ||
    path.includes('Donation')
  );
}).map((row) => `${row.status} ${row.path}`);

const checks = [];
if (runChecks) {
  if (commandExists(['npm', '--version'])) {
    checks.push(runCheck('Lint', 'npm', ['run', 'lint', '--', '--quiet']));
    checks.push(runCheck('Tests', 'npm', ['run', 'test']));
  } else {
    checks.push({ label: 'npm checks', command: 'npm --version', ok: false, output: 'npm is not available.' });
  }
}

function sectionList(items, emptyText = 'None found.') {
  if (items.length === 0) return `- ${emptyText}`;
  return items.map((item) => `- ${item}`).join('\n');
}

const failedChecks = checks.filter((check) => !check.ok);
const report = `# Daily Repo Scan

- Beirut time: ${beirutTime}
- UTC time: ${now.toISOString()}
- Window: last ${windowHours} hours
- Ref scanned: ${scanRef}
- Base commit: ${baseCommit || 'not found'}
- Total commits in window: ${allCommitCount}
- First-parent / merged commits in window: ${commitLines.length}
- Fetch status: ${fetchNotes.join(' ')}

## Merged / first-parent commits

${sectionList(commitLines, 'No first-parent commits in this window.')}

## Files changed summary

\`\`\`
${diffStat || 'No diff stat available.'}
\`\`\`

## Migrations added or changed

${sectionList(migrationFiles)}

## Auth / RLS / security-sensitive files touched

${sectionList(authRlsSecurityFiles)}

## New public endpoints / forms / consent surfaces

${sectionList(publicEndpointOrFormFiles)}

## Lint / test checks

${runChecks ? sectionList(checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} — ${check.label}: \`${check.command}\``), 'No checks were run.') : '- Checks not run. Pass `--run-checks` or set `DAILY_SCAN_RUN_CHECKS=1`.'}

${failedChecks.length > 0 ? `## Failed check output\n\n${failedChecks.map((check) => `### ${check.label}\n\n\`\`\`\n${check.output || 'No output.'}\n\`\`\``).join('\n\n')}` : '## Failed check output\n\n- None.'}

## Quick reviewer prompts

- Look closely at new middleware, API routes, public forms, and Supabase migrations.
- Confirm any public insert policy has spam/rate-limit protection.
- Confirm token, invite, and reward flows are transactional enough for failure cases.
- Confirm legal consent changes have a single source of truth and version/timestamp if needed.
`;

writeFileSync('daily-scan-report.md', report);
console.log(report);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
}
