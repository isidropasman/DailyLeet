import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const pairs = "pairs = [[intervals[i], intervals[i + 1]] for i in range(0, len(intervals), 2)]";
const overlaps = ["pairs[i][0] <= merged[-1]", "pairs[i][0] < merged[-1]", "pairs[i][0] <= pairs[i - 1][1]", "pairs[i][0] <= merged[-1] + 1"];

function extend(merge: number) {
  if (merge < 0) return pending("cómo fusionarlo con el último.");
  if (merge === 2) return ["for j in range(first, i + 1):", block("merged[-1] = max(merged[-1], pairs[j][1])")];
  return merge === 0 ? "merged[-1] = max(merged[-1], pairs[i][1])" : merge === 1 ? "merged[-1] = pairs[i][1]" : "continue";
}

function sweep(compare: number, merge: number) {
  return ["merged = []", merge === 2 && "first = 0",
    "for i in range(len(pairs)):",
    block(compare < 0 ? pending("cuándo el intervalo se pisa con el último y cómo fusionarlo.") : [
      `if merged and ${overlaps[compare]}:`, block(extend(merge)),
      "else:", block(merge === 2 && "first = i", "merged.extend(pairs[i])")]),
    "return merged"];
}

export function python([approach, compare, merge]: Choices): string {
  const args = "intervals";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, pairs, "changed = True",
    "while changed:",
    block("changed = False", "i = 0",
      "while i < len(pairs):",
      block("j = i + 1",
        "while j < len(pairs):",
        block("if pairs[j][0] <= pairs[i][1] and pairs[i][0] <= pairs[j][1]:",
          block("pairs[i] = [min(pairs[i][0], pairs[j][0]), max(pairs[i][1], pairs[j][1])]", "pairs.pop(j)", "changed = True"),
          "else:", block("j += 1")),
        "i += 1")),
    "pairs.sort()",
    "return [value for pair in pairs for value in pair]");
  if (approach === 2) return fn(args, "last = max(intervals[1::2], default=-1)", "covered = [False] * (last + 1)",
    "for i in range(0, len(intervals), 2):",
    block("for t in range(intervals[i], intervals[i + 1] + 1):", block("covered[t] = True")),
    "merged = []",
    "for t in range(last + 1):",
    block("if covered[t] and (t == 0 or not covered[t - 1]):", block("merged.append(t)"),
      "if covered[t] and (t == last or not covered[t + 1]):", block("merged.append(t)")),
    "return merged");
  if (approach === 3) return fn(args, pairs, sweep(0, 0));
  return fn(args, pairs, "pairs.sort()", sweep(compare, merge));
}
