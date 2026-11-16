import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const countT = ["for letter in t:", block("need[letter] = need.get(letter, 0) + 1")];
const take = (wanted: string): Line => [`if ${wanted}:`, block("missing -= 1"), "need[ch] = need.get(ch, 0) - 1"];
const record = ['if best == "" or right - left + 1 < len(best):', block("best = s[left:right + 1]")];

function memoryParts(memory: number) {
  if (memory === 2) return {
    init: ["target = {}", "for letter in t:", block("target[letter] = target.get(letter, 0) + 1"), "have = {}",
      "def covers():", block("for ch, count in target.items():", block("if have.get(ch, 0) < count:", block("return False")), "return True")],
    reset: ["have.clear()"],
    valid: "covers()",
    add: ["have[ch] = have.get(ch, 0) + 1"],
    remove: ["out = s[left]", "have[out] -= 1", "left += 1"],
  };
  const fill = memory === 1 ? ["for letter in t:", block("need[letter] = 1")] : countT;
  const total = memory === 1 ? "len(need)" : "len(t)";
  return {
    init: ["need = {}", fill, `missing = ${total}`],
    reset: ["need.clear()", fill, `missing = ${total}`],
    valid: "missing == 0",
    add: take(memory === 3 ? "ch in t" : "need.get(ch, 0) > 0"),
    remove: ["out = s[left]", "need[out] += 1", memory === 3 ? "if out in t:" : "if need[out] > 0:", block("missing += 1"), "left += 1"],
  };
}

export function python([approach, memory, rule]: Choices): string {
  const args = "s, t";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, 'best = ""',
    "for start in range(len(s)):",
    block("need = {}", countT, "missing = len(t)",
      "for end in range(start, len(s)):",
      block("ch = s[end]", take("need.get(ch, 0) > 0"),
        "if missing == 0:", block('if best == "" or end - start + 1 < len(best):', block("best = s[start:end + 1]"), "break"))),
    "return best");
  if (approach === 2) return fn(args,
    "for start in range(len(s) - len(t) + 1):",
    block("need = {}", countT, "missing = len(t)",
      "for end in range(start, start + len(t)):", block("ch = s[end]", take("need.get(ch, 0) > 0")),
      "if missing == 0:", block("return s[start:start + len(t)]")),
    'return ""');
  if (approach === 3) return fn(args, "first = len(s)", "last = -1",
    "for ch in t:", block("at = s.find(ch)", "if at < 0:", block('return ""'), "first = min(first, at)", "last = max(last, at)"),
    "return s[first:last + 1]");
  if (memory < 0) return fn(args, pending("qué guardar de t."), "left = 0", 'best = ""',
    "for right in range(len(s)):", block(pending("sumar la letra nueva y decidir si la ventana cubre t.")),
    "return best");
  const parts = memoryParts(memory);
  const onCover: Line = rule < 0 ? pending("qué hacer cuando la ventana cubre t.")
    : rule === 0 ? [`while ${parts.valid}:`, block(record, parts.remove)]
    : rule === 1 ? [`if ${parts.valid}:`, block(record, parts.remove)]
    : rule === 2 ? [`while ${parts.valid}:`, block(parts.remove, `if not ${parts.valid} and (best == "" or right - left + 2 < len(best)):`, block("best = s[left:right + 1]"))]
    : [`if ${parts.valid}:`, block(record, parts.reset, "left = right + 1")];
  return fn(args, parts.init, "left = 0", 'best = ""',
    "for right in range(len(s)):", block("ch = s[right]", parts.add, onCover),
    "return best");
}
