import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const table = "const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));";

function cell(rule: number): string {
  const same = rule === 2 ? "a[i % a.length] === b[j % b.length]" : "a[i - 1] === b[j - 1]";
  const edit = rule === 1 ? "1 + Math.min(up, left)" : rule === 3 ? "diag + 1" : "1 + Math.min(diag, up, left)";
  return `${same} ? diag : ${edit}`;
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(table,
    jsBlock("for (let i = 1; i <= a.length; i++)",
      jsBlock("for (let j = 1; j <= b.length; j++)",
        "dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);",
        "emit(j, 0, [i], dp[i][j], dp[i]);")),
    "return a.length + b.length - 2 * dp[a.length][b.length];");
  if (approach === 2) return render("let diff = Math.abs(a.length - b.length);",
    jsBlock("for (let i = 0; i < Math.min(a.length, b.length); i++)",
      jsBlock("if (a[i] !== b[i])", "diff++;"),
      "emit(i, 0, [a[i], b[i]], diff);"),
    "return diff;");
  if (approach === 3) return render("const count = new Array(26).fill(0);",
    jsBlock("for (let i = 0; i < a.length; i++)", "count[a.charCodeAt(i) - 97]++;"),
    "let common = 0;",
    jsBlock("for (let j = 0; j < b.length; j++)",
      jsBlock("if (count[b.charCodeAt(j) - 97] > 0)", "count[b.charCodeAt(j) - 97]--;", "common++;"),
      "emit(j, 0, [b[j]], common);"),
    "return Math.max(a.length, b.length) - common;");
  if (memory < 0) return render(jsPending("cómo guardar la tabla."),
    jsBlock("for (let i = 1; i <= a.length; i++)", jsBlock("for (let j = 1; j <= b.length; j++)", jsPending("calcular la celda (i, j)."))),
    jsPending("devolver la última celda."));
  const formula = rule < 0 ? jsPending("cómo calcular cada celda.") : null;
  if (memory === 0) return render("let prev = Array.from({ length: b.length + 1 }, (_, j) => j);",
    jsBlock("for (let i = 1; i <= a.length; i++)", "const cur = [i];",
      jsBlock("for (let j = 1; j <= b.length; j++)", "const diag = prev[j - 1];", "const up = prev[j];", "const left = cur[j - 1];",
        formula ?? [`cur[j] = ${cell(rule)};`, "emit(j, 0, [diag, up, left], cur[j], cur);"]),
      "prev = cur;"),
    "return prev[b.length];");
  if (memory === 2) return render("const row = Array.from({ length: b.length + 1 }, (_, j) => j);",
    jsBlock("for (let i = 1; i <= a.length; i++)", "row[0] = i;",
      jsBlock("for (let j = 1; j <= b.length; j++)", "const diag = row[j - 1];", "const up = row[j];", "const left = row[j - 1];",
        formula ?? [`row[j] = ${cell(rule)};`, "emit(j, 0, [diag, up, left], row[j], row);"])),
    "return row[b.length];");
  return render(table,
    memory === 1 && [jsBlock("for (let i = 0; i <= a.length; i++)", "dp[i][0] = i;"), jsBlock("for (let j = 0; j <= b.length; j++)", "dp[0][j] = j;")],
    jsBlock("for (let i = 1; i <= a.length; i++)",
      jsBlock("for (let j = 1; j <= b.length; j++)", "const diag = dp[i - 1][j - 1];", "const up = dp[i - 1][j];", "const left = dp[i][j - 1];",
        formula ?? [`dp[i][j] = ${cell(rule)};`, "emit(j, 0, [diag, up, left], dp[i][j], dp[i]);"])),
    "return dp[a.length][b.length];");
}

export const typescript: [string, string][] = [
  ["() => new Array(b.length + 1).fill(0)", "() => new Array<number>(b.length + 1).fill(0)"],
  ["const count = new Array(26).fill(0);", "const count = new Array<number>(26).fill(0);"],
];
