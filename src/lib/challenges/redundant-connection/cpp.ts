import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::vector<int> solve(const std::vector<int>& edges)";
const eachEdge = (list: string, ...body: Line[]) => braces(`for (int i = 0; i < static_cast<int>(${list}.size()); i += 2)`,
  `int u = ${list}[i];`, `int v = ${list}[i + 1];`, ...body);
const size = "const int n = static_cast<int>(edges.size()) / 2;";

function finder(memory: number): Line {
  if (memory === 2) return braces("int find(std::vector<int>& parent, int x)", "return parent[x];");
  const climb = ["int root = x;", braces("while (parent[root] != root)", "root = parent[root];")];
  if (memory === 1) return braces("int find(std::vector<int>& parent, int x)", climb, "return root;");
  return braces("int find(std::vector<int>& parent, int x)", climb,
    braces("while (parent[x] != root)", "int next = parent[x];", "parent[x] = root;", "x = next;"),
    "return root;");
}

const link = (memory: number): Line => memory === 0
  ? [braces("if (rank[a] < rank[b])", "std::swap(a, b);"), "parent[b] = a;", braces("if (rank[a] == rank[b])", "rank[a]++;")]
  : memory === 1 ? "parent[a] = b;" : "parent[u] = parent[v];";

function decide(memory: number, rule: number): Line {
  if (rule < 0) return pending("cómo decidir si el cable cierra un ciclo y cómo unir.");
  if (rule === 1) return [braces("if (find(parent, u) == find(parent, v))", "return {u, v};"), "parent[u] = v;"];
  if (rule === 2) return [braces("if (parent[u] == parent[v])", "return {u, v};"), "int a = find(parent, u);", "int b = find(parent, v);", link(memory)];
  if (rule === 3) return ["int a = find(parent, u);", "int b = find(parent, v);", "parent[a] = b;", braces("if (find(parent, u) == find(parent, v))", "return {u, v};")];
  return ["int a = find(parent, u);", "int b = find(parent, v);", braces("if (a == b)", "return {u, v};"), link(memory)];
}

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [size, "std::vector<std::vector<int>> adj(n + 1);",
    eachEdge("edges",
      "std::vector<bool> seen(n + 1, false);", "seen[u] = true;", "std::vector<int> stack{u};", "bool found = false;",
      braces("while (!stack.empty())",
        "int x = stack.back();", "stack.pop_back();",
        braces("if (x == v)", "found = true;", "break;"),
        braces("for (int y : adj[x])", braces("if (!seen[y])", "seen[y] = true;", "stack.push_back(y);"))),
      braces("if (found)", "return {u, v};"),
      "adj[u].push_back(v);", "adj[v].push_back(u);"),
    "return {};"] });
  if (approach === 2) return translationUnit({ signature, body: [size, "std::vector<int> degree(n + 1, 0);",
    eachEdge("edges", "degree[u]++;", "degree[v]++;"),
    braces("for (int i = static_cast<int>(edges.size()) - 2; i >= 0; i -= 2)",
      braces("if (degree[edges[i]] >= 2 && degree[edges[i + 1]] >= 2)", "return {edges[i], edges[i + 1]};")),
    "return {};"] });
  const list = approach === 3 ? "sorted" : "edges";
  const sorting = approach === 3 && ["std::vector<std::pair<int, int>> pairs;",
    braces("for (int i = 0; i < static_cast<int>(edges.size()); i += 2)", "pairs.push_back({edges[i], edges[i + 1]});"),
    "std::ranges::sort(pairs);",
    "std::vector<int> sorted;",
    braces("for (const auto& [a, b] : pairs)", "sorted.push_back(a);", "sorted.push_back(b);")];
  if (memory < 0) return translationUnit({ signature, body: [size, sorting, pending("qué guardar de los nodos ya conectados."), unfinished("elegí qué guardar de los nodos.")] });
  if (memory === 3) return translationUnit({ signature, body: [size, sorting, "std::unordered_set<int> seen;",
    eachEdge(list,
      rule < 0 ? pending("cuándo es el cable de más.") : braces("if (seen.count(u) && seen.count(v))", "return {u, v};"),
      "seen.insert(u);", "seen.insert(v);"),
    `return {${list}[${list}.size() - 2], ${list}[${list}.size() - 1]};`] });
  return translationUnit({
    signature,
    body: [size, sorting,
      "std::vector<int> parent(n + 1);",
      braces("for (int x = 0; x <= n; x++)", "parent[x] = x;"),
      memory === 0 && "std::vector<int> rank(n + 1, 0);",
      eachEdge(list, decide(memory, rule)),
      "return {};"],
    helpers: [finder(memory)],
  });
}
