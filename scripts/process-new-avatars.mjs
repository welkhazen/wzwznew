/**
 * Avatar pipeline: drops in `public/avatars/` get renamed to the next
 * sequential number, resized, compressed, deduped, and registered in the
 * generated catalog file `src/lib/generatedAvatarEntries.ts`.
 *
 * Runs locally (on demand) and via the pre-commit hook.
 *
 *   node scripts/process-new-avatars.mjs
 *
 * Behaviour:
 *   - Scans `public/avatars/` for files NOT matching `^\d+\.(png|webp)$`
 *     (skips `previews/` and `avatar-*.svg` icons).
 *   - For each candidate:
 *       1. Hash bytes (SHA-256). If hash matches any existing numbered
 *          avatar in the folder, the candidate is an exact duplicate —
 *          delete it and skip.
 *       2. Otherwise resize to max 512×512 (preserves aspect),
 *          PNG-compress, save as `<nextNumber>.png`, delete the original.
 *       3. Extract dominant color via sharp .stats() and append a
 *          catalog entry pointing at the new file.
 *   - Rewrites `src/lib/generatedAvatarEntries.ts` with the merged list.
 */
import sharp from "sharp";
import { createHash } from "crypto";
import { readdir, readFile, writeFile, stat, rm, rename } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AVATARS_DIR = path.join(ROOT, "public", "avatars");
const GENERATED_FILE = path.join(ROOT, "src", "lib", "generatedAvatarEntries.ts");

const MAX_DIMENSION = 512;
const NUMBERED_RE = /^(\d+)\.(png|webp)$/i;
const IMAGE_EXT_RE = /\.(png|webp|jpg|jpeg)$/i;
const SKIP_BASENAMES = new Set(["previews"]);
// Levels 1–34 are generated inline in avatarCatalog.ts and file 35.png is
// already used by the hand-crafted `pink-circuit` entry. Anything 36+ is
// the responsibility of this generator.
const GENERATED_LEVEL_START = 36;

function hex2(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

function rgbToHex({ r, g, b }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

function darken({ r, g, b }, factor) {
  return { r: r * factor, g: g * factor, b: b * factor };
}

async function sha256(file) {
  const buf = await readFile(file);
  return createHash("sha256").update(buf).digest("hex");
}

async function listAvatars() {
  const entries = await readdir(AVATARS_DIR, { withFileTypes: true });
  const numbered = [];
  const candidates = [];
  for (const e of entries) {
    if (e.isDirectory()) continue;
    if (SKIP_BASENAMES.has(e.name)) continue;
    if (!IMAGE_EXT_RE.test(e.name)) continue;
    if (e.name.startsWith("avatar-")) continue; // hand-crafted SVG icons
    const match = e.name.match(NUMBERED_RE);
    if (match) {
      numbered.push({ name: e.name, level: Number(match[1]) });
    } else {
      candidates.push(e.name);
    }
  }
  return { numbered, candidates };
}

async function buildExistingHashIndex(numbered) {
  const hashes = new Map(); // hash -> existing filename
  for (const { name } of numbered) {
    const file = path.join(AVATARS_DIR, name);
    hashes.set(await sha256(file), name);
  }
  return hashes;
}

function nextLevel(numbered) {
  const max = numbered.reduce((m, { level }) => Math.max(m, level), 0);
  return max + 1;
}

/**
 * Pull a *characteristic* mid-tone color out of an avatar. Sharp's built-in
 * .stats().dominant returns the most-common pixel — which for these avatars
 * is the near-black background, not the figure. So instead we:
 *   1. Downsample to a 64×64 raw pixel grid.
 *   2. Discard pixels that are near-black, near-white, or near-grayscale
 *      (low saturation) — those are background / outlines.
 *   3. Quantize the rest into 4-bit-per-channel buckets and return the
 *      bucket with the highest count.
 *   4. If everything got filtered out, fall back to sharp's mean.
 */
async function extractCharacteristicColor(buf) {
  const SIZE = 64;
  const { data, info } = await sharp(buf)
    .resize(SIZE, SIZE, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (lum < 28 || lum > 235) continue;        // skip near-black & near-white
    if (max - min < 24) continue;               // skip near-grayscale (outlines, neutral bg)
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  if (buckets.size > 0) {
    let bestKey = 0;
    let bestCount = 0;
    for (const [k, c] of buckets) {
      if (c > bestCount) { bestKey = k; bestCount = c; }
    }
    return {
      r: ((bestKey >> 8) & 0xf) * 16 + 8,
      g: ((bestKey >> 4) & 0xf) * 16 + 8,
      b: (bestKey & 0xf) * 16 + 8,
    };
  }
  // Fallback: image is purely black/white/grayscale — use overall mean.
  const stats = await sharp(buf).stats();
  return {
    r: stats.channels[0]?.mean ?? 128,
    g: stats.channels[1]?.mean ?? 128,
    b: stats.channels[2]?.mean ?? 128,
  };
}

async function compressToBuffer(inputBuf) {
  const meta = await sharp(inputBuf).metadata();
  const needsResize = (meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION;
  let pipeline = sharp(inputBuf);
  if (needsResize) {
    pipeline = pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });
  }
  return pipeline.png({ compressionLevel: 9, effort: 10 }).toBuffer();
}

async function deriveEntry(buf, level) {
  const color = await extractCharacteristicColor(buf);
  const dominantHex = rgbToHex(color);
  const bgHex = rgbToHex(darken(color, 0.12));
  return { level, dominantHex, bgHex };
}

async function processCandidate(candidateName, level) {
  const src = path.join(AVATARS_DIR, candidateName);
  const dst = path.join(AVATARS_DIR, `${level}.png`);
  const inputBuf = await readFile(src);
  const compressed = await compressToBuffer(inputBuf);
  const entry = await deriveEntry(compressed, level);

  await writeFile(dst, compressed);
  await rm(src, { force: true });

  return {
    ...entry,
    file: `${level}.png`,
    bytesBefore: inputBuf.length,
    bytesAfter: compressed.length,
  };
}

async function readExistingGenerated() {
  try {
    const content = await readFile(GENERATED_FILE, "utf8");
    const levelMatches = [...content.matchAll(/level:\s*(\d+)/g)];
    return new Set(levelMatches.map((m) => Number(m[1])));
  } catch {
    return new Set();
  }
}

function entryLiteral({ level, dominantHex, bgHex }) {
  const glow = `${dominantHex}80`;
  return `  { id: "avatar-${level}", level: ${level}, name: "Avatar ${level}", price: "50", imageSrc: "/avatars/${level}.png", bg: "${bgHex}", figure: "${dominantHex}", ring: "${dominantHex}", glow: "${glow}", isActive: true, showIn: "both", rarity: "common" },`;
}

async function writeGeneratedFile(allEntries) {
  const sorted = [...allEntries].sort((a, b) => a.level - b.level);
  const body = sorted.map(entryLiteral).join("\n");
  const file = `// Generated by scripts/process-new-avatars.mjs — do not edit by hand.\n// Drop new images in public/avatars/ and run the script (or commit, the\n// pre-commit hook runs it for you).\nimport type { AvatarCatalogItem } from "@/lib/avatarCatalog";\n\nexport const GENERATED_AVATAR_ENTRIES: readonly AvatarCatalogItem[] = [\n${body}\n];\n`;
  await writeFile(GENERATED_FILE, file, "utf8");
}

function parseExistingEntries(content) {
  // Crude — extract the literal object lines so we preserve previously-generated
  // entries (with their detected colors) without re-reading every image.
  const out = [];
  const re = /\{\s*id:\s*"avatar-(\d+)"[^}]*level:\s*(\d+)[^}]*bg:\s*"(#[0-9a-fA-F]{6})"[^}]*figure:\s*"(#[0-9a-fA-F]{6})"[^}]*ring:\s*"(#[0-9a-fA-F]{6})"[^}]*glow:\s*"(#[0-9a-fA-F]{8})"[^}]*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    out.push({ level: Number(m[2]), bgHex: m[3], dominantHex: m[4] });
  }
  return out;
}

async function main() {
  const { numbered, candidates } = await listAvatars();
  const existingHashes = await buildExistingHashIndex(numbered);

  let existingGeneratedEntries = [];
  try {
    const content = await readFile(GENERATED_FILE, "utf8");
    existingGeneratedEntries = parseExistingEntries(content);
  } catch {
    existingGeneratedEntries = [];
  }
  const knownLevels = new Set(existingGeneratedEntries.map((e) => e.level));

  let nextNum = nextLevel(numbered);
  const renamed = [];
  let skippedDup = 0;

  // Pass 1: rename + compress + extract color for each non-numbered candidate.
  for (const name of candidates) {
    const src = path.join(AVATARS_DIR, name);
    const hash = await sha256(src);
    if (existingHashes.has(hash)) {
      const dup = existingHashes.get(hash);
      console.log(`  ⊘ duplicate: "${name}" matches existing ${dup} — deleting`);
      await rm(src, { force: true });
      skippedDup += 1;
      continue;
    }
    existingHashes.set(hash, `${nextNum}.png`);
    const res = await processCandidate(name, nextNum);
    const sizeBefore = (res.bytesBefore / 1024).toFixed(0);
    const sizeAfter = (res.bytesAfter / 1024).toFixed(0);
    const pct = Math.round((1 - res.bytesAfter / res.bytesBefore) * 100);
    console.log(`  ✓ "${name}" → ${res.file}  (${sizeBefore}kB → ${sizeAfter}kB, -${pct}%, color ${res.dominantHex})`);
    renamed.push(res);
    nextNum += 1;
  }

  // Pass 2: seed catalog entries for any numbered file at level >= GENERATED_LEVEL_START
  // that doesn't have one yet. Lets you wipe generatedAvatarEntries.ts and rerun
  // the script to refresh colors for already-numbered avatars.
  const numberedAfterRename = (await listAvatars()).numbered;
  const seeded = [];
  for (const { name, level } of numberedAfterRename) {
    if (level < GENERATED_LEVEL_START) continue;
    if (knownLevels.has(level)) continue;
    if (renamed.some((r) => r.level === level)) continue; // already added in pass 1
    const buf = await readFile(path.join(AVATARS_DIR, name));
    const entry = await deriveEntry(buf, level);
    console.log(`  + seeded entry for existing ${name}  (color ${entry.dominantHex})`);
    seeded.push(entry);
  }

  const byLevel = new Map(existingGeneratedEntries.map((e) => [e.level, e]));
  for (const e of [...renamed, ...seeded]) byLevel.set(e.level, e);
  const merged = [...byLevel.values()];

  if (renamed.length > 0 || seeded.length > 0) {
    await writeGeneratedFile(merged);
    console.log(`Wrote ${merged.length} catalog entr${merged.length === 1 ? "y" : "ies"} to ${path.relative(ROOT, GENERATED_FILE)}.`);
  } else if (skippedDup > 0) {
    console.log("All candidates were duplicates; catalog unchanged.");
  } else {
    console.log("No unprocessed avatars and no missing catalog entries. Nothing to do.");
  }

  console.log(`Done. ${renamed.length} renamed, ${seeded.length} seeded from existing files, ${skippedDup} skipped as duplicates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
