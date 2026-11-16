import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const widths = ["i - stack[-1] - 1 if stack else i", "i - j", "i - stack[-1] if stack else i", "i - stack[-1] - 1 if stack else 1"];
const pendingWidth = pending("cuánto se extiende la barra que sacás.");

export function python([approach, memory, rule]: Choices): string {
  const args = "heights";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "best = 0",
    "for i in range(len(heights)):",
    block("left = right = i",
      "while left > 0 and heights[left - 1] >= heights[i]:", block("left -= 1"),
      "while right < len(heights) - 1 and heights[right + 1] >= heights[i]:", block("right += 1"),
      "best = max(best, heights[i] * (right - left + 1))"),
    "return best");
  if (approach === 2) return fn(args, "left = 0", "right = len(heights) - 1", "best = 0",
    "while left <= right:",
    block("low = heights[left]", "for k in range(left + 1, right + 1):", block("low = min(low, heights[k])"),
      "best = max(best, low * (right - left + 1))",
      "if heights[left] < heights[right]:", block("left += 1"), "else:", block("right -= 1")),
    "return best");
  if (approach === 3) return fn(args, "best = 0",
    "for i in range(len(heights)):",
    block("count = 0", "for j in range(len(heights)):", block("if heights[j] >= heights[i]:", block("count += 1")), "best = max(best, heights[i] * count)"),
    "return best");
  if (memory < 0) return fn(args, pending("qué guardar en la pila."), "best = 0", pending("cómo recorrer las barras."), "return best");
  if (memory === 1) return fn(args, "bars = heights + [0]", "stack = []", "best = 0",
    "for i in range(len(bars)):",
    block("popped = 0", "while stack and stack[-1] > bars[i]:",
      block("height = stack.pop()", "popped += 1", rule < 0 ? pendingWidth : "best = max(best, height * popped)"),
      "stack.append(bars[i])"),
    "return best");
  return fn(args, memory === 2 ? "bars = heights" : "bars = heights + [0]", "stack = []", "best = 0",
    "for i in range(len(bars)):",
    block(`while stack and bars[stack[-1]] ${memory === 3 ? "<" : ">"} bars[i]:`,
      block("j = stack.pop()", rule < 0 ? pendingWidth : [`width = ${widths[rule]}`, "best = max(best, bars[j] * width)"]),
      "stack.append(i)"),
    "return best");
}
