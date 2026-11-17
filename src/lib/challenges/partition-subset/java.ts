import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "boolean solve(int[] nums)";
const sum = ["int total = 0;", braces("for (int x : nums)", "total += x;")];
const parity = braces("if (total % 2 != 0)", "return false;");
const loops = ["for (int j = goal; j >= x; j--)", "for (int j = x; j <= goal; j++)", "for (int j = goal; j >= x; j--)", "for (int j = goal; j > x; j--)"];

function seed(memory: number): Line {
  if (memory === 1) return null;
  if (memory === 2) return braces("for (int x : nums)", braces("if (x <= goal)", "dp[x] = true;"));
  return "dp[0] = true;";
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 3) return javaClass(signature, { body: [sum, "return total % 2 == 0;"] });
  if (approach === 2) return javaClass(signature, { body: ["int[] sorted = nums.clone();", "Arrays.sort(sorted);", "int left = 0;", "int right = 0;",
    braces("for (int i = sorted.length - 1; i >= 0; i--)", "if (left <= right) {", "    left += sorted[i];", "} else {", "    right += sorted[i];", "}"),
    "return left == right;"] });
  if (approach === 1) return javaClass(signature, { body: [sum, "int n = nums.length;",
    braces("for (int mask = 0; mask < (1 << n); mask++)", "int picked = 0;",
      braces("for (int i = 0; i < n; i++)", braces("if (((mask >> i) & 1) == 1)", "picked += nums[i];")),
      braces("if (2 * picked == total)", "return true;")),
    "return false;"] });
  if (memory < 0) return javaClass(signature, { body: [sum, parity, pending("hasta qué suma llega la tabla y qué sumas arrancan alcanzables."),
    braces("for (int x : nums)", pending("cómo recorrer j y actualizar dp[j] con x.")), unfinished("qué devolver.")] });
  return javaClass(signature, { body: [sum, parity,
    `int goal = ${memory === 3 ? "total" : "total / 2"};`,
    "boolean[] dp = new boolean[goal + 1];",
    seed(memory),
    braces("for (int x : nums)", rule < 0 ? pending("cómo recorrer j y actualizar dp[j] con x.") : braces(loops[rule], rule === 2 ? "dp[j] = dp[j - x];" : "dp[j] = dp[j] || dp[j - x];")),
    "return dp[goal];"] });
}
