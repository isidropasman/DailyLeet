import { test } from "node:test";
import { strict as assert } from "node:assert";
import { challenges, scheduleFor } from "../src/lib/challenges";
import { practiceUnlocked } from "../src/lib/practice";

test("today's challenge is locked in practice until the player submits it", () => {
  const today = "2026-11-18";
  const kind = scheduleFor(today).kind;
  assert.equal(practiceUnlocked(kind, today, false), false);
  assert.equal(practiceUnlocked(kind, today, true), true);
});

test("a hard challenge scheduled later is locked, and unlocks after its day", () => {
  const later = "2026-11-28";
  const kind = scheduleFor(later).kind;
  assert.equal(practiceUnlocked(kind, "2026-11-16", false), false);
  assert.equal(practiceUnlocked(kind, "2026-11-29", false), true);
});

test("legacy tutorial challenges stay practicable unless they are today's daily", () => {
  const today = "2026-11-16";
  const daily = scheduleFor(today).kind;
  for (const kind of ["two-sum", "brackets", "stock", "move-zeroes", "anagram", "substring"] as const) {
    assert.equal(practiceUnlocked(kind, today, false), kind !== daily, kind);
  }
});

test("on the first plan day only tutorials are practicable", () => {
  const open = challenges.filter(c => practiceUnlocked(c.kind, "2026-11-16", false)).map(c => c.kind);
  assert.deepEqual(open.sort(), ["anagram", "brackets", "move-zeroes", "stock", "substring", "two-sum"]);
});
