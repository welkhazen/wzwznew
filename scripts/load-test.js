#!/usr/bin/env node
/**
 * Local-only defensive load test.
 * Never target production URLs.
 */

const baseUrl = process.env.LOAD_TEST_URL ?? "http://127.0.0.1:8787";
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl)) {
  console.error(`Refusing to run: LOAD_TEST_URL must be localhost/127.0.0.1 (received ${baseUrl}).`);
  process.exit(1);
}

const endpoints = ["/api/health", "/api/polls/random?limit=10", "/api/assistant/status"];
const durationMs = Number(process.env.LOAD_TEST_DURATION_MS ?? 15000);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? 8);

const stats = new Map(endpoints.map((path) => [path, { total: 0, failures: 0, latencies: [] }]));

async function hit(path) {
  const started = performance.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, { method: "GET" });
    const elapsed = performance.now() - started;
    const row = stats.get(path);
    row.total += 1;
    row.latencies.push(elapsed);
    if (!res.ok) row.failures += 1;
  } catch {
    const row = stats.get(path);
    row.total += 1;
    row.failures += 1;
  }
}

async function worker(deadline) {
  while (Date.now() < deadline) {
    for (const path of endpoints) {
      await hit(path);
    }
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

(async () => {
  console.log("Running local-only defensive load test against", baseUrl);
  const deadline = Date.now() + durationMs;
  await Promise.all(Array.from({ length: concurrency }, () => worker(deadline)));

  console.log("\nResults:");
  for (const [path, row] of stats.entries()) {
    const errorRate = row.total === 0 ? 0 : (row.failures / row.total) * 100;
    const p95 = percentile(row.latencies, 95).toFixed(1);
    const avg = (row.latencies.reduce((acc, n) => acc + n, 0) / Math.max(1, row.latencies.length)).toFixed(1);
    console.log(`${path} | requests=${row.total} failures=${row.failures} errorRate=${errorRate.toFixed(2)}% avg=${avg}ms p95=${p95}ms`);
  }
})();
