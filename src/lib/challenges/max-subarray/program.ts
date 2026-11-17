import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const starts = [
  ["let cur = nums[0];", "let best = nums[0];", 1],
  ["let cur = 0;", "let best = 0;", 0],
  ["let cur = nums[0];", "let best = nums[0];", 0],
  ["let cur = nums[0];", "let best = -1;", 1],
] as const;
const updates = ["cur = Math.max(nums[i], cur + nums[i]);", "cur = Math.max(0, cur + nums[i]);", "cur = cur + nums[i];", "cur = nums[i] < 0 ? nums[i] : cur + nums[i];"];

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let best = nums[0];",
    jsBlock("for (let start = 0; start < nums.length; start++)", "let sum = 0;",
      jsBlock("for (let end = start; end < nums.length; end++)", "sum += nums[end];", "best = Math.max(best, sum);", "emit(end, start, [sum], best);")),
    "return best;");
  if (approach === 2) return render("let prefix = 0;", "let low = 0;", "let best = nums[0];",
    jsBlock("for (let i = 0; i < nums.length; i++)", "prefix += nums[i];", "low = Math.min(low, prefix);", "best = Math.max(best, prefix - low);", "emit(i, 0, [prefix, low], best);"),
    "return best;");
  if (approach === 3) return render("let total = 0;", "let best = nums[0];",
    jsBlock("for (let i = 0; i < nums.length; i++)", jsBlock("if (nums[i] > 0)", "total += nums[i];"), "best = Math.max(best, nums[i]);", "emit(i, i, [total], best);"),
    "return total > 0 ? total : best;");
  if (memory < 0) return jsPending("con qué arrancan cur y best, y desde dónde recorrer.");
  const [cur, best, from] = starts[memory];
  return render(cur, best,
    jsBlock(`for (let i = ${from}; i < nums.length; i++)`,
      rule < 0 ? jsPending("cómo actualizar cur con el número actual.") : [updates[rule], "best = Math.max(best, cur);", "emit(i, i, [cur], best);"]),
    "return best;");
}

export const typescript: [string, string][] = [];
