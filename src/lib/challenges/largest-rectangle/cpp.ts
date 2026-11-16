import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& heights)";
const widths = ["stack.empty() ? i : i - stack.back() - 1", "i - j", "stack.empty() ? i : i - stack.back()", "stack.empty() ? 1 : i - stack.back() - 1"];
const pendingWidth = pending("cuánto se extiende la barra que sacás.");
const sentinel = ["std::vector<int> bars(heights);", "bars.push_back(0);"];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(heights.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "int best = 0;",
    braces("for (int i = 0; i < n; i++)", "int left = i;", "int right = i;",
      braces("while (left > 0 && heights[left - 1] >= heights[i])", "left--;"),
      braces("while (right < n - 1 && heights[right + 1] >= heights[i])", "right++;"),
      "best = std::max(best, heights[i] * (right - left + 1));"),
    "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, "int left = 0;", "int right = n - 1;", "int best = 0;",
    braces("while (left <= right)", "int low = heights[left];",
      braces("for (int k = left + 1; k <= right; k++)", "low = std::min(low, heights[k]);"),
      "best = std::max(best, low * (right - left + 1));",
      "if (heights[left] < heights[right]) {", "    left++;", "} else {", "    right--;", "}"),
    "return best;"] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int best = 0;",
    braces("for (int i = 0; i < n; i++)", "int count = 0;",
      braces("for (int j = 0; j < n; j++)", braces("if (heights[j] >= heights[i])", "count++;")),
      "best = std::max(best, heights[i] * count);"),
    "return best;"] });
  if (memory < 0) return translationUnit({ signature, body: [pending("qué guardar en la pila."), "int best = 0;", pending("cómo recorrer las barras."), "return best;"] });
  const size = "const int size = static_cast<int>(bars.size());";
  if (memory === 1) return translationUnit({ signature, body: [sentinel, size, "std::vector<int> stack;", "int best = 0;",
    braces("for (int i = 0; i < size; i++)", "int popped = 0;",
      braces("while (!stack.empty() && stack.back() > bars[i])", "const int height = stack.back();", "stack.pop_back();", "popped++;",
        rule < 0 ? pendingWidth : "best = std::max(best, height * popped);"),
      "stack.push_back(bars[i]);"),
    "return best;"] });
  return translationUnit({ signature, body: [memory === 2 ? "const std::vector<int>& bars = heights;" : sentinel, size, "std::vector<int> stack;", "int best = 0;",
    braces("for (int i = 0; i < size; i++)",
      braces(`while (!stack.empty() && bars[stack.back()] ${memory === 3 ? "<" : ">"} bars[i])`, "const int j = stack.back();", "stack.pop_back();",
        rule < 0 ? pendingWidth : [`const int width = ${widths[rule]};`, "best = std::max(best, bars[j] * width);"]),
      "stack.push_back(i);"),
    "return best;"] });
}
