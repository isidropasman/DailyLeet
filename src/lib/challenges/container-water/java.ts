import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] height)";

const area = [
  "Math.min(height[left], height[right]) * (right - left)",
  "Math.max(height[left], height[right]) * (right - left)",
  "Math.min(height[left], height[right]) * (right - left + 1)",
  "height[left] * (right - left)",
];

const move = [
  ["if (height[left] < height[right]) {", "    left++;", "} else {", "    right--;", "}"],
  ["if (height[left] < height[right]) {", "    right--;", "} else {", "    left++;", "}"],
  ["left++;", "right--;"],
  ["if (turn % 2 == 0) {", "    left++;", "} else {", "    right--;", "}", "turn++;"],
];

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int best = 0;",
    braces("for (int i = 0; i < height.length; i++)",
      braces("for (int j = i + 1; j < height.length; j++)", "int area = Math.min(height[i], height[j]) * (j - i);", "best = Math.max(best, area);")),
    "return best;"] });
  if (approach === 2) return javaClass(signature, { body: ["int first = height[1] > height[0] ? 1 : 0;", "int second = 1 - first;",
    braces("for (int i = 2; i < height.length; i++)",
      "if (height[i] > height[first]) {", "    second = first;", "    first = i;", "} else if (height[i] > height[second]) {", "    second = i;", "}"),
    "return Math.min(height[first], height[second]) * Math.abs(first - second);"] });
  if (approach === 3) return javaClass(signature, { body: ["int tallest = 0;",
    braces("for (int i = 1; i < height.length; i++)", braces("if (height[i] > height[tallest])", "tallest = i;")),
    "int best = 0;",
    braces("for (int j = 0; j < height.length; j++)", "int area = Math.min(height[tallest], height[j]) * Math.abs(j - tallest);", "best = Math.max(best, area);"),
    "return best;"] });
  return javaClass(signature, { body: ["int left = 0;", "int right = height.length - 1;", "int best = 0;", memory === 3 && "int turn = 0;",
    braces("while (left < right)",
      rule < 0 ? pending("cuánta agua guardan las dos paredes.") : [`int area = ${area[rule]};`, "best = Math.max(best, area);"],
      memory < 0 ? pending("qué pared descartar.") : move[memory]),
    "return best;"] });
}
