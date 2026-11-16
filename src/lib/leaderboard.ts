import type { Row, Sql } from "./db";

export const BOARD_SIZE = 50;

export type Entry = { playerId: string; name: string; score: number; elapsed: number };
export type Leader = { name: string; score: number; elapsed: number; me: boolean };
// elapsed === null means the bucket spans every elapsed value for that score.
export type Bucket = { score: number; elapsed: number | null; players: number };
export type Rank = { rank: number; total: number };

function entries(rows: Row[]): Entry[] {
  return rows.map(row => ({ playerId: String(row.player_id), name: String(row.name), score: Number(row.score), elapsed: Number(row.elapsed) }));
}

function buckets(rows: Row[]): Bucket[] {
  return rows.map(row => ({ score: Number(row.score), elapsed: row.elapsed === null || row.elapsed === undefined ? null : Number(row.elapsed), players: Number(row.players) }));
}

// Must match the SQL ORDER BY (uuid compares like its lowercase hex text).
export function compareEntries(a: Entry, b: Entry): number {
  return b.score - a.score || a.elapsed - b.elapsed || (a.playerId < b.playerId ? -1 : a.playerId > b.playerId ? 1 : 0);
}

// The global board is accounts-only: a throwaway guest can't put a peeked perfect run on it.
// Group boards keep guests because members know each other.
export async function dailyBoard(sql: Sql, day: string): Promise<Entry[]> {
  return entries(await sql`
    SELECT a.player_id, p.name, a.score, a.elapsed FROM attempts a JOIN players p ON p.id = a.player_id
    WHERE a.day = ${day} AND a.score IS NOT NULL AND p.clerk_user_id IS NOT NULL ORDER BY a.score DESC, a.elapsed ASC, a.player_id ASC LIMIT ${BOARD_SIZE}`);
}

export async function weeklyBoard(sql: Sql, weekStart: string): Promise<Entry[]> {
  return entries(await sql`
    SELECT w.player_id, p.name, w.score, w.elapsed FROM weekly_scores w JOIN players p ON p.id = w.player_id
    WHERE w.week_start = ${weekStart} AND p.clerk_user_id IS NOT NULL ORDER BY w.score DESC, w.elapsed ASC, w.player_id ASC LIMIT ${BOARD_SIZE}`);
}

export async function groupDailyBoard(sql: Sql, group: string, day: string): Promise<Entry[]> {
  return entries(await sql`
    SELECT a.player_id, p.name, a.score, a.elapsed FROM memberships m
    JOIN attempts a ON a.player_id = m.player_id AND a.day = ${day} JOIN players p ON p.id = m.player_id
    WHERE m.group_code = ${group} AND a.score IS NOT NULL ORDER BY a.score DESC, a.elapsed ASC, a.player_id ASC LIMIT ${BOARD_SIZE}`);
}

export async function groupWeeklyBoard(sql: Sql, group: string, weekStart: string): Promise<Entry[]> {
  return entries(await sql`
    SELECT w.player_id, p.name, w.score, w.elapsed FROM memberships m
    JOIN weekly_scores w ON w.player_id = m.player_id AND w.week_start = ${weekStart} JOIN players p ON p.id = m.player_id
    WHERE m.group_code = ${group} ORDER BY w.score DESC, w.elapsed ASC, w.player_id ASC LIMIT ${BOARD_SIZE}`);
}

export async function myEntries(sql: Sql, playerId: string, day: string, weekStart: string): Promise<{ daily: Entry | null; weekly: Entry | null }> {
  const rows: Row[] = await sql`
    SELECT p.id AS player_id, p.name, a.score AS daily_score, a.elapsed AS daily_elapsed, w.score AS weekly_score, w.elapsed AS weekly_elapsed
    FROM players p LEFT JOIN attempts a ON a.player_id = p.id AND a.day = ${day} AND a.score IS NOT NULL
    LEFT JOIN weekly_scores w ON w.player_id = p.id AND w.week_start = ${weekStart} WHERE p.id = ${playerId}`;
  const row = rows[0];
  if (!row) return { daily: null, weekly: null };
  const entry = (score: unknown, elapsed: unknown): Entry | null => score === null ? null : { playerId, name: String(row.name), score: Number(score), elapsed: Number(elapsed) };
  return { daily: entry(row.daily_score, row.daily_elapsed), weekly: entry(row.weekly_score, row.weekly_elapsed) };
}

// The cached board can predate the viewer's own submit; their fresh entry replaces
// whatever the cache holds so they see themselves immediately.
export function leadersFor(board: Entry[], playerId: string, mine: Entry | null): Leader[] {
  const merged = board.filter(entry => entry.playerId !== playerId);
  if (mine) merged.push(mine);
  return merged.sort(compareEntries).slice(0, BOARD_SIZE).map(entry => ({ name: entry.name, score: entry.score, elapsed: entry.elapsed, me: entry.playerId === playerId }));
}

export function qualifiesForBoard(board: Entry[], entry: Entry): boolean {
  const others = board.filter(other => other.playerId !== entry.playerId);
  return others.length < BOARD_SIZE || compareEntries(entry, others[BOARD_SIZE - 1]) < 0;
}

export async function dailyBuckets(sql: Sql, day: string): Promise<Bucket[]> {
  return buckets(await sql`SELECT a.score, a.elapsed, count(*)::int AS players FROM attempts a JOIN players p ON p.id = a.player_id WHERE a.day = ${day} AND a.score IS NOT NULL AND p.clerk_user_id IS NOT NULL GROUP BY a.score, a.elapsed`);
}

export async function weeklyBuckets(sql: Sql, weekStart: string): Promise<Bucket[]> {
  return buckets(await sql`SELECT w.score, NULL::int AS elapsed, count(*)::int AS players FROM weekly_scores w JOIN players p ON p.id = w.player_id WHERE w.week_start = ${weekStart} AND p.clerk_user_id IS NOT NULL GROUP BY w.score`);
}

// Players in the viewer's own bucket that sort ahead of them; exact and index-bounded
// to a single bucket, while the cross-bucket part comes from the (cached) histogram.
export async function dailyPeersAhead(sql: Sql, day: string, mine: Entry): Promise<number> {
  const rows: Row[] = await sql`SELECT count(*)::int AS n FROM attempts a JOIN players p ON p.id = a.player_id WHERE a.day = ${day} AND a.score = ${mine.score} AND a.elapsed = ${mine.elapsed} AND a.player_id < ${mine.playerId} AND p.clerk_user_id IS NOT NULL`;
  return Number(rows[0].n);
}

export async function weeklyPeersAhead(sql: Sql, weekStart: string, mine: Entry): Promise<number> {
  const rows: Row[] = await sql`SELECT count(*)::int AS n FROM weekly_scores w JOIN players p ON p.id = w.player_id WHERE w.week_start = ${weekStart} AND w.score = ${mine.score} AND (w.elapsed, w.player_id) < (${mine.elapsed}, ${mine.playerId}::uuid) AND p.clerk_user_id IS NOT NULL`;
  return Number(rows[0].n);
}

export function rankFrom(histogram: Bucket[], mine: Entry, peersAhead: number): Rank {
  let ahead = 0;
  let total = 0;
  for (const bucket of histogram) {
    total += bucket.players;
    if (bucket.score > mine.score || (bucket.elapsed !== null && bucket.score === mine.score && bucket.elapsed < mine.elapsed)) ahead += bucket.players;
  }
  const rank = ahead + peersAhead + 1;
  return { rank, total: Math.max(total, rank) };
}
