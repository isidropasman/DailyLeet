import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const condition = ["nums[mid] > nums[hi]", "nums[mid] > nums[lo]", "nums[mid] > nums[0]", "nums[mid] < nums[hi]"];

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let best = nums[0];",
    jsBlock("for (let i = 1; i < nums.length; i++)", jsBlock("if (nums[i] < best)", "best = nums[i];"), "emit(i, 0, [best], best);"),
    "return best;");
  if (approach === 2) return render(
    jsBlock("for (let i = 1; i < nums.length; i++)", "emit(i, i - 1, [nums[i - 1]], nums[i]);", jsBlock("if (nums[i] < nums[i - 1])", "return nums[i];")),
    "return nums[0];");
  if (approach === 3) return render("emit(nums.length - 1, 0, [nums[0], nums[nums.length - 1]], Math.min(nums[0], nums[nums.length - 1]));",
    "return Math.min(nums[0], nums[nums.length - 1]);");
  const bounds = ["let lo = 0;", "let hi = nums.length - 1;"];
  if (memory < 0) return render(bounds, jsPending("qué comparación te dice que el mínimo está a la derecha."));
  const mid = ["const mid = Math.floor((lo + hi) / 2);", "emit(mid, lo, [lo, hi], nums[mid]);"];
  if (rule < 0) return render(bounds, jsBlock("while (lo < hi)", mid, jsBlock(`if (${condition[memory]})`, jsPending("cómo mover los bordes."))));
  return render(bounds,
    jsBlock("while (lo < hi)", mid,
      `if (${condition[memory]}) {`, `  ${rule === 2 ? "lo = mid;" : "lo = mid + 1;"}`, "} else {", `  ${["hi = mid;", "hi = mid - 1;", "hi = mid;", "return nums[mid];"][rule]}`, "}"),
    "return nums[lo];");
}

export const typescript: [string, string][] = [];
