import { test } from "node:test";
import { strict as assert } from "node:assert";
import { previewInLanguage } from "../src/lib/language-preview";

test("JavaScript preview removes TypeScript annotations and preserves the selected algorithm", () => {
  const source = previewInLanguage("two-sum", [0, 0, 0], "javascript");
  assert.match(source, /function solve\(nums, target\)/);
  assert.match(source, /seen\.get\(complement\)/);
  assert.doesNotMatch(source, /number\[\]|Map<number/);
  assert.doesNotThrow(() => new Function(`${source}; return solve;`)());
});

test("unfinished choices remain visible in JavaScript", () => {
  const source = previewInLanguage("substring", [-1, -1, -1], "javascript");
  assert.match(source, /Pendiente|Elegí/);
  assert.doesNotMatch(source, /: string/);
});

test("Python preview contains selected stock strategy", async () => {
  const { pythonPreview } = await import("../src/lib/python-preview");
  const source = pythonPreview("stock", [0, 0, 0]);
  assert.match(source, /best = max\(best, gain\)/);
  assert.match(source, /buy = min\(buy, prices\[i\]\)/);
});

test("every selectable language renders a full and a pending preview for every challenge", async () => {
  const { previewLanguages } = await import("../src/lib/language-preview");
  const { challenges } = await import("../src/lib/challenges");
  assert.deepEqual(previewLanguages.map(language => language.file), ["solution.ts", "solution.js", "solution.py", "Solution.java", "solution.cpp"]);
  for (const { kind } of challenges) for (const { id } of previewLanguages) {
    assert.doesNotMatch(previewInLanguage(kind, [0, 0, 0], id), /Pendiente|Elegí/, `${id} ${kind}`);
    assert.match(previewInLanguage(kind, [-1, -1, -1], id), /Pendiente|Elegí/, `${id} ${kind}`);
  }
});

test("Java and C++ previews use the structure each choice dictates", () => {
  assert.match(previewInLanguage("two-sum", [0, 0, 0], "java"), /Map<Integer, Integer> seen = new HashMap<>\(\);/);
  assert.match(previewInLanguage("two-sum", [0, 1, 0], "java"), /List<int\[\]> seen/);
  assert.match(previewInLanguage("brackets", [0, 1, 0], "cpp"), /std::deque<char> pending;/);
  assert.match(previewInLanguage("brackets", [0, 0, 0], "cpp"), /std::vector<char> pending;/);
  assert.match(previewInLanguage("anagram", [0, 1, 0], "cpp"), /std::array<int, 26> counts\{\};/);
  assert.match(previewInLanguage("move-zeroes", [2, 0, 0], "cpp"), /^std::vector<int> solve\(const std::vector<int>& nums\)/m);
  assert.match(previewInLanguage("move-zeroes", [0, 0, 0], "cpp"), /^std::vector<int>& solve\(std::vector<int>& nums\)/m);
});

test("ignored steps never leave a pending marker", () => {
  assert.equal(previewInLanguage("two-sum", [1, -1, -1], "python"), previewInLanguage("two-sum", [1, 0, 0], "python"));
  assert.equal(previewInLanguage("stock", [2, -1, -1], "cpp"), previewInLanguage("stock", [2, 3, 3], "cpp"));
});
