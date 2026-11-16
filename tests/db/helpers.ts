import { randomUUID } from "node:crypto";
import { database, type Sql } from "../../src/lib/db";
import type { Evaluation } from "../../src/lib/engine";
import { startAttempt, submitAttempt } from "../../src/lib/submission";

// These tests TRUNCATE; refuse anything that isn't the local throwaway DB.
export function testDatabase(): Sql {
  const url = new URL(process.env.DATABASE_URL ?? "postgres://missing");
  if (!["localhost", "127.0.0.1", "db.localtest.me"].includes(url.hostname) || !url.pathname.endsWith("_test") || !process.env.DAILYLEET_LOCAL_NEON_ENDPOINT) {
    throw new Error("DB tests need the local test DB: run them via `pnpm test:db`.");
  }
  return database();
}

export async function reset(sql: Sql): Promise<void> {
  await sql`TRUNCATE attempts, test_attempts, weekly_scores, memberships, friend_groups, players`;
}

export async function newPlayer(sql: Sql, name = "p", options: { guest?: boolean } = {}): Promise<string> {
  const id = randomUUID();
  const clerkUserId = options.guest ? null : `user_${id}`;
  await sql`INSERT INTO players (id, name, clerk_user_id) VALUES (${id}, ${name}, ${clerkUserId})`;
  return id;
}

export const scored = (score: number) => (): Evaluation => ({ score, passed: 12, total: 12, efficient: true, tests: [], feedback: [] });

// Pins the submit clock to started_at + elapsed so elapsed doesn't depend on query latency.
export async function play(sql: Sql, playerId: string, day: string, score: number, elapsed = 0) {
  const started = await startAttempt(sql, playerId, day);
  const startedAt = new Date(String(started.started_at)).getTime();
  return submitAttempt(sql, { playerId, day, choices: [0, 0, 0], evaluate: scored(score), timeoutFeedback: "timeout", now: () => startedAt + elapsed * 1000 + 100 });
}

// Bounded fan-out: with batches of 100 every test fans out fully; the bound only matters
// if a test grows past what one local Postgres should absorb at once.
export async function inBatches<T, R>(items: T[], size: number, run: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += size) {
    results.push(...await Promise.all(items.slice(start, start + size).map((item, offset) => run(item, start + offset))));
  }
  return results;
}
