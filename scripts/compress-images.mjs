/**
 * Image compression script.
 * - src/assets/*.png  → converts to WebP (quality 80) + deletes original
 * - src/assets/*.webp → recompresses at quality 72
 * - public/**\/*.png  → compresses PNG in-place (no format change — URLs stay the same)
 * - public/**\/*.webp → recompresses in-place at quality 72
 *
 * Run: node scripts/compress-images.mjs
 */

import sharp from "sharp";
import { readdir, stat, rename, rm, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function kb(bytes) {
  return (bytes / 1024).toFixed(1) + " kB";
}

async function getSize(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

async function findFiles(dir, exts) {
  const results = [];
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (exts.some((ext) => e.name.toLowerCase().endsWith(ext))) {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

async function compressSrcAssets() {
  const srcAssets = path.join(ROOT, "src", "assets");
  const pngs = await findFiles(srcAssets, [".png"]);
  const webps = await findFiles(srcAssets, [".webp"]);
  const conversions = []; // { from: string, to: string }

  console.log("\n=== src/assets PNG → WebP ===");
  for (const png of pngs) {
    const before = await getSize(png);
    const webpPath = png.replace(/\.png$/i, ".webp");

    await sharp(png)
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);

    const after = await getSize(webpPath);
    const saving = Math.round((1 - after / before) * 100);
    console.log(`  ${path.basename(png)} → ${path.basename(webpPath)}  ${kb(before)} → ${kb(after)}  (-${saving}%)`);

    conversions.push({ from: png, to: webpPath });
  }

  console.log("\n=== src/assets WebP recompress ===");
  for (const webp of webps) {
    const before = await getSize(webp);
    const tmp = webp + ".tmp.webp";
    await sharp(webp).webp({ quality: 72, effort: 6 }).toFile(tmp);
    const after = await getSize(tmp);
    if (after < before) {
      await rename(tmp, webp);
      const saving = Math.round((1 - after / before) * 100);
      console.log(`  ${path.basename(webp)}  ${kb(before)} → ${kb(after)}  (-${saving}%)`);
    } else {
      await rm(tmp, { force: true });
      console.log(`  ${path.basename(webp)}  already optimal, skipped`);
    }
  }

  return conversions;
}

async function compressPublicImages() {
  const publicDir = path.join(ROOT, "public");
  const pngs = await findFiles(publicDir, [".png"]);
  const webps = await findFiles(publicDir, [".webp"]);

  console.log("\n=== public/ PNG compress in-place ===");
  for (const png of pngs) {
    const before = await getSize(png);
    const tmp = png + ".tmp.png";
    await sharp(png)
      .png({ compressionLevel: 9, effort: 10 })
      .toFile(tmp);
    const after = await getSize(tmp);
    if (after < before) {
      await rename(tmp, png);
      const saving = Math.round((1 - after / before) * 100);
      console.log(`  ${path.relative(ROOT, png)}  ${kb(before)} → ${kb(after)}  (-${saving}%)`);
    } else {
      await rm(tmp, { force: true });
      console.log(`  ${path.relative(ROOT, png)}  already optimal, skipped`);
    }
  }

  console.log("\n=== public/ WebP recompress ===");
  for (const webp of webps) {
    const before = await getSize(webp);
    const tmp = webp + ".tmp.webp";
    await sharp(webp).webp({ quality: 72, effort: 6 }).toFile(tmp);
    const after = await getSize(tmp);
    if (after < before) {
      await rename(tmp, webp);
      const saving = Math.round((1 - after / before) * 100);
      console.log(`  ${path.relative(ROOT, webp)}  ${kb(before)} → ${kb(after)}  (-${saving}%)`);
    } else {
      await rm(tmp, { force: true });
      console.log(`  ${path.relative(ROOT, webp)}  already optimal, skipped`);
    }
  }
}

async function updateImports(conversions) {
  if (conversions.length === 0) return;
  console.log("\n=== Updating import statements ===");

  const srcDir = path.join(ROOT, "src");
  const tsxFiles = await findFiles(srcDir, [".tsx", ".ts"]);

  for (const file of tsxFiles) {
    let content = await readFile(file, "utf-8");
    let changed = false;

    for (const { from } of conversions) {
      const basename = path.basename(from); // e.g. "01_chrome.png"
      const basenameWebp = basename.replace(/\.png$/i, ".webp");

      // Match both single and double quote imports, with any @/assets/ or relative path
      const patterns = [
        // @/assets/filename.png
        new RegExp(`(from\\s+['"]@/assets/)${escapeRegex(basename)}(['"])`, "g"),
        new RegExp(`(import\\s+\\w+\\s+from\\s+['"]@/assets/)${escapeRegex(basename)}(['"])`, "g"),
        // relative ./filename.png or ../assets/filename.png
        new RegExp(`(from\\s+['"][^'"]*/)${escapeRegex(basename)}(['"])`, "g"),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `$1${basenameWebp}$2`);
          changed = true;
        }
      }
    }

    if (changed) {
      await writeFile(file, content, "utf-8");
      console.log(`  updated: ${path.relative(ROOT, file)}`);
    }
  }
}

async function deleteOriginalPngs(conversions) {
  if (conversions.length === 0) return;
  console.log("\n=== Deleting original PNGs ===");
  for (const { from, to } of conversions) {
    if (existsSync(to)) {
      await rm(from, { force: true });
      console.log(`  deleted: ${path.relative(ROOT, from)}`);
    }
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  console.log("Starting image compression…\n");

  const conversions = await compressSrcAssets();
  await compressPublicImages();
  await updateImports(conversions);
  await deleteOriginalPngs(conversions);

  console.log("\nDone. Run `npx vite build` to verify bundle sizes.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
