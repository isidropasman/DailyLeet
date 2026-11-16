import type { Choices } from "./challenges";
import type { Row, Sql } from "./db";
import type { Evaluation } from "./engine";
import { weekRange } from "./ranking-period";

export const TIME_LIMIT_SECONDS = 300;

export type Streak = { current: number; best: number; lastPlayedDay: string | null; playedToday: boolean };
// totals is set only when this call applied the submit; it feeds board revalidation.
export type Submission = { result: unknown; elapsed: number | null; applied: boolean; streak: Streak | null; totals: { daily: { score: number; elapsed: number }; weekly: { score: number; elapsed: number } } | null };
export type SubmitError = "not-started";
export type SubmitOutcome = { ok: true; value: Submission } | { ok: false; error: SubmitError };

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

// The stored current_streak only changes on submit, so a streak broken by missing
// yesterday is still stored as alive until the next submit; reads must age it.
export function streakView(stored: { current: number; best: number; lastPlayedDay: string | null }, today: string): Streak {
  const alive = stored.lastPlayedDay === today || stored.lastPlayedDay === previousDay(today);
  return { current: alive ? stored.current : 0, best: stored.best, lastPlayedDay: stored.lastPlayedDay, playedToday: stored.lastPlayedDay === today };
}

function storedStreak(row: Row) {
  return { current: Number(row.current_streak), best: Number(row.best_streak), lastPlayedDay: typeof row.last_played_day === "string" ? row.last_played_day : null };
}

export async function startAttempt(sql: Sql, playerId: string, day: string): Promise<Row> {
  const rows: Row[] = await sql`
    WITH inserted AS (
      INSERT INTO attempts (player_id, day) VALUES (${playerId}, ${day}) ON CONFLICT DO NOTHING RETURNING started_at, result
    )
    SELECT started_at, result FROM inserted
    UNION ALL
    SELECT started_at, result FROM attempts WHERE player_id = ${playerId} AND day = ${day} AND NOT EXISTS (SELECT 1 FROM inserted)`;
  if (rows[0]) return rows[0];
  // A concurrent start inserted first: ON CONFLICT waited for its commit, but this
  // statement's snapshot predates it, so only a fresh statement can see the row.
  const existing: Row[] = await sql`SELECT started_at, result FROM attempts WHERE player_id = ${playerId} AND day = ${day}`;
  return existing[0];
}

export async function readStreak(sql: Sql, playerId: string, today: string): Promise<Streak | null> {
  const rows: Row[] = await sql`SELECT current_streak, best_streak, last_played_day::text AS last_played_day FROM players WHERE id = ${playerId}`;
  return rows[0] ? streakView(storedStreak(rows[0]), today) : null;
}

export async function submitAttempt(sql: Sql, input: { playerId: string; day: string; choices: Choices | null; evaluate: (choices: Choices, elapsed: number) => Evaluation; timeoutFeedback: string; now?: () => number }): Promise<SubmitOutcome> {
  const { playerId, day, choices } = input;
  const attempts: Row[] = await sql`SELECT started_at, result, elapsed FROM attempts WHERE player_id = ${playerId} AND day = ${day}`;
  const attempt = attempts[0];
  if (!attempt) return { ok: false, error: "not-started" };
  if (attempt.result) return { ok: true, value: { result: attempt.result, elapsed: Number(attempt.elapsed), applied: false, streak: await readStreak(sql, playerId, day), totals: null } };
  const elapsed = Math.max(0, Math.floor(((input.now ?? Date.now)() - new Date(String(attempt.started_at)).getTime()) / 1000));
  // Late unsubmitted choices cannot become a ranked solution after the deadline.
  const result: Evaluation = choices === null || elapsed > TIME_LIMIT_SECONDS
    ? { score: 1, passed: 0, total: 12, efficient: false, tests: [], feedback: [input.timeoutFeedback] }
    : input.evaluate(choices, elapsed);
  const week = weekRange(day).start;
  // One statement = one atomic unit: weekly totals and streak move only if this call is
  // the one that flipped result from NULL. A concurrent duplicate blocks on the row lock,
  // re-checks `result IS NULL`, matches nothing and leaves the aggregates alone.
  const rows: Row[] = await sql`
    WITH updated AS (
      UPDATE attempts SET choices = ${JSON.stringify(choices)}::jsonb, result = ${JSON.stringify(result)}::jsonb, elapsed = ${Math.min(elapsed, TIME_LIMIT_SECONDS)}, submitted_at = now()
      WHERE player_id = ${playerId} AND day = ${day} AND result IS NULL
      RETURNING player_id, day, result, score, elapsed
    ), weekly AS (
      INSERT INTO weekly_scores (week_start, player_id, score, elapsed, days)
      SELECT ${week}::date, player_id, score, elapsed, 1 FROM updated
      ON CONFLICT (week_start, player_id) DO UPDATE SET score = weekly_scores.score + EXCLUDED.score, elapsed = weekly_scores.elapsed + EXCLUDED.elapsed, days = weekly_scores.days + 1
      RETURNING score, elapsed
    ), streak AS (
      UPDATE players p SET
        current_streak = s.next,
        best_streak = GREATEST(p.best_streak, s.next),
        last_played_day = GREATEST(p.last_played_day, s.day)
      FROM (
        SELECT u.day, CASE WHEN q.last_played_day = u.day - 1 THEN q.current_streak + 1 WHEN q.last_played_day >= u.day THEN q.current_streak ELSE 1 END AS next
        FROM updated u JOIN players q ON q.id = u.player_id
      ) s
      WHERE p.id = ${playerId}
      RETURNING p.current_streak, p.best_streak, p.last_played_day::text AS last_played_day
    )
    SELECT u.result, u.score, u.elapsed, w.score AS weekly_score, w.elapsed AS weekly_elapsed, s.current_streak, s.best_streak, s.last_played_day
    FROM updated u LEFT JOIN weekly w ON true LEFT JOIN streak s ON true`;
  const row = rows[0];
  if (row) return { ok: true, value: { result: row.result, elapsed: Number(row.elapsed), applied: true, streak: streakView(storedStreak(row), day), totals: { daily: { score: Number(row.score), elapsed: Number(row.elapsed) }, weekly: { score: Number(row.weekly_score), elapsed: Number(row.weekly_elapsed) } } } };
  // Lost the race to a concurrent submit: re-read in a new statement so the winner's
  // commit is visible (this statement's snapshot predates it).
  const saved: Row[] = await sql`SELECT result, elapsed FROM attempts WHERE player_id = ${playerId} AND day = ${day}`;
  return { ok: true, value: { result: saved[0]?.result ?? null, elapsed: saved[0] ? Number(saved[0].elapsed) : null, applied: false, streak: await readStreak(sql, playerId, day), totals: null } };
}
