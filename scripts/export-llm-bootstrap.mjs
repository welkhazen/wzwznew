#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const bootstrapPath = resolve(repoRoot, 'docs/llm-memory-pack/BOOTSTRAP_PROMPT.md');
const agentsPath = resolve(repoRoot, 'AGENTS.md');
const marker = [
  '- Follow repo-level assistant interaction preferences in `../../AGENTS.md`',
  'instead of duplicating them here.',
].join(' ');

function extractSection(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);

  if (start === -1) {
    throw new Error(`Could not find ${heading} in AGENTS.md`);
  }

  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return lines.slice(start, end === -1 ? lines.length : end).join('\n').trim();
}

function parseArgs(argv) {
  const writeIndex = argv.indexOf('--write');

  if (writeIndex === -1) {
    return { outputPath: null };
  }

  const outputPath = argv[writeIndex + 1];
  if (!outputPath) {
    throw new Error('Expected an output path after --write');
  }

  return { outputPath: resolve(repoRoot, outputPath) };
}

const { outputPath } = parseArgs(process.argv.slice(2));
const bootstrap = readFileSync(bootstrapPath, 'utf8');
const agents = readFileSync(agentsPath, 'utf8');
const assistantPreference = extractSection(agents, '## Assistant interaction preference');

if (!bootstrap.includes(marker)) {
  throw new Error(`Could not find bootstrap marker: ${marker}`);
}

const portableBootstrap = bootstrap.replace(
  marker,
  [`- Apply these inlined repo-level assistant interaction preferences:`, '', assistantPreference]
    .join('\n')
);

if (outputPath) {
  writeFileSync(outputPath, portableBootstrap);
} else {
  process.stdout.write(portableBootstrap);
}
