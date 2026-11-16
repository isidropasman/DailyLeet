import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "nums";
const middle = (list: string) => `answer.append(${list}[m // 2] if m % 2 == 1 else (${list}[m // 2 - 1] + ${list}[m // 2]) / 2)`;
const eachNumber = (...body: Line[]): Line => ["for i in range(len(nums)):", block("x = nums[i]", ...body)];
const withImport = (module: string, source: string) => render(`import ${module}`, "", "", source);

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "answer = []", "ordered = []",
    eachNumber("lo = 0", "hi = len(ordered)",
      "while lo < hi:", block("mid = (lo + hi) >> 1", "if ordered[mid] < x:", block("lo = mid + 1"), "else:", block("hi = mid")),
      "ordered.insert(lo, x)", "m = len(ordered)", middle("ordered")),
    "return answer");
  if (approach === 2) return fn(args, "answer = []", "total = 0",
    eachNumber("total += x", "answer.append(total / (i + 1))"),
    "return answer");
  if (approach === 3) return withImport("heapq", fn(args, "answer = []", "low = []",
    eachNumber("heapq.heappush(low, -x)",
      "while len(low) > (i + 2) >> 1:", block("heapq.heappop(low)"),
      "answer.append(-low[0])"),
    "return answer"));
  if (memory < 0) return fn(args, "answer = []", pending("dónde guardar los números que llegaron."),
    eachNumber(pending("insertar x y calcular la mediana.")), "return answer");
  if (memory === 2 || memory === 3) {
    const list = memory === 2 ? "ordered" : "ends";
    const insert: Line = memory === 2 ? ["ordered.append(x)", "ordered.sort()"]
      : ["if len(ends) == 0 or x <= ends[0]:", block("ends.appendleft(x)"), "else:", block("ends.append(x)")];
    const source = fn(args, "answer = []", memory === 2 ? "ordered = []" : "ends = deque()",
      eachNumber(insert, `m = len(${list})`, rule < 0 ? pending("cómo combinar los dos del medio.") : middle(list)),
      "return answer");
    return memory === 3 ? render("from collections import deque", "", "", source) : source;
  }
  const neg = memory === 0 ? "-" : "";
  const insert: Line = rule < 0 ? pending("cómo insertar x y mantener las dos mitades.")
    : rule === 1 ? [`heapq.heappush(low, ${neg}x)`, "if len(low) > len(high) + 1:", block(`heapq.heappush(high, ${neg}heapq.heappop(low))`)]
    : [`heapq.heappush(low, ${neg}x)`, `heapq.heappush(high, ${neg}heapq.heappop(low))`, "if len(high) > len(low):", block(`heapq.heappush(low, ${neg}heapq.heappop(high))`)];
  const even = rule === 2 ? "low_top" : rule === 3 ? "(low_top + high[0]) >> 1" : "(low_top + high[0]) / 2";
  const median: Line = rule < 0 ? pending("qué devolver con cantidad par.")
    : [`low_top = ${neg}low[0]`, `answer.append(low_top if len(low) > len(high) else ${even})`];
  return withImport("heapq", fn(args, "answer = []", "low = []", "high = []",
    eachNumber(insert, median),
    "return answer"));
}
