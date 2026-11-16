import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { inBatches, newPlayer, play, reset, scored, testDatabase } from "./helpers";
import { dailyBoard, dailyBuckets, dailyPeersAhead, groupDailyBoard, groupWeeklyBoard, rankFrom, weeklyBoard, weeklyBuckets, weeklyPeersAhead, type Entry } from "../../src/lib/leaderboard";
import { readStreak, startAttempt, submitAttempt } from "../../src/lib/submission";
import { resolveIdentity } from "../../src/lib/identity";

const sql = testDatabase();
const MONDAY = "2030-01-07";
const day = (offset: number) => new Date(Date.parse(`${MONDAY}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);

beforeEach(() => reset(sql));
after(() => reset(sql));

test("streak counts consecutive UTC days, resets after a gap and keeps the best run", async () => {
  const id = await newPlayer(sql);
  for (const offset of [0, 1, 2]) await play(sql, id, day(offset), 50);
  assert.deepEqual(await readStreak(sql, id, day(2)), { current: 3, best: 3, lastPlayedDay: day(2), playedToday: true });
  assert.deepEqual(await readStreak(sql, id, day(3)), { current: 3, best: 3, lastPlayedDay: day(2), playedToday: false }, "still alive the next day until it's missed");
  assert.equal((await readStreak(sql, id, day(4)))?.current, 0, "a missed day breaks the streak on read");
  const outcome = await play(sql, id, day(4), 50);
  assert.ok(outcome.ok);
  assert.deepEqual(outcome.value.streak, { current: 1, best: 3, lastPlayedDay: day(4), playedToday: true });
  await play(sql, id, day(5), 50);
  assert.deepEqual(await readStreak(sql, id, day(5)), { current: 2, best: 3, lastPlayedDay: day(5), playedToday: true });
});

test("a started but unsubmitted attempt does not count toward the streak", async () => {
  const id = await newPlayer(sql);
  await play(sql, id, day(0), 50);
  await startAttempt(sql, id, day(1));
  assert.equal((await readStreak(sql, id, day(2)))?.current, 0);
});

test("timed-out submissions still count as played", async () => {
  const id = await newPlayer(sql);
  await startAttempt(sql, id, day(0));
  const outcome = await submitAttempt(sql, { playerId: id, day: day(0), choices: null, evaluate: scored(99), timeoutFeedback: "timeout" });
  assert.ok(outcome.ok && outcome.value.applied);
  assert.equal((outcome.value.result as { score: number }).score, 1);
  assert.equal(outcome.value.streak?.current, 1);
});

test("daily board orders by score desc, elapsed asc, then player id; matches the old query's order", async () => {
  const ids = await inBatches(Array.from({ length: 8 }, (_, i) => i), 100, i => newPlayer(sql, `p${i}`));
  const plays: [number, number][] = [[90, 30], [90, 10], [70, 5], [90, 10], [100, 200], [70, 5], [1, 300], [90, 10]];
  await inBatches(ids, 100, (id, i) => play(sql, id, day(0), plays[i][0], plays[i][1]));
  const board = await dailyBoard(sql, day(0));
  assert.equal(board.length, 8);
  for (let i = 1; i < board.length; i++) {
    const [a, b] = [board[i - 1], board[i]];
    assert.ok(a.score > b.score || (a.score === b.score && (a.elapsed < b.elapsed || (a.elapsed === b.elapsed && a.playerId < b.playerId))), `row ${i} out of order`);
  }
  assert.deepEqual(board.map(e => [e.score, e.elapsed]), [[100, 200], [90, 10], [90, 10], [90, 10], [90, 30], [70, 5], [70, 5], [1, 300]]);
  const old = await sql`SELECT p.name, (a.result->>'score')::int AS score, a.elapsed FROM attempts a JOIN players p ON p.id = a.player_id WHERE a.day = ${day(0)} AND a.result IS NOT NULL ORDER BY score DESC, a.elapsed ASC LIMIT 50`;
  assert.deepEqual(board.map(e => [e.score, e.elapsed]), old.map(r => [r.score, r.elapsed]));
});

test("weekly_scores equals the old SUM aggregation, including order and the group board", async () => {
  const ids = await inBatches(Array.from({ length: 30 }, (_, i) => i), 100, i => newPlayer(sql, `w${i}`));
  let seed = 7;
  const next = (n: number) => { seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648; return seed % n; };
  for (let offset = 0; offset < 7; offset++) {
    await inBatches(ids.filter(() => next(3) > 0), 100, id => play(sql, id, day(offset), 1 + next(100), next(300)));
  }
  await play(sql, ids[0], day(7), 100);
  const weekEnd = day(6);
  const old = await sql`SELECT p.id AS player_id, SUM((a.result->>'score')::int)::int AS score, SUM(a.elapsed)::int AS elapsed FROM attempts a JOIN players p ON p.id = a.player_id WHERE a.day >= ${MONDAY} AND a.day <= ${weekEnd} AND a.result IS NOT NULL GROUP BY p.id, p.name ORDER BY score DESC, elapsed ASC, p.id ASC LIMIT 50`;
  const board = await weeklyBoard(sql, MONDAY);
  assert.deepEqual(board.map(e => [e.playerId, e.score, e.elapsed]), old.map(r => [r.player_id, r.score, r.elapsed]));
  const drift = await sql`
    SELECT count(*)::int AS n FROM (
      SELECT day - (extract(isodow FROM day)::int - 1) AS week_start, player_id, SUM(score)::int AS score, SUM(elapsed)::int AS elapsed, COUNT(*)::int AS days FROM attempts WHERE score IS NOT NULL GROUP BY 1, 2
      EXCEPT SELECT week_start, player_id, score, elapsed, days FROM weekly_scores
    ) d`;
  assert.equal(drift[0].n, 0);
  const code = randomUUID().replaceAll("-", "").slice(0, 24);
  await sql`INSERT INTO friend_groups (code, name, owner_id) VALUES (${code}, 'g', ${ids[0]})`;
  for (const id of ids.slice(0, 10)) await sql`INSERT INTO memberships (group_code, player_id) VALUES (${code}, ${id})`;
  const oldGroup = await sql`SELECT p.id AS player_id, SUM((a.result->>'score')::int)::int AS score, SUM(a.elapsed)::int AS elapsed FROM attempts a JOIN players p ON p.id = a.player_id JOIN memberships m ON m.player_id = p.id WHERE a.day >= ${MONDAY} AND a.day <= ${weekEnd} AND a.result IS NOT NULL AND m.group_code = ${code} GROUP BY p.id, p.name ORDER BY score DESC, elapsed ASC, p.id ASC LIMIT 50`;
  assert.deepEqual((await groupWeeklyBoard(sql, code, MONDAY)).map(e => [e.playerId, e.score, e.elapsed]), oldGroup.map(r => [r.player_id, r.score, r.elapsed]));
  const oldGroupDaily = await sql`SELECT p.id AS player_id, (a.result->>'score')::int AS score, a.elapsed FROM attempts a JOIN players p ON p.id = a.player_id JOIN memberships m ON m.player_id = p.id WHERE a.day = ${day(3)} AND a.result IS NOT NULL AND m.group_code = ${code} ORDER BY score DESC, a.elapsed ASC, p.id ASC`;
  assert.deepEqual((await groupDailyBoard(sql, code, day(3))).map(e => [e.playerId, e.score, e.elapsed]), oldGroupDaily.map(r => [r.player_id, r.score, r.elapsed]));
});

test("rank from histogram + peers matches a full sort for every player", async () => {
  const ids = await inBatches(Array.from({ length: 40 }, (_, i) => i), 100, i => newPlayer(sql, `r${i}`));
  await inBatches(ids, 100, (id, i) => play(sql, id, day(0), [100, 90, 90, 50][i % 4], [10, 100, 20, 0][i % 3]));
  await inBatches(ids.slice(0, 25), 100, (id, i) => play(sql, id, day(1), [80, 80, 60][i % 3], 5));
  const daily = await sql`SELECT player_id, score, elapsed FROM attempts WHERE day = ${day(0)} AND score IS NOT NULL ORDER BY score DESC, elapsed, player_id`;
  const histogram = await dailyBuckets(sql, day(0));
  for (const [index, row] of daily.entries()) {
    const mine: Entry = { playerId: String(row.player_id), name: "", score: Number(row.score), elapsed: Number(row.elapsed) };
    assert.deepEqual(rankFrom(histogram, mine, await dailyPeersAhead(sql, day(0), mine)), { rank: index + 1, total: daily.length });
  }
  const weekly = await sql`SELECT player_id, score, elapsed FROM weekly_scores WHERE week_start = ${MONDAY} ORDER BY score DESC, elapsed, player_id`;
  const weeklyHistogram = await weeklyBuckets(sql, MONDAY);
  for (const [index, row] of weekly.entries()) {
    const mine: Entry = { playerId: String(row.player_id), name: "", score: Number(row.score), elapsed: Number(row.elapsed) };
    assert.deepEqual(rankFrom(weeklyHistogram, mine, await weeklyPeersAhead(sql, MONDAY, mine)), { rank: index + 1, total: weekly.length });
  }
});

test("double submit is idempotent: same result, aggregates applied once", async () => {
  const id = await newPlayer(sql);
  const first = await play(sql, id, day(0), 70);
  const second = await submitAttempt(sql, { playerId: id, day: day(0), choices: [1, 1, 1], evaluate: scored(100), timeoutFeedback: "timeout" });
  assert.ok(first.ok && second.ok);
  assert.equal(first.value.applied, true);
  assert.equal(second.value.applied, false);
  assert.deepEqual(second.value.result, first.value.result);
  const weekly = await sql`SELECT score, days FROM weekly_scores WHERE player_id = ${id}`;
  assert.deepEqual(weekly.map(r => [r.score, r.days]), [[70, 1]]);
  assert.equal(second.value.streak?.current, 1);
});

test("submit before start is a domain error, not an exception", async () => {
  const id = await newPlayer(sql);
  assert.deepEqual(await submitAttempt(sql, { playerId: id, day: day(0), choices: [0, 0, 0], evaluate: scored(5), timeoutFeedback: "timeout" }), { ok: false, error: "not-started" });
});

test("concurrent submits for one player apply exactly once and all return the stored result", async () => {
  const id = await newPlayer(sql);
  await startAttempt(sql, id, day(0));
  const outcomes = await Promise.all(Array.from({ length: 25 }, (_, i) => submitAttempt(sql, { playerId: id, day: day(0), choices: [0, 0, 0], evaluate: scored(10 + i), timeoutFeedback: "timeout" })));
  const applied = outcomes.filter(o => o.ok && o.value.applied);
  assert.equal(applied.length, 1);
  const stored = await sql`SELECT result FROM attempts WHERE player_id = ${id}`;
  for (const outcome of outcomes) assert.ok(outcome.ok && outcome.value.result !== null && JSON.stringify(outcome.value.result) === JSON.stringify(stored[0].result));
  const weekly = await sql`SELECT score, days FROM weekly_scores WHERE player_id = ${id}`;
  assert.deepEqual(weekly.map(r => [r.days]), [[1]]);
  assert.equal((await readStreak(sql, id, day(0)))?.current, 1);
});

test("concurrent starts for one player all return the same started_at", async () => {
  const id = await newPlayer(sql);
  const rows = await Promise.all(Array.from({ length: 20 }, () => startAttempt(sql, id, day(0))));
  assert.ok(rows.every(row => row !== undefined));
  assert.equal(new Set(rows.map(row => String(row.started_at))).size, 1);
});

test("concurrent submits across players keep weekly totals exact", async () => {
  const ids = await inBatches(Array.from({ length: 60 }, (_, i) => i), 100, i => newPlayer(sql, `c${i}`));
  await inBatches(ids, 100, id => play(sql, id, day(0), 40));
  await inBatches(ids, 100, id => Promise.all([play(sql, id, day(1), 60), play(sql, id, day(1), 60)]));
  const totals = await sql`SELECT count(*)::int AS players, SUM(score)::int AS score, SUM(days)::int AS days FROM weekly_scores WHERE week_start = ${MONDAY}`;
  assert.deepEqual(totals[0], { players: 60, score: 60 * 100, days: 120 });
  const streaks = await sql`SELECT DISTINCT current_streak, best_streak FROM players`;
  assert.deepEqual(streaks.map(r => [r.current_streak, r.best_streak]), [[2, 2]]);
});

test("guest merge into an account rebuilds weekly totals and streak", async () => {
  const guest = await newPlayer(sql, "guest", { guest: true });
  const authId = `user_${randomUUID()}`;
  const account = await resolveIdentity(undefined, authId);
  await play(sql, account.id, day(0), 30);
  await play(sql, guest, day(0), 99);
  await play(sql, guest, day(1), 20);
  await play(sql, guest, day(2), 10);
  const merged = await resolveIdentity(guest, authId);
  assert.equal(merged.id, account.id);
  const weekly = await sql`SELECT player_id, score, days FROM weekly_scores`;
  assert.deepEqual(weekly.map(r => [r.player_id, r.score, r.days]), [[account.id, 60, 3]], "account's own day-0 attempt wins the conflict");
  assert.deepEqual(await readStreak(sql, account.id, day(2)), { current: 3, best: 3, lastPlayedDay: day(2), playedToday: true });
  assert.equal((await sql`SELECT 1 FROM players WHERE id = ${guest}`).length, 0);
});

test("the global board and ranks only count accounts; groups still include guests", async () => {
  const account = await newPlayer(sql, "account");
  const guest = await newPlayer(sql, "guest", { guest: true });
  await play(sql, account, day(0), 50, 10);
  await play(sql, guest, day(0), 100, 5);
  assert.deepEqual((await dailyBoard(sql, day(0))).map(e => e.playerId), [account]);
  assert.deepEqual((await weeklyBoard(sql, MONDAY)).map(e => e.playerId), [account]);
  const mine: Entry = { playerId: account, name: "", score: 50, elapsed: 10 };
  assert.deepEqual(rankFrom(await dailyBuckets(sql, day(0)), mine, await dailyPeersAhead(sql, day(0), mine)), { rank: 1, total: 1 });
  assert.deepEqual(rankFrom(await weeklyBuckets(sql, MONDAY), mine, await weeklyPeersAhead(sql, MONDAY, mine)), { rank: 1, total: 1 });
  const code = randomUUID().replaceAll("-", "").slice(0, 24);
  await sql`INSERT INTO friend_groups (code, name, owner_id) VALUES (${code}, 'g', ${account})`;
  for (const id of [account, guest]) await sql`INSERT INTO memberships (group_code, player_id) VALUES (${code}, ${id})`;
  assert.deepEqual((await groupDailyBoard(sql, code, day(0))).map(e => e.playerId), [guest, account]);
  assert.deepEqual((await groupWeeklyBoard(sql, code, MONDAY)).map(e => e.playerId), [guest, account]);
});
