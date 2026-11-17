import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const area = [
  "Math.min(height[left], height[right]) * (right - left)",
  "Math.max(height[left], height[right]) * (right - left)",
  "Math.min(height[left], height[right]) * (right - left + 1)",
  "height[left] * (right - left)",
];

const move = [
  ["if (height[left] < height[right]) {", "  left++;", "} else {", "  right--;", "}"],
  ["if (height[left] < height[right]) {", "  right--;", "} else {", "  left++;", "}"],
  ["left++;", "right--;"],
  ["if (turn % 2 === 0) {", "  left++;", "} else {", "  right--;", "}", "turn++;"],
];

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let best = 0;",
    jsBlock("for (let i = 0; i < height.length; i++)",
      jsBlock("for (let j = i + 1; j < height.length; j++)", "const area = Math.min(height[i], height[j]) * (j - i);", "best = Math.max(best, area);", "emit(j, i, [area], best);")),
    "return best;");
  if (approach === 2) return render("let first = height[1] > height[0] ? 1 : 0;", "let second = 1 - first;",
    jsBlock("for (let i = 2; i < height.length; i++)",
      "if (height[i] > height[first]) {", "  second = first;", "  first = i;", "} else if (height[i] > height[second]) {", "  second = i;", "}",
      "emit(i, Math.min(first, second), [height[first], height[second]], Math.min(height[first], height[second]) * Math.abs(first - second));"),
    "return Math.min(height[first], height[second]) * Math.abs(first - second);");
  if (approach === 3) return render("let tallest = 0;",
    jsBlock("for (let i = 1; i < height.length; i++)", jsBlock("if (height[i] > height[tallest])", "tallest = i;")),
    "let best = 0;",
    jsBlock("for (let j = 0; j < height.length; j++)", "const area = Math.min(height[tallest], height[j]) * Math.abs(j - tallest);", "best = Math.max(best, area);", "emit(j, Math.min(j, tallest), [area], best);"),
    "return best;");
  return render("let left = 0;", "let right = height.length - 1;", "let best = 0;", memory === 3 && "let turn = 0;",
    jsBlock("while (left < right)",
      rule < 0 ? jsPending("cuánta agua guardan las dos paredes.") : [`const area = ${area[rule]};`, "best = Math.max(best, area);", "emit(right, left, [area], best);"],
      memory < 0 ? jsPending("qué pared descartar.") : move[memory]),
    "return best;");
}

export const typescript: [string, string][] = [];
