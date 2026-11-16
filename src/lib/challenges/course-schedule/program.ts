import type { Choices } from "../../challenges";
import { render } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const eachPair = (...body: string[]) => jsBlock("for (let i = 0; i < prerequisites.length; i += 2)",
  "const course = prerequisites[i];", "const required = prerequisites[i + 1];", ...body);
const adjacency = "const adj = Array.from({ length: n }, () => []);";
const ordered = ["if (order.length !== n) {", "  return [];", "}", "return order;"];

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(adjacency, eachPair("adj[required].push(course);"),
    "const seen = new Array(n).fill(false);", "const order = [];",
    jsBlock("for (let start = 0; start < n; start++)",
      jsBlock("if (seen[start])", "continue;"),
      "seen[start] = true;", "const stack = [start];", "const cursor = [0];",
      jsBlock("while (stack.length > 0)",
        "const top = stack.length - 1;", "const u = stack[top];",
        jsBlock("if (cursor[top] < adj[u].length)",
          "const v = adj[u][cursor[top]];", "cursor[top]++;",
          jsBlock("if (!seen[v])", "seen[v] = true;", "stack.push(v);", "cursor.push(0);")),
        jsBlock("else", "stack.pop();", "cursor.pop();", "order.push(u);"),
        "emit(u, u, [...stack], order.length, [...order]);")),
    "order.reverse();", "return order;");
  if (approach === 2) return render("const needs = Array.from({ length: n }, () => []);", eachPair("needs[course].push(required);"),
    "const done = new Array(n).fill(false);", "const order = [];", "let progress = true;",
    jsBlock("while (progress)", "progress = false;",
      jsBlock("for (let u = 0; u < n; u++)",
        jsBlock("if (done[u])", "continue;"),
        "let ready = true;",
        jsBlock("for (const p of needs[u])", jsBlock("if (!done[p])", "ready = false;")),
        jsBlock("if (ready)", "done[u] = true;", "order.push(u);", "progress = true;"),
        "emit(u, u, [...needs[u]], order.length, [...order]);")),
    ordered);
  if (approach === 3) return render("const degree = new Array(n).fill(0);", eachPair("degree[course]++;"),
    "const order = [];",
    jsBlock("for (let u = 0; u < n; u++)", "order.push(u);", "emit(u, u, [degree[u]], u, [...degree]);"),
    "order.sort((a, b) => degree[a] - degree[b]);",
    "return order;");
  if (memory < 0) return render(jsPending("cómo guardar las correlativas."), jsPending("qué materias arrancan la cola y cuándo liberás una."), "return [];");
  const flags = memory === 2;
  const counter = flags ? "const blocked = new Array(n).fill(false);" : "const degree = new Array(n).fill(0);";
  const record = [
    ["adj[required].push(course);", "degree[course]++;"],
    ["adj[course].push(required);", "degree[required]++;"],
    ["adj[required].push(course);", "blocked[course] = true;"],
    ["adj[required] = [course];", "degree[course]++;"],
  ][memory];
  const free = (u: string) => (flags ? `!blocked[${u}]` : `degree[${u}] === 0`);
  const state = flags ? "blocked.map(Number)" : "[...degree]";
  const build = [adjacency, counter, eachPair(...record)];
  if (rule < 0) return render(build, jsPending("qué materias arrancan la cola y cuándo hay un ciclo."), "return [];");
  const start = rule === 2 ? `const queue = ${free("0")} ? [0] : [];`
    : ["const queue = [];", jsBlock("for (let u = 0; u < n; u++)", jsBlock(`if (${free("u")})`, "queue.push(u);"))];
  const enqueue = rule === 3 ? jsBlock("if (!queued[v])", "queued[v] = true;", "queue.push(v);") : jsBlock(`if (${free("v")})`, "queue.push(v);");
  return render(build, start,
    rule === 3 && ["const queued = new Array(n).fill(false);", jsBlock("for (const u of queue)", "queued[u] = true;")],
    "const order = [];", "let head = 0;",
    jsBlock("while (head < queue.length)",
      "const u = queue[head];", "head++;", "order.push(u);",
      jsBlock("for (const v of adj[u])", flags ? "blocked[v] = false;" : "degree[v]--;", enqueue),
      `emit(u, u, queue.slice(head), order.length, ${state});`),
    rule === 1 ? "return order;" : ordered);
}

export const typescript: [string, string][] = [
  ["const adj = Array.from({ length: n }, () => []);", "const adj: number[][] = Array.from({ length: n }, () => []);"],
  ["const needs = Array.from({ length: n }, () => []);", "const needs: number[][] = Array.from({ length: n }, () => []);"],
  ["const order = [];", "const order: number[] = [];"],
  ["const queue = [];", "const queue: number[] = [];"],
];
