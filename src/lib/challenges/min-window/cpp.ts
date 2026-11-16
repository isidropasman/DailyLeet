import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::string solve(const std::string& s, const std::string& t)";
const n = "const int n = static_cast<int>(s.size());";
const m = "const int m = static_cast<int>(t.size());";
const countT = braces("for (char letter : t)", "need[letter]++;");
const take = (wanted: string): Line => [braces(`if (${wanted})`, "missing--;"), "need[ch]--;"];
const record = braces("if (best.empty() || right - left + 1 < static_cast<int>(best.size()))", "best = s.substr(left, right - left + 1);");

function memoryParts(memory: number) {
  if (memory === 2) return {
    init: ["std::unordered_map<char, int> target;", braces("for (char letter : t)", "target[letter]++;"), "std::unordered_map<char, int> have;",
      "auto covers = [&]() {", "    for (const auto& [letter, count] : target) {", "        if (have[letter] < count) {", "            return false;", "        }", "    }", "    return true;", "};"],
    reset: ["have.clear();"],
    valid: "covers()",
    add: ["have[ch]++;"],
    remove: ["const char out = s[left];", "have[out]--;", "left++;"],
  };
  const fill = memory === 1 ? braces("for (char letter : t)", "need[letter] = 1;") : countT;
  const total = memory === 1 ? "static_cast<int>(need.size())" : "m";
  return {
    init: ["std::unordered_map<char, int> need;", fill, `int missing = ${total};`],
    reset: ["need.clear();", fill, `missing = ${total};`],
    valid: "missing == 0",
    add: take(memory === 3 ? "t.find(ch) != std::string::npos" : "need[ch] > 0"),
    remove: ["const char out = s[left];", "need[out]++;", braces(memory === 3 ? "if (t.find(out) != std::string::npos)" : "if (need[out] > 0)", "missing++;"), "left++;"],
  };
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [n, m, "std::string best;",
    braces("for (int start = 0; start < n; start++)", "std::unordered_map<char, int> need;", countT, "int missing = m;",
      braces("for (int end = start; end < n; end++)", "const char ch = s[end];", take("need[ch] > 0"),
        braces("if (missing == 0)", braces("if (best.empty() || end - start + 1 < static_cast<int>(best.size()))", "best = s.substr(start, end - start + 1);"), "break;"))),
    "return best;"] });
  if (approach === 2) return translationUnit({ signature, body: [n, m,
    braces("for (int start = 0; start + m <= n; start++)", "std::unordered_map<char, int> need;", countT, "int missing = m;",
      braces("for (int end = start; end < start + m; end++)", "const char ch = s[end];", take("need[ch] > 0")),
      braces("if (missing == 0)", "return s.substr(start, m);")),
    'return "";'] });
  if (approach === 3) return translationUnit({ signature, body: [n, "int first = n;", "int last = -1;",
    braces("for (char ch : t)", "const std::size_t at = s.find(ch);", braces("if (at == std::string::npos)", 'return "";'),
      "first = std::min(first, static_cast<int>(at));", "last = std::max(last, static_cast<int>(at));"),
    "return s.substr(first, last - first + 1);"] });
  if (memory < 0) return translationUnit({ signature, body: [n, pending("qué guardar de t."), "int left = 0;", "std::string best;",
    braces("for (int right = 0; right < n; right++)", pending("sumar la letra nueva y decidir si la ventana cubre t.")),
    "return best;"] });
  const parts = memoryParts(memory);
  const onCover: Line = rule < 0 ? pending("qué hacer cuando la ventana cubre t.")
    : rule === 0 ? braces(`while (${parts.valid})`, record, parts.remove)
    : rule === 1 ? braces(`if (${parts.valid})`, record, parts.remove)
    : rule === 2 ? braces(`while (${parts.valid})`, parts.remove,
      braces(`if (!(${parts.valid}) && (best.empty() || right - left + 2 < static_cast<int>(best.size())))`, "best = s.substr(left, right - left + 1);"))
    : braces(`if (${parts.valid})`, record, parts.reset, "left = right + 1;");
  return translationUnit({ signature, body: [n, m, parts.init, "int left = 0;", "std::string best;",
    braces("for (int right = 0; right < n; right++)", "const char ch = s[right];", parts.add, onCover),
    "return best;"] });
}
