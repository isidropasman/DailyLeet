import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const top = "stack[stack.length - 1]";
const widths = [`stack.length > 0 ? i - ${top} - 1 : i`, "i - j", `stack.length > 0 ? i - ${top} : i`, `stack.length > 0 ? i - ${top} - 1 : 1`];
const pendingWidth = jsPending("cuánto se extiende la barra que sacás.");

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let best = 0;",
    jsBlock("for (let i = 0; i < heights.length; i++)", "let left = i;", "let right = i;",
      jsBlock("while (left > 0 && heights[left - 1] >= heights[i])", "left--;"),
      jsBlock("while (right < heights.length - 1 && heights[right + 1] >= heights[i])", "right++;"),
      "best = Math.max(best, heights[i] * (right - left + 1));",
      "emit(right, left, [heights[i]], best);"),
    "return best;");
  if (approach === 2) return render("let left = 0;", "let right = heights.length - 1;", "let best = 0;",
    jsBlock("while (left <= right)", "let low = heights[left];",
      jsBlock("for (let k = left + 1; k <= right; k++)", "low = Math.min(low, heights[k]);"),
      "best = Math.max(best, low * (right - left + 1));",
      "emit(right, left, [low], best);",
      "if (heights[left] < heights[right]) {", "  left++;", "} else {", "  right--;", "}"),
    "return best;");
  if (approach === 3) return render("let best = 0;",
    jsBlock("for (let i = 0; i < heights.length; i++)", "let count = 0;",
      jsBlock("for (let j = 0; j < heights.length; j++)", jsBlock("if (heights[j] >= heights[i])", "count++;")),
      "best = Math.max(best, heights[i] * count);",
      "emit(i, i, [count], best);"),
    "return best;");
  if (memory < 0) return render(jsPending("qué guardar en la pila."), "let best = 0;", jsPending("cómo recorrer las barras."), "return best;");
  if (memory === 1) return render("const bars = heights.concat(0);", "const stack = [];", "let best = 0;",
    jsBlock("for (let i = 0; i < bars.length; i++)", "let popped = 0;",
      jsBlock(`while (stack.length > 0 && ${top} > bars[i])`, "const height = stack.pop();", "popped++;",
        rule < 0 ? pendingWidth : "best = Math.max(best, height * popped);"),
      "stack.push(bars[i]);",
      "emit(i, i, [...stack], best, bars);"),
    "return best;");
  return render(memory === 2 ? "const bars = heights;" : "const bars = heights.concat(0);", "const stack = [];", "let best = 0;",
    jsBlock("for (let i = 0; i < bars.length; i++)",
      jsBlock(`while (stack.length > 0 && bars[${top}] ${memory === 3 ? "<" : ">"} bars[i])`, "const j = stack.pop();",
        rule < 0 ? pendingWidth : [`const width = ${widths[rule]};`, "best = Math.max(best, bars[j] * width);"]),
      "stack.push(i);",
      "emit(i, stack[0], [...stack], best, bars);"),
    "return best;");
}

export const typescript: [string, string][] = [
  ["const stack = [];", "const stack: number[] = [];"],
  ["const j = stack.pop();", "const j = stack.pop()!;"],
  ["const height = stack.pop();", "const height = stack.pop()!;"],
];
