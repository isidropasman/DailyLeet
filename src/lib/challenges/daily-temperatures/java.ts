import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int[] solve(int[] temperatures)";

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const answer = "int[] answer = new int[temperatures.length];";
  if (approach === 1) return javaClass(signature, { body: [answer,
    braces("for (int i = 0; i < temperatures.length; i++)", braces("for (int j = i + 1; j < temperatures.length; j++)", braces("if (temperatures[j] > temperatures[i])", "answer[i] = j - i;", "break;"))),
    "return answer;"] });
  if (approach === 2) return javaClass(signature, { body: [answer,
    braces("for (int i = temperatures.length - 2; i >= 0; i--)", "if (temperatures[i + 1] > temperatures[i]) {", "    answer[i] = 1;", "} else if (answer[i + 1] > 0) {", "    answer[i] = answer[i + 1] + 1;", "}"),
    "return answer;"] });
  if (approach === 3) return javaClass(signature, { body: [answer, "int best = -1;",
    braces("for (int i = temperatures.length - 1; i >= 0; i--)", braces("if (best >= 0 && temperatures[best] > temperatures[i])", "answer[i] = best - i;"), braces("if (best < 0 || temperatures[i] >= temperatures[best])", "best = i;")),
    "return answer;"] });
  const peek = memory === 2 ? "pending.peekFirst()" : "pending.peekLast()";
  const resolve: Line = rule < 0 ? pending("cuándo resolver un día pendiente.")
    : braces(`${rule === 2 ? "if" : "while"} (!pending.isEmpty() && temperatures[i] ${rule === 1 ? ">=" : ">"} temperatures[${peek}])`,
      `int j = ${memory === 2 ? "pending.pollFirst()" : "pending.pollLast()"};`,
      rule === 3 ? `answer[j] = pending.isEmpty() ? i - j : i - ${peek};` : "answer[j] = i - j;");
  const record: Line = memory === 1 ? ["pending.clear();", "pending.addLast(i);"]
    : memory === 3 ? ["if (!pending.isEmpty() && temperatures[pending.peekLast()] == temperatures[i]) {", "    pending.pollLast();", "}", "pending.addLast(i);"]
    : "pending.addLast(i);";
  return javaClass(signature, { body: [answer,
    memory < 0 ? pending("qué guardar de los días sin resolver.") : "Deque<Integer> pending = new ArrayDeque<>();",
    braces("for (int i = 0; i < temperatures.length; i++)", memory < 0 ? [pending("cómo resolver los días pendientes."), pending("registrar el día actual.")] : [resolve, record]),
    "return answer;"] });
}
