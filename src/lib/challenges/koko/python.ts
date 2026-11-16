import type { Choices } from "../../challenges";
import { block, fn, pending } from "../../python-preview";

const perPile = ["(pile + v - 1) // v", "pile // v", "pile // v + 1", "int(pile / v + 0.5)"];

const hours = (memory: number) => ["def hours(v):", block("total = 0", "for pile in piles:",
  block(memory < 0 ? pending("cuántas horas lleva cada pila.") : `total += ${perPile[memory]}`), "return total")];

export function python([approach, memory, rule]: Choices): string {
  const args = "piles, h";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 2) return fn(args, "total = 0", "for pile in piles:", block("total += pile"), "return (total + h - 1) // h");
  if (approach === 1) return fn(args, hours(memory), "top = max(piles)", "v = 1", "while v < top and hours(v) > h:", block("v += 1"), "return v");
  if (approach === 3) return fn(args, hours(memory), "speeds = sorted(set(piles))", "lo = 0", "hi = len(speeds) - 1",
    "while lo < hi:", block("mid = (lo + hi) // 2", "if hours(speeds[mid]) <= h:", block("hi = mid"), "else:", block("lo = mid + 1")),
    "return speeds[lo]");
  if (rule < 0) return fn(args, hours(memory), pending("dónde empieza la búsqueda y cómo mover los bordes."));
  return fn(args, hours(memory),
    `lo = ${rule === 2 ? "min(piles)" : "1"}`, "hi = max(piles)",
    "while lo < hi:", block("mid = (lo + hi) // 2", "if hours(mid) <= h:", block(["hi = mid", "hi = mid - 1", "hi = mid", "return mid"][rule]), "else:", block("lo = mid + 1")),
    "return lo");
}
