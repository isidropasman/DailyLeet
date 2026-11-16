import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const pairs = "pairs = sorted((meetings[i], meetings[i + 1]) for i in range(0, len(meetings), 2))";
const empty = ["if not meetings:", block("return 0")];
const order = ["(e[0], e[1])", "(e[0], -e[1])", "(e[0], e[1])", "e[0]"];

export function python([approach, memory, rule]: Choices): string {
  const args = "meetings";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "best = 0",
    "for i in range(0, len(meetings), 2):",
    block("active = 0", "for j in range(0, len(meetings), 2):", block("if meetings[j] <= meetings[i] < meetings[j + 1]:", block("active += 1")), "best = max(best, active)"),
    "return best");
  if (approach === 2) return fn(args, empty, pairs, "best = 1", "run = 1",
    "for i in range(1, len(pairs)):", block("run = run + 1 if pairs[i][0] < pairs[i - 1][1] else 1", "best = max(best, run)"),
    "return best");
  if (approach === 3) return fn(args, empty, pairs, "groups = 1", "end = pairs[0][1]",
    "for start, finish in pairs[1:]:", block("if start < end:", block("end = max(end, finish)"), "else:", block("groups += 1", "end = finish")),
    "return groups");
  if (memory < 0) return fn(args, pending("qué guardar de las reuniones."), pending("cómo encontrar el momento más ocupado."));
  const tie = rule < 0 && pending("cómo desempatar dos eventos en el mismo minuto.");
  if (memory === 1) return fn(args, empty, pairs, tie, "rooms = 1", "last = pairs[0][1]",
    "for start, finish in pairs[1:]:", block("if start < last:", block("rooms += 1"), "last = finish"),
    "return rooms");
  if (memory === 2) return fn(args, "last = max(meetings[1::2], default=0)", "diff = [0] * (last + 1)",
    "for i in range(0, len(meetings), 2):", block("diff[meetings[i]] += 1", "diff[meetings[i + 1]] -= 1"),
    tie, "rooms = 0", "best = 0",
    "for delta in diff:", block("rooms += delta", "best = max(best, rooms)"),
    "return best");
  return fn(args, "events = []",
    "for i in range(0, len(meetings), 2):", block("events.append((meetings[i], 1))", `events.append((meetings[i + 1]${memory === 3 ? " + 1" : ""}, -1))`),
    rule < 0 ? pending("cómo ordenar los eventos y qué devolver.") : [
      `events.sort(key=lambda e: ${order[rule]})`, "rooms = 0", "best = 0",
      "for _, delta in events:", block("rooms += delta", "best = max(best, rooms)"),
      `return ${rule === 2 ? "rooms" : "best"}`]);
}
