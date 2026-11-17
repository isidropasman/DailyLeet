import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const position = ["const r = Math.floor(i / cols);", "const c = i % cols;"];

function directions(memory: number): Line {
  if (memory < 0) return jsPending("qué celdas cuentan como vecinas.");
  if (memory === 1) return [position,
    jsBlock("for (let dr = -1; dr <= 1; dr++)", jsBlock("for (let dc = -1; dc <= 1; dc++)",
      "const nr = r + dr;", "const nc = c + dc;",
      jsBlock("if ((dr !== 0 || dc !== 0) && nr >= 0 && nr < rows && nc >= 0 && nc < cols)", "out.push(nr * cols + nc);")))];
  if (memory === 2) return [position, jsBlock("if (c + 1 < cols)", "out.push(i + 1);"), jsBlock("if (r + 1 < rows)", "out.push(i + cols);")];
  if (memory === 3) return jsBlock("for (const v of [i - cols, i + cols, i - 1, i + 1])", jsBlock("if (v >= 0 && v < rows * cols)", "out.push(v);"));
  return [position,
    jsBlock("if (r > 0)", "out.push(i - cols);"), jsBlock("if (r + 1 < rows)", "out.push(i + cols);"),
    jsBlock("if (c > 0)", "out.push(i - 1);"), jsBlock("if (c + 1 < cols)", "out.push(i + 1);")];
}

const setup = (memory: number) => ["const size = grid.length;", "const rows = size / cols;", "const cells = [...grid];",
  jsBlock("function neighbors(i)", "const out = [];", directions(memory), "return out;")];

const unreached = (seen: string) => jsBlock("for (let i = 0; i < size; i++)", jsBlock(`if (cells[i] === 1 && !${seen}[i])`, "return -1;"));

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(setup(memory), "let fresh = 0;",
    jsBlock("for (let i = 0; i < size; i++)", jsBlock("if (cells[i] === 1)", "fresh++;")),
    "let minutes = 0;",
    jsBlock("while (fresh > 0)", "const rotting = [];",
      jsBlock("for (let i = 0; i < size; i++)", jsBlock("if (cells[i] === 2)",
        jsBlock("for (const v of neighbors(i))", jsBlock("if (cells[v] === 1)", "rotting.push(v);")))),
      jsBlock("if (rotting.length === 0)", "return -1;"),
      jsBlock("for (const v of rotting)", jsBlock("if (cells[v] === 1)", "cells[v] = 2;", "fresh--;")),
      "minutes++;",
      "emit(rotting[0], rotting[0], rotting, minutes, [...cells]);"),
    "return minutes;");
  if (approach === 2) return render(setup(memory), "const reached = new Array(size).fill(false);", "let worst = 0;",
    jsBlock("for (let s = 0; s < size; s++)",
      jsBlock("if (cells[s] !== 2)", "continue;"),
      "const dist = new Array(size).fill(-1);", "dist[s] = 0;", "const queue = [s];", "let head = 0;",
      jsBlock("while (head < queue.length)",
        "const u = queue[head];", "head++;", "worst = Math.max(worst, dist[u]);",
        jsBlock("for (const v of neighbors(u))", jsBlock("if (cells[v] === 1 && dist[v] < 0)", "dist[v] = dist[u] + 1;", "reached[v] = true;", "queue.push(v);")),
        "emit(u, s, queue.slice(head), worst);")),
    unreached("reached"), "return worst;");
  if (approach === 3) return render(setup(memory), "const stack = [];", "const depth = [];",
    jsBlock("for (let i = 0; i < size; i++)", jsBlock("if (cells[i] === 2)", "stack.push(i);", "depth.push(0);")),
    "const seen = new Array(size).fill(false);", "let worst = 0;",
    jsBlock("while (stack.length > 0)",
      "const u = stack.pop();", "const d = depth.pop();",
      jsBlock("if (seen[u])", "continue;"),
      "seen[u] = true;", "worst = Math.max(worst, d);",
      jsBlock("for (const v of neighbors(u))", jsBlock("if (cells[v] === 1 && !seen[v])", "stack.push(v);", "depth.push(d + 1);")),
      "emit(u, u, [...stack], worst);"),
    unreached("seen"), "return worst;");
  const start = ["const queue = [];", "let fresh = 0;",
    jsBlock("for (let i = 0; i < size; i++)", jsBlock("if (cells[i] === 2)", "queue.push(i);"), jsBlock("if (cells[i] === 1)", "fresh++;"))];
  if (rule < 0) return render(setup(memory), start, jsPending("cuándo cortar y qué devolver."), "return -1;");
  return render(setup(memory), start,
    rule === 3 && jsBlock("if (queue.length === 0)", "return -1;"),
    "let minutes = 0;", "let head = 0;",
    jsBlock(rule === 2 ? "while (head < queue.length)" : "while (head < queue.length && fresh > 0)",
      "const end = queue.length;",
      jsBlock("while (head < end)",
        "const u = queue[head];", "head++;",
        jsBlock("for (const v of neighbors(u))", jsBlock("if (cells[v] === 1)", "cells[v] = 2;", "fresh--;", "queue.push(v);")),
        "emit(u, u, queue.slice(head), minutes, [...cells]);"),
      "minutes++;"),
    rule === 1 ? "return minutes;" : "return fresh > 0 ? -1 : minutes;");
}

export const typescript: [string, string][] = [
  ["function neighbors(i) {", "function neighbors(i: number): number[] {"],
  ["const out = [];", "const out: number[] = [];"],
  ["const queue = [];", "const queue: number[] = [];"],
  ["const rotting = [];", "const rotting: number[] = [];"],
  ["const stack = [];", "const stack: number[] = [];"],
  ["const depth = [];", "const depth: number[] = [];"],
  ["const u = stack.pop();", "const u = stack.pop()!;"],
  ["const d = depth.pop();", "const d = depth.pop()!;"],
];
