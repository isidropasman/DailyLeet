import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const perPile = ["Math.floor((piles[i] + v - 1) / v)", "Math.floor(piles[i] / v)", "Math.floor(piles[i] / v) + 1", "Math.round(piles[i] / v)"];

function hours(memory: number) {
  return jsBlock("function hours(v)", "let total = 0;",
    jsBlock("for (let i = 0; i < piles.length; i++)",
      memory < 0 ? jsPending("cuántas horas lleva cada pila.") : [`total += ${perPile[memory]};`, "emit(i, i, [v], total);"]),
    "return total;");
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 2) return render("let total = 0;",
    jsBlock("for (let i = 0; i < piles.length; i++)", "total += piles[i];", "emit(i, 0, [total], total);"),
    "return Math.floor((total + h - 1) / h);");
  if (approach === 1) return render(hours(memory), "const max = Math.max(...piles);", "let v = 1;",
    jsBlock("while (v < max && hours(v) > h)", "v++;"),
    "return v;");
  if (approach === 3) return render(hours(memory), "const speeds = [...new Set(piles)].sort((a, b) => a - b);", "let lo = 0;", "let hi = speeds.length - 1;",
    jsBlock("while (lo < hi)", "const mid = Math.floor((lo + hi) / 2);", "if (hours(speeds[mid]) <= h) {", "  hi = mid;", "} else {", "  lo = mid + 1;", "}"),
    "return speeds[lo];");
  if (rule < 0) return render(hours(memory), jsPending("dónde empieza la búsqueda y cómo mover los bordes."));
  return render(hours(memory),
    `let lo = ${rule === 2 ? "Math.min(...piles)" : "1"};`, "let hi = Math.max(...piles);",
    jsBlock("while (lo < hi)", "const mid = Math.floor((lo + hi) / 2);",
      "if (hours(mid) <= h) {", `  ${["hi = mid;", "hi = mid - 1;", "hi = mid;", "return mid;"][rule]}`, "} else {", "  lo = mid + 1;", "}"),
    "return lo;");
}

export const typescript: [string, string][] = [
  ["function hours(v) {", "function hours(v: number): number {"],
];
