import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const pairs = [
  "const sorted = [];",
  jsBlock("for (let i = 0; i < meetings.length; i += 2)", "sorted.push([meetings[i], meetings[i + 1]]);"),
  "sorted.sort((a, b) => a[0] - b[0] || a[1] - b[1]);",
];
const empty = "if (meetings.length === 0) return 0;";
const order = ["a[0] - b[0] || a[1] - b[1]", "a[0] - b[0] || b[1] - a[1]", "a[0] - b[0] || a[1] - b[1]", "a[0] - b[0]"];

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("let best = 0;",
    jsBlock("for (let i = 0; i < meetings.length; i += 2)", "let active = 0;",
      jsBlock("for (let j = 0; j < meetings.length; j += 2)", jsBlock("if (meetings[j] <= meetings[i] && meetings[i] < meetings[j + 1])", "active++;")),
      "best = Math.max(best, active);",
      "emit(i, i, [active], best);"),
    "return best;");
  if (approach === 2) return render(empty, pairs, "let best = 1;", "let run = 1;",
    jsBlock("for (let i = 1; i < sorted.length; i++)", "run = sorted[i][0] < sorted[i - 1][1] ? run + 1 : 1;", "best = Math.max(best, run);", "emit(2 * i, 2 * i - 2, [run], best);"),
    "return best;");
  if (approach === 3) return render(empty, pairs, "let groups = 1;", "let end = sorted[0][1];",
    jsBlock("for (let i = 1; i < sorted.length; i++)",
      "if (sorted[i][0] < end) {", "  end = Math.max(end, sorted[i][1]);", "} else {", "  groups++;", "  end = sorted[i][1];", "}",
      "emit(2 * i, 2 * i, [end], groups);"),
    "return groups;");
  if (memory < 0) return render(jsPending("qué guardar de las reuniones."), jsPending("cómo encontrar el momento más ocupado."));
  const tie = rule < 0 && jsPending("cómo desempatar dos eventos en el mismo minuto.");
  if (memory === 1) return render(empty, pairs, tie, "let rooms = 1;", "let last = sorted[0][1];",
    jsBlock("for (let i = 1; i < sorted.length; i++)", jsBlock("if (sorted[i][0] < last)", "rooms++;"), "last = sorted[i][1];", "emit(2 * i, 2 * i, [last], rooms);"),
    "return rooms;");
  if (memory === 2) return render("let last = 0;",
    jsBlock("for (let i = 1; i < meetings.length; i += 2)", "last = Math.max(last, meetings[i]);"),
    "const diff = new Array(last + 1).fill(0);",
    jsBlock("for (let i = 0; i < meetings.length; i += 2)", "diff[meetings[i]]++;", "diff[meetings[i + 1]]--;"),
    tie, "let rooms = 0;", "let best = 0;",
    jsBlock("for (let t = 0; t < diff.length; t++)", "rooms += diff[t];", "best = Math.max(best, rooms);"),
    "return best;");
  return render("const events = [];",
    jsBlock("for (let i = 0; i < meetings.length; i += 2)", "events.push([meetings[i], 1]);", `events.push([meetings[i + 1]${memory === 3 ? " + 1" : ""}, -1]);`),
    rule < 0 ? jsPending("cómo ordenar los eventos y qué devolver.") : [
      `events.sort((a, b) => ${order[rule]});`, "let rooms = 0;", "let best = 0;",
      jsBlock("for (let i = 0; i < events.length; i++)", "rooms += events[i][1];", "best = Math.max(best, rooms);", "emit(i, 0, [rooms], best, events.map(event => event[0]));"),
      `return ${rule === 2 ? "rooms" : "best"};`]);
}

export const typescript: [string, string][] = [
  ["const sorted = [];", "const sorted: [number, number][] = [];"],
  ["const events = [];", "const events: [number, number][] = [];"],
  ["const diff = new Array(", "const diff: number[] = new Array("],
];
