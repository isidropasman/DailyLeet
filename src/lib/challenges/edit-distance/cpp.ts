import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::string& a, const std::string& b)";
const sizes = ["const int n = static_cast<int>(a.size());", "const int m = static_cast<int>(b.size());"];
const table = "std::vector<std::vector<int>> dp(n + 1, std::vector<int>(m + 1, 0));";

function cell(rule: number): string {
  const same = rule === 2 ? "a[i % n] == b[j % m]" : "a[i - 1] == b[j - 1]";
  const edit = rule === 1 ? "1 + std::min(up, left)" : rule === 3 ? "diag + 1" : "1 + std::min({diag, up, left})";
  return `${same} ? diag : ${edit}`;
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [sizes, table,
    braces("for (int i = 1; i <= n; i++)", braces("for (int j = 1; j <= m; j++)",
      "dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : std::max(dp[i - 1][j], dp[i][j - 1]);")),
    "return n + m - 2 * dp[n][m];"] });
  if (approach === 2) return translationUnit({ signature, body: [sizes, "int diff = std::abs(n - m);",
    braces("for (int i = 0; i < std::min(n, m); i++)", braces("if (a[i] != b[i])", "diff++;")),
    "return diff;"] });
  if (approach === 3) return translationUnit({ signature, body: [sizes, "std::vector<int> count(26, 0);",
    braces("for (int i = 0; i < n; i++)", "count[a[i] - 'a']++;"),
    "int common = 0;",
    braces("for (int j = 0; j < m; j++)", braces("if (count[b[j] - 'a'] > 0)", "count[b[j] - 'a']--;", "common++;")),
    "return std::max(n, m) - common;"] });
  if (memory < 0) return translationUnit({ signature, body: [sizes, pending("cómo guardar la tabla."),
    braces("for (int i = 1; i <= n; i++)", braces("for (int j = 1; j <= m; j++)", pending("calcular la celda (i, j)."))),
    unfinished("devolver la última celda.")] });
  const formula = rule < 0 ? pending("cómo calcular cada celda.") : null;
  if (memory === 0) return translationUnit({ signature, body: [sizes, "std::vector<int> prev(m + 1);",
    braces("for (int j = 0; j <= m; j++)", "prev[j] = j;"),
    braces("for (int i = 1; i <= n; i++)", "std::vector<int> cur(m + 1, 0);", "cur[0] = i;",
      braces("for (int j = 1; j <= m; j++)", "int diag = prev[j - 1];", "int up = prev[j];", "int left = cur[j - 1];", formula ?? `cur[j] = ${cell(rule)};`),
      "prev = cur;"),
    "return prev[m];"] });
  if (memory === 2) return translationUnit({ signature, body: [sizes, "std::vector<int> row(m + 1);",
    braces("for (int j = 0; j <= m; j++)", "row[j] = j;"),
    braces("for (int i = 1; i <= n; i++)", "row[0] = i;",
      braces("for (int j = 1; j <= m; j++)", "int diag = row[j - 1];", "int up = row[j];", "int left = row[j - 1];", formula ?? `row[j] = ${cell(rule)};`)),
    "return row[m];"] });
  return translationUnit({ signature, body: [sizes, table,
    memory === 1 && [braces("for (int i = 0; i <= n; i++)", "dp[i][0] = i;"), braces("for (int j = 0; j <= m; j++)", "dp[0][j] = j;")],
    braces("for (int i = 1; i <= n; i++)",
      braces("for (int j = 1; j <= m; j++)", "int diag = dp[i - 1][j - 1];", "int up = dp[i - 1][j];", "int left = dp[i][j - 1];", formula ?? `dp[i][j] = ${cell(rule)};`)),
    "return dp[n][m];"] });
}
