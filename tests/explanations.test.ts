import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCase, evaluate } from "../src/lib/engine";
import { activeSteps, challenges, type Choices, type Kind } from "../src/lib/challenges";
import { explainResult, explanations, smallestFailing } from "../src/lib/explanations";

const kinds = challenges.map(c => c.kind);
const allChoices: Choices[] = [0, 1, 2, 3].flatMap(a => [0, 1, 2, 3].flatMap(m => [0, 1, 2, 3].map(r => [a, m, r] as Choices)));
const substitute = (kind: Kind, step: number, option: number): Choices => {
  const choices: Choices = [...explanations[kind].optimal];
  choices[step] = option;
  return choices;
};
const optimalTime = (kind: Kind, time: string) => (explanations[kind].optimalTime ?? /^O\(n\)/).test(time);

test("every kind has a complete explanation", () => {
  assert.deepEqual(Object.keys(explanations).sort(), [...kinds].sort());
  for (const kind of kinds) {
    const explanation = explanations[kind];
    assert.ok(explanation.keyIdea.summary && explanation.keyIdea.detail, kind);
    assert.ok(explanation.tradeOffs.length >= 2, kind);
    assert.ok(explanation.related.length >= 1 && explanation.related.every(r => r.url.startsWith("https://")), kind);
    assert.ok(explanation.pattern.heuristic && explanation.interview.question && explanation.interview.answer, kind);
    assert.equal(explanation.steps.length, 3);
    for (const step of explanation.steps) {
      assert.equal(step.length, 4);
      for (const option of step) assert.ok(option.why.length > 10, kind);
    }
  }
});

test("the optimal combination passes all cases and is efficient", () => {
  for (const kind of kinds) {
    const result = evaluate(kind, explanations[kind].optimal, 0);
    assert.equal(result.passed, result.total, kind);
    assert.ok(result.efficient, kind);
    assert.ok(optimalTime(kind, explanations[kind].cost(explanations[kind].optimal).time), kind);
  }
});

test("each verdict matches the engine when only that decision deviates from the optimal", () => {
  for (const kind of kinds) {
    const explanation = explanations[kind];
    explanation.steps.forEach((options, step) => options.forEach((option, index) => {
      const choices = substitute(kind, step, index);
      const where = `${kind} paso ${step} opción ${index}`;
      assert.ok(activeSteps(kind, choices[0]).includes(step), `${where} debería estar activa`);
      const result = evaluate(kind, choices, 0);
      if (option.verdict === "incorrecta") {
        assert.ok(result.passed < result.total, `${where} marcada incorrecta pero pasa todo`);
        const failing = smallestFailing(result.tests);
        const example = option.counterexample;
        assert.deepEqual([failing?.input, failing?.target, failing?.other], [example.input, example.target, example.other], `${where}: el contraejemplo debe ser el caso fallido más chico`);
        assert.ok(failing?.expected !== undefined, where);
        assert.equal(checkCase(kind, choices, { ...example, expected: failing.expected }).passed, false, `${where}: el contraejemplo no falla con el engine`);
      } else {
        assert.equal(result.passed, result.total, `${where} marcada correcta pero falla`);
        assert.equal(result.efficient, option.verdict === "óptima", `${where}: eficiencia inconsistente`);
        const time = explanation.cost(choices).time;
        assert.equal(optimalTime(kind, time), option.verdict === "óptima", `${where}: complejidad ${time} inconsistente con el veredicto`);
      }
    }));
  }
});

test("stated complexity agrees with the engine's efficiency for every passing combination", () => {
  for (const kind of kinds) for (const choices of allChoices) {
    const result = evaluate(kind, choices, 0);
    if (result.passed === result.total) assert.equal(optimalTime(kind, explanations[kind].cost(choices).time), result.efficient, `${kind} ${choices}`);
  }
});

test("explainResult is consistent with the engine for all 64 combinations", () => {
  for (const kind of kinds) for (const choices of allChoices) {
    const result = evaluate(kind, choices, 0);
    const explained = explainResult(kind, choices, result);
    const where = `${kind} ${choices}`;
    assert.ok(explained, where);
    const complete = result.passed === result.total;
    assert.equal(explained.status, !complete ? "incorrecta" : result.efficient ? "óptima" : "correcta pero más lenta", where);
    const used = activeSteps(kind, choices[0]);
    for (const summary of explained.choices) {
      assert.equal(summary.active, used.includes(summary.step), where);
      if (!summary.active) assert.equal(summary.verdict, null, where);
    }
    assert.equal(explained.skipped !== null, used.length < 3, where);
    if (complete) { assert.equal(explained.failure, null, where); continue; }
    assert.ok(explained.failure, where);
    assert.ok(explained.failure.culprit, `${where}: toda combinación que falla tiene una decisión incorrecta activa`);
    assert.ok(explained.failure.trace, where);
    const sizes = result.tests.filter(t => !t.passed).map(t => (t.input?.length ?? 0) + (t.other?.length ?? 0));
    const chosen = result.tests.find(t => t.label === explained.failure?.label);
    assert.equal((chosen?.input?.length ?? 0) + (chosen?.other?.length ?? 0), Math.min(...sizes), where);
    assert.equal(result.tests.findIndex(t => !t.passed && (t.input?.length ?? 0) + (t.other?.length ?? 0) === Math.min(...sizes)), result.tests.indexOf(chosen!), `${where}: ante empate, el primero`);
  }
});

test("explainResult describes the actual failing case and its mechanism", () => {
  const single = explainResult("substring", [0, 0, 1], evaluate("substring", [0, 0, 1], 0));
  assert.equal(single?.failure?.input, '"dvdf"');
  assert.equal(single?.failure?.expected, "3");
  assert.equal(single?.failure?.actual, "2");
  assert.equal(single?.failure?.culprit?.step, "Regla");
  assert.equal(single?.failure?.trace?.sameCase, true);

  const twoSum = explainResult("two-sum", [0, 0, 1], evaluate("two-sum", [0, 0, 1], 0));
  assert.equal(twoSum?.failure?.input, "[3], objetivo = 6");
  assert.equal(twoSum?.failure?.actual, "[0, 0]");

  const anagram = explainResult("anagram", [2, 0, 0], evaluate("anagram", [2, 0, 0], 0));
  assert.equal(anagram?.failure?.input, 's = "aab", t = "abb"');
  assert.match(anagram?.skipped ?? "", /Memoria y Regla/);

  const multiple = explainResult("stock", [0, 3, 1], evaluate("stock", [0, 3, 1], 0));
  assert.equal(multiple?.failure?.culprit?.step, "Memoria", "se culpa a la primera decisión incorrecta activa");
});

test("passing with an option that is wrong elsewhere is not labeled as a mistake", () => {
  const result = evaluate("brackets", [1, 0, 1], 0);
  assert.equal(result.passed, result.total);
  const explained = explainResult("brackets", [1, 0, 1], result);
  assert.equal(explained?.choices[2].verdict, "válida con tu enfoque");
  assert.equal(explained?.choices[1].active, false);
});

test("explainResult returns null without executed tests", () => {
  const empty = { score: 1, passed: 0, total: 12, efficient: false, tests: [], feedback: [] };
  assert.equal(explainResult("stock", [0, 0, 0], empty), null);
});
