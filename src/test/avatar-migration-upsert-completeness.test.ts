import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "supabase/migrations");
const AUTHORITATIVE_SCHEMA_MIGRATION = "20260609160000";
const AUTHORITATIVE_COLUMNS = [
  "level",
  "name",
  "price",
  "image_src",
  "bg",
  "figure",
  "ring",
  "glow",
  "is_active",
  "rarity",
  "drop_weight",
  "frame_color",
  "rank_tier",
] as const;

function avatarCatalogUpsertClauses(sql: string): string[] {
  const clauses: string[] = [];
  const pattern = /insert\s+into\s+(?:public\.)?avatar_catalog\b[\s\S]*?on\s+conflict\s*\(\s*id\s*\)\s*do\s+update\s+set\s+([\s\S]*?);/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sql)) !== null) {
    clauses.push(match[1].toLowerCase());
  }

  return clauses;
}

describe("avatar catalog migrations", () => {
  it("updates every authoritative avatar field in post-schema ON CONFLICT upserts", () => {
    const offenders: string[] = [];
    const migrationFiles = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql") && file.slice(0, 14) >= AUTHORITATIVE_SCHEMA_MIGRATION)
      .sort();

    for (const file of migrationFiles) {
      const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      const clauses = avatarCatalogUpsertClauses(sql);

      clauses.forEach((clause, index) => {
        const missing = AUTHORITATIVE_COLUMNS.filter((column) => !new RegExp(`\\b${column}\\s*=`).test(clause));
        if (missing.length > 0) {
          offenders.push(`${file} upsert #${index + 1} missing: ${missing.join(", ")}`);
        }
      });
    }

    expect(offenders, `partial avatar_catalog ON CONFLICT updates found: ${offenders.join("; ")}`).toEqual([]);
  });
});
