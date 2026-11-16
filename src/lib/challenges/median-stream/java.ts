import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending } from "../../java-preview";

const signature = "double[] solve(int[] nums)";
const answer = "double[] answer = new double[nums.length];";
const middle = (list: string) => `answer[i] = m % 2 == 1 ? ${list}.get(m / 2) : (${list}.get(m / 2 - 1) + ${list}.get(m / 2)) / 2.0;`;
const eachNumber = (...body: Line[]) => braces("for (int i = 0; i < nums.length; i++)", "int x = nums[i];", ...body);
const heap = (name: string) => `PriorityQueue<Integer> ${name} = new PriorityQueue<>();`;

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", "return new double[0];"] });
  if (approach === 1) return javaClass(signature, { body: [answer, "List<Integer> sorted = new ArrayList<>();",
    eachNumber("int lo = 0;", "int hi = sorted.size();",
      braces("while (lo < hi)", "int mid = (lo + hi) >> 1;", braces("if (sorted.get(mid) < x)", "lo = mid + 1;"), braces("else", "hi = mid;")),
      "sorted.add(lo, x);", "int m = sorted.size();", middle("sorted")),
    "return answer;"] });
  if (approach === 2) return javaClass(signature, { body: [answer, "long total = 0;",
    eachNumber("total += x;", "answer[i] = (double) total / (i + 1);"),
    "return answer;"] });
  if (approach === 3) return javaClass(signature, { body: [answer, heap("low"),
    eachNumber("low.add(-x);",
      braces("while (low.size() > (i + 2) >> 1)", "low.poll();"),
      "answer[i] = -low.peek();"),
    "return answer;"] });
  if (memory < 0) return javaClass(signature, { body: [answer, pending("dónde guardar los números que llegaron."),
    eachNumber(pending("insertar x y calcular la mediana.")), "return answer;"] });
  if (memory === 2 || memory === 3) {
    const list = memory === 2 ? "sorted" : "ends";
    const insert: Line = memory === 2 ? ["sorted.add(x);", "Collections.sort(sorted);"]
      : [braces("if (ends.isEmpty() || x <= ends.get(0))", "ends.add(0, x);"), braces("else", "ends.add(x);")];
    return javaClass(signature, { body: [answer, `List<Integer> ${list} = new ArrayList<>();`,
      eachNumber(insert, `int m = ${list}.size();`, rule < 0 ? pending("cómo combinar los dos del medio.") : middle(list)),
      "return answer;"] });
  }
  const neg = memory === 0 ? "-" : "";
  const insert: Line = rule < 0 ? pending("cómo insertar x y mantener las dos mitades.")
    : rule === 1 ? [`low.add(${neg}x);`, braces("if (low.size() > high.size() + 1)", `high.add(${neg}low.poll());`)]
    : [`low.add(${neg}x);`, `high.add(${neg}low.poll());`, braces("if (high.size() > low.size())", `low.add(${neg}high.poll());`)];
  const even = rule === 2 ? "lowTop" : rule === 3 ? "(lowTop + high.peek()) >> 1" : "(lowTop + high.peek()) / 2.0";
  const median: Line = rule < 0 ? pending("qué devolver con cantidad par.")
    : [`int lowTop = ${neg}low.peek();`, `answer[i] = low.size() > high.size() ? lowTop : ${even};`];
  return javaClass(signature, { body: [answer, heap("low"), heap("high"),
    eachNumber(insert, median),
    "return answer;"] });
}
