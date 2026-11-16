import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn("temperatures", "# Elegí un enfoque para empezar a construir.");
  const answer = "answer = [0] * len(temperatures)";
  if (approach === 1) return fn("temperatures", answer,
    "for i in range(len(temperatures)):",
    block("for j in range(i + 1, len(temperatures)):", block("if temperatures[j] > temperatures[i]:", block("answer[i] = j - i", "break"))),
    "return answer");
  if (approach === 2) return fn("temperatures", answer,
    "for i in range(len(temperatures) - 2, -1, -1):",
    block("if temperatures[i + 1] > temperatures[i]:", block("answer[i] = 1"), "elif answer[i + 1] > 0:", block("answer[i] = answer[i + 1] + 1")),
    "return answer");
  if (approach === 3) return fn("temperatures", answer, "best = -1",
    "for i in range(len(temperatures) - 1, -1, -1):",
    block("if best >= 0 and temperatures[best] > temperatures[i]:", block("answer[i] = best - i"), "if best < 0 or temperatures[i] >= temperatures[best]:", block("best = i")),
    "return answer");
  const top = memory === 2 ? "pending[0]" : "pending[-1]";
  const resolve: Line = rule < 0 ? pending("cuándo resolver un día pendiente.")
    : [`${rule === 2 ? "if" : "while"} pending and temperatures[i] ${rule === 1 ? ">=" : ">"} temperatures[${top}]:`,
      block(`j = ${memory === 2 ? "pending.popleft()" : "pending.pop()"}`, rule === 3 ? `answer[j] = i - ${top} if pending else i - j` : "answer[j] = i - j")];
  const record: Line = memory === 1 ? ["pending.clear()", "pending.append(i)"]
    : memory === 3 ? ["if pending and temperatures[pending[-1]] == temperatures[i]:", block("pending[-1] = i"), "else:", block("pending.append(i)")]
    : "pending.append(i)";
  const source = fn("temperatures", answer,
    memory < 0 ? pending("qué guardar de los días sin resolver.") : memory === 2 ? "pending = deque()" : "pending = []",
    "for i in range(len(temperatures)):",
    block(memory < 0 ? [pending("cómo resolver los días pendientes."), pending("registrar el día actual.")] : [resolve, record]),
    "return answer");
  return memory === 2 ? render("from collections import deque", "", "", source) : source;
}
