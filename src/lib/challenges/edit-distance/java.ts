import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(String a, String b)";
const table = "int[][] dp = new int[a.length() + 1][b.length() + 1];";

function cell(rule: number): string {
  const same = rule === 2 ? "a.charAt(i % a.length()) == b.charAt(j % b.length())" : "a.charAt(i - 1) == b.charAt(j - 1)";
  const edit = rule === 1 ? "1 + Math.min(up, left)" : rule === 3 ? "diag + 1" : "1 + Math.min(diag, Math.min(up, left))";
  return `${same} ? diag : ${edit}`;
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: [table,
    braces("for (int i = 1; i <= a.length(); i++)", braces("for (int j = 1; j <= b.length(); j++)",
      "dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);")),
    "return a.length() + b.length() - 2 * dp[a.length()][b.length()];"] });
  if (approach === 2) return javaClass(signature, { body: ["int diff = Math.abs(a.length() - b.length());",
    braces("for (int i = 0; i < Math.min(a.length(), b.length()); i++)", braces("if (a.charAt(i) != b.charAt(i))", "diff++;")),
    "return diff;"] });
  if (approach === 3) return javaClass(signature, { body: ["int[] count = new int[26];",
    braces("for (int i = 0; i < a.length(); i++)", "count[a.charAt(i) - 'a']++;"),
    "int common = 0;",
    braces("for (int j = 0; j < b.length(); j++)", braces("if (count[b.charAt(j) - 'a'] > 0)", "count[b.charAt(j) - 'a']--;", "common++;")),
    "return Math.max(a.length(), b.length()) - common;"] });
  if (memory < 0) return javaClass(signature, { body: [pending("cómo guardar la tabla."),
    braces("for (int i = 1; i <= a.length(); i++)", braces("for (int j = 1; j <= b.length(); j++)", pending("calcular la celda (i, j)."))),
    unfinished("devolver la última celda.")] });
  const formula = rule < 0 ? pending("cómo calcular cada celda.") : null;
  if (memory === 0) return javaClass(signature, { body: ["int[] prev = new int[b.length() + 1];",
    braces("for (int j = 0; j <= b.length(); j++)", "prev[j] = j;"),
    braces("for (int i = 1; i <= a.length(); i++)", "int[] cur = new int[b.length() + 1];", "cur[0] = i;",
      braces("for (int j = 1; j <= b.length(); j++)", "int diag = prev[j - 1];", "int up = prev[j];", "int left = cur[j - 1];", formula ?? `cur[j] = ${cell(rule)};`),
      "prev = cur;"),
    "return prev[b.length()];"] });
  if (memory === 2) return javaClass(signature, { body: ["int[] row = new int[b.length() + 1];",
    braces("for (int j = 0; j <= b.length(); j++)", "row[j] = j;"),
    braces("for (int i = 1; i <= a.length(); i++)", "row[0] = i;",
      braces("for (int j = 1; j <= b.length(); j++)", "int diag = row[j - 1];", "int up = row[j];", "int left = row[j - 1];", formula ?? `row[j] = ${cell(rule)};`)),
    "return row[b.length()];"] });
  return javaClass(signature, { body: [table,
    memory === 1 && [braces("for (int i = 0; i <= a.length(); i++)", "dp[i][0] = i;"), braces("for (int j = 0; j <= b.length(); j++)", "dp[0][j] = j;")],
    braces("for (int i = 1; i <= a.length(); i++)",
      braces("for (int j = 1; j <= b.length(); j++)", "int diag = dp[i - 1][j - 1];", "int up = dp[i - 1][j];", "int left = dp[i][j - 1];", formula ?? `dp[i][j] = ${cell(rule)};`)),
    "return dp[a.length()][b.length()];"] });
}
