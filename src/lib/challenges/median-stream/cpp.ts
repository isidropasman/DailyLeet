import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit } from "../../cpp-preview";

const signature = "std::vector<double> solve(const std::vector<int>& nums)";
const answer = "std::vector<double> answer;";
const middle = (list: string) => `answer.push_back(m % 2 == 1 ? ${list}[m / 2] : (${list}[m / 2 - 1] + ${list}[m / 2]) / 2.0);`;
const eachNumber = (...body: Line[]) => braces("for (int i = 0; i < static_cast<int>(nums.size()); i++)", "int x = nums[i];", ...body);
const heap = (name: string) => `std::priority_queue<int, std::vector<int>, std::greater<int>> ${name};`;

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", "return {};"] });
  if (approach === 1) return translationUnit({ signature, body: [answer, "std::vector<int> sorted;",
    eachNumber("int lo = 0;", "int hi = static_cast<int>(sorted.size());",
      braces("while (lo < hi)", "int mid = (lo + hi) >> 1;", braces("if (sorted[mid] < x)", "lo = mid + 1;"), braces("else", "hi = mid;")),
      "sorted.insert(sorted.begin() + lo, x);", "int m = static_cast<int>(sorted.size());", middle("sorted")),
    "return answer;"] });
  if (approach === 2) return translationUnit({ signature, body: [answer, "long long total = 0;",
    eachNumber("total += x;", "answer.push_back(static_cast<double>(total) / (i + 1));"),
    "return answer;"] });
  if (approach === 3) return translationUnit({ signature, body: [answer, heap("low"),
    eachNumber("low.push(-x);",
      braces("while (static_cast<int>(low.size()) > (i + 2) >> 1)", "low.pop();"),
      "answer.push_back(-low.top());"),
    "return answer;"] });
  if (memory < 0) return translationUnit({ signature, body: [answer, pending("dónde guardar los números que llegaron."),
    eachNumber(pending("insertar x y calcular la mediana.")), "return answer;"] });
  if (memory === 2 || memory === 3) {
    const list = memory === 2 ? "sorted" : "ends";
    const insert: Line = memory === 2 ? ["sorted.push_back(x);", "std::ranges::sort(sorted);"]
      : [braces("if (ends.empty() || x <= ends.front())", "ends.push_front(x);"), braces("else", "ends.push_back(x);")];
    return translationUnit({ signature, body: [answer, memory === 2 ? "std::vector<int> sorted;" : "std::deque<int> ends;",
      eachNumber(insert, `int m = static_cast<int>(${list}.size());`, rule < 0 ? pending("cómo combinar los dos del medio.") : middle(list)),
      "return answer;"] });
  }
  const neg = memory === 0 ? "-" : "";
  const insert: Line = rule < 0 ? pending("cómo insertar x y mantener las dos mitades.")
    : rule === 1 ? [`low.push(${neg}x);`, braces("if (low.size() > high.size() + 1)", `high.push(${neg}low.top());`, "low.pop();")]
    : [`low.push(${neg}x);`, `high.push(${neg}low.top());`, "low.pop();", braces("if (high.size() > low.size())", `low.push(${neg}high.top());`, "high.pop();")];
  const even = rule === 2 ? "lowTop" : rule === 3 ? "(lowTop + high.top()) >> 1" : "(lowTop + high.top()) / 2.0";
  const median: Line = rule < 0 ? pending("qué devolver con cantidad par.")
    : [`int lowTop = ${neg}low.top();`, `answer.push_back(low.size() > high.size() ? lowTop : ${even});`];
  return translationUnit({ signature, body: [answer, heap("low"), heap("high"),
    eachNumber(insert, median),
    "return answer;"] });
}
