import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const condition = ["nums[mid] > nums[hi]", "nums[mid] > nums[lo]", "nums[mid] > nums[0]", "nums[mid] < nums[hi]"];

export function python([approach, memory, rule]: Choices): string {
  const args = "nums";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "best = nums[0]", "for i in range(1, len(nums)):", block("if nums[i] < best:", block("best = nums[i]")), "return best");
  if (approach === 2) return fn(args, "for i in range(1, len(nums)):", block("if nums[i] < nums[i - 1]:", block("return nums[i]")), "return nums[0]");
  if (approach === 3) return fn(args, "return min(nums[0], nums[-1])");
  const bounds = ["lo = 0", "hi = len(nums) - 1"];
  if (memory < 0) return fn(args, bounds, pending("qué comparación te dice que el mínimo está a la derecha."));
  const mid = "mid = (lo + hi) // 2";
  if (rule < 0) return fn(args, bounds, "while lo < hi:", block(mid, `if ${condition[memory]}:`, block(pending("cómo mover los bordes."))));
  return fn(args, bounds,
    "while lo < hi:", block(mid, `if ${condition[memory]}:`, block(rule === 2 ? "lo = mid" : "lo = mid + 1"), "else:", block(["hi = mid", "hi = mid - 1", "hi = mid", "return nums[mid]"][rule])),
    "return nums[lo]");
}
