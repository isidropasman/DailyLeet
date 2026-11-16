import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const eachEdge = (list: string, ...body: Line[]): Line => [`for i in range(0, len(${list}), 2):`, block(`u = ${list}[i]`, `v = ${list}[i + 1]`, ...body)];
const size = "n = len(edges) // 2";

function finder(memory: number): Line {
  if (memory === 2) return ["def find(x):", block("return parent[x]")];
  const climb = ["root = x", "while parent[root] != root:", block("root = parent[root]")];
  if (memory === 1) return ["def find(x):", block(climb, "return root")];
  return ["def find(x):", block(climb, "while parent[x] != root:", block("nxt = parent[x]", "parent[x] = root", "x = nxt"), "return root")];
}

const link = (memory: number): Line => memory === 0
  ? ["if rank[a] < rank[b]:", block("a, b = b, a"), "parent[b] = a", "if rank[a] == rank[b]:", block("rank[a] += 1")]
  : memory === 1 ? "parent[a] = b" : "parent[u] = parent[v]";

function decide(memory: number, rule: number): Line {
  if (rule < 0) return pending("cómo decidir si el cable cierra un ciclo y cómo unir.");
  if (rule === 1) return ["if find(u) == find(v):", block("return [u, v]"), "parent[u] = v"];
  if (rule === 2) return ["if parent[u] == parent[v]:", block("return [u, v]"), "a = find(u)", "b = find(v)", link(memory)];
  if (rule === 3) return ["a = find(u)", "b = find(v)", "parent[a] = b", "if find(u) == find(v):", block("return [u, v]")];
  return ["a = find(u)", "b = find(v)", "if a == b:", block("return [u, v]"), link(memory)];
}

export function python([approach, memory, rule]: Choices): string {
  const args = "edges";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, size, "adj = [[] for _ in range(n + 1)]",
    eachEdge("edges",
      "seen = [False] * (n + 1)", "seen[u] = True", "stack = [u]", "found = False",
      "while len(stack) > 0:",
      block("x = stack.pop()", "if x == v:", block("found = True", "break"),
        "for y in adj[x]:", block("if not seen[y]:", block("seen[y] = True", "stack.append(y)"))),
      "if found:", block("return [u, v]"),
      "adj[u].append(v)", "adj[v].append(u)"),
    "return []");
  if (approach === 2) return fn(args, size, "degree = [0] * (n + 1)",
    eachEdge("edges", "degree[u] += 1", "degree[v] += 1"),
    "for i in range(len(edges) - 2, -1, -2):",
    block("if degree[edges[i]] >= 2 and degree[edges[i + 1]] >= 2:", block("return [edges[i], edges[i + 1]]")),
    "return []");
  const list = approach === 3 ? "ordered" : "edges";
  const sorting = approach === 3 && ["pairs = []", "for i in range(0, len(edges), 2):", block("pairs.append([edges[i], edges[i + 1]])"),
    "pairs.sort()", "ordered = [x for pair in pairs for x in pair]"];
  if (memory < 0) return fn(args, size, sorting, pending("qué guardar de los nodos ya conectados."), "return []");
  if (memory === 3) return fn(args, size, sorting, "seen = set()",
    eachEdge(list,
      rule < 0 ? pending("cuándo es el cable de más.") : ["if u in seen and v in seen:", block("return [u, v]")],
      "seen.add(u)", "seen.add(v)"),
    `return ${list}[len(${list}) - 2:]`);
  return fn(args, size, sorting,
    "parent = list(range(n + 1))",
    memory === 0 && "rank = [0] * (n + 1)",
    finder(memory),
    eachEdge(list, decide(memory, rule)),
    "return []");
}
