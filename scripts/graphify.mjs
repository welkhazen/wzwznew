import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootArg = process.argv[2] ?? '.';
const root = path.resolve(process.cwd(), rootArg);
const srcRoot = path.join(root, 'src');
const outFile = path.join(root, 'docs', 'codebase-graph.md');

const files = [];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}

function normalize(p) {
  return path.relative(srcRoot, p).replace(/\\/g, '/');
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((c) => files.includes(c)) ?? null;
}

await walk(srcRoot);

const edges = new Set();
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const matches = text.matchAll(/from\s+['\"]([^'\"]+)['\"]/g);
  for (const m of matches) {
    const target = resolveImport(file, m[1]);
    if (!target) continue;
    edges.add(`${normalize(file)}-->${normalize(target)}`);
  }
}

const lines = [
  '# Codebase dependency graph',
  '',
  `Generated from \`${path.relative(root, srcRoot)}\` on ${new Date().toISOString()}.`,
  '',
  '```mermaid',
  'graph LR',
  ...[...edges].sort().map((edge) => `  ${edge}`),
  '```',
  '',
  '> Regenerate with `node scripts/graphify.mjs .`.',
];

await fs.writeFile(outFile, lines.join('\n'));
console.log(`Wrote ${path.relative(root, outFile)} with ${edges.size} edges.`);
