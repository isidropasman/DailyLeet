import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& coins, int amount)";
const fills = [["std::vector<int> dp(amount + 1, INF);", "dp[0] = 0;"], ["std::vector<int> dp(amount + 1, 0);"], ["std::vector<int> dp(amount + 1, -1);", "dp[0] = 0;"], ["std::vector<int> dp(amount + 1, INF);", "dp[0] = 1;"]];

function update(rule: number): Line {
  if (rule === 2) return "dp[a] = dp[a - c] + 1;";
  if (rule === 3) return braces("if (dp[a] >= INF)", "dp[a] = dp[a - c] + 1;");
  return "dp[a] = std::min(dp[a], dp[a - c] + 1);";
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: ["return fewest(coins, amount);"], helpers: [
    braces("int fewest(const std::vector<int>& coins, int rest)",
      braces("if (rest == 0)", "return 0;"),
      "int best = -1;",
      braces("for (int c : coins)",
        braces("if (c <= rest)", "int sub = fewest(coins, rest - c);", braces("if (sub >= 0 && (best < 0 || sub + 1 < best))", "best = sub + 1;"))),
      "return best;")] });
  if (approach === 2) return translationUnit({ signature, body: ["std::vector<int> sorted = coins;", "std::ranges::sort(sorted);", "int rest = amount;", "int count = 0;",
    braces("for (int i = static_cast<int>(sorted.size()) - 1; i >= 0; i--)", "count += rest / sorted[i];", "rest %= sorted[i];"),
    "return rest == 0 ? count : -1;"] });
  if (approach === 3) return translationUnit({ signature, body: ["std::vector<int> ways(amount + 1, 0);", "ways[0] = 1;",
    braces("for (int c : coins)", braces("for (int a = c; a <= amount; a++)", "ways[a] += ways[a - c];")),
    "return ways[amount];"] });
  return translationUnit({ signature, body: ["const int INF = amount + 1;",
    memory < 0 ? pending("cómo inicializar la tabla.") : fills[memory],
    braces("for (int a = 1; a <= amount; a++)",
      braces("for (int c : coins)", memory < 0 || rule < 0 ? pending("cómo actualizar dp[a] con la moneda c.") : braces("if (c <= a)", update(rule)))),
    rule < 0 ? unfinished("qué devolver.") : memory < 0 ? unfinished("inicializar la tabla.") : rule === 1 ? "return dp[amount];" : "return dp[amount] > amount ? -1 : dp[amount];"] });
}
