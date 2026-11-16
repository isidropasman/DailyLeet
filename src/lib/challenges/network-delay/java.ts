import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int solve(int[] links, int n)";
const setup = ["int k = links[0];", "final int INF = 1_000_000_000;",
  "List<List<int[]>> adj = new ArrayList<>();",
  braces("for (int x = 0; x <= n; x++)", "adj.add(new ArrayList<>());"),
  braces("for (int i = 1; i < links.length; i += 3)", "adj.get(links[i]).add(new int[] {links[i + 1], links[i + 2]});"),
  "int[] dist = new int[n + 1];", "Arrays.fill(dist, INF);", "dist[k] = 0;"];

function finish(rule: number): Line {
  if (rule < 0) return [pending("qué devolver con las distancias."), unfinished("elegí qué devolver.")];
  if (rule === 3) return ["int total = 0;",
    braces("for (int x = 1; x <= n; x++)", braces("if (dist[x] == INF)", "return -1;"), "total += dist[x];"), "return total;"];
  if (rule === 2) return ["int worst = 0;",
    braces("for (int x = 1; x <= n; x++)", braces("if (dist[x] < INF)", "worst = Math.max(worst, dist[x]);")), "return worst;"];
  return ["int worst = 0;", braces("for (int x = 1; x <= n; x++)", "worst = Math.max(worst, dist[x]);"), "return worst == INF ? -1 : worst;"];
}

const heap = (reversed: boolean) =>
  `PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] != b[0] ? Integer.compare(${reversed ? "b[0], a[0]" : "a[0], b[0]"}) : Integer.compare(a[1], b[1]));`;

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: [setup,
    braces("for (int round = 0; round < n - 1; round++)",
      braces("for (int u = 1; u <= n; u++)",
        braces("for (int[] edge : adj.get(u))", braces("if (dist[u] + edge[1] < dist[edge[0]])", "dist[edge[0]] = dist[u] + edge[1];")))),
    finish(rule)] });
  if (approach === 2 || approach === 3) return javaClass(signature, { body: [setup,
    "List<Integer> queue = new ArrayList<>(List.of(k));", "int head = 0;",
    approach === 3 && "boolean[] done = new boolean[n + 1];",
    braces("while (head < queue.size())", "int u = queue.get(head);", "head++;",
      approach === 3 && [braces("if (done[u])", "continue;"), "done[u] = true;"],
      braces("for (int[] edge : adj.get(u))", "int v = edge[0];", "int w = edge[1];",
        approach === 2 ? braces("if (dist[v] == INF)", "dist[v] = dist[u] + w;", "queue.add(v);")
          : [braces("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;"), braces("if (!done[v])", "queue.add(v);")])),
    finish(0)] });
  if (memory < 0) return javaClass(signature, { body: [setup, pending("cómo elegir el próximo nodo a expandir."), unfinished("elegí cómo ordenar la frontera.")] });
  if (memory === 2) return javaClass(signature, { body: [setup, "boolean[] done = new boolean[n + 1];",
    braces("for (int round = 0; round < n; round++)",
      "int u = -1;",
      braces("for (int x = 1; x <= n; x++)", braces("if (!done[x] && (u < 0 || dist[x] < dist[u]))", "u = x;")),
      braces("if (dist[u] == INF)", "break;"),
      "done[u] = true;",
      braces("for (int[] edge : adj.get(u))", braces("if (dist[u] + edge[1] < dist[edge[0]])", "dist[edge[0]] = dist[u] + edge[1];"))),
    finish(rule)] });
  const closed = "boolean[] closed = new boolean[n + 1];";
  if (memory === 1) return javaClass(signature, { body: [setup, heap(false), closed, "heap.add(new int[] {0, k});",
    braces("while (!heap.isEmpty())", "int u = heap.poll()[1];",
      braces("if (closed[u])", "continue;"), "closed[u] = true;",
      braces("for (int[] edge : adj.get(u))", "int v = edge[0];", "int w = edge[1];",
        braces("if (!closed[v])", "dist[v] = Math.min(dist[v], dist[u] + w);", "heap.add(new int[] {w, v});"))),
    finish(rule)] });
  if (rule < 0) return javaClass(signature, { body: [setup, heap(memory === 3), closed, "heap.add(new int[] {0, k});", pending("cuándo queda fija la distancia de un nodo."), finish(rule)] });
  const loop = rule === 1
    ? ["closed[k] = true;", braces("while (!heap.isEmpty())", "int[] top = heap.poll();", "int d = top[0];", "int u = top[1];",
      braces("for (int[] edge : adj.get(u))", "int v = edge[0];", "int w = edge[1];",
        braces("if (!closed[v])", "closed[v] = true;", "dist[v] = d + w;", "heap.add(new int[] {dist[v], v});")))]
    : braces("while (!heap.isEmpty())", "int[] top = heap.poll();", "int d = top[0];", "int u = top[1];",
      braces("if (d > dist[u] || closed[u])", "continue;"), "closed[u] = true;",
      braces("for (int[] edge : adj.get(u))", "int v = edge[0];", "int w = edge[1];",
        braces("if (!closed[v] && d + w < dist[v])", "dist[v] = d + w;", "heap.add(new int[] {dist[v], v});")));
  return javaClass(signature, { body: [setup, heap(memory === 3), closed, "heap.add(new int[] {0, k});", loop, finish(rule)] });
}
