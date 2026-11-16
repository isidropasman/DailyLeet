import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

function search(rule: number): Line {
  if (rule === 2) return ["i = 0", "while i < len(tails) and tails[i] < x:", block("i += 1")];
  return ["lo = 0", "hi = len(tails)",
    "while lo < hi:", block("mid = (lo + hi) // 2", `if ${rule === 1 ? "tails[mid] <= x" : "tails[mid] < x"}:`, block("lo = mid + 1"), "else:", block("hi = mid")),
    rule === 3 ? "i = max(0, lo - 1) if lo < len(tails) else lo" : "i = lo"];
}

function place(memory: number): Line {
  if (memory === 2) return ["while len(tails) > i:", block("tails.pop()"), "tails.append(x)", "best = max(best, len(tails))"];
  if (memory === 3) return ["if not tails or x > tails[-1]:", block("tails.append(x)"), "else:", block("tails[-1] = x")];
  return ["if i == len(tails):", block("tails.append(x)"), "else:", block(memory === 1 ? "tails[i] = max(tails[i], x)" : "tails[i] = x")];
}

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn("nums", "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn("nums", "best = [1] * len(nums)", "longest = 0",
    "for i in range(len(nums)):",
    block("for j in range(i):", block("if nums[j] < nums[i]:", block("best[i] = max(best[i], best[j] + 1)")), "longest = max(longest, best[i])"),
    "return longest");
  if (approach === 2) return fn("nums", "if not nums:", block("return 0"), "last = nums[0]", "count = 1",
    "for i in range(1, len(nums)):", block("if nums[i] > last:", block("last = nums[i]", "count += 1")),
    "return count");
  if (approach === 3) return fn("nums", "best = 0", "run = 0",
    "for i in range(len(nums)):", block("run = run + 1 if i > 0 and nums[i] > nums[i - 1] else 1", "best = max(best, run)"),
    "return best");
  return fn("nums",
    memory < 0 ? pending("qué guardar de las subsecuencias.") : "tails = []",
    memory === 2 && "best = 0",
    "for x in nums:",
    block(rule < 0 ? pending("en qué posición cae x.") : search(rule),
      memory < 0 ? pending("cómo actualizar las colas.") : rule >= 0 && place(memory)),
    memory < 0 ? pending("qué devolver.") : memory === 2 ? "return best" : "return len(tails)");
}
