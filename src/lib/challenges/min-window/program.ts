import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const countT = jsBlock("for (const letter of t)", "need.set(letter, (need.get(letter) ?? 0) + 1);");
const take = (ch: string, wanted: string) => [jsBlock(`if (${wanted})`, "missing--;"), `need.set(${ch}, (need.get(${ch}) ?? 0) - 1);`];
const record = jsBlock('if (best === "" || right - left + 1 < best.length)', "best = s.slice(left, right + 1);");

function memoryParts(memory: number) {
  if (memory === 2) return {
    init: ["const target = new Map();", jsBlock("for (const letter of t)", "target.set(letter, (target.get(letter) ?? 0) + 1);"), "const have = new Map();",
      jsBlock("function covers()", jsBlock("for (const [ch, count] of target)", "if ((have.get(ch) ?? 0) < count) return false;"), "return true;")],
    reset: ["have.clear();"],
    valid: "covers()",
    add: ["have.set(ch, (have.get(ch) ?? 0) + 1);"],
    remove: ["const out = s[left];", "have.set(out, have.get(out) - 1);", "left++;"],
    trace: "have.size",
  };
  const fill = memory === 1 ? jsBlock("for (const letter of t)", "need.set(letter, 1);") : countT;
  const total = memory === 1 ? "need.size" : "t.length";
  return {
    init: ["const need = new Map();", fill, `let missing = ${total};`],
    reset: ["need.clear();", fill, `missing = ${total};`],
    valid: "missing === 0",
    add: take("ch", memory === 3 ? "t.includes(ch)" : "(need.get(ch) ?? 0) > 0"),
    remove: ["const out = s[left];", "need.set(out, need.get(out) + 1);", jsBlock(memory === 3 ? "if (t.includes(out))" : "if (need.get(out) > 0)", "missing++;"), "left++;"],
    trace: "missing",
  };
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render('let best = "";',
    jsBlock("for (let start = 0; start < s.length; start++)", "const need = new Map();", countT, "let missing = t.length;",
      jsBlock("for (let end = start; end < s.length; end++)", "const ch = s[end];", take("ch", "(need.get(ch) ?? 0) > 0"),
        "emit(end, start, [missing], best.length);",
        jsBlock("if (missing === 0)", jsBlock('if (best === "" || end - start + 1 < best.length)', "best = s.slice(start, end + 1);"), "break;"))),
    "return best;");
  if (approach === 2) return render(
    jsBlock("for (let start = 0; start + t.length <= s.length; start++)", "const need = new Map();", countT, "let missing = t.length;",
      jsBlock("for (let end = start; end < start + t.length; end++)", "const ch = s[end];", take("ch", "(need.get(ch) ?? 0) > 0")),
      "emit(start + t.length - 1, start, [missing], t.length);",
      jsBlock("if (missing === 0)", "return s.slice(start, start + t.length);")),
    'return "";');
  if (approach === 3) return render("let first = s.length;", "let last = -1;",
    jsBlock("for (const ch of t)", "const at = s.indexOf(ch);", jsBlock("if (at < 0)", 'return "";'), "first = Math.min(first, at);", "last = Math.max(last, at);", "emit(last, first, [at], last - first + 1);"),
    "return s.slice(first, last + 1);");
  if (memory < 0) return render(jsPending("qué guardar de t."), "let left = 0;", 'let best = "";',
    jsBlock("for (let right = 0; right < s.length; right++)", jsPending("sumar la letra nueva y decidir si la ventana cubre t.")),
    "return best;");
  const parts = memoryParts(memory);
  const onCover = rule < 0 ? jsPending("qué hacer cuando la ventana cubre t.")
    : rule === 0 ? jsBlock(`while (${parts.valid})`, record, parts.remove)
    : rule === 1 ? jsBlock(`if (${parts.valid})`, record, parts.remove)
    : rule === 2 ? jsBlock(`while (${parts.valid})`, parts.remove,
      jsBlock(`if (!(${parts.valid}) && (best === "" || right - left + 2 < best.length))`, "best = s.slice(left, right + 1);"))
    : jsBlock(`if (${parts.valid})`, record, parts.reset, "left = right + 1;");
  return render(parts.init, "let left = 0;", 'let best = "";',
    jsBlock("for (let right = 0; right < s.length; right++)", "const ch = s[right];", parts.add, onCover,
      `emit(right, left, [${parts.trace}], best.length);`),
    "return best;");
}

export const typescript: [string, string][] = [
  ["const need = new Map();", "const need = new Map<string, number>();"],
  ["const target = new Map();", "const target = new Map<string, number>();"],
  ["const have = new Map();", "const have = new Map<string, number>();"],
  ["function covers() {", "function covers(): boolean {"],
  ["need.get(out) + 1", "need.get(out)! + 1"],
  ["need.get(out) > 0", "need.get(out)! > 0"],
  ["have.get(out) - 1", "have.get(out)! - 1"],
];
