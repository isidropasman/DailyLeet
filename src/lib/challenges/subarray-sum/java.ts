import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] nums, int k)";

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int count = 0;",
    braces("for (int start = 0; start < nums.length; start++)", "int sum = 0;", braces("for (int end = start; end < nums.length; end++)", "sum += nums[end];", braces("if (sum == k)", "count++;"))),
    "return count;"] });
  if (approach === 2) return javaClass(signature, { body: ["int left = 0;", "int sum = 0;", "int count = 0;",
    braces("for (int right = 0; right < nums.length; right++)", "sum += nums[right];", braces("while (sum > k && left <= right)", "sum -= nums[left];", "left++;"), braces("if (sum == k && left <= right)", "count++;")),
    "return count;"] });
  if (approach === 3) return javaClass(signature, { body: ["int sum = 0;", "int count = 0;",
    braces("for (int i = 0; i < nums.length; i++)", "sum += nums[i];", "if (sum == k) {", "    count++;", "    sum = 0;", "} else if (sum > k) {", "    sum = nums[i] <= k ? nums[i] : 0;", "}"),
    "return count;"] });
  const key = rule === 2 ? "k - sum" : "sum - k";
  const lookup = memory === 0 || memory === 3 ? `seen.getOrDefault(${key}, 0)` : memory === 1 ? `(seen.contains(${key}) ? 1 : 0)` : "(sum - previous == k ? 1 : 0)";
  const search: Line = rule === 3 ? braces("if (sum - k >= 0)", `count += ${lookup};`) : `count += ${lookup};`;
  const record = memory === 0 || memory === 3 ? "seen.put(sum, seen.getOrDefault(sum, 0) + 1);" : memory === 1 ? "seen.add(sum);" : "previous = sum;";
  const declaration: Line = [["Map<Integer, Integer> seen = new HashMap<>();", "seen.put(0, 1);"], ["Set<Integer> seen = new HashSet<>();", "seen.add(0);"], "int previous = 0;", "Map<Integer, Integer> seen = new HashMap<>();"][memory];
  return javaClass(signature, { body: [
    memory < 0 ? pending("qué guardar de los prefijos.") : declaration,
    "int sum = 0;", "int count = 0;",
    braces("for (int i = 0; i < nums.length; i++)", "sum += nums[i];",
      memory < 0 ? pending("contar los subarrays que terminan acá.") : rule < 0 ? pending("cómo usar el prefijo actual.") : rule === 1 ? [record, search] : [search, record]),
    "return count;"] });
}
