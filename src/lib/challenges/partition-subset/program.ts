import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const sum = ["let total = 0;", ...jsBlock("for (const x of nums)", "total += x;")];
const loops = ["for (let j = goal; j >= x; j--)", "for (let j = x; j <= goal; j++)", "for (let j = goal; j >= x; j--)", "for (let j = goal; j > x; j--)"];

function seed(memory: number): string[] {
  if (memory === 1) return [];
  if (memory === 2) return jsBlock("for (const x of nums)", jsBlock("if (x <= goal)", "dp[x] = true;"));
  return ["dp[0] = true;"];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 3) return render(sum, "return total % 2 === 0;");
  if (approach === 2) return render("const sorted = [...nums].sort((a, b) => a - b);", "let left = 0;", "let right = 0;",
    jsBlock("for (let i = sorted.length - 1; i >= 0; i--)",
      "if (left <= right) {", "  left += sorted[i];", "} else {", "  right += sorted[i];", "}",
      "emit(i, i, [left, right], left - right, sorted);"),
    "return left === right;");
  if (approach === 1) return render(sum, "const n = nums.length;",
    jsBlock("for (let mask = 0; mask < (1 << n); mask++)", "let picked = 0;",
      jsBlock("for (let i = 0; i < n; i++)", jsBlock("if ((mask >> i) & 1)", "picked += nums[i];")),
      "emit(0, 0, [mask, picked], total - 2 * picked);",
      jsBlock("if (2 * picked === total)", "return true;")),
    "return false;");
  const parity = jsBlock("if (total % 2 !== 0)", "return false;");
  if (memory < 0) return render(sum, parity, jsPending("hasta qué suma llega la tabla y qué sumas arrancan alcanzables."),
    jsBlock("for (const x of nums)", jsPending("cómo recorrer j y actualizar dp[j] con x.")), jsPending("qué devolver."));
  return render(sum, parity,
    `const goal = ${memory === 3 ? "total" : "total / 2"};`,
    "const dp = new Array(goal + 1).fill(false);",
    seed(memory),
    jsBlock("for (const x of nums)",
      rule < 0 ? jsPending("cómo recorrer j y actualizar dp[j] con x.")
      : jsBlock(loops[rule], rule === 2 ? "dp[j] = dp[j - x];" : "dp[j] = dp[j] || dp[j - x];", "emit(j, j - x, [x], dp[j] ? 1 : 0, dp.map(Number));")),
    "return dp[goal];");
}

export const typescript: [string, string][] = [
  ["const dp = new Array(goal + 1).fill(false);", "const dp = new Array<boolean>(goal + 1).fill(false);"],
];
