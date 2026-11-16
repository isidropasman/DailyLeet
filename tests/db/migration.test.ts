import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { testDatabase } from "./helpers";

const sql = testDatabase();
const migrate = () => execFileSync(process.execPath, ["scripts/setup-db.mjs"], { env: process.env, encoding: "utf8" });

test("setup-db upgrades the pre-scoreboard schema in place, backfills derived data and is re-runnable", async () => {
  await sql`DROP TABLE IF EXISTS weekly_scores, memberships, friend_groups, test_attempts, attempts, players CASCADE`;
  // Exact DDL the app shipped with before this migration.
  await sql`CREATE TABLE players (id uuid PRIMARY KEY, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE players ADD COLUMN clerk_user_id text UNIQUE`;
  await sql`CREATE TABLE attempts (player_id uuid REFERENCES players(id), day date NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), choices jsonb, result jsonb, elapsed integer, PRIMARY KEY(player_id, day))`;
  await sql`CREATE TABLE test_attempts (player_id uuid REFERENCES players(id), day date NOT NULL, run_id uuid NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), choices jsonb, result jsonb, elapsed integer, PRIMARY KEY(player_id, day))`;
  await sql`CREATE TABLE friend_groups (code text PRIMARY KEY, name text NOT NULL, owner_id uuid REFERENCES players(id), created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE memberships (group_code text REFERENCES friend_groups(code), player_id uuid REFERENCES players(id), PRIMARY KEY(group_code, player_id))`;

  const [a, b] = [randomUUID(), randomUUID()];
  await sql`INSERT INTO players (id, name) VALUES (${a}, 'a'), (${b}, 'b')`;
  const result = (score: number) => JSON.stringify({ score, passed: 12, total: 12, efficient: true, tests: [], feedback: [] });
  // a: Sat 2030-01-05, Sun 01-06 (week of 12-31), Mon 01-07, Wed 01-09 (week of 01-07); b: one unsubmitted start.
  for (const [day, score, elapsed] of [["2030-01-05", 10, 100], ["2030-01-06", 20, 50], ["2030-01-07", 30, 40], ["2030-01-09", 40, 30]] as const) {
    await sql`INSERT INTO attempts (player_id, day, result, elapsed) VALUES (${a}, ${day}, ${result(score)}::jsonb, ${elapsed})`;
  }
  await sql`INSERT INTO attempts (player_id, day) VALUES (${b}, '2030-01-09')`;

  migrate();
  const scores = await sql`SELECT day::text AS day, score FROM attempts ORDER BY player_id = ${a} DESC, day`;
  assert.deepEqual(scores.map(r => [r.day, r.score]), [["2030-01-05", 10], ["2030-01-06", 20], ["2030-01-07", 30], ["2030-01-09", 40], ["2030-01-09", null]]);
  const weekly = await sql`SELECT week_start::text AS week_start, score, elapsed, days FROM weekly_scores WHERE player_id = ${a} ORDER BY week_start`;
  assert.deepEqual(weekly.map(r => [r.week_start, r.score, r.elapsed, r.days]), [["2029-12-31", 30, 150, 2], ["2030-01-07", 70, 70, 2]]);
  const streaks = await sql`SELECT id, current_streak, best_streak, last_played_day::text AS last FROM players ORDER BY id = ${a} DESC`;
  assert.deepEqual(streaks.map(r => [r.current_streak, r.best_streak, r.last]), [[1, 3, "2030-01-09"], [0, 0, null]]);

  // Simulate drift (e.g. a submit handled by the previous deployment) and re-run.
  await sql`UPDATE weekly_scores SET score = 0`;
  await sql`INSERT INTO weekly_scores (week_start, player_id, score, elapsed, days) VALUES ('2020-01-06', ${b}, 5, 5, 1)`;
  migrate();
  const healed = await sql`SELECT week_start::text AS week_start, score FROM weekly_scores ORDER BY week_start`;
  assert.deepEqual(healed.map(r => [r.week_start, r.score]), [["2029-12-31", 30], ["2030-01-07", 70]]);
  migrate();
  const indexes = await sql`SELECT indexname FROM pg_indexes WHERE indexname IN ('attempts_daily_board', 'weekly_scores_board', 'memberships_player') ORDER BY 1`;
  assert.deepEqual(indexes.map(r => r.indexname), ["attempts_daily_board", "memberships_player", "weekly_scores_board"]);
});
