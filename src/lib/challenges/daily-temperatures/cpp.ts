import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::vector<int> solve(const std::vector<int>& temperatures)";

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const setup = ["const int n = static_cast<int>(temperatures.size());", "std::vector<int> answer(temperatures.size(), 0);"];
  if (approach === 1) return translationUnit({ signature, body: [setup,
    braces("for (int i = 0; i < n; i++)", braces("for (int j = i + 1; j < n; j++)", braces("if (temperatures[j] > temperatures[i])", "answer[i] = j - i;", "break;"))),
    "return answer;"] });
  if (approach === 2) return translationUnit({ signature, body: [setup,
    braces("for (int i = n - 2; i >= 0; i--)", "if (temperatures[i + 1] > temperatures[i]) {", "    answer[i] = 1;", "} else if (answer[i + 1] > 0) {", "    answer[i] = answer[i + 1] + 1;", "}"),
    "return answer;"] });
  if (approach === 3) return translationUnit({ signature, body: [setup, "int best = -1;",
    braces("for (int i = n - 1; i >= 0; i--)", braces("if (best >= 0 && temperatures[best] > temperatures[i])", "answer[i] = best - i;"), braces("if (best < 0 || temperatures[i] >= temperatures[best])", "best = i;")),
    "return answer;"] });
  const top = memory === 2 ? "pending.front()" : "pending.back()";
  const resolve: Line = rule < 0 ? pending("cuándo resolver un día pendiente.")
    : braces(`${rule === 2 ? "if" : "while"} (!pending.empty() && temperatures[i] ${rule === 1 ? ">=" : ">"} temperatures[${top}])`,
      `int j = ${top};`, memory === 2 ? "pending.pop_front();" : "pending.pop_back();",
      rule === 3 ? `answer[j] = pending.empty() ? i - j : i - ${top};` : "answer[j] = i - j;");
  const record: Line = memory === 1 ? ["pending.clear();", "pending.push_back(i);"]
    : memory === 3 ? ["if (!pending.empty() && temperatures[pending.back()] == temperatures[i]) {", "    pending.back() = i;", "} else {", "    pending.push_back(i);", "}"]
    : "pending.push_back(i);";
  return translationUnit({ signature, body: [setup,
    memory < 0 ? pending("qué guardar de los días sin resolver.") : memory === 2 ? "std::deque<int> pending;" : "std::vector<int> pending;",
    braces("for (int i = 0; i < n; i++)", memory < 0 ? [pending("cómo resolver los días pendientes."), pending("registrar el día actual.")] : [resolve, record]),
    "return answer;"] });
}
