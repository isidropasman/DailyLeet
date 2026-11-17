import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const starts = [["cur = nums[0]", "best = nums[0]", 1], ["cur = 0", "best = 0", 0], ["cur = nums[0]", "best = nums[0]", 0], ["cur = nums[0]", "best = -1", 1]] as const;
const updates = ["cur = max(x, cur + x)", "cur = max(0, cur + x)", "cur = cur + x", "cur = x if x < 0 else cur + x"];

export function python([approach, memory, rule]: Choices): string {
  const args = "nums";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "best = nums[0]",
    "for start in range(len(nums)):",
    block("total = 0", "for end in range(start, len(nums)):", block("total += nums[end]", "best = max(best, total)")),
    "return best");
  if (approach === 2) return fn(args, "prefix = 0", "low = 0", "best = nums[0]",
    "for x in nums:", block("prefix += x", "low = min(low, prefix)", "best = max(best, prefix - low)"),
    "return best");
  if (approach === 3) return fn(args, "total = 0", "best = nums[0]",
    "for x in nums:", block("if x > 0:", block("total += x"), "best = max(best, x)"),
    "return total if total > 0 else best");
  if (memory < 0) return fn(args, pending("con qué arrancan cur y best, y desde dónde recorrer."));
  const [cur, best, from] = starts[memory];
  return fn(args, cur, best,
    `for x in ${from === 1 ? "nums[1:]" : "nums"}:`,
    block(rule < 0 ? pending("cómo actualizar cur con el número actual.") : [updates[rule], "best = max(best, cur)"]),
    "return best");
}
