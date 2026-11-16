import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

function search(rule: number): string[] {
  if (rule === 2) return ["let i = 0;", ...jsBlock("while (i < tails.length && tails[i] < x)", "i++;")];
  const lower = rule === 1 ? "tails[mid] <= x" : "tails[mid] < x";
  return ["let lo = 0;", "let hi = tails.length;",
    ...jsBlock("while (lo < hi)", "const mid = (lo + hi) >> 1;", "if (" + lower + ") {", "  lo = mid + 1;", "} else {", "  hi = mid;", "}"),
    rule === 3 ? "const i = lo < tails.length ? Math.max(0, lo - 1) : lo;" : "const i = lo;"];
}

function place(memory: number): string[] {
  if (memory === 2) return [...jsBlock("while (tails.length > i)", "tails.pop();"), "tails.push(x);", "best = Math.max(best, tails.length);"];
  if (memory === 3) return ["if (tails.length === 0 || x > tails[tails.length - 1]) {", "  tails.push(x);", "} else {", "  tails[tails.length - 1] = x;", "}"];
  return ["if (i === tails.length) {", "  tails.push(x);", "} else {", `  ${memory === 1 ? "tails[i] = Math.max(tails[i], x);" : "tails[i] = x;"}`, "}"];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("const best = new Array(nums.length).fill(1);", "let longest = 0;",
    jsBlock("for (let i = 0; i < nums.length; i++)",
      jsBlock("for (let j = 0; j < i; j++)", jsBlock("if (nums[j] < nums[i])", "best[i] = Math.max(best[i], best[j] + 1);")),
      "longest = Math.max(longest, best[i]);",
      "emit(i, 0, [best[i]], longest);"),
    "return longest;");
  if (approach === 2) return render(jsBlock("if (nums.length === 0)", "return 0;"), "let last = nums[0];", "let count = 1;",
    jsBlock("for (let i = 1; i < nums.length; i++)",
      jsBlock("if (nums[i] > last)", "last = nums[i];", "count++;"),
      "emit(i, 0, [last], count);"),
    "return count;");
  if (approach === 3) return render("let best = 0;", "let run = 0;",
    jsBlock("for (let i = 0; i < nums.length; i++)",
      "run = i > 0 && nums[i] > nums[i - 1] ? run + 1 : 1;",
      "best = Math.max(best, run);",
      "emit(i, i - run + 1, [run], best);"),
    "return best;");
  return render(
    memory < 0 ? jsPending("qué guardar de las subsecuencias.") : "const tails = [];",
    memory === 2 && "let best = 0;",
    jsBlock("for (const x of nums)",
      rule < 0 ? jsPending("en qué posición cae x.") : search(rule),
      memory < 0 ? jsPending("cómo actualizar las colas.") : rule >= 0 && [place(memory), "emit(i, 0, [...tails], tails.length, tails);"]),
    memory < 0 ? jsPending("qué devolver.") : memory === 2 ? "return best;" : "return tails.length;");
}

export const typescript: [string, string][] = [
  ["const best = new Array(nums.length).fill(1);", "const best = new Array<number>(nums.length).fill(1);"],
  ["const tails = [];", "const tails: number[] = [];"],
];
