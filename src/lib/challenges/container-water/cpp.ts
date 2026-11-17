import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& height)";

const area = [
  "std::min(height[left], height[right]) * (right - left)",
  "std::max(height[left], height[right]) * (right - left)",
  "std::min(height[left], height[right]) * (right - left + 1)",
  "height[left] * (right - left)",
];

const move = [
  ["if (height[left] < height[right]) {", "    left++;", "} else {", "    right--;", "}"],
  ["if (height[left] < height[right]) {", "    right--;", "} else {", "    left++;", "}"],
  ["left++;", "right--;"],
  ["if (turn % 2 == 0) {", "    left++;", "} else {", "    right--;", "}", "turn++;"],
];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(height.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "int best = 0;",
    braces("for (int i = 0; i < n; i++)",
      braces("for (int j = i + 1; j < n; j++)", "const int area = std::min(height[i], height[j]) * (j - i);", "best = std::max(best, area);")),
    "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, "int first = height[1] > height[0] ? 1 : 0;", "int second = 1 - first;",
    braces("for (int i = 2; i < n; i++)",
      "if (height[i] > height[first]) {", "    second = first;", "    first = i;", "} else if (height[i] > height[second]) {", "    second = i;", "}"),
    "return std::min(height[first], height[second]) * std::abs(first - second);"] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int tallest = 0;",
    braces("for (int i = 1; i < n; i++)", braces("if (height[i] > height[tallest])", "tallest = i;")),
    "int best = 0;",
    braces("for (int j = 0; j < n; j++)", "const int area = std::min(height[tallest], height[j]) * std::abs(j - tallest);", "best = std::max(best, area);"),
    "return best;"] });
  return translationUnit({ signature, body: ["int left = 0;", "int right = static_cast<int>(height.size()) - 1;", "int best = 0;", memory === 3 && "int turn = 0;",
    braces("while (left < right)",
      rule < 0 ? pending("cuánta agua guardan las dos paredes.") : [`const int area = ${area[rule]};`, "best = std::max(best, area);"],
      memory < 0 ? pending("qué pared descartar.") : move[memory]),
    "return best;"] });
}
