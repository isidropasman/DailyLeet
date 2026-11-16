import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const eachEdge = (list: string, ...body: Line[]) => jsBlock(`for (let i = 0; i < ${list}.length; i += 2)`,
  `const u = ${list}[i];`, `const v = ${list}[i + 1];`, ...body);
const size = "const n = edges.length / 2;";

function finder(memory: number): string[] {
  if (memory === 2) return jsBlock("const find = (x) =>", "return parent[x];");
  const climb = ["let root = x;", ...jsBlock("while (parent[root] !== root)", "root = parent[root];")];
  if (memory === 1) return jsBlock("const find = (x) =>", ...climb, "return root;");
  return jsBlock("const find = (x) =>", ...climb,
    jsBlock("while (parent[x] !== root)", "const next = parent[x];", "parent[x] = root;", "x = next;"),
    "return root;");
}

const link = (memory: number): Line => memory === 0
  ? [jsBlock("if (rank[a] < rank[b])", "[a, b] = [b, a];"), "parent[b] = a;", jsBlock("if (rank[a] === rank[b])", "rank[a]++;")]
  : memory === 1 ? "parent[a] = b;" : "parent[u] = parent[v];";

function decide(memory: number, rule: number): Line {
  if (rule < 0) return jsPending("cómo decidir si el cable cierra un ciclo y cómo unir.");
  const roots = `${memory === 0 ? "let" : "const"} a = find(u);`;
  const other = `${memory === 0 ? "let" : "const"} b = find(v);`;
  if (rule === 1) return [jsBlock("if (find(u) === find(v))", "return [u, v];"), "parent[u] = v;"];
  if (rule === 2) return [jsBlock("if (parent[u] === parent[v])", "return [u, v];"), roots, other, link(memory)];
  if (rule === 3) return ["const a = find(u);", "const b = find(v);", "parent[a] = b;", jsBlock("if (find(u) === find(v))", "return [u, v];")];
  return [roots, other, jsBlock("if (a === b)", "return [u, v];"), link(memory)];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(size, "const adj = Array.from({ length: n + 1 }, () => []);",
    eachEdge("edges",
      "const seen = new Array(n + 1).fill(false);", "seen[u] = true;", "const stack = [u];", "let found = false;",
      jsBlock("while (stack.length > 0)",
        "const x = stack.pop();",
        jsBlock("if (x === v)", "found = true;", "break;"),
        jsBlock("for (const y of adj[x])", jsBlock("if (!seen[y])", "seen[y] = true;", "stack.push(y);"))),
      "emit(i + 1, i, [...stack], found ? 1 : 0);",
      jsBlock("if (found)", "return [u, v];"),
      "adj[u].push(v);", "adj[v].push(u);"),
    "return [];");
  if (approach === 2) return render(size, "const degree = new Array(n + 1).fill(0);",
    eachEdge("edges", "degree[u]++;", "degree[v]++;"),
    jsBlock("for (let i = edges.length - 2; i >= 0; i -= 2)",
      "emit(i + 1, i, degree.slice(1), degree[edges[i]]);",
      jsBlock("if (degree[edges[i]] >= 2 && degree[edges[i + 1]] >= 2)", "return [edges[i], edges[i + 1]];")),
    "return [];");
  const list = approach === 3 ? "sorted" : "edges";
  const sorting = approach === 3 && ["const pairs = [];",
    jsBlock("for (let i = 0; i < edges.length; i += 2)", "pairs.push([edges[i], edges[i + 1]]);"),
    "pairs.sort((p, q) => p[0] - q[0] || p[1] - q[1]);",
    "const sorted = pairs.flat();"];
  if (memory < 0) return render(size, sorting, jsPending("qué guardar de los nodos ya conectados."), "return [];");
  if (memory === 3) return render(size, sorting, "const seen = new Set();",
    eachEdge(list,
      rule < 0 ? jsPending("cuándo es el cable de más.") : jsBlock("if (seen.has(u) && seen.has(v))", "return [u, v];"),
      "seen.add(u);", "seen.add(v);",
      "emit(i + 1, i, [...seen], seen.size);"),
    `return ${list}.slice(${list}.length - 2);`);
  return render(size, sorting,
    "const parent = Array.from({ length: n + 1 }, (_, x) => x);",
    memory === 0 && "const rank = new Array(n + 1).fill(0);",
    finder(memory),
    eachEdge(list, decide(memory, rule), "emit(i + 1, i, parent.slice(1), parent[u]);"),
    "return [];");
}

export const typescript: [string, string][] = [
  ["const adj = Array.from(", "const adj: number[][] = Array.from("],
  ["const pairs = [];", "const pairs: number[][] = [];"],
  ["const seen = new Set();", "const seen = new Set<number>();"],
  ["const find = (x) =>", "const find = (x: number): number =>"],
  ["const stack = [u];", "const stack: number[] = [u];"],
  ["const x = stack.pop();", "const x = stack.pop()!;"],
];
