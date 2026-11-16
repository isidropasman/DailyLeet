import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

export function python([approach, memory, rule]: Choices): string {
  const args = "nums, k";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "count = 0",
    "for start in range(len(nums)):",
    block("total = 0", "for end in range(start, len(nums)):", block("total += nums[end]", "if total == k:", block("count += 1"))),
    "return count");
  if (approach === 2) return fn(args, "left = 0", "total = 0", "count = 0",
    "for right in range(len(nums)):",
    block("total += nums[right]", "while total > k and left <= right:", block("total -= nums[left]", "left += 1"), "if total == k and left <= right:", block("count += 1")),
    "return count");
  if (approach === 3) return fn(args, "total = 0", "count = 0",
    "for i in range(len(nums)):",
    block("total += nums[i]", "if total == k:", block("count += 1", "total = 0"), "elif total > k:", block("total = nums[i] if nums[i] <= k else 0")),
    "return count");
  const key = rule === 2 ? "k - total" : "total - k";
  const lookup = memory === 0 || memory === 3 ? `seen.get(${key}, 0)` : memory === 1 ? `(1 if ${key} in seen else 0)` : "(1 if total - previous == k else 0)";
  const search: Line = rule === 3 ? ["if total - k >= 0:", block(`count += ${lookup}`)] : `count += ${lookup}`;
  const record = memory === 0 || memory === 3 ? "seen[total] = seen.get(total, 0) + 1" : memory === 1 ? "seen.add(total)" : "previous = total";
  const declaration = ["seen = {0: 1}", "seen = {0}", "previous = 0", "seen = {}"][memory];
  return fn(args,
    memory < 0 ? pending("qué guardar de los prefijos.") : declaration,
    "total = 0", "count = 0",
    "for i in range(len(nums)):",
    block("total += nums[i]",
      memory < 0 ? pending("contar los subarrays que terminan acá.") : rule < 0 ? pending("cómo usar el prefijo actual.") : rule === 1 ? [record, search] : [search, record]),
    "return count");
}
