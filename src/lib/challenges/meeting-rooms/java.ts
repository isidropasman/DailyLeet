import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] meetings)";
const pairs = [
  "int[][] sorted = new int[meetings.length / 2][];",
  braces("for (int i = 0; i < meetings.length; i += 2)", "sorted[i / 2] = new int[] {meetings[i], meetings[i + 1]};"),
  "Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));",
];
const empty = ["if (meetings.length == 0) {", "    return 0;", "}"];
const order = [
  "a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1])",
  "a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1])",
  "a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1])",
  "Integer.compare(a[0], b[0])",
];

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["int best = 0;",
    braces("for (int i = 0; i < meetings.length; i += 2)", "int active = 0;",
      braces("for (int j = 0; j < meetings.length; j += 2)", braces("if (meetings[j] <= meetings[i] && meetings[i] < meetings[j + 1])", "active++;")),
      "best = Math.max(best, active);"),
    "return best;"] });
  if (approach === 2) return javaClass(signature, { body: [empty, pairs, "int best = 1;", "int run = 1;",
    braces("for (int i = 1; i < sorted.length; i++)", "run = sorted[i][0] < sorted[i - 1][1] ? run + 1 : 1;", "best = Math.max(best, run);"),
    "return best;"] });
  if (approach === 3) return javaClass(signature, { body: [empty, pairs, "int groups = 1;", "int end = sorted[0][1];",
    braces("for (int i = 1; i < sorted.length; i++)",
      "if (sorted[i][0] < end) {", "    end = Math.max(end, sorted[i][1]);", "} else {", "    groups++;", "    end = sorted[i][1];", "}"),
    "return groups;"] });
  if (memory < 0) return javaClass(signature, { body: [pending("qué guardar de las reuniones."), unfinished("cómo encontrar el momento más ocupado.")] });
  const tie = rule < 0 && pending("cómo desempatar dos eventos en el mismo minuto.");
  if (memory === 1) return javaClass(signature, { body: [empty, pairs, tie, "int rooms = 1;", "int last = sorted[0][1];",
    braces("for (int i = 1; i < sorted.length; i++)", braces("if (sorted[i][0] < last)", "rooms++;"), "last = sorted[i][1];"),
    "return rooms;"] });
  if (memory === 2) return javaClass(signature, { body: ["int last = 0;",
    braces("for (int i = 1; i < meetings.length; i += 2)", "last = Math.max(last, meetings[i]);"),
    "int[] diff = new int[last + 1];",
    braces("for (int i = 0; i < meetings.length; i += 2)", "diff[meetings[i]]++;", "diff[meetings[i + 1]]--;"),
    tie, "int rooms = 0;", "int best = 0;",
    braces("for (int delta : diff)", "rooms += delta;", "best = Math.max(best, rooms);"),
    "return best;"] });
  return javaClass(signature, { body: ["List<int[]> events = new ArrayList<>();",
    braces("for (int i = 0; i < meetings.length; i += 2)", "events.add(new int[] {meetings[i], 1});", `events.add(new int[] {meetings[i + 1]${memory === 3 ? " + 1" : ""}, -1});`),
    rule < 0 ? [pending("cómo ordenar los eventos y qué devolver."), unfinished("cómo ordenar los eventos y qué devolver.")] : [
      `events.sort((a, b) -> ${order[rule]});`, "int rooms = 0;", "int best = 0;",
      braces("for (int[] event : events)", "rooms += event[1];", "best = Math.max(best, rooms);"),
      `return ${rule === 2 ? "rooms" : "best"};`]] });
}
