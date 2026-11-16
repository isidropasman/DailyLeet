import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] coins, int amount)";
const fills = [["Arrays.fill(dp, INF);", "dp[0] = 0;"], ["Arrays.fill(dp, 0);"], ["Arrays.fill(dp, -1);", "dp[0] = 0;"], ["Arrays.fill(dp, INF);", "dp[0] = 1;"]];

function update(rule: number): Line {
  if (rule === 2) return "dp[a] = dp[a - c] + 1;";
  if (rule === 3) return braces("if (dp[a] >= INF)", "dp[a] = dp[a - c] + 1;");
  return "dp[a] = Math.min(dp[a], dp[a - c] + 1);";
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["return fewest(coins, amount);"], helpers: [
    braces("static int fewest(int[] coins, int rest)",
      braces("if (rest == 0)", "return 0;"),
      "int best = -1;",
      braces("for (int c : coins)",
        braces("if (c <= rest)", "int sub = fewest(coins, rest - c);", braces("if (sub >= 0 && (best < 0 || sub + 1 < best))", "best = sub + 1;"))),
      "return best;")] });
  if (approach === 2) return javaClass(signature, { body: ["int[] sorted = coins.clone();", "Arrays.sort(sorted);", "int rest = amount;", "int count = 0;",
    braces("for (int i = sorted.length - 1; i >= 0; i--)", "count += rest / sorted[i];", "rest %= sorted[i];"),
    "return rest == 0 ? count : -1;"] });
  if (approach === 3) return javaClass(signature, { body: ["int[] ways = new int[amount + 1];", "ways[0] = 1;",
    braces("for (int c : coins)", braces("for (int a = c; a <= amount; a++)", "ways[a] += ways[a - c];")),
    "return ways[amount];"] });
  return javaClass(signature, { body: ["final int INF = amount + 1;", "int[] dp = new int[amount + 1];",
    memory < 0 ? pending("cómo inicializar la tabla.") : fills[memory],
    braces("for (int a = 1; a <= amount; a++)",
      braces("for (int c : coins)", memory < 0 || rule < 0 ? pending("cómo actualizar dp[a] con la moneda c.") : braces("if (c <= a)", update(rule)))),
    rule < 0 ? unfinished("qué devolver.") : rule === 1 ? "return dp[amount];" : "return dp[amount] > amount ? -1 : dp[amount];"] });
}
