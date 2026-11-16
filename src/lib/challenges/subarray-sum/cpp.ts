import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& nums, int k)";

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const n = "const int n = static_cast<int>(nums.size());";
  if (approach === 1) return translationUnit({ signature, body: [n, "int count = 0;",
    braces("for (int start = 0; start < n; start++)", "int sum = 0;", braces("for (int end = start; end < n; end++)", "sum += nums[end];", braces("if (sum == k)", "count++;"))),
    "return count;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, "int left = 0;", "int sum = 0;", "int count = 0;",
    braces("for (int right = 0; right < n; right++)", "sum += nums[right];", braces("while (sum > k && left <= right)", "sum -= nums[left];", "left++;"), braces("if (sum == k && left <= right)", "count++;")),
    "return count;"] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int sum = 0;", "int count = 0;",
    braces("for (int i = 0; i < n; i++)", "sum += nums[i];", "if (sum == k) {", "    count++;", "    sum = 0;", "} else if (sum > k) {", "    sum = nums[i] <= k ? nums[i] : 0;", "}"),
    "return count;"] });
  const key = rule === 2 ? "k - sum" : "sum - k";
  const lookup = memory === 0 || memory === 3 ? `(seen.count(${key}) ? seen.at(${key}) : 0)` : memory === 1 ? `(seen.count(${key}) ? 1 : 0)` : "(sum - previous == k ? 1 : 0)";
  const search: Line = rule === 3 ? braces("if (sum - k >= 0)", `count += ${lookup};`) : `count += ${lookup};`;
  const record = memory === 0 || memory === 3 ? "seen[sum]++;" : memory === 1 ? "seen.insert(sum);" : "previous = sum;";
  const declaration = ["std::unordered_map<int, int> seen{{0, 1}};", "std::unordered_set<int> seen{0};", "int previous = 0;", "std::unordered_map<int, int> seen;"][memory];
  return translationUnit({ signature, body: [n,
    memory < 0 ? pending("qué guardar de los prefijos.") : declaration,
    "int sum = 0;", "int count = 0;",
    braces("for (int i = 0; i < n; i++)", "sum += nums[i];",
      memory < 0 ? pending("contar los subarrays que terminan acá.") : rule < 0 ? pending("cómo usar el prefijo actual.") : rule === 1 ? [record, search] : [search, record]),
    "return count;"] });
}
