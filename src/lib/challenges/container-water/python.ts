import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const area = [
  "min(height[left], height[right]) * (right - left)",
  "max(height[left], height[right]) * (right - left)",
  "min(height[left], height[right]) * (right - left + 1)",
  "height[left] * (right - left)",
];

const move: Line[] = [
  ["if height[left] < height[right]:", block("left += 1"), "else:", block("right -= 1")],
  ["if height[left] < height[right]:", block("right -= 1"), "else:", block("left += 1")],
  ["left += 1", "right -= 1"],
  ["if turn % 2 == 0:", block("left += 1"), "else:", block("right -= 1"), "turn += 1"],
];

export function python([approach, memory, rule]: Choices): string {
  const args = "height";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "best = 0",
    "for i in range(len(height)):",
    block("for j in range(i + 1, len(height)):", block("area = min(height[i], height[j]) * (j - i)", "best = max(best, area)")),
    "return best");
  if (approach === 2) return fn(args, "first = 1 if height[1] > height[0] else 0", "second = 1 - first",
    "for i in range(2, len(height)):",
    block("if height[i] > height[first]:", block("second = first", "first = i"), "elif height[i] > height[second]:", block("second = i")),
    "return min(height[first], height[second]) * abs(first - second)");
  if (approach === 3) return fn(args, "tallest = 0",
    "for i in range(1, len(height)):", block("if height[i] > height[tallest]:", block("tallest = i")),
    "best = 0",
    "for j in range(len(height)):", block("area = min(height[tallest], height[j]) * abs(j - tallest)", "best = max(best, area)"),
    "return best");
  return fn(args, "left = 0", "right = len(height) - 1", "best = 0", memory === 3 && "turn = 0",
    "while left < right:",
    block(rule < 0 ? pending("cuánta agua guardan las dos paredes.") : [`area = ${area[rule]}`, "best = max(best, area)"],
      memory < 0 ? pending("qué pared descartar.") : move[memory]),
    "return best");
}
