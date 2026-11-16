// Local load test: N virtual guest players doing GET -> start -> submit -> GET (+ optional
// public leaderboard reads) against a running `pnpm start`. Guests only: Clerk sign-in
// can't be scripted without a real Clerk instance, so signed-in board reads are covered by
// the /api/leaderboard step instead.
//
//   pnpm loadtest -- --base http://localhost:3200 --players 2000 --concurrency 100 --reads 2
//   pnpm loadtest -- --seed 200000          (pre-fill today's attempts directly in the local DB)
//
// Each virtual player sends a distinct x-forwarded-for so the per-IP limiter sees distinct
// clients, as it would in production.
import { writeFileSync } from 'node:fs';
import { neon, neonConfig } from '@neondatabase/serverless';

const args = Object.fromEntries(process.argv.slice(2).filter(a => a !== '--').reduce((pairs, arg, i, all) => {
  if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
  return pairs;
}, []));
const base = args.base ?? 'http://localhost:3200';
const players = Number(args.players ?? 500);
const concurrency = Number(args.concurrency ?? 50);
const reads = Number(args.reads ?? 0);
const label = args.label ?? 'run';
const today = new Date().toISOString().slice(0, 10);

function requireLocal(url, what) {
  const host = new URL(url).hostname;
  if (!['localhost', '127.0.0.1', 'db.localtest.me'].includes(host)) throw new Error(`${what} must be local, got ${host}`);
}

if (args.seed) {
  requireLocal(process.env.DATABASE_URL ?? 'postgres://missing', 'DATABASE_URL');
  if (!process.env.DAILYLEET_LOCAL_NEON_ENDPOINT) throw new Error('run via scripts/local-db.sh exec');
  neonConfig.fetchEndpoint = process.env.DAILYLEET_LOCAL_NEON_ENDPOINT;
  const sql = neon(process.env.DATABASE_URL);
  const count = Number(args.seed);
  // Realistic skew: many perfect-ish scores, spread elapsed, last 7 days for weekly totals.
  await sql`INSERT INTO players (id, name) SELECT gen_random_uuid(), 'Seed ' || g FROM generate_series(1, ${count}) g`;
  await sql`
    INSERT INTO attempts (player_id, day, started_at, choices, result, elapsed)
    SELECT p.id, d.day, d.day + interval '1 hour', '[0,0,0]'::jsonb,
      jsonb_build_object('score', CASE WHEN random() < 0.4 THEN 97 + floor(random() * 4) ELSE 1 + floor(random() * 96) END, 'passed', 12, 'total', 12, 'efficient', true, 'tests', '[]'::jsonb, 'feedback', '[]'::jsonb),
      floor(random() * 300)::int
    FROM players p CROSS JOIN LATERAL (SELECT (${today}::date - k) AS day FROM generate_series(0, 6) k WHERE random() < 0.7) d
    WHERE p.name LIKE 'Seed %' ON CONFLICT DO NOTHING`;
  await sql`ANALYZE`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM attempts`;
  process.stdout.write(`seeded: ${n} attempts total. Run \`node scripts/setup-db.mjs\` (via local-db.sh exec) to rebuild weekly_scores/streaks.\n`);
  process.exit(0);
}

requireLocal(base, '--base');
const samples = new Map();
function record(step, ms, ok, status) {
  const entry = samples.get(step) ?? { ms: [], errors: 0, statuses: {} };
  entry.ms.push(ms);
  if (!ok) entry.errors += 1;
  entry.statuses[status] = (entry.statuses[status] ?? 0) + 1;
  samples.set(step, entry);
}

async function call(step, path, { cookie, ip, body } = {}) {
  const started = performance.now();
  try {
    const response = await fetch(base + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-forwarded-for': ip, ...(cookie ? { cookie } : {}), ...(body ? { 'content-type': 'application/json', origin: base } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    record(step, performance.now() - started, response.ok, response.status);
    return { response, text };
  } catch (error) {
    record(step, performance.now() - started, false, error.name ?? 'error');
    return null;
  }
}

async function playOne(index) {
  const ip = `10.${(index >> 16) & 255}.${(index >> 8) & 255}.${index & 255}`;
  const first = await call('GET /api/game', '/api/game', { ip });
  const setCookie = first?.response.headers.get('set-cookie') ?? '';
  const cookie = setCookie.match(/dailyleet-player=[^;]+/)?.[0];
  if (!cookie) return;
  await call('POST start', '/api/game', { cookie, ip, body: { action: 'start', day: today } });
  const choices = [0, 1, 2].map(() => Math.floor(Math.random() * 4));
  await call('POST submit', '/api/game', { cookie, ip, body: { action: 'submit', day: today, choices } });
  await call('GET /api/game (after)', '/api/game', { cookie, ip });
  for (let i = 0; i < reads; i++) await call('GET /api/leaderboard', `/api/leaderboard?period=${i % 2 ? 'weekly' : 'daily'}`, { ip });
}

const quantile = (sorted, q) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : NaN;
const started = performance.now();
let next = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (next < players) await playOne(next++);
}));
const seconds = (performance.now() - started) / 1000;

const rows = [];
const all = { ms: [], errors: 0 };
for (const [step, entry] of samples) {
  const sorted = [...entry.ms].sort((a, b) => a - b);
  all.ms.push(...entry.ms); all.errors += entry.errors;
  rows.push({ step, n: sorted.length, p50: quantile(sorted, 0.5), p95: quantile(sorted, 0.95), p99: quantile(sorted, 0.99), max: sorted.at(-1), errorRate: entry.errors / sorted.length, statuses: entry.statuses });
}
const sortedAll = all.ms.sort((a, b) => a - b);
rows.push({ step: 'ALL', n: sortedAll.length, p50: quantile(sortedAll, 0.5), p95: quantile(sortedAll, 0.95), p99: quantile(sortedAll, 0.99), max: sortedAll.at(-1), errorRate: all.errors / sortedAll.length, statuses: {} });

const fmt = v => (typeof v === 'number' ? v.toFixed(1) : String(v)).padStart(8);
process.stdout.write(`\n[${label}] ${players} players, concurrency ${concurrency}, reads/player ${reads}, ${seconds.toFixed(1)}s, ${(sortedAll.length / seconds).toFixed(0)} req/s\n`);
process.stdout.write(`${'step'.padEnd(24)}${'n'.padStart(8)}${'p50'.padStart(8)}${'p95'.padStart(8)}${'p99'.padStart(8)}${'max'.padStart(8)}  err%  statuses\n`);
for (const row of rows) process.stdout.write(`${row.step.padEnd(24)}${String(row.n).padStart(8)}${fmt(row.p50)}${fmt(row.p95)}${fmt(row.p99)}${fmt(row.max)}  ${(row.errorRate * 100).toFixed(2).padStart(5)} ${JSON.stringify(row.statuses)}\n`);
if (args.json) writeFileSync(args.json, JSON.stringify({ label, players, concurrency, reads, seconds, rows }, null, 2));
