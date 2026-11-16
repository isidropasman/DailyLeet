import { test } from "node:test";
import assert from "node:assert/strict";
import { streakView } from "../src/lib/submission";

test("stored streak is aged on read in UTC days, across month and year boundaries", () => {
  const stored = { current: 4, best: 9, lastPlayedDay: "2026-12-31" };
  assert.deepEqual(streakView(stored, "2026-12-31"), { current: 4, best: 9, lastPlayedDay: "2026-12-31", playedToday: true });
  assert.deepEqual(streakView(stored, "2027-01-01"), { current: 4, best: 9, lastPlayedDay: "2026-12-31", playedToday: false });
  assert.equal(streakView(stored, "2027-01-02").current, 0);
  assert.equal(streakView({ current: 0, best: 0, lastPlayedDay: null }, "2027-01-02").current, 0);
  assert.equal(streakView({ current: 2, best: 2, lastPlayedDay: "2028-02-28" }, "2028-02-29").current, 2);
});
