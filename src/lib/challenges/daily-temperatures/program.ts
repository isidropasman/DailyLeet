import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const answer = "const answer = new Array(temperatures.length).fill(0);";

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(answer,
    jsBlock("for (let i = 0; i < temperatures.length; i++)",
      jsBlock("for (let j = i + 1; j < temperatures.length; j++)",
        "emit(j, i, [i], answer[i]);",
        jsBlock("if (temperatures[j] > temperatures[i])", "answer[i] = j - i;", "break;"))),
    "return answer;");
  if (approach === 2) return render(answer,
    jsBlock("for (let i = temperatures.length - 2; i >= 0; i--)",
      "if (temperatures[i + 1] > temperatures[i]) {", "  answer[i] = 1;", "} else if (answer[i + 1] > 0) {", "  answer[i] = answer[i + 1] + 1;", "}",
      "emit(i, i, [answer[i + 1]], answer[i]);"),
    "return answer;");
  if (approach === 3) return render(answer, "let best = -1;",
    jsBlock("for (let i = temperatures.length - 1; i >= 0; i--)",
      jsBlock("if (best >= 0 && temperatures[best] > temperatures[i])", "answer[i] = best - i;"),
      jsBlock("if (best < 0 || temperatures[i] >= temperatures[best])", "best = i;"),
      "emit(i, i, [best], answer[i]);"),
    "return answer;");
  const top = memory === 2 ? "pending[0]" : "pending[pending.length - 1]";
  const pop = memory === 2 ? "pending.shift()" : "pending.pop()";
  const resolve = rule < 0 ? jsPending("cuándo resolver un día pendiente.")
    : jsBlock(`${rule === 2 ? "if" : "while"} (pending.length > 0 && temperatures[i] ${rule === 1 ? ">=" : ">"} temperatures[${top}])`,
      `const j = ${pop};`,
      rule === 3 ? `answer[j] = pending.length > 0 ? i - ${top} : i - j;` : "answer[j] = i - j;",
      "emit(i, j, [...pending], answer[j]);");
  const record = memory === 1 ? "pending.splice(0, pending.length, i);"
    : memory === 3 ? ["if (pending.length > 0 && temperatures[pending[pending.length - 1]] === temperatures[i]) {", "  pending[pending.length - 1] = i;", "} else {", "  pending.push(i);", "}"]
    : "pending.push(i);";
  return render(answer,
    memory < 0 ? jsPending("qué guardar de los días sin resolver.") : "const pending = [];",
    jsBlock("for (let i = 0; i < temperatures.length; i++)",
      memory < 0 ? [jsPending("cómo resolver los días pendientes."), jsPending("registrar el día actual.")] : [resolve, record, "emit(i, pending[0] ?? i, [...pending], pending.length);"]),
    "return answer;");
}

export const typescript: [string, string][] = [
  ["const answer = new Array(", "const answer: number[] = new Array("],
  ["const pending = [];", "const pending: number[] = [];"],
  ["const j = pending.shift();", "const j = pending.shift()!;"],
  ["const j = pending.pop();", "const j = pending.pop()!;"],
];
