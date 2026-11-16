import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

// JS has no heap: a minimal min-heap of numbers, shared by every approach that needs one.
const minHeap = jsBlock("class MinHeap",
  ...jsBlock("constructor()", "this.items = [];"),
  ...jsBlock("size()", "return this.items.length;"),
  ...jsBlock("top()", "return this.items[0];"),
  ...jsBlock("push(value)", "const items = this.items;", "items.push(value);", "let i = items.length - 1;",
    jsBlock("while (i > 0 && items[i] < items[(i - 1) >> 1])", "const p = (i - 1) >> 1;", "[items[i], items[p]] = [items[p], items[i]];", "i = p;")),
  ...jsBlock("pop()", "const items = this.items;", "const top = items[0];", "const last = items.pop();",
    jsBlock("if (items.length > 0)", "items[0] = last;", "let i = 0;",
      jsBlock("while (true)", "const l = 2 * i + 1;", "const r = l + 1;", "let best = i;",
        jsBlock("if (l < items.length && items[l] < items[best])", "best = l;"),
        jsBlock("if (r < items.length && items[r] < items[best])", "best = r;"),
        jsBlock("if (best === i)", "break;"),
        "[items[i], items[best]] = [items[best], items[i]];", "i = best;")),
    "return top;"));

const answer = "const answer = [];";
const middle = (list: string) => `answer.push(m % 2 === 1 ? ${list}[m >> 1] : (${list}[(m >> 1) - 1] + ${list}[m >> 1]) / 2);`;
const eachNumber = (...body: Line[]) => jsBlock("for (let i = 0; i < nums.length; i++)", "const x = nums[i];", ...body);

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(answer, "const sorted = [];",
    eachNumber("let lo = 0;", "let hi = sorted.length;",
      jsBlock("while (lo < hi)", "const mid = (lo + hi) >> 1;",
        jsBlock("if (sorted[mid] < x)", "lo = mid + 1;"), jsBlock("else", "hi = mid;")),
      "sorted.splice(lo, 0, x);", "const m = sorted.length;", middle("sorted"),
      "emit(i, i, [...sorted], answer[i]);"),
    "return answer;");
  if (approach === 2) return render(answer, "let total = 0;",
    eachNumber("total += x;", "answer.push(total / (i + 1));", "emit(i, 0, [total], answer[i]);"),
    "return answer;");
  if (approach === 3) return render(minHeap, answer, "const low = new MinHeap();",
    eachNumber("low.push(-x);",
      jsBlock("while (low.size() > (i + 2) >> 1)", "low.pop();"),
      "answer.push(-low.top());",
      "emit(i, 0, low.items.map(v => -v), answer[i]);"),
    "return answer;");
  if (memory < 0) return render(answer, jsPending("dónde guardar los números que llegaron."),
    eachNumber(jsPending("insertar x y calcular la mediana.")), "return answer;");
  if (memory === 2 || memory === 3) {
    const list = memory === 2 ? "sorted" : "ends";
    const insert = memory === 2 ? ["sorted.push(x);", "sorted.sort((a, b) => a - b);"]
      : [jsBlock("if (ends.length === 0 || x <= ends[0])", "ends.unshift(x);"), jsBlock("else", "ends.push(x);")];
    return render(answer, `const ${list} = [];`,
      eachNumber(insert, `const m = ${list}.length;`,
        rule < 0 ? jsPending("cómo combinar los dos del medio.") : middle(list),
        `emit(i, 0, [...${list}], answer[i] ?? 0);`),
      "return answer;");
  }
  const neg = memory === 0 ? "-" : "";
  const insert = rule < 0 ? jsPending("cómo insertar x y mantener las dos mitades.")
    : rule === 1 ? [`low.push(${neg}x);`, jsBlock("if (low.size() > high.size() + 1)", `high.push(${neg}low.pop());`)]
    : [`low.push(${neg}x);`, `high.push(${neg}low.pop());`, jsBlock("if (high.size() > low.size())", `low.push(${neg}high.pop());`)];
  const even = rule === 2 ? "lowTop" : rule === 3 ? "(lowTop + high.top()) >> 1" : "(lowTop + high.top()) / 2";
  const median = rule < 0 ? jsPending("qué devolver con cantidad par.")
    : [`const lowTop = ${neg}low.top();`, `answer.push(low.size() > high.size() ? lowTop : ${even});`];
  return render(minHeap, answer, "const low = new MinHeap();", "const high = new MinHeap();",
    eachNumber(insert, median, `emit(i, 0, [...low.items.map(v => ${neg}v), "|", ...high.items], answer[i] ?? 0);`),
    "return answer;");
}

export const typescript: [string, string][] = [
  ["class MinHeap {", "class MinHeap {\n  items: number[];"],
  ["push(value) {", "push(value: number) {"],
  ["const last = items.pop();", "const last = items.pop()!;"],
  ["const answer = [];", "const answer: number[] = [];"],
  ["const sorted = [];", "const sorted: number[] = [];"],
  ["const ends = [];", "const ends: number[] = [];"],
];
