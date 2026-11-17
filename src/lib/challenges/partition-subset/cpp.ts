import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "bool solve(const std::vector<int>& nums)";
const sum = ["int total = 0;", braces("for (int x : nums)", "total += x;")];
const parity = braces("if (total % 2 != 0)", "return false;");
const loops = ["for (int j = goal; j >= x; j--)", "for (int j = x; j <= goal; j++)", "for (int j = goal; j >= x; j--)", "for (int j = goal; j > x; j--)"];

function seed(memory: number): Line {
  if (memory === 1) return null;
  if (memory === 2) return braces("for (int x : nums)", braces("if (x <= goal)", "dp[x] = true;"));
  return "dp[0] = true;";
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 3) return translationUnit({ signature, body: [sum, "return total % 2 == 0;"] });
  if (approach === 2) return translationUnit({ signature, body: ["std::vector<int> sorted = nums;", "std::ranges::sort(sorted);", "int left = 0;", "int right = 0;",
    braces("for (int i = static_cast<int>(sorted.size()) - 1; i >= 0; i--)", "if (left <= right) {", "    left += sorted[i];", "} else {", "    right += sorted[i];", "}"),
    "return left == right;"] });
  if (approach === 1) return translationUnit({ signature, body: [sum, "const int n = static_cast<int>(nums.size());",
    braces("for (int mask = 0; mask < (1 << n); mask++)", "int picked = 0;",
      braces("for (int i = 0; i < n; i++)", braces("if ((mask >> i) & 1)", "picked += nums[i];")),
      braces("if (2 * picked == total)", "return true;")),
    "return false;"] });
  if (memory < 0) return translationUnit({ signature, body: [sum, parity, pending("hasta qué suma llega la tabla y qué sumas arrancan alcanzables."),
    braces("for (int x : nums)", pending("cómo recorrer j y actualizar dp[j] con x.")), unfinished("qué devolver.")] });
  return translationUnit({ signature, body: [sum, parity,
    `const int goal = ${memory === 3 ? "total" : "total / 2"};`,
    "std::vector<bool> dp(goal + 1, false);",
    seed(memory),
    braces("for (int x : nums)", rule < 0 ? pending("cómo recorrer j y actualizar dp[j] con x.") : braces(loops[rule], rule === 2 ? "dp[j] = dp[j - x];" : "dp[j] = dp[j] || dp[j - x];")),
    "return dp[goal];"] });
}
