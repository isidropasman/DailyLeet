import { randomUUID } from "node:crypto";
import { database } from "./db";

export async function resolveIdentity(guestId: string | undefined, authId: string | null): Promise<{ id: string; name: string; authenticated: boolean }> {
  const sql = database();
  const guests = guestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(guestId)
    ? await sql`SELECT id, name, clerk_user_id FROM players WHERE id = ${guestId}` : [];
  const guest = guests[0];
  if (!authId) {
    if (guest && guest.clerk_user_id === null) return { id: guest.id as string, name: guest.name as string, authenticated: false };
    const id = randomUUID();
    const displayName = `Coder ${id.slice(0,4)}`;
    await sql`INSERT INTO players (id, name) VALUES (${id}, ${displayName})`;
    return { id, name: displayName, authenticated: false };
  }
  let accounts = await sql`SELECT id, name FROM players WHERE clerk_user_id = ${authId}`;
  if (!accounts.length) {
    const id = randomUUID();
    const displayName = guest?.clerk_user_id === null ? guest.name as string : `Coder ${id.slice(0,4)}`;
    accounts = await sql`INSERT INTO players (id, name, clerk_user_id) VALUES (${id}, ${displayName}, ${authId}) ON CONFLICT (clerk_user_id) DO UPDATE SET clerk_user_id = EXCLUDED.clerk_user_id RETURNING id, name`;
  }
  const account = accounts[0];
  const id = account.id as string;
  if (guest && guest.id !== id && guest.clerk_user_id === null) {
    // Only unclaimed guest rows can move; an existing account's daily attempt wins conflicts.
    await sql.transaction([
      sql`INSERT INTO attempts (player_id, day, started_at, choices, result, elapsed) SELECT ${id}, a.day, a.started_at, a.choices, a.result, a.elapsed FROM attempts a JOIN players p ON p.id = a.player_id WHERE p.id = ${guest.id} AND p.clerk_user_id IS NULL ON CONFLICT DO NOTHING`,
      sql`INSERT INTO memberships (group_code, player_id) SELECT m.group_code, ${id} FROM memberships m JOIN players p ON p.id = m.player_id WHERE p.id = ${guest.id} AND p.clerk_user_id IS NULL ON CONFLICT DO NOTHING`,
      sql`UPDATE friend_groups SET owner_id = ${id} WHERE owner_id = ${guest.id} AND EXISTS (SELECT 1 FROM players WHERE id = ${guest.id} AND clerk_user_id IS NULL)`,
      sql`DELETE FROM attempts WHERE player_id = ${guest.id} AND EXISTS (SELECT 1 FROM players WHERE id = ${guest.id} AND clerk_user_id IS NULL)`,
      sql`DELETE FROM memberships WHERE player_id = ${guest.id} AND EXISTS (SELECT 1 FROM players WHERE id = ${guest.id} AND clerk_user_id IS NULL)`,
      sql`DELETE FROM weekly_scores WHERE player_id = ${guest.id} AND EXISTS (SELECT 1 FROM players WHERE id = ${guest.id} AND clerk_user_id IS NULL)`,
      // Moved attempts can land on any past day, so derived totals are rebuilt from
      // attempts instead of incremented.
      sql`INSERT INTO weekly_scores (week_start, player_id, score, elapsed, days)
          SELECT day - (extract(isodow FROM day)::int - 1), player_id, SUM(score)::int, SUM(elapsed)::int, COUNT(*)::int
          FROM attempts WHERE player_id = ${id} AND score IS NOT NULL GROUP BY 1, 2
          ON CONFLICT (week_start, player_id) DO UPDATE SET score = EXCLUDED.score, elapsed = EXCLUDED.elapsed, days = EXCLUDED.days`,
      sql`WITH islands AS (
            SELECT day, day - (row_number() OVER (ORDER BY day))::int AS grp FROM attempts WHERE player_id = ${id} AND result IS NOT NULL
          ), runs AS (SELECT max(day) AS last, count(*)::int AS len FROM islands GROUP BY grp)
          UPDATE players SET
            current_streak = COALESCE((SELECT len FROM runs ORDER BY last DESC LIMIT 1), 0),
            best_streak = COALESCE((SELECT max(len) FROM runs), 0),
            last_played_day = (SELECT max(last) FROM runs)
          WHERE id = ${id}`,
      sql`DELETE FROM players WHERE id = ${guest.id} AND clerk_user_id IS NULL`,
    ]);
  }
  return { id, name: account.name as string, authenticated: true };
}
