import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "grid, cols";
const position = ["r = i // cols", "c = i % cols"];

function directions(memory: number): Line {
  if (memory < 0) return pending("qué celdas cuentan como vecinas.");
  if (memory === 1) return [position, "for dr in range(-1, 2):", block("for dc in range(-1, 2):", block("nr = r + dr", "nc = c + dc",
    "if (dr != 0 or dc != 0) and nr >= 0 and nr < rows and nc >= 0 and nc < cols:", block("out.append(nr * cols + nc)")))];
  if (memory === 2) return [position, "if c + 1 < cols:", block("out.append(i + 1)"), "if r + 1 < rows:", block("out.append(i + cols)")];
  if (memory === 3) return ["for v in (i - cols, i + cols, i - 1, i + 1):", block("if v >= 0 and v < rows * cols:", block("out.append(v)"))];
  return [position,
    "if r > 0:", block("out.append(i - cols)"), "if r + 1 < rows:", block("out.append(i + cols)"),
    "if c > 0:", block("out.append(i - 1)"), "if c + 1 < cols:", block("out.append(i + 1)")];
}

const setup = (memory: number): Line => ["size = len(grid)", "rows = size // cols", "cells = list(grid)",
  "def neighbors(i):", block("out = []", directions(memory), "return out")];

const unreached = (seen: string): Line => ["for i in range(size):", block(`if cells[i] == 1 and not ${seen}[i]:`, block("return -1"))];

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, setup(memory), "fresh = 0",
    "for i in range(size):", block("if cells[i] == 1:", block("fresh += 1")),
    "minutes = 0",
    "while fresh > 0:",
    block("rotting = []",
      "for i in range(size):", block("if cells[i] == 2:", block("for v in neighbors(i):", block("if cells[v] == 1:", block("rotting.append(v)")))),
      "if len(rotting) == 0:", block("return -1"),
      "for v in rotting:", block("if cells[v] == 1:", block("cells[v] = 2", "fresh -= 1")),
      "minutes += 1"),
    "return minutes");
  if (approach === 2) return fn(args, setup(memory), "reached = [False] * size", "worst = 0",
    "for s in range(size):",
    block("if cells[s] != 2:", block("continue"),
      "dist = [-1] * size", "dist[s] = 0", "queue = [s]", "head = 0",
      "while head < len(queue):",
      block("u = queue[head]", "head += 1", "worst = max(worst, dist[u])",
        "for v in neighbors(u):", block("if cells[v] == 1 and dist[v] < 0:", block("dist[v] = dist[u] + 1", "reached[v] = True", "queue.append(v)")))),
    unreached("reached"), "return worst");
  if (approach === 3) return fn(args, setup(memory), "stack = []", "depth = []",
    "for i in range(size):", block("if cells[i] == 2:", block("stack.append(i)", "depth.append(0)")),
    "seen = [False] * size", "worst = 0",
    "while len(stack) > 0:",
    block("u = stack.pop()", "d = depth.pop()",
      "if seen[u]:", block("continue"),
      "seen[u] = True", "worst = max(worst, d)",
      "for v in neighbors(u):", block("if cells[v] == 1 and not seen[v]:", block("stack.append(v)", "depth.append(d + 1)"))),
    unreached("seen"), "return worst");
  const start: Line = ["queue = []", "fresh = 0",
    "for i in range(size):", block("if cells[i] == 2:", block("queue.append(i)"), "if cells[i] == 1:", block("fresh += 1"))];
  if (rule < 0) return fn(args, setup(memory), start, pending("cuándo cortar y qué devolver."), "return -1");
  return fn(args, setup(memory), start,
    rule === 3 && ["if len(queue) == 0:", block("return -1")],
    "minutes = 0", "head = 0",
    rule === 2 ? "while head < len(queue):" : "while head < len(queue) and fresh > 0:",
    block("end = len(queue)",
      "while head < end:",
      block("u = queue[head]", "head += 1",
        "for v in neighbors(u):", block("if cells[v] == 1:", block("cells[v] = 2", "fresh -= 1", "queue.append(v)"))),
      "minutes += 1"),
    rule === 1 ? "return minutes" : "return -1 if fresh > 0 else minutes");
}
