import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "int[] solve(int[] edges)";
const eachEdge = (list: string, ...body: Line[]) => braces(`for (int i = 0; i < ${list}.length; i += 2)`,
  `int u = ${list}[i];`, `int v = ${list}[i + 1];`, ...body);
const size = "int n = edges.length / 2;";

function finder(memory: number): Line {
  if (memory === 2) return braces("static int find(int[] parent, int x)", "return parent[x];");
  const climb = ["int root = x;", braces("while (parent[root] != root)", "root = parent[root];")];
  if (memory === 1) return braces("static int find(int[] parent, int x)", climb, "return root;");
  return braces("static int find(int[] parent, int x)", climb,
    braces("while (parent[x] != root)", "int next = parent[x];", "parent[x] = root;", "x = next;"),
    "return root;");
}

const link = (memory: number): Line => memory === 0
  ? [braces("if (rank[a] < rank[b])", "int swap = a;", "a = b;", "b = swap;"), "parent[b] = a;", braces("if (rank[a] == rank[b])", "rank[a]++;")]
  : memory === 1 ? "parent[a] = b;" : "parent[u] = parent[v];";

function decide(memory: number, rule: number): Line {
  if (rule < 0) return pending("cómo decidir si el cable cierra un ciclo y cómo unir.");
  if (rule === 1) return [braces("if (find(parent, u) == find(parent, v))", "return new int[] {u, v};"), "parent[u] = v;"];
  if (rule === 2) return [braces("if (parent[u] == parent[v])", "return new int[] {u, v};"), "int a = find(parent, u);", "int b = find(parent, v);", link(memory)];
  if (rule === 3) return ["int a = find(parent, u);", "int b = find(parent, v);", "parent[a] = b;", braces("if (find(parent, u) == find(parent, v))", "return new int[] {u, v};")];
  return ["int a = find(parent, u);", "int b = find(parent, v);", braces("if (a == b)", "return new int[] {u, v};"), link(memory)];
}

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: [size,
    "List<List<Integer>> adj = new ArrayList<>();",
    braces("for (int x = 0; x <= n; x++)", "adj.add(new ArrayList<>());"),
    eachEdge("edges",
      "boolean[] seen = new boolean[n + 1];", "seen[u] = true;", "Deque<Integer> stack = new ArrayDeque<>(List.of(u));", "boolean found = false;",
      braces("while (!stack.isEmpty())",
        "int x = stack.pollLast();",
        braces("if (x == v)", "found = true;", "break;"),
        braces("for (int y : adj.get(x))", braces("if (!seen[y])", "seen[y] = true;", "stack.addLast(y);"))),
      braces("if (found)", "return new int[] {u, v};"),
      "adj.get(u).add(v);", "adj.get(v).add(u);"),
    "return new int[0];"] });
  if (approach === 2) return javaClass(signature, { body: [size, "int[] degree = new int[n + 1];",
    eachEdge("edges", "degree[u]++;", "degree[v]++;"),
    braces("for (int i = edges.length - 2; i >= 0; i -= 2)",
      braces("if (degree[edges[i]] >= 2 && degree[edges[i + 1]] >= 2)", "return new int[] {edges[i], edges[i + 1]};")),
    "return new int[0];"] });
  const list = approach === 3 ? "sorted" : "edges";
  const sorting = approach === 3 && ["List<int[]> pairs = new ArrayList<>();",
    braces("for (int i = 0; i < edges.length; i += 2)", "pairs.add(new int[] {edges[i], edges[i + 1]});"),
    "pairs.sort((p, q) -> p[0] != q[0] ? p[0] - q[0] : p[1] - q[1]);",
    "int[] sorted = new int[edges.length];",
    braces("for (int i = 0; i < pairs.size(); i++)", "sorted[2 * i] = pairs.get(i)[0];", "sorted[2 * i + 1] = pairs.get(i)[1];")];
  if (memory < 0) return javaClass(signature, { body: [size, sorting, pending("qué guardar de los nodos ya conectados."), unfinished("elegí qué guardar de los nodos.")] });
  if (memory === 3) return javaClass(signature, { body: [size, sorting, "Set<Integer> seen = new HashSet<>();",
    eachEdge(list,
      rule < 0 ? pending("cuándo es el cable de más.") : braces("if (seen.contains(u) && seen.contains(v))", "return new int[] {u, v};"),
      "seen.add(u);", "seen.add(v);"),
    `return new int[] {${list}[${list}.length - 2], ${list}[${list}.length - 1]};`] });
  return javaClass(signature, {
    body: [size, sorting,
      "int[] parent = new int[n + 1];",
      braces("for (int x = 0; x <= n; x++)", "parent[x] = x;"),
      memory === 0 && "int[] rank = new int[n + 1];",
      eachEdge(list, decide(memory, rule)),
      "return new int[0];"],
    helpers: [finder(memory)],
  });
}
