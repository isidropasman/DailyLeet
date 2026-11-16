import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] nums)";

function search(rule: number): Line {
  if (rule === 2) return ["int i = 0;", braces("while (i < tails.size() && tails.get(i) < x)", "i++;")];
  return ["int lo = 0;", "int hi = tails.size();",
    braces("while (lo < hi)", "int mid = (lo + hi) >>> 1;", `if (${rule === 1 ? "tails.get(mid) <= x" : "tails.get(mid) < x"}) {`, "    lo = mid + 1;", "} else {", "    hi = mid;", "}"),
    rule === 3 ? "int i = lo < tails.size() ? Math.max(0, lo - 1) : lo;" : "int i = lo;"];
}

function place(memory: number): Line {
  if (memory === 2) return [braces("while (tails.size() > i)", "tails.remove(tails.size() - 1);"), "tails.add(x);", "best = Math.max(best, tails.size());"];
  if (memory === 3) return ["if (tails.isEmpty() || x > tails.get(tails.size() - 1)) {", "    tails.add(x);", "} else {", "    tails.set(tails.size() - 1, x);", "}"];
  return ["if (i == tails.size()) {", "    tails.add(x);", "} else {", `    ${memory === 1 ? "tails.set(i, Math.max(tails.get(i), x));" : "tails.set(i, x);"}`, "}"];
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int[] best = new int[nums.length];", "int longest = 0;",
    braces("for (int i = 0; i < nums.length; i++)", "best[i] = 1;",
      braces("for (int j = 0; j < i; j++)", braces("if (nums[j] < nums[i])", "best[i] = Math.max(best[i], best[j] + 1);")),
      "longest = Math.max(longest, best[i]);"),
    "return longest;"] });
  if (approach === 2) return javaClass(signature, { body: [braces("if (nums.length == 0)", "return 0;"), "int last = nums[0];", "int count = 1;",
    braces("for (int i = 1; i < nums.length; i++)", braces("if (nums[i] > last)", "last = nums[i];", "count++;")),
    "return count;"] });
  if (approach === 3) return javaClass(signature, { body: ["int best = 0;", "int run = 0;",
    braces("for (int i = 0; i < nums.length; i++)", "run = i > 0 && nums[i] > nums[i - 1] ? run + 1 : 1;", "best = Math.max(best, run);"),
    "return best;"] });
  return javaClass(signature, { body: [
    memory < 0 ? pending("qué guardar de las subsecuencias.") : "List<Integer> tails = new ArrayList<>();",
    memory === 2 && "int best = 0;",
    braces("for (int x : nums)",
      rule < 0 ? pending("en qué posición cae x.") : memory < 0 ? pending("buscar la posición de x en las colas.") : search(rule),
      memory < 0 ? pending("cómo actualizar las colas.") : rule >= 0 && place(memory)),
    memory < 0 ? unfinished("qué devolver.") : memory === 2 ? "return best;" : "return tails.size();"] });
}
