import type { Choices } from "../../challenges";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] piles, int h)";
const perPile = ["(pile + v - 1) / v", "pile / v", "pile / v + 1", "(int) (pile / (double) v + 0.5)"];

const hours = (memory: number) => [braces("private static int hours(int[] piles, int v)", "int total = 0;",
  braces("for (int pile : piles)", memory < 0 ? pending("cuántas horas lleva cada pila.") : `total += ${perPile[memory]};`), "return total;")];

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 2) return javaClass(signature, { body: ["int total = 0;", braces("for (int pile : piles)", "total += pile;"), "return (total + h - 1) / h;"] });
  const helpers = hours(memory);
  if (approach === 1) return javaClass(signature, { helpers, body: ["int max = Arrays.stream(piles).max().getAsInt();", "int v = 1;",
    braces("while (v < max && hours(piles, v) > h)", "v++;"), "return v;"] });
  if (approach === 3) return javaClass(signature, { helpers, body: ["int[] speeds = Arrays.stream(piles).distinct().sorted().toArray();", "int lo = 0;", "int hi = speeds.length - 1;",
    braces("while (lo < hi)", "int mid = (lo + hi) / 2;", "if (hours(piles, speeds[mid]) <= h) {", "    hi = mid;", "} else {", "    lo = mid + 1;", "}"),
    "return speeds[lo];"] });
  if (rule < 0) return javaClass(signature, { helpers, body: [pending("dónde empieza la búsqueda y cómo mover los bordes."), unfinished("dónde empieza la búsqueda y cómo mover los bordes.")] });
  return javaClass(signature, { helpers, body: [
    `int lo = ${rule === 2 ? "Arrays.stream(piles).min().getAsInt()" : "1"};`, "int hi = Arrays.stream(piles).max().getAsInt();",
    braces("while (lo < hi)", "int mid = (lo + hi) / 2;", "if (hours(piles, mid) <= h) {", `    ${["hi = mid;", "hi = mid - 1;", "hi = mid;", "return mid;"][rule]}`, "} else {", "    lo = mid + 1;", "}"),
    "return lo;"] });
}
