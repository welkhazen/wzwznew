import { promises as fs } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function parseArgs(rawArgs) {
  if (rawArgs.length === 0) return { command: 'generate', format: 'markdown', rootArg: '.' };
  if (rawArgs[0] === 'export') {
    return {
      command: 'export',
      format: rawArgs[1] ?? 'callflow-html',
      rootArg: rawArgs[2] ?? '.',
    };
  }
  return { command: 'generate', format: 'markdown', rootArg: rawArgs[0] };
}

const { command, format, rootArg } = parseArgs(args);
const root = path.resolve(process.cwd(), rootArg);
const srcRoot = path.join(root, 'src');
const graphMdFile = path.join(root, 'docs', 'codebase-graph.md');
const callflowHtmlFile = path.join(root, 'docs', 'callflow.html');

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
  let base = null;
  if (spec.startsWith('.')) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else if (spec.startsWith('@/')) {
    base = path.join(srcRoot, spec.slice(2));
  }

  if (!base) return null;

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return candidates.find((c) => files.includes(c)) ?? null;
}

function buildMermaid(edges) {
  return ['graph LR', ...edges.map((edge) => `  ${edge}`)].join('\n');
}

function buildMarkdown(mermaid) {
  return [
    '# Codebase dependency graph',
    '',
    `Generated from \`${path.relative(root, srcRoot)}\` on ${new Date().toISOString()}.`,
    '',
    '```mermaid',
    mermaid,
    '```',
    '',
    '> Regenerate with `node scripts/graphify.mjs .`.',
    '> Export callflow HTML with `node scripts/graphify.mjs export callflow-html .`.',
  ].join('\n');
}

function buildCallflowHtml(mermaid) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Codebase Callflow</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 16px; color: #444; }
    .mermaid { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
  </style>
</head>
<body>
  <h1>Codebase Callflow</h1>
  <p>Generated from <code>${path.relative(root, srcRoot)}</code> on ${new Date().toISOString()}.</p>
  <pre class="mermaid">${mermaid}</pre>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
</body>
</html>
`;
}

if (command !== 'generate' && command !== 'export') {
  throw new Error(`Unsupported command: ${command}`);
}

await walk(srcRoot);

const edges = new Set();
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const staticImports = text.matchAll(/from\s+['\"]([^'\"]+)['\"]/g);
  const dynamicImports = text.matchAll(/import\(\s*['\"]([^'\"]+)['\"]\s*\)/g);
  for (const m of [...staticImports, ...dynamicImports]) {
    const target = resolveImport(file, m[1]);
    if (!target) continue;
    edges.add(`${normalize(file)}-->${normalize(target)}`);
  }
}

const sortedEdges = [...edges].sort();
const mermaid = buildMermaid(sortedEdges);

if (command === 'generate') {
  await fs.writeFile(graphMdFile, buildMarkdown(mermaid));
  console.log(`Wrote ${path.relative(root, graphMdFile)} with ${sortedEdges.length} edges.`);
}

if (command === 'export') {
  if (format !== 'callflow-html') {
    throw new Error(`Unsupported export format: ${format}`);
  }
  await fs.writeFile(callflowHtmlFile, buildCallflowHtml(mermaid));
  console.log(`Wrote ${path.relative(root, callflowHtmlFile)} with ${sortedEdges.length} edges.`);
}
