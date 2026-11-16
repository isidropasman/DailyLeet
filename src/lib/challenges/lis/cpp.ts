import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& nums)";
const size = "static_cast<int>(tails.size())";

function search(rule: number): Line {
  if (rule === 2) return ["int i = 0;", braces(`while (i < ${size} && tails[i] < x)`, "i++;")];
  return ["int lo = 0;", `int hi = ${size};`,
    braces("while (lo < hi)", "int mid = (lo + hi) / 2;", `if (${rule === 1 ? "tails[mid] <= x" : "tails[mid] < x"}) {`, "    lo = mid + 1;", "} else {", "    hi = mid;", "}"),
    rule === 3 ? `int i = lo < ${size} ? std::max(0, lo - 1) : lo;` : "int i = lo;"];
}

function place(memory: number): Line {
  if (memory === 2) return [braces(`while (${size} > i)`, "tails.pop_back();"), "tails.push_back(x);", `best = std::max(best, ${size});`];
  if (memory === 3) return ["if (tails.empty() || x > tails.back()) {", "    tails.push_back(x);", "} else {", "    tails.back() = x;", "}"];
  return [`if (i == ${size}) {`, "    tails.push_back(x);", "} else {", `    ${memory === 1 ? "tails[i] = std::max(tails[i], x);" : "tails[i] = x;"}`, "}"];
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(nums.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "std::vector<int> best(n, 1);", "int longest = 0;",
    braces("for (int i = 0; i < n; i++)",
      braces("for (int j = 0; j < i; j++)", braces("if (nums[j] < nums[i])", "best[i] = std::max(best[i], best[j] + 1);")),
      "longest = std::max(longest, best[i]);"),
    "return longest;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, braces("if (n == 0)", "return 0;"), "int last = nums[0];", "int count = 1;",
    braces("for (int i = 1; i < n; i++)", braces("if (nums[i] > last)", "last = nums[i];", "count++;")),
    "return count;"] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int best = 0;", "int run = 0;",
    braces("for (int i = 0; i < n; i++)", "run = i > 0 && nums[i] > nums[i - 1] ? run + 1 : 1;", "best = std::max(best, run);"),
    "return best;"] });
  return translationUnit({ signature, body: [
    memory < 0 ? pending("qué guardar de las subsecuencias.") : "std::vector<int> tails;",
    memory === 2 && "int best = 0;",
    braces("for (int x : nums)",
      rule < 0 ? pending("en qué posición cae x.") : memory < 0 ? pending("buscar la posición de x en las colas.") : search(rule),
      memory < 0 ? pending("cómo actualizar las colas.") : rule >= 0 && place(memory)),
    memory < 0 ? unfinished("qué devolver.") : memory === 2 ? "return best;" : "return static_cast<int>(tails.size());"] });
}
