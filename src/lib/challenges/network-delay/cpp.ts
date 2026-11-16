import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "int solve(const std::vector<int>& links, int n)";
const setup = ["const int k = links[0];", "const int INF = 1'000'000'000;",
  "std::vector<std::vector<std::pair<int, int>>> adj(n + 1);",
  braces("for (int i = 1; i < static_cast<int>(links.size()); i += 3)", "adj[links[i]].push_back({links[i + 1], links[i + 2]});"),
  "std::vector<int> dist(n + 1, INF);", "dist[k] = 0;"];

function finish(rule: number): Line {
  if (rule < 0) return [pending("qué devolver con las distancias."), unfinished("elegí qué devolver.")];
  if (rule === 3) return ["int total = 0;",
    braces("for (int x = 1; x <= n; x++)", braces("if (dist[x] == INF)", "return -1;"), "total += dist[x];"), "return total;"];
  if (rule === 2) return ["int worst = 0;",
    braces("for (int x = 1; x <= n; x++)", braces("if (dist[x] < INF)", "worst = std::max(worst, dist[x]);")), "return worst;"];
  return ["int worst = 0;", braces("for (int x = 1; x <= n; x++)", "worst = std::max(worst, dist[x]);"), "return worst == INF ? -1 : worst;"];
}

// std::priority_queue pops the element its comparator ranks last, so "later" means lower priority.
const heap = (reversed: boolean) => [
  `auto later = [](const std::pair<int, int>& a, const std::pair<int, int>& b) { return a.first != b.first ? a.first ${reversed ? "<" : ">"} b.first : a.second > b.second; };`,
  "std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int>>, decltype(later)> heap(later);"];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [setup,
    braces("for (int round = 0; round < n - 1; round++)",
      braces("for (int u = 1; u <= n; u++)",
        braces("for (auto [v, w] : adj[u])", braces("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;")))),
    finish(rule)] });
  if (approach === 2 || approach === 3) return translationUnit({ signature, body: [setup,
    "std::vector<int> queue{k};", "std::size_t head = 0;",
    approach === 3 && "std::vector<bool> done(n + 1, false);",
    braces("while (head < queue.size())", "int u = queue[head];", "head++;",
      approach === 3 && [braces("if (done[u])", "continue;"), "done[u] = true;"],
      braces("for (auto [v, w] : adj[u])",
        approach === 2 ? braces("if (dist[v] == INF)", "dist[v] = dist[u] + w;", "queue.push_back(v);")
          : [braces("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;"), braces("if (!done[v])", "queue.push_back(v);")])),
    finish(0)] });
  if (memory < 0) return translationUnit({ signature, body: [setup, pending("cómo elegir el próximo nodo a expandir."), unfinished("elegí cómo ordenar la frontera.")] });
  if (memory === 2) return translationUnit({ signature, body: [setup, "std::vector<bool> done(n + 1, false);",
    braces("for (int round = 0; round < n; round++)",
      "int u = -1;",
      braces("for (int x = 1; x <= n; x++)", braces("if (!done[x] && (u < 0 || dist[x] < dist[u]))", "u = x;")),
      braces("if (dist[u] == INF)", "break;"),
      "done[u] = true;",
      braces("for (auto [v, w] : adj[u])", braces("if (dist[u] + w < dist[v])", "dist[v] = dist[u] + w;"))),
    finish(rule)] });
  const closed = "std::vector<bool> closed(n + 1, false);";
  if (memory === 1) return translationUnit({ signature, body: [setup, heap(false), closed, "heap.push({0, k});",
    braces("while (!heap.empty())", "int u = heap.top().second;", "heap.pop();",
      braces("if (closed[u])", "continue;"), "closed[u] = true;",
      braces("for (auto [v, w] : adj[u])", braces("if (!closed[v])", "dist[v] = std::min(dist[v], dist[u] + w);", "heap.push({w, v});"))),
    finish(rule)] });
  if (rule < 0) return translationUnit({ signature, body: [setup, heap(memory === 3), closed, "heap.push({0, k});", pending("cuándo queda fija la distancia de un nodo."), finish(rule)] });
  const loop = rule === 1
    ? ["closed[k] = true;", braces("while (!heap.empty())", "auto [d, u] = heap.top();", "heap.pop();",
      braces("for (auto [v, w] : adj[u])", braces("if (!closed[v])", "closed[v] = true;", "dist[v] = d + w;", "heap.push({dist[v], v});")))]
    : braces("while (!heap.empty())", "auto [d, u] = heap.top();", "heap.pop();",
      braces("if (d > dist[u] || closed[u])", "continue;"), "closed[u] = true;",
      braces("for (auto [v, w] : adj[u])", braces("if (!closed[v] && d + w < dist[v])", "dist[v] = d + w;", "heap.push({dist[v], v});")));
  return translationUnit({ signature, body: [setup, heap(memory === 3), closed, "heap.push({0, k});", loop, finish(rule)] });
}
