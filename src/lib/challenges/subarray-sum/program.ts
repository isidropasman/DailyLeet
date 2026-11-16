import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let count = 0;",
    jsBlock("for (let start = 0; start < nums.length; start++)", "let sum = 0;",
      jsBlock("for (let end = start; end < nums.length; end++)", "sum += nums[end];", jsBlock("if (sum === k)", "count++;"), "emit(end, start, [sum], count);")),
    "return count;");
  if (approach === 2) return render("let left = 0;", "let sum = 0;", "let count = 0;",
    jsBlock("for (let right = 0; right < nums.length; right++)", "sum += nums[right];",
      jsBlock("while (sum > k && left <= right)", "sum -= nums[left];", "left++;"),
      jsBlock("if (sum === k && left <= right)", "count++;"),
      "emit(right, left, [sum], count);"),
    "return count;");
  if (approach === 3) return render("let sum = 0;", "let count = 0;",
    jsBlock("for (let i = 0; i < nums.length; i++)", "sum += nums[i];",
      "if (sum === k) {", "  count++;", "  sum = 0;", "} else if (sum > k) {", "  sum = nums[i] <= k ? nums[i] : 0;", "}",
      "emit(i, i, [sum], count);"),
    "return count;");
  const key = rule === 2 ? "k - sum" : "sum - k";
  const lookup = memory === 0 || memory === 3 ? `(seen.get(${key}) ?? 0)` : memory === 1 ? `(seen.has(${key}) ? 1 : 0)` : "(sum - previous === k ? 1 : 0)";
  const search = rule === 3 ? jsBlock("if (sum - k >= 0)", `count += ${lookup};`) : `count += ${lookup};`;
  const record = memory === 0 || memory === 3 ? "seen.set(sum, (seen.get(sum) ?? 0) + 1);" : memory === 1 ? "seen.add(sum);" : "previous = sum;";
  const declaration = ["const seen = new Map([[0, 1]]);", "const seen = new Set([0]);", "let previous = 0;", "const seen = new Map();"][memory];
  const memoryTrace = memory === 2 ? "[previous]" : "[...seen.keys()]";
  return render(
    memory < 0 ? jsPending("qué guardar de los prefijos.") : declaration,
    "let sum = 0;", "let count = 0;",
    jsBlock("for (let i = 0; i < nums.length; i++)", "sum += nums[i];",
      memory < 0 ? jsPending("contar los subarrays que terminan acá.")
        : rule < 0 ? jsPending("cómo usar el prefijo actual.")
        : rule === 1 ? [record, search] : [search, record],
      memory >= 0 && `emit(i, 0, ${memoryTrace}, count);`),
    "return count;");
}

export const typescript: [string, string][] = [
  ["const seen = new Map([[0, 1]]);", "const seen = new Map<number, number>([[0, 1]]);"],
  ["const seen = new Set([0]);", "const seen = new Set<number>([0]);"],
  ["const seen = new Map();", "const seen = new Map<number, number>();"],
];
