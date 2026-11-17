import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const pairs = [
  "const pairs = [];",
  jsBlock("for (let i = 0; i < intervals.length; i += 2)", "pairs.push([intervals[i], intervals[i + 1]]);"),
];
const overlaps = ["pairs[i][0] <= merged[end]", "pairs[i][0] < merged[end]", "pairs[i][0] <= pairs[i - 1][1]", "pairs[i][0] <= merged[end] + 1"];

function extend(merge: number) {
  if (merge < 0) return jsPending("cómo fusionarlo con el último.");
  if (merge === 2) return jsBlock("for (let j = first; j <= i; j++)", "merged[end] = Math.max(merged[end], pairs[j][1]);");
  return merge === 0 ? "merged[end] = Math.max(merged[end], pairs[i][1]);" : merge === 1 ? "merged[end] = pairs[i][1];" : "continue;";
}

function sweep(compare: number, merge: number) {
  return ["const merged = [];", merge === 2 && "let first = 0;",
    jsBlock("for (let i = 0; i < pairs.length; i++)",
      compare < 0 ? jsPending("cuándo el intervalo se pisa con el último y cómo fusionarlo.") : [
        "const end = merged.length - 1;",
        jsBlock(`if (merged.length > 0 && ${overlaps[compare]})`, extend(merge)),
        jsBlock("else", merge === 2 && "first = i;", "merged.push(pairs[i][0], pairs[i][1]);"),
        "emit(2 * i, 2 * i, [...merged], merged.length / 2, pairs.flat());"]),
    "return merged;"];
}

export function program([approach, compare, merge]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(pairs, "let changed = true;",
    jsBlock("while (changed)", "changed = false;",
      jsBlock("for (let i = 0; i < pairs.length; i++)",
        jsBlock("for (let j = i + 1; j < pairs.length; j++)",
          "emit(2 * j, 2 * i, [pairs.length], pairs.length, pairs.flat());",
          jsBlock("if (pairs[j][0] <= pairs[i][1] && pairs[i][0] <= pairs[j][1])",
            "pairs[i] = [Math.min(pairs[i][0], pairs[j][0]), Math.max(pairs[i][1], pairs[j][1])];",
            "pairs.splice(j, 1);", "changed = true;", "j--;")))),
    "pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);",
    "return pairs.flat();");
  if (approach === 2) return render("let last = -1;",
    jsBlock("for (let i = 1; i < intervals.length; i += 2)", "last = Math.max(last, intervals[i]);"),
    "const covered = new Array(last + 1).fill(false);",
    jsBlock("for (let i = 0; i < intervals.length; i += 2)",
      jsBlock("for (let t = intervals[i]; t <= intervals[i + 1]; t++)", "covered[t] = true;")),
    "const merged = [];",
    jsBlock("for (let t = 0; t <= last; t++)",
      jsBlock("if (covered[t] && (t === 0 || !covered[t - 1]))", "merged.push(t);"),
      jsBlock("if (covered[t] && (t === last || !covered[t + 1]))", "merged.push(t);"),
      "emit(t, t, [...merged], merged.length / 2, covered.map(Number));"),
    "return merged;");
  if (approach === 3) return render(pairs, sweep(0, 0));
  return render(pairs, "pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);", sweep(compare, merge));
}

export const typescript: [string, string][] = [
  ["const pairs = [];", "const pairs: [number, number][] = [];"],
  ["const merged = [];", "const merged: number[] = [];"],
  ["const covered = new Array(", "const covered: boolean[] = new Array("],
];
