import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "nums";
const sum = ["total = 0", "for x in nums:", block("total += x")];
const parity = ["if total % 2 != 0:", block("return False")];
const loops = ["for j in range(goal, x - 1, -1):", "for j in range(x, goal + 1):", "for j in range(goal, x - 1, -1):", "for j in range(goal, x, -1):"];

function seed(memory: number): Line {
  if (memory === 1) return null;
  if (memory === 2) return ["for x in nums:", block("if x <= goal:", block("dp[x] = True"))];
  return "dp[0] = True";
}

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 3) return fn(args, sum, "return total % 2 == 0");
  if (approach === 2) return fn(args, "ordered = sorted(nums)", "left = 0", "right = 0",
    "for i in range(len(ordered) - 1, -1, -1):", block("if left <= right:", block("left += ordered[i]"), "else:", block("right += ordered[i]")),
    "return left == right");
  if (approach === 1) return fn(args, sum, "n = len(nums)",
    "for mask in range(1 << n):",
    block("picked = 0", "for i in range(n):", block("if (mask >> i) & 1:", block("picked += nums[i]")),
      "if 2 * picked == total:", block("return True")),
    "return False");
  if (memory < 0) return fn(args, sum, parity, pending("hasta qué suma llega la tabla y qué sumas arrancan alcanzables."),
    "for x in nums:", block(pending("cómo recorrer j y actualizar dp[j] con x.")), pending("qué devolver."));
  return fn(args, sum, parity,
    `goal = ${memory === 3 ? "total" : "total // 2"}`,
    "dp = [False] * (goal + 1)",
    seed(memory),
    "for x in nums:",
    block(rule < 0 ? pending("cómo recorrer j y actualizar dp[j] con x.") : [loops[rule], block(rule === 2 ? "dp[j] = dp[j - x]" : "dp[j] = dp[j] or dp[j - x]")]),
    "return dp[goal]");
}
