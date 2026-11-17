import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& nums)";
const condition = ["nums[mid] > nums[hi]", "nums[mid] > nums[lo]", "nums[mid] > nums[0]", "nums[mid] < nums[hi]"];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(nums.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "int best = nums[0];",
    braces("for (int i = 1; i < n; i++)", braces("if (nums[i] < best)", "best = nums[i];")), "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [n,
    braces("for (int i = 1; i < n; i++)", braces("if (nums[i] < nums[i - 1])", "return nums[i];")), "return nums[0];"] });
  if (approach === 3) return translationUnit({ signature, body: ["return std::min(nums.front(), nums.back());"] });
  const bounds = ["int lo = 0;", "int hi = static_cast<int>(nums.size()) - 1;"];
  if (memory < 0) return translationUnit({ signature, body: [bounds, pending("qué comparación te dice que el mínimo está a la derecha."), unfinished("qué comparación te dice que el mínimo está a la derecha.")] });
  const mid = "const int mid = (lo + hi) / 2;";
  if (rule < 0) return translationUnit({ signature, body: [bounds,
    braces("while (lo < hi)", mid, braces(`if (${condition[memory]})`, pending("cómo mover los bordes."))), unfinished("cómo mover los bordes.")] });
  return translationUnit({ signature, body: [bounds,
    braces("while (lo < hi)", mid, `if (${condition[memory]}) {`, `    ${rule === 2 ? "lo = mid;" : "lo = mid + 1;"}`, "} else {", `    ${["hi = mid;", "hi = mid - 1;", "hi = mid;", "return nums[mid];"][rule]}`, "}"),
    "return nums[lo];"] });
}
