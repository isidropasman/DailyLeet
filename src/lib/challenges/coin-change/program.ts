import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const fills = [["dp.fill(INF);", "dp[0] = 0;"], ["dp.fill(0);"], ["dp.fill(-1);", "dp[0] = 0;"], ["dp.fill(INF);", "dp[0] = 1;"]];

function update(rule: number): string[] {
  if (rule === 2) return ["dp[a] = dp[a - c] + 1;"];
  if (rule === 3) return jsBlock("if (dp[a] >= INF)", "dp[a] = dp[a - c] + 1;");
  return ["dp[a] = Math.min(dp[a], dp[a - c] + 1);"];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(
    jsBlock("function fewest(rest)", "tick();",
      jsBlock("if (rest === 0)", "return 0;"),
      "let best = -1;",
      jsBlock("for (const c of coins)",
        jsBlock("if (c <= rest)", "const sub = fewest(rest - c);",
          jsBlock("if (sub >= 0 && (best < 0 || sub + 1 < best))", "best = sub + 1;")),
        "emit(0, 0, [rest, c], best);"),
      "return best;"),
    "return fewest(amount);");
  if (approach === 2) return render("const sorted = [...coins].sort((x, y) => x - y);", "let rest = amount;", "let count = 0;",
    jsBlock("for (let i = sorted.length - 1; i >= 0; i--)", "count += Math.floor(rest / sorted[i]);", "rest %= sorted[i];", "emit(i, i, [rest], count, sorted);"),
    "return rest === 0 ? count : -1;");
  if (approach === 3) return render("const ways = new Array(amount + 1).fill(0);", "ways[0] = 1;",
    jsBlock("for (const c of coins)",
      jsBlock("for (let a = c; a <= amount; a++)", "ways[a] += ways[a - c];", "emit(a, a - c, [c], ways[a], ways);")),
    "return ways[amount];");
  return render("const INF = amount + 1;", "const dp = new Array(amount + 1);",
    memory < 0 ? jsPending("cómo inicializar la tabla.") : fills[memory],
    jsBlock("for (let a = 1; a <= amount; a++)",
      jsBlock("for (const c of coins)",
        memory < 0 || rule < 0 ? jsPending("cómo actualizar dp[a] con la moneda c.") : jsBlock("if (c <= a)", update(rule)),
        memory >= 0 && rule >= 0 && "emit(a, a, [c], dp[a], dp);")),
    rule < 0 ? jsPending("qué devolver.") : rule === 1 ? "return dp[amount];" : "return dp[amount] > amount ? -1 : dp[amount];");
}

export const typescript: [string, string][] = [
  ["function fewest(rest) {", "function fewest(rest: number): number {"],
  ["const dp = new Array(amount + 1);", "const dp = new Array<number>(amount + 1);"],
  ["const ways = new Array(amount + 1).fill(0);", "const ways = new Array<number>(amount + 1).fill(0);"],
];
