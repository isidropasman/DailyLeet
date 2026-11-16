import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const args = "a, b";
const table = "dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]";

function cell(rule: number): string {
  const same = rule === 2 ? "a[i % len(a)] == b[j % len(b)]" : "a[i - 1] == b[j - 1]";
  const edit = rule === 1 ? "1 + min(up, left)" : rule === 3 ? "diag + 1" : "1 + min(diag, up, left)";
  return `diag if ${same} else ${edit}`;
}

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, table,
    "for i in range(1, len(a) + 1):",
    block("for j in range(1, len(b) + 1):", block("dp[i][j] = dp[i - 1][j - 1] + 1 if a[i - 1] == b[j - 1] else max(dp[i - 1][j], dp[i][j - 1])")),
    "return len(a) + len(b) - 2 * dp[len(a)][len(b)]");
  if (approach === 2) return fn(args, "diff = abs(len(a) - len(b))",
    "for i in range(min(len(a), len(b))):",
    block("if a[i] != b[i]:", block("diff += 1")),
    "return diff");
  if (approach === 3) return fn(args, "count = [0] * 26",
    "for i in range(len(a)):", block("count[ord(a[i]) - 97] += 1"),
    "common = 0",
    "for j in range(len(b)):", block("if count[ord(b[j]) - 97] > 0:", block("count[ord(b[j]) - 97] -= 1", "common += 1")),
    "return max(len(a), len(b)) - common");
  if (memory < 0) return fn(args, pending("cómo guardar la tabla."),
    "for i in range(1, len(a) + 1):", block("for j in range(1, len(b) + 1):", block(pending("calcular la celda (i, j)."))),
    pending("devolver la última celda."));
  const formula = rule < 0 ? pending("cómo calcular cada celda.") : null;
  if (memory === 0) return fn(args, "prev = list(range(len(b) + 1))",
    "for i in range(1, len(a) + 1):",
    block("cur = [i] + [0] * len(b)",
      "for j in range(1, len(b) + 1):", block("diag = prev[j - 1]", "up = prev[j]", "left = cur[j - 1]", formula ?? `cur[j] = ${cell(rule)}`),
      "prev = cur"),
    "return prev[len(b)]");
  if (memory === 2) return fn(args, "row = list(range(len(b) + 1))",
    "for i in range(1, len(a) + 1):",
    block("row[0] = i",
      "for j in range(1, len(b) + 1):", block("diag = row[j - 1]", "up = row[j]", "left = row[j - 1]", formula ?? `row[j] = ${cell(rule)}`)),
    "return row[len(b)]");
  return fn(args, table,
    memory === 1 && ["for i in range(len(a) + 1):", block("dp[i][0] = i"), "for j in range(len(b) + 1):", block("dp[0][j] = j")],
    "for i in range(1, len(a) + 1):",
    block("for j in range(1, len(b) + 1):", block("diag = dp[i - 1][j - 1]", "up = dp[i - 1][j]", "left = dp[i][j - 1]", formula ?? `dp[i][j] = ${cell(rule)}`)),
    "return dp[len(a)][len(b)]");
}
