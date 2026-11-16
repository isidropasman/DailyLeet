import { test } from "node:test";
import assert from "node:assert/strict";
import { BOARD_SIZE, compareEntries, leadersFor, qualifiesForBoard, rankFrom, type Entry } from "../src/lib/leaderboard";

const entry = (playerId: string, score: number, elapsed: number): Entry => ({ playerId, name: playerId, score, elapsed });

test("ordering is score desc, elapsed asc, then player id", () => {
  const sorted = [entry("b", 90, 10), entry("a", 90, 10), entry("c", 100, 300), entry("d", 90, 5)].sort(compareEntries);
  assert.deepEqual(sorted.map(e => e.playerId), ["c", "d", "a", "b"]);
});

test("viewer's fresh entry replaces a stale cached one and is flagged", () => {
  const cached = [entry("x", 80, 10), entry("me", 10, 100)];
  const leaders = leadersFor(cached, "me", entry("me", 95, 20));
  assert.deepEqual(leaders.map(l => [l.name, l.score, l.me]), [["me", 95, true], ["x", 80, false]]);
});

test("board stays capped and only top-changing entries qualify for revalidation", () => {
  const full = Array.from({ length: BOARD_SIZE }, (_, i) => entry(`p${String(i).padStart(2, "0")}`, 100 - i, 10));
  assert.equal(leadersFor(full, "me", entry("me", 1, 300)).length, BOARD_SIZE);
  assert.equal(leadersFor(full, "me", entry("me", 1, 300)).some(l => l.me), false);
  assert.equal(qualifiesForBoard(full, entry("me", 1, 300)), false);
  assert.equal(qualifiesForBoard(full, entry("me", 99, 0)), true);
  assert.equal(qualifiesForBoard(full.slice(0, 3), entry("me", 1, 300)), true);
});

test("rank adds cross-bucket histogram counts to exact in-bucket peers", () => {
  const histogram = [{ score: 100, elapsed: 30, players: 4 }, { score: 90, elapsed: 10, players: 3 }, { score: 90, elapsed: 50, players: 2 }, { score: 50, elapsed: 0, players: 7 }];
  assert.deepEqual(rankFrom(histogram, entry("me", 90, 50), 1), { rank: 9, total: 16 });
  assert.deepEqual(rankFrom([{ score: 300, elapsed: null, players: 2 }, { score: 200, elapsed: null, players: 5 }], entry("me", 200, 40), 3), { rank: 6, total: 7 });
  assert.deepEqual(rankFrom([], entry("me", 10, 10), 0), { rank: 1, total: 1 }, "stale empty histogram still yields a sane rank");
});
