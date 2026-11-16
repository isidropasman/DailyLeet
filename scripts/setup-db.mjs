// Idempotent, additive schema migration. Safe to re-run at any time: every statement is
// IF NOT EXISTS / ON CONFLICT, and the derived tables (weekly_scores, player streaks) are
// recomputed from `attempts`, which stays the source of truth.
// Re-run it after deploying new code to reconcile submits handled by the previous version.
import { neon, neonConfig } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (process.env.DAILYLEET_LOCAL_NEON_ENDPOINT) neonConfig.fetchEndpoint = process.env.DAILYLEET_LOCAL_NEON_ENDPOINT;
const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS players (id uuid PRIMARY KEY, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`;
await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE`;
await sql`CREATE TABLE IF NOT EXISTS attempts (player_id uuid REFERENCES players(id), day date NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), choices jsonb, result jsonb, elapsed integer, PRIMARY KEY(player_id, day))`;
await sql`CREATE TABLE IF NOT EXISTS test_attempts (player_id uuid REFERENCES players(id), day date NOT NULL, run_id uuid NOT NULL, started_at timestamptz NOT NULL DEFAULT now(), choices jsonb, result jsonb, elapsed integer, PRIMARY KEY(player_id, day))`;
await sql`CREATE TABLE IF NOT EXISTS friend_groups (code text PRIMARY KEY, name text NOT NULL, owner_id uuid REFERENCES players(id), created_at timestamptz NOT NULL DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS memberships (group_code text REFERENCES friend_groups(code), player_id uuid REFERENCES players(id), PRIMARY KEY(group_code, player_id))`;

// Generated (not app-written) so code still writing only `result` — e.g. the previous
// deployment during a rollout — can never leave score out of sync.
await sql`ALTER TABLE attempts ADD COLUMN IF NOT EXISTS score integer GENERATED ALWAYS AS ((result->>'score')::int) STORED`;
await sql`ALTER TABLE attempts ADD COLUMN IF NOT EXISTS submitted_at timestamptz`;
await sql`CREATE INDEX IF NOT EXISTS attempts_daily_board ON attempts (day, score DESC, elapsed, player_id) WHERE score IS NOT NULL`;
// memberships' PK leads with group_code; "my groups" filters by player_id.
await sql`CREATE INDEX IF NOT EXISTS memberships_player ON memberships (player_id)`;

await sql`CREATE TABLE IF NOT EXISTS weekly_scores (week_start date NOT NULL, player_id uuid NOT NULL REFERENCES players(id), score integer NOT NULL, elapsed integer NOT NULL, days integer NOT NULL, PRIMARY KEY (week_start, player_id))`;
await sql`CREATE INDEX IF NOT EXISTS weekly_scores_board ON weekly_scores (week_start, score DESC, elapsed, player_id)`;

await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS best_streak integer NOT NULL DEFAULT 0`;
await sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS last_played_day date`;

// SHARE lock blocks submits (not reads) while derived data is rebuilt, so an increment
// can't land between the aggregate snapshot and the overwrite and get lost.
await sql.transaction([
  sql`LOCK TABLE attempts IN SHARE MODE`,
  sql`INSERT INTO weekly_scores (week_start, player_id, score, elapsed, days)
      SELECT day - (extract(isodow FROM day)::int - 1), player_id, SUM(score)::int, SUM(elapsed)::int, COUNT(*)::int
      FROM attempts WHERE score IS NOT NULL GROUP BY 1, 2
      ON CONFLICT (week_start, player_id) DO UPDATE SET score = EXCLUDED.score, elapsed = EXCLUDED.elapsed, days = EXCLUDED.days
      WHERE (weekly_scores.score, weekly_scores.elapsed, weekly_scores.days) IS DISTINCT FROM (EXCLUDED.score, EXCLUDED.elapsed, EXCLUDED.days)`,
  sql`DELETE FROM weekly_scores w WHERE NOT EXISTS (
        SELECT 1 FROM attempts a WHERE a.player_id = w.player_id AND a.score IS NOT NULL
        AND a.day >= w.week_start AND a.day < w.week_start + 7)`,
  sql`WITH islands AS (
        SELECT player_id, day, day - (row_number() OVER (PARTITION BY player_id ORDER BY day))::int AS grp
        FROM attempts WHERE result IS NOT NULL
      ), runs AS (
        SELECT player_id, max(day) AS last, count(*)::int AS len FROM islands GROUP BY player_id, grp
      ), stats AS (
        SELECT DISTINCT ON (player_id) player_id, len AS current, last, max(len) OVER (PARTITION BY player_id) AS best
        FROM runs ORDER BY player_id, last DESC
      )
      UPDATE players p SET current_streak = s.current, best_streak = s.best, last_played_day = s.last
      FROM stats s WHERE p.id = s.player_id
      AND (p.current_streak, p.best_streak, p.last_played_day) IS DISTINCT FROM (s.current, s.best, s.last)`,
]);
process.stdout.write('Database schema ready.\n');
