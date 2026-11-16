import type { Choices } from "../../challenges";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& piles, int h)";
const perPile = ["(pile + v - 1) / v", "pile / v", "pile / v + 1", "static_cast<int>(pile / static_cast<double>(v) + 0.5)"];

const hours = (memory: number) => [braces("int hours(const std::vector<int>& piles, int v)", "int total = 0;",
  braces("for (int pile : piles)", memory < 0 ? pending("cuántas horas lleva cada pila.") : `total += ${perPile[memory]};`), "return total;")];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 2) return translationUnit({ signature, body: ["int total = 0;", braces("for (int pile : piles)", "total += pile;"), "return (total + h - 1) / h;"] });
  const helpers = hours(memory);
  if (approach === 1) return translationUnit({ signature, helpers, body: ["const int max = std::ranges::max(piles);", "int v = 1;",
    braces("while (v < max && hours(piles, v) > h)", "v++;"), "return v;"] });
  if (approach === 3) return translationUnit({ signature, helpers, body: ["std::vector<int> speeds(piles);", "std::ranges::sort(speeds);", "speeds.erase(std::ranges::unique(speeds).begin(), speeds.end());",
    "int lo = 0;", "int hi = static_cast<int>(speeds.size()) - 1;",
    braces("while (lo < hi)", "const int mid = (lo + hi) / 2;", "if (hours(piles, speeds[mid]) <= h) {", "    hi = mid;", "} else {", "    lo = mid + 1;", "}"),
    "return speeds[lo];"] });
  if (rule < 0) return translationUnit({ signature, helpers, body: [pending("dónde empieza la búsqueda y cómo mover los bordes."), unfinished("dónde empieza la búsqueda y cómo mover los bordes.")] });
  return translationUnit({ signature, helpers, body: [
    `int lo = ${rule === 2 ? "std::ranges::min(piles)" : "1"};`, "int hi = std::ranges::max(piles);",
    braces("while (lo < hi)", "const int mid = (lo + hi) / 2;", "if (hours(piles, mid) <= h) {", `    ${["hi = mid;", "hi = mid - 1;", "hi = mid;", "return mid;"][rule]}`, "} else {", "    lo = mid + 1;", "}"),
    "return lo;"] });
}
