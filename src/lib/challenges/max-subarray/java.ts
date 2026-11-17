import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] nums)";
const starts = [["int cur = nums[0];", "int best = nums[0];", 1], ["int cur = 0;", "int best = 0;", 0], ["int cur = nums[0];", "int best = nums[0];", 0], ["int cur = nums[0];", "int best = -1;", 1]] as const;
const updates = ["cur = Math.max(nums[i], cur + nums[i]);", "cur = Math.max(0, cur + nums[i]);", "cur = cur + nums[i];", "cur = nums[i] < 0 ? nums[i] : cur + nums[i];"];

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int best = nums[0];",
    braces("for (int start = 0; start < nums.length; start++)", "int sum = 0;", braces("for (int end = start; end < nums.length; end++)", "sum += nums[end];", "best = Math.max(best, sum);")),
    "return best;"] });
  if (approach === 2) return javaClass(signature, { body: ["int prefix = 0;", "int low = 0;", "int best = nums[0];",
    braces("for (int i = 0; i < nums.length; i++)", "prefix += nums[i];", "low = Math.min(low, prefix);", "best = Math.max(best, prefix - low);"),
    "return best;"] });
  if (approach === 3) return javaClass(signature, { body: ["int total = 0;", "int best = nums[0];",
    braces("for (int i = 0; i < nums.length; i++)", braces("if (nums[i] > 0)", "total += nums[i];"), "best = Math.max(best, nums[i]);"),
    "return total > 0 ? total : best;"] });
  if (memory < 0) return javaClass(signature, { body: [pending("con qué arrancan cur y best, y desde dónde recorrer."), unfinished("con qué arrancan cur y best, y desde dónde recorrer.")] });
  const [cur, best, from] = starts[memory];
  return javaClass(signature, { body: [cur, best,
    braces(`for (int i = ${from}; i < nums.length; i++)`,
      rule < 0 ? pending("cómo actualizar cur con el número actual.") : [updates[rule], "best = Math.max(best, cur);"]),
    "return best;"] });
}
