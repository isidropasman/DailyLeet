import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "links, n";
const setup = ["k = links[0]", "INF = 10**9", "adj = [[] for _ in range(n + 1)]",
  "for i in range(1, len(links), 3):", block("adj[links[i]].append((links[i + 1], links[i + 2]))"),
  "dist = [INF] * (n + 1)", "dist[k] = 0"];

function finish(rule: number): Line {
  if (rule < 0) return [pending("qué devolver con las distancias."), "return -1"];
  if (rule === 3) return ["total = 0", "for x in range(1, n + 1):", block("if dist[x] == INF:", block("return -1"), "total += dist[x]"), "return total"];
  if (rule === 2) return ["worst = 0", "for x in range(1, n + 1):", block("if dist[x] < INF:", block("worst = max(worst, dist[x])")), "return worst"];
  return ["worst = 0", "for x in range(1, n + 1):", block("worst = max(worst, dist[x])"), "return -1 if worst == INF else worst"];
}

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, setup,
    "for _ in range(n - 1):",
    block("for u in range(1, n + 1):", block("for v, w in adj[u]:", block("if dist[u] + w < dist[v]:", block("dist[v] = dist[u] + w")))),
    finish(rule));
  if (approach === 2 || approach === 3) return fn(args, setup, "queue = [k]", "head = 0",
    approach === 3 && "done = [False] * (n + 1)",
    "while head < len(queue):",
    block("u = queue[head]", "head += 1",
      approach === 3 && ["if done[u]:", block("continue"), "done[u] = True"],
      "for v, w in adj[u]:",
      block(approach === 2 ? ["if dist[v] == INF:", block("dist[v] = dist[u] + w", "queue.append(v)")]
        : ["if dist[u] + w < dist[v]:", block("dist[v] = dist[u] + w"), "if not done[v]:", block("queue.append(v)")])),
    finish(0));
  if (memory < 0) return fn(args, setup, pending("cómo elegir el próximo nodo a expandir."), "return -1");
  if (memory === 2) return fn(args, setup, "done = [False] * (n + 1)",
    "for _ in range(n):",
    block("u = -1",
      "for x in range(1, n + 1):", block("if not done[x] and (u < 0 or dist[x] < dist[u]):", block("u = x")),
      "if dist[u] == INF:", block("break"),
      "done[u] = True",
      "for v, w in adj[u]:", block("if dist[u] + w < dist[v]:", block("dist[v] = dist[u] + w"))),
    finish(rule));
  const closed = "closed = [False] * (n + 1)";
  const source = (body: Line) => render("import heapq", "", "", fn(args, setup, "heap = [(0, k)]", closed, body));
  if (memory === 1) return source([
    "while len(heap) > 0:",
    block("_, u = heapq.heappop(heap)", "if closed[u]:", block("continue"), "closed[u] = True",
      "for v, w in adj[u]:", block("if not closed[v]:", block("dist[v] = min(dist[v], dist[u] + w)", "heapq.heappush(heap, (w, v))"))),
    finish(rule)]);
  const sign = memory === 3 ? "-" : "";
  const pop = memory === 3 ? ["d, u = heapq.heappop(heap)", "d = -d"] : ["d, u = heapq.heappop(heap)"];
  if (rule < 0) return source([pending("cuándo queda fija la distancia de un nodo."), finish(rule)]);
  if (rule === 1) return source(["closed[k] = True",
    "while len(heap) > 0:",
    block(pop, "for v, w in adj[u]:", block("if not closed[v]:", block("closed[v] = True", "dist[v] = d + w", `heapq.heappush(heap, (${sign}dist[v], v))`))),
    finish(rule)]);
  return source([
    "while len(heap) > 0:",
    block(pop, "if d > dist[u] or closed[u]:", block("continue"), "closed[u] = True",
      "for v, w in adj[u]:", block("if not closed[v] and d + w < dist[v]:", block("dist[v] = d + w", `heapq.heappush(heap, (${sign}dist[v], v))`))),
    finish(rule)]);
}
