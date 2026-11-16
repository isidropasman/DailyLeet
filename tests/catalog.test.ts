import { test } from "node:test";
import assert from "node:assert/strict";
import { challenges, dailyChallenge, scheduleFor, weeklyPlan, type Choices, type LegacyKind } from "../src/lib/challenges";
import { modules } from "../src/lib/challenges/registry";
import { evaluate, run, type RunResult } from "../src/lib/engine";

const outputOf = (result: RunResult) => (result.ok ? result.output : result.error);
import { generateCode, previewCode } from "../src/lib/program";

test("new challenges provide working alternatives and reject plausible wrong decisions", () => {
  const paths: [LegacyKind, Choices[]][] = [
    ["stock", [[0,0,0],[1,0,0]]],
    ["move-zeroes", [[0,0,0],[1,0,0]]],
    ["anagram", [[0,0,0],[0,1,0],[1,0,0]]],
  ];
  for (const [kind, valid] of paths) {
    for (const choices of valid) {
      const result = evaluate(kind, choices, 120);
      assert.equal(result.total, 12);
      assert.equal(result.passed, 12, `${kind}: ${choices}`);
    }
    assert.ok(evaluate(kind, [0,0,1], 120).passed < 12);
    for (let a=0;a<4;a++) for (let b=0;b<4;b++) for(let c=0;c<4;c++) {
      const result = evaluate(kind, [a,b,c], 100);
      assert.ok(result.score >= 1 && result.score <= 100);
      assert.ok(generateCode(kind, [a,b,c]).includes("function solve"));
    }
    assert.notEqual(previewCode(kind, [0,-1,-1]), previewCode(kind, [0,0,-1]));
  }
});

test("stock respects time order, zero profit, and multiple local valleys", () => {
  assert.equal(outputOf(run("stock", [0,0,0], [9,7,4,1])), 0);
  assert.equal(outputOf(run("stock", [0,0,0], [3,2,6,1,4])), 4);
});

test("move zeroes preserves order and requires mutating the input rather than returning a new array", () => {
  assert.deepEqual(outputOf(run("move-zeroes", [0,0,0], [0,-2,0,4,-1])), [-2,4,-1,0,0]);
  assert.ok(evaluate("move-zeroes", [2,0,0], 100).passed < 12);
});

test("anagram checks multiplicities, not just length, sets or character sums", () => {
  assert.equal(outputOf(run("anagram", [0,0,0], "aab", 0, "aba")), true);
  assert.equal(outputOf(run("anagram", [0,0,0], "aab", 0, "abb")), false);
  assert.equal(outputOf(run("anagram", [0,0,0], "ad", 0, "bc")), false);
});

const utc = (day: string) => new Date(`${day}T12:00:00Z`);
const addDays = (day: string, days: number) => new Date(Date.parse(day) + days * 86_400_000).toISOString().slice(0, 10);

test("already-issued days keep their original challenge", () => {
  const legacy = ["substring", "two-sum", "brackets", "stock", "move-zeroes", "anagram"];
  const rollout = Math.floor(Date.parse("2026-11-14") / 86_400_000);
  for (let day = "2026-01-01"; day <= "2026-11-15"; day = addDays(day, 1)) {
    const dayNumber = Math.floor(Date.parse(day) / 86_400_000);
    const original = dayNumber < rollout ? legacy[dayNumber % 3] : legacy[(dayNumber - rollout + 3) % 6];
    assert.equal(dailyChallenge(utc(day)).kind, original, day);
  }
  assert.equal(dailyChallenge(utc("2026-11-12")).kind, "substring");
  assert.equal(dailyChallenge(utc("2026-11-13")).kind, "two-sum");
  assert.equal(dailyChallenge(utc("2026-11-14")).kind, "stock", "today was already served");
  assert.equal(dailyChallenge(utc("2026-11-15")).kind, "move-zeroes");
});

test("from 2026-11-16 the weekly plan alternates S1/S2 by week and falls back to the legacy rotation", () => {
  const issued = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];
  assert.deepEqual(issued.map(day => scheduleFor(day)), [
    { source: "plan", week: "S1", kind: "daily-temperatures" },
    { source: "plan", week: "S1", kind: "min-window" },
    { source: "plan", week: "S1", kind: "subarray-sum" },
    { source: "plan", week: "S1", kind: "koko" },
    { source: "plan", week: "S1", kind: "course-schedule" },
    { source: "plan", week: "S1", kind: "meeting-rooms" },
    { source: "plan", week: "S1", kind: "largest-rectangle" },
  ]);
  for (let offset = 0; offset < 28; offset++) {
    const day = addDays("2026-11-16", offset);
    const slot = scheduleFor(day);
    const week = Math.floor(offset / 7) % 2 === 0 ? "S1" : "S2";
    assert.equal(new Date(day).getUTCDay(), (offset + 1) % 7, "the plan starts on a Monday");
    if (slot.source === "legacy") assert.fail(`${day} must follow the plan`);
    assert.equal(slot.week, week, day);
    const planned = weeklyPlan[week][offset % 7];
    assert.equal(slot.source === "plan" ? slot.kind : slot.planned, planned, day);
    assert.equal(slot.source, Object.hasOwn(modules, planned) ? "plan" : "fallback", `${day}: implemented kinds are scheduled, the rest fall back`);
    assert.equal(dailyChallenge(utc(day)).kind, slot.kind, day);
  }
});

test("every planned kind is unique and every module is in the plan", () => {
  const planned = [...weeklyPlan.S1, ...weeklyPlan.S2];
  assert.equal(new Set(planned).size, 14);
  for (const kind of Object.keys(modules)) assert.ok(planned.some(item => item === kind), `${kind} is not in weeklyPlan`);
  assert.equal(challenges.length, 6 + Object.keys(modules).length, "legacy six stay available for practice");
});
