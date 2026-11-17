import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& grid, int cols)";
const position = ["const int r = i / cols;", "const int c = i % cols;"];

function directions(memory: number): Line {
  if (memory < 0) return pending("qué celdas cuentan como vecinas.");
  if (memory === 1) return [position,
    braces("for (int dr = -1; dr <= 1; dr++)", braces("for (int dc = -1; dc <= 1; dc++)",
      "const int nr = r + dr;", "const int nc = c + dc;",
      braces("if ((dr != 0 || dc != 0) && nr >= 0 && nr < rows && nc >= 0 && nc < cols)", "out.push_back(nr * cols + nc);")))];
  if (memory === 2) return [position, braces("if (c + 1 < cols)", "out.push_back(i + 1);"), braces("if (r + 1 < rows)", "out.push_back(i + cols);")];
  if (memory === 3) return braces("for (int v : {i - cols, i + cols, i - 1, i + 1})", braces("if (v >= 0 && v < rows * cols)", "out.push_back(v);"));
  return [position,
    braces("if (r > 0)", "out.push_back(i - cols);"), braces("if (r + 1 < rows)", "out.push_back(i + cols);"),
    braces("if (c > 0)", "out.push_back(i - 1);"), braces("if (c + 1 < cols)", "out.push_back(i + 1);")];
}

const helpers = (memory: number) => [braces("std::vector<int> neighbors(int i, int rows, int cols)",
  "std::vector<int> out;", directions(memory), "return out;")];
const setup = ["const int size = static_cast<int>(grid.size());", "const int rows = size / cols;", "std::vector<int> cells(grid);"];
const unreached = (seen: string) => braces("for (int i = 0; i < size; i++)", braces(`if (cells[i] == 1 && !${seen}[i])`, "return -1;"));

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  const unit = (...body: Line[]) => translationUnit({ signature, helpers: helpers(memory), body: [setup, ...body] });
  if (approach === 1) return unit("int fresh = 0;",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 1)", "fresh++;")),
    "int minutes = 0;",
    braces("while (fresh > 0)", "std::vector<int> rotting;",
      braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)",
        braces("for (int v : neighbors(i, rows, cols))", braces("if (cells[v] == 1)", "rotting.push_back(v);")))),
      braces("if (rotting.empty())", "return -1;"),
      braces("for (int v : rotting)", braces("if (cells[v] == 1)", "cells[v] = 2;", "fresh--;")),
      "minutes++;"),
    "return minutes;");
  if (approach === 2) return unit("std::vector<bool> reached(size, false);", "int worst = 0;",
    braces("for (int s = 0; s < size; s++)",
      braces("if (cells[s] != 2)", "continue;"),
      "std::vector<int> dist(size, -1);", "dist[s] = 0;", "std::vector<int> queue{s};", "std::size_t head = 0;",
      braces("while (head < queue.size())",
        "int u = queue[head];", "head++;", "worst = std::max(worst, dist[u]);",
        braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1 && dist[v] < 0)", "dist[v] = dist[u] + 1;", "reached[v] = true;", "queue.push_back(v);")))),
    unreached("reached"), "return worst;");
  if (approach === 3) return unit("std::vector<int> stack;", "std::vector<int> depth;",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)", "stack.push_back(i);", "depth.push_back(0);")),
    "std::vector<bool> seen(size, false);", "int worst = 0;",
    braces("while (!stack.empty())",
      "int u = stack.back();", "stack.pop_back();", "int d = depth.back();", "depth.pop_back();",
      braces("if (seen[u])", "continue;"),
      "seen[u] = true;", "worst = std::max(worst, d);",
      braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1 && !seen[v])", "stack.push_back(v);", "depth.push_back(d + 1);"))),
    unreached("seen"), "return worst;");
  const start = ["std::vector<int> queue;", "int fresh = 0;",
    braces("for (int i = 0; i < size; i++)", braces("if (cells[i] == 2)", "queue.push_back(i);"), braces("if (cells[i] == 1)", "fresh++;"))];
  if (rule < 0) return unit(start, pending("cuándo cortar y qué devolver."), unfinished("cuándo cortar y qué devolver."));
  return unit(start,
    rule === 3 && braces("if (queue.empty())", "return -1;"),
    "int minutes = 0;", "std::size_t head = 0;",
    braces(rule === 2 ? "while (head < queue.size())" : "while (head < queue.size() && fresh > 0)",
      "const std::size_t end = queue.size();",
      braces("while (head < end)",
        "int u = queue[head];", "head++;",
        braces("for (int v : neighbors(u, rows, cols))", braces("if (cells[v] == 1)", "cells[v] = 2;", "fresh--;", "queue.push_back(v);"))),
      "minutes++;"),
    rule === 1 ? "return minutes;" : "return fresh > 0 ? -1 : minutes;");
}
