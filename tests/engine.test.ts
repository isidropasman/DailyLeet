import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate, run, type RunResult } from "../src/lib/engine";

const outputOf = (result: RunResult) => (result.ok ? result.output : result.error);
import { generateCode, previewCode } from "../src/lib/program";
import { dailyChallenge, isChoices, type Choices } from "../src/lib/challenges";

test("both substring structures and exhaustive search are valid", () => {
  for (const choices of [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0]] as Choices[]) {
    const result = evaluate("substring", choices, 120);
    assert.equal(result.passed, result.total);
  }
  assert.equal(outputOf(run("substring", [0, 0, 0], "abba")), 2);
});
test("two-sum accepts multiple paths, duplicates and disallows reusing an index", () => {
  for (const choices of [[0, 0, 0], [0, 1, 0], [1, 0, 0]] as Choices[]) {
    const result = evaluate("two-sum", choices, 60);
    assert.equal(result.passed, result.total);
  }
  assert.ok(evaluate("two-sum", [0, 0, 1], 60).passed < evaluate("two-sum", [0, 0, 1], 60).total);
});
test("brackets accepts stack and reduction but rejects counting-only", () => {
  for (const choices of [[0, 0, 0], [1, 0, 0]] as Choices[]) {
    const result = evaluate("brackets", choices, 80);
    assert.equal(result.passed, result.total);
  }
  assert.equal(outputOf(run("brackets", [0, 0, 0], "([)]")), false);
  assert.equal(outputOf(run("brackets", [0, 0, 0], "")), true);
});
test("all 192 decision paths finish, return bounded scores and produce code", () => {
  for (const kind of ["substring", "two-sum", "brackets"] as const)
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
      const choices: Choices = [a,b,c];
      const result = evaluate(kind, choices, 300);
      assert.ok(result.score >= 1 && result.score <= 100);
      assert.ok(generateCode(kind, choices).length > 50);
    }
});
test("daily is stable in UTC and choices reject malformed external data", () => {
  assert.equal(dailyChallenge(new Date("2026-11-12T00:00:00Z")).kind, dailyChallenge(new Date("2026-11-12T23:59:59Z")).kind);
  for (const bad of [null, [0,0], [0,0,4], [0,0,"1"], [NaN,0,0]]) assert.equal(isChoices(bad), false);
});

test("code preview exposes each selected piece without inventing pending decisions", () => {
  const empty = previewCode("substring", [-1,-1,-1]);
  const approach = previewCode("substring", [0,-1,-1]);
  const memory = previewCode("substring", [0,1,-1]);
  assert.notEqual(empty, approach);
  assert.match(approach, /for \(let right/);
  assert.doesNotMatch(approach, /new Map|new Set/);
  assert.match(memory, /new Set<string>/);
  assert.notEqual(approach, memory);
  assert.equal(previewCode("substring", [0,1,0]), generateCode("substring", [0,1,0]));
  assert.match(generateCode("substring", [1,0,0]), /new Map<string, number>/);
});

test("evaluation includes real execution input, expected output and actual output", () => {
  const result = evaluate("substring", [0,0,1], 120);
  const failed = result.tests.find(item => !item.passed);
  assert.ok(failed);
  assert.ok("input" in failed && "expected" in failed && "actual" in failed);
  assert.notDeepEqual(failed.actual, failed.expected);
});

test("score rewards partial work and makes speed a small bonus", () => {
  const fast = evaluate("substring", [0,0,0], 0);
  const slow = evaluate("substring", [0,0,0], 300);
  const partial = evaluate("substring", [0,0,1], 120);
  assert.equal(fast.score - slow.score, 3);
  assert.equal(slow.score, 97);
  assert.ok(partial.breakdown && partial.breakdown.correctness > 0 && partial.breakdown.efficiency > 0);
  assert.equal(partial.score, partial.breakdown.correctness + partial.breakdown.efficiency + partial.breakdown.time);
  const exhaustive = evaluate("substring", [1,0,0], 300);
  assert.equal(exhaustive.score, 92);
});
