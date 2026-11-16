import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] heights)";
const widths = ["stack.isEmpty() ? i : i - stack.peekLast() - 1", "i - j", "stack.isEmpty() ? i : i - stack.peekLast()", "stack.isEmpty() ? 1 : i - stack.peekLast() - 1"];
const pendingWidth = pending("cuánto se extiende la barra que sacás.");

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int best = 0;",
    braces("for (int i = 0; i < heights.length; i++)", "int left = i;", "int right = i;",
      braces("while (left > 0 && heights[left - 1] >= heights[i])", "left--;"),
      braces("while (right < heights.length - 1 && heights[right + 1] >= heights[i])", "right++;"),
      "best = Math.max(best, heights[i] * (right - left + 1));"),
    "return best;"] });
  if (approach === 2) return javaClass(signature, { body: ["int left = 0;", "int right = heights.length - 1;", "int best = 0;",
    braces("while (left <= right)", "int low = heights[left];",
      braces("for (int k = left + 1; k <= right; k++)", "low = Math.min(low, heights[k]);"),
      "best = Math.max(best, low * (right - left + 1));",
      "if (heights[left] < heights[right]) {", "    left++;", "} else {", "    right--;", "}"),
    "return best;"] });
  if (approach === 3) return javaClass(signature, { body: ["int best = 0;",
    braces("for (int i = 0; i < heights.length; i++)", "int count = 0;",
      braces("for (int j = 0; j < heights.length; j++)", braces("if (heights[j] >= heights[i])", "count++;")),
      "best = Math.max(best, heights[i] * count);"),
    "return best;"] });
  if (memory < 0) return javaClass(signature, { body: [pending("qué guardar en la pila."), "int best = 0;", pending("cómo recorrer las barras."), "return best;"] });
  if (memory === 1) return javaClass(signature, { body: ["int[] bars = Arrays.copyOf(heights, heights.length + 1);", "Deque<Integer> stack = new ArrayDeque<>();", "int best = 0;",
    braces("for (int i = 0; i < bars.length; i++)", "int popped = 0;",
      braces("while (!stack.isEmpty() && stack.peekLast() > bars[i])", "int height = stack.pollLast();", "popped++;",
        rule < 0 ? pendingWidth : "best = Math.max(best, height * popped);"),
      "stack.addLast(bars[i]);"),
    "return best;"] });
  return javaClass(signature, { body: [memory === 2 ? "int[] bars = heights;" : "int[] bars = Arrays.copyOf(heights, heights.length + 1);", "Deque<Integer> stack = new ArrayDeque<>();", "int best = 0;",
    braces("for (int i = 0; i < bars.length; i++)",
      braces(`while (!stack.isEmpty() && bars[stack.peekLast()] ${memory === 3 ? "<" : ">"} bars[i])`, "int j = stack.pollLast();",
        rule < 0 ? pendingWidth : [`int width = ${widths[rule]};`, "best = Math.max(best, bars[j] * width);"]),
      "stack.addLast(i);"),
    "return best;"] });
}
