import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

const setup = ["const k = links[0];", "const INF = 1e9;", "const adj = Array.from({ length: n + 1 }, () => []);",
  ...jsBlock("for (let i = 1; i < links.length; i += 3)", "adj[links[i]].push([links[i + 1], links[i + 2]]);"),
  "const dist = new Array(n + 1).fill(INF);", "dist[k] = 0;"];
const shown = "dist.slice(1).map(d => (d === INF ? \"∞\" : d))";

// JS has no heap; this one breaks ties by node so every language pops in the same order.
const heap = (reversed: boolean) => ["const heap = [];",
  `const before = (a, b) => (${reversed ? "b[0] - a[0]" : "a[0] - b[0]"} || a[1] - b[1]) < 0;`,
  ...jsBlock("const push = (item) =>", "heap.push(item);", "let i = heap.length - 1;",
    jsBlock("while (i > 0 && before(heap[i], heap[(i - 1) >> 1]))", "const p = (i - 1) >> 1;", "[heap[i], heap[p]] = [heap[p], heap[i]];", "i = p;")),
  ...jsBlock("const pop = () =>", "const top = heap[0];", "const last = heap.pop();",
    jsBlock("if (heap.length > 0)", "heap[0] = last;", "let i = 0;",
      jsBlock("while (true)", "const l = 2 * i + 1;", "const r = l + 1;", "let best = i;",
        jsBlock("if (l < heap.length && before(heap[l], heap[best]))", "best = l;"),
        jsBlock("if (r < heap.length && before(heap[r], heap[best]))", "best = r;"),
        jsBlock("if (best === i)", "break;"),
        "[heap[i], heap[best]] = [heap[best], heap[i]];", "i = best;")),
    "return top;")];

function finish(rule: number): Line {
  if (rule < 0) return [jsPending("qué devolver con las distancias."), "return -1;"];
  if (rule === 3) return ["let total = 0;",
    jsBlock("for (let x = 1; x <= n; x++)", jsBlock("if (dist[x] === INF)", "return -1;"), "total += dist[x];"), "return total;"];
  if (rule === 2) return ["let worst = 0;",
    jsBlock("for (let x = 1; x <= n; x++)", jsBlock("if (dist[x] < INF)", "worst = Math.max(worst, dist[x]);")), "return worst;"];
  return ["let worst = 0;", jsBlock("for (let x = 1; x <= n; x++)", "worst = Math.max(worst, dist[x]);"), "return worst === INF ? -1 : worst;"];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render(setup,
    jsBlock("for (let round = 0; round < n - 1; round++)",
      jsBlock("for (let u = 1; u <= n; u++)",
        jsBlock("for (const [v, w] of adj[u])", jsBlock("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;"))),
      `emit(round, 0, [], round, ${shown});`),
    finish(rule));
  if (approach === 2 || approach === 3) return render(setup, "const queue = [k];", "let head = 0;",
    approach === 3 && "const done = new Array(n + 1).fill(false);",
    jsBlock("while (head < queue.length)", "const u = queue[head];", "head++;",
      approach === 3 && [jsBlock("if (done[u])", "continue;"), "done[u] = true;"],
      jsBlock("for (const [v, w] of adj[u])",
        approach === 2 ? jsBlock("if (dist[v] === INF)", "dist[v] = dist[u] + w;", "queue.push(v);")
          : [jsBlock("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;"), jsBlock("if (!done[v])", "queue.push(v);")]),
      `emit(u - 1, u - 1, queue.slice(head), dist[u], ${shown});`),
    finish(0));
  if (memory < 0) return render(setup, jsPending("cómo elegir el próximo nodo a expandir."), "return -1;");
  if (memory === 2) return render(setup, "const done = new Array(n + 1).fill(false);",
    jsBlock("for (let round = 0; round < n; round++)",
      "let u = -1;",
      jsBlock("for (let x = 1; x <= n; x++)", jsBlock("if (!done[x] && (u < 0 || dist[x] < dist[u]))", "u = x;")),
      jsBlock("if (dist[u] === INF)", "break;"),
      "done[u] = true;",
      jsBlock("for (const [v, w] of adj[u])", jsBlock("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;")),
      `emit(u - 1, u - 1, [], dist[u], ${shown});`),
    finish(rule));
  const closed = "const closed = new Array(n + 1).fill(false);";
  if (memory === 1) return render(setup, heap(false), closed, "push([0, k]);",
    jsBlock("while (heap.length > 0)", "const [, u] = pop();",
      jsBlock("if (closed[u])", "continue;"), "closed[u] = true;",
      jsBlock("for (const [v, w] of adj[u])", jsBlock("if (!closed[v])", "dist[v] = Math.min(dist[v], dist[u] + w);", "push([w, v]);")),
      `emit(u - 1, u - 1, heap.map(e => e[1]), dist[u], ${shown});`),
    finish(rule));
  if (rule < 0) return render(setup, heap(memory === 3), closed, "push([0, k]);", jsPending("cuándo queda fija la distancia de un nodo."), finish(rule));
  const loop = rule === 1
    ? ["closed[k] = true;", jsBlock("while (heap.length > 0)", "const [d, u] = pop();",
      jsBlock("for (const [v, w] of adj[u])", jsBlock("if (!closed[v])", "closed[v] = true;", "dist[v] = d + w;", "push([dist[v], v]);")),
      `emit(u - 1, u - 1, heap.map(e => e[1]), d, ${shown});`)]
    : jsBlock("while (heap.length > 0)", "const [d, u] = pop();",
      jsBlock("if (d > dist[u] || closed[u])", "continue;"), "closed[u] = true;",
      jsBlock("for (const [v, w] of adj[u])", jsBlock("if (!closed[v] && d + w < dist[v])", "dist[v] = d + w;", "push([dist[v], v]);")),
      `emit(u - 1, u - 1, heap.map(e => e[1]), d, ${shown});`);
  return render(setup, heap(memory === 3), closed, "push([0, k]);", loop, finish(rule));
}

export const typescript: [string, string][] = [
  ["const adj = Array.from(", "const adj: [number, number][][] = Array.from("],
  ["const heap = [];", "const heap: [number, number][] = [];"],
  ["const before = (a, b) =>", "const before = (a: [number, number], b: [number, number]) =>"],
  ["const push = (item) =>", "const push = (item: [number, number]) =>"],
  ["const pop = () =>", "const pop = (): [number, number] =>"],
  ["const last = heap.pop();", "const last = heap.pop()!;"],
];
