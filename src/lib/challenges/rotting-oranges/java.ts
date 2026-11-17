import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] grid, int cols)";
const position = ["int r = i / cols;", "int c = i % cols;"];

function directions(memory: number): Line {
  if (memory < 0) return pending("qué celdas cuentan como vecinas.");
  if (memory === 1) return [position,
    braces("for (int dr = -1; dr <= 1; dr++)", braces("for (int dc = -1; dc <= 1; dc++)",
      "int nr = r + dr;", "int nc = c + dc;",
      braces("if ((dr != 0 || dc != 0) && nr >= 0 && nr < rows && nc >= 0 && nc < cols)", "out.add(nr * cols + nc);")))];
  if (memory === 2) return [position, braces("if (c + 1 < cols)", "out.add(i + 1);"), braces("if (r + 1 < rows)", "out.add(i + cols);")];
  if (memory === 3) return braces("for (int v : new int[] {i - cols, i + cols, i - 1, i + 1})", braces("if (v >= 0 && v < rows * cols)", "out.add(v);"));
  return [position,
    braces("if (r > 0)", "out.add(i - cols);"), braces("if (r + 1 < rows)", "out.add(i + cols);"),
    braces("if (c > 0)", "out.add(i - 1);"), braces("if (c + 1 < cols)", "out.add(i + 1);")];
}

const helpers = (memory: number) => [braces("private static List<Integer> neighbors(int i, int rows, int cols)",
  "List<Integer> out = new ArrayList<>();", directions(memory), "return out;")];
const setup = ["int size = grid.length;", "int rows = size / cols;", "int[] cells = grid.clone();"];
const unreached = (seen: string) => braces("for (int i = 0; i < size; i++)", braces(`if (cells[i] == 1 && !${seen}[i])`, "return -1;"));

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const method = (...body: Line[]) => javaClass(signature, { helpers: helpers(memory), body: [setup, ...body] });
  if (approach === 1) return method("int fresh = 0;",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 1)", "fresh++;")),
    "int minutes = 0;",
    braces("while (fresh > 0)", "List<Integer> rotting = new ArrayList<>();",
      braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)",
        braces("for (int v : neighbors(i, rows, cols))", braces("if (cells[v] == 1)", "rotting.add(v);")))),
      braces("if (rotting.isEmpty())", "return -1;"),
      braces("for (int v : rotting)", braces("if (cells[v] == 1)", "cells[v] = 2;", "fresh--;")),
      "minutes++;"),
    "return minutes;");
  if (approach === 2) return method("boolean[] reached = new boolean[size];", "int worst = 0;",
    braces("for (int s = 0; s < size; s++)",
      braces("if (cells[s] != 2)", "continue;"),
      "int[] dist = new int[size];", "Arrays.fill(dist, -1);", "dist[s] = 0;", "List<Integer> queue = new ArrayList<>(List.of(s));", "int head = 0;",
      braces("while (head < queue.size())",
        "int u = queue.get(head);", "head++;", "worst = Math.max(worst, dist[u]);",
        braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1 && dist[v] < 0)", "dist[v] = dist[u] + 1;", "reached[v] = true;", "queue.add(v);")))),
    unreached("reached"), "return worst;");
  if (approach === 3) return method("List<Integer> stack = new ArrayList<>();", "List<Integer> depth = new ArrayList<>();",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)", "stack.add(i);", "depth.add(0);")),
    "boolean[] seen = new boolean[size];", "int worst = 0;",
    braces("while (stack.size() > 0)",
      "int u = stack.remove(stack.size() - 1);", "int d = depth.remove(depth.size() - 1);",
      braces("if (seen[u])", "continue;"),
      "seen[u] = true;", "worst = Math.max(worst, d);",
      braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1 && !seen[v])", "stack.add(v);", "depth.add(d + 1);"))),
    unreached("seen"), "return worst;");
  const start = ["List<Integer> queue = new ArrayList<>();", "int fresh = 0;",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)", "queue.add(i);"), braces("if (cells[i] == 1)", "fresh++;"))];
  if (rule < 0) return method(start, pending("cuándo cortar y qué devolver."), unfinished("cuándo cortar y qué devolver."));
  return method(start,
    rule === 3 && braces("if (queue.isEmpty())", "return -1;"),
    "int minutes = 0;", "int head = 0;",
    braces(rule === 2 ? "while (head < queue.size())" : "while (head < queue.size() && fresh > 0)",
      "int end = queue.size();",
      braces("while (head < end)",
        "int u = queue.get(head);", "head++;",
        braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1)", "cells[v] = 2;", "fresh--;", "queue.add(v);"))),
      "minutes++;"),
    rule === 1 ? "return minutes;" : "return fresh > 0 ? -1 : minutes;");
}
