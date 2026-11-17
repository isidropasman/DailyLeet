import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& nums)";
const starts = [["int cur = nums[0];", "int best = nums[0];", 1], ["int cur = 0;", "int best = 0;", 0], ["int cur = nums[0];", "int best = nums[0];", 0], ["int cur = nums[0];", "int best = -1;", 1]] as const;
const updates = ["cur = std::max(nums[i], cur + nums[i]);", "cur = std::max(0, cur + nums[i]);", "cur = cur + nums[i];", "cur = nums[i] < 0 ? nums[i] : cur + nums[i];"];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(nums.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "int best = nums[0];",
    braces("for (int start = 0; start < n; start++)", "int sum = 0;", braces("for (int end = start; end < n; end++)", "sum += nums[end];", "best = std::max(best, sum);")),
    "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, "int prefix = 0;", "int low = 0;", "int best = nums[0];",
    braces("for (int i = 0; i < n; i++)", "prefix += nums[i];", "low = std::min(low, prefix);", "best = std::max(best, prefix - low);"),
    "return best;"] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int total = 0;", "int best = nums[0];",
    braces("for (int i = 0; i < n; i++)", braces("if (nums[i] > 0)", "total += nums[i];"), "best = std::max(best, nums[i]);"),
    "return total > 0 ? total : best;"] });
  if (memory < 0) return translationUnit({ signature, body: [pending("con qué arrancan cur y best, y desde dónde recorrer."), unfinished("con qué arrancan cur y best, y desde dónde recorrer.")] });
  const [cur, best, from] = starts[memory];
  return translationUnit({ signature, body: [n, cur, best,
    braces(`for (int i = ${from}; i < n; i++)`,
      rule < 0 ? pending("cómo actualizar cur con el número actual.") : [updates[rule], "best = std::max(best, cur);"]),
    "return best;"] });
}
