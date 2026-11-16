import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "String solve(String s, String t)";
const countT = braces("for (char letter : t.toCharArray())", "need.merge(letter, 1, Integer::sum);");
const take = (wanted: string): Line => [braces(`if (${wanted})`, "missing--;"), "need.merge(ch, -1, Integer::sum);"];
const record = braces("if (best.isEmpty() || right - left + 1 < best.length())", "best = s.substring(left, right + 1);");
const covers = braces("private static boolean covers(Map<Character, Integer> have, Map<Character, Integer> target)",
  braces("for (Map.Entry<Character, Integer> entry : target.entrySet())", braces("if (have.getOrDefault(entry.getKey(), 0) < entry.getValue())", "return false;")),
  "return true;");

function memoryParts(memory: number) {
  if (memory === 2) return {
    init: ["Map<Character, Integer> target = new HashMap<>();", braces("for (char letter : t.toCharArray())", "target.merge(letter, 1, Integer::sum);"), "Map<Character, Integer> have = new HashMap<>();"],
    reset: ["have.clear();"],
    valid: "covers(have, target)",
    add: ["have.merge(ch, 1, Integer::sum);"],
    remove: ["char out = s.charAt(left);", "have.merge(out, -1, Integer::sum);", "left++;"],
  };
  const fill = memory === 1 ? braces("for (char letter : t.toCharArray())", "need.put(letter, 1);") : countT;
  const total = memory === 1 ? "need.size()" : "t.length()";
  return {
    init: ["Map<Character, Integer> need = new HashMap<>();", fill, `int missing = ${total};`],
    reset: ["need.clear();", fill, `missing = ${total};`],
    valid: "missing == 0",
    add: take(memory === 3 ? "t.indexOf(ch) >= 0" : "need.getOrDefault(ch, 0) > 0"),
    remove: ["char out = s.charAt(left);", "need.merge(out, 1, Integer::sum);", braces(memory === 3 ? "if (t.indexOf(out) >= 0)" : "if (need.get(out) > 0)", "missing++;"), "left++;"],
  };
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ['String best = "";',
    braces("for (int start = 0; start < s.length(); start++)", "Map<Character, Integer> need = new HashMap<>();", countT, "int missing = t.length();",
      braces("for (int end = start; end < s.length(); end++)", "char ch = s.charAt(end);", take("need.getOrDefault(ch, 0) > 0"),
        braces("if (missing == 0)", braces("if (best.isEmpty() || end - start + 1 < best.length())", "best = s.substring(start, end + 1);"), "break;"))),
    "return best;"] });
  if (approach === 2) return javaClass(signature, { body: [
    braces("for (int start = 0; start + t.length() <= s.length(); start++)", "Map<Character, Integer> need = new HashMap<>();", countT, "int missing = t.length();",
      braces("for (int end = start; end < start + t.length(); end++)", "char ch = s.charAt(end);", take("need.getOrDefault(ch, 0) > 0")),
      braces("if (missing == 0)", "return s.substring(start, start + t.length());")),
    'return "";'] });
  if (approach === 3) return javaClass(signature, { body: ["int first = s.length();", "int last = -1;",
    braces("for (char ch : t.toCharArray())", "int at = s.indexOf(ch);", braces("if (at < 0)", 'return "";'), "first = Math.min(first, at);", "last = Math.max(last, at);"),
    "return s.substring(first, last + 1);"] });
  if (memory < 0) return javaClass(signature, { body: [pending("qué guardar de t."), "int left = 0;", 'String best = "";',
    braces("for (int right = 0; right < s.length(); right++)", pending("sumar la letra nueva y decidir si la ventana cubre t.")),
    "return best;"] });
  const parts = memoryParts(memory);
  const onCover: Line = rule < 0 ? pending("qué hacer cuando la ventana cubre t.")
    : rule === 0 ? braces(`while (${parts.valid})`, record, parts.remove)
    : rule === 1 ? braces(`if (${parts.valid})`, record, parts.remove)
    : rule === 2 ? braces(`while (${parts.valid})`, parts.remove,
      braces(`if (!(${parts.valid}) && (best.isEmpty() || right - left + 2 < best.length()))`, "best = s.substring(left, right + 1);"))
    : braces(`if (${parts.valid})`, record, parts.reset, "left = right + 1;");
  return javaClass(signature, { helpers: memory === 2 ? [covers] : [], body: [parts.init, "int left = 0;", 'String best = "";',
    braces("for (int right = 0; right < s.length(); right++)", "char ch = s.charAt(right);", parts.add, onCover),
    "return best;"] });
}
