import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "coins, amount";
const fills = [["dp = [INF] * (amount + 1)", "dp[0] = 0"], ["dp = [0] * (amount + 1)"], ["dp = [-1] * (amount + 1)", "dp[0] = 0"], ["dp = [INF] * (amount + 1)", "dp[0] = 1"]];

function update(rule: number): Line {
  if (rule === 2) return "dp[a] = dp[a - c] + 1";
  if (rule === 3) return ["if dp[a] >= INF:", block("dp[a] = dp[a - c] + 1")];
  return "dp[a] = min(dp[a], dp[a - c] + 1)";
}

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args,
    "def fewest(rest):",
    block("if rest == 0:", block("return 0"),
      "best = -1",
      "for c in coins:",
      block("if c <= rest:", block("sub = fewest(rest - c)", "if sub >= 0 and (best < 0 or sub + 1 < best):", block("best = sub + 1"))),
      "return best"),
    "return fewest(amount)");
  if (approach === 2) return fn(args, "ordered = sorted(coins)", "rest = amount", "count = 0",
    "for i in range(len(ordered) - 1, -1, -1):", block("count += rest // ordered[i]", "rest %= ordered[i]"),
    "return count if rest == 0 else -1");
  if (approach === 3) return fn(args, "ways = [0] * (amount + 1)", "ways[0] = 1",
    "for c in coins:", block("for a in range(c, amount + 1):", block("ways[a] += ways[a - c]")),
    "return ways[amount]");
  return fn(args, "INF = amount + 1",
    memory < 0 ? pending("cómo inicializar la tabla.") : fills[memory],
    "for a in range(1, amount + 1):",
    block("for c in coins:", block(memory < 0 || rule < 0 ? pending("cómo actualizar dp[a] con la moneda c.") : ["if c <= a:", block(update(rule))])),
    rule < 0 ? pending("qué devolver.") : rule === 1 ? "return dp[amount]" : "return -1 if dp[amount] > amount else dp[amount]");
}
