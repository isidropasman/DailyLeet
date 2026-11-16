import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::vector<int> solve(const std::vector<int>& prerequisites, int n)";
const size = "const int m = static_cast<int>(prerequisites.size());";
const eachPair = (...body: Line[]) => [size, braces("for (int i = 0; i < m; i += 2)",
  "int course = prerequisites[i];", "int required = prerequisites[i + 1];", ...body)];
const adjacency = "std::vector<std::vector<int>> adj(n);";
const ordered = [braces("if (static_cast<int>(order.size()) != n)", "return {};"), "return order;"];

export function cpp([approach, memory, rule]: Choices): string {
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: [adjacency, eachPair("adj[required].push_back(course);"),
    "std::vector<bool> seen(n, false);", "std::vector<int> order;",
    braces("for (int start = 0; start < n; start++)",
      braces("if (seen[start])", "continue;"),
      "seen[start] = true;", "std::vector<int> stack{start};", "std::vector<std::size_t> cursor{0};",
      braces("while (!stack.empty())",
        "std::size_t top = stack.size() - 1;", "int u = stack[top];",
        braces("if (cursor[top] < adj[u].size())",
          "int v = adj[u][cursor[top]];", "cursor[top]++;",
          braces("if (!seen[v])", "seen[v] = true;", "stack.push_back(v);", "cursor.push_back(0);")),
        braces("else", "stack.pop_back();", "cursor.pop_back();", "order.push_back(u);"))),
    "std::ranges::reverse(order);", "return order;"] });
  if (approach === 2) return translationUnit({ signature, body: ["std::vector<std::vector<int>> needs(n);", eachPair("needs[course].push_back(required);"),
    "std::vector<bool> done(n, false);", "std::vector<int> order;", "bool progress = true;",
    braces("while (progress)", "progress = false;",
      braces("for (int u = 0; u < n; u++)",
        braces("if (done[u])", "continue;"),
        "bool ready = true;",
        braces("for (int p : needs[u])", braces("if (!done[p])", "ready = false;")),
        braces("if (ready)", "done[u] = true;", "order.push_back(u);", "progress = true;"))),
    ordered] });
  if (approach === 3) return translationUnit({ signature, body: ["std::vector<int> degree(n, 0);", eachPair("degree[course]++;"),
    "std::vector<int> order;",
    braces("for (int u = 0; u < n; u++)", "order.push_back(u);"),
    "std::ranges::stable_sort(order, [&](int a, int b) { return degree[a] < degree[b]; });",
    "return order;"] });
  if (memory < 0) return translationUnit({ signature, body: [pending("cómo guardar las correlativas."), pending("qué materias arrancan la cola y cuándo liberás una."), unfinished("elegí cómo guardar las correlativas.")] });
  const flags = memory === 2;
  const record = [
    ["adj[required].push_back(course);", "degree[course]++;"],
    ["adj[course].push_back(required);", "degree[required]++;"],
    ["adj[required].push_back(course);", "blocked[course] = true;"],
    ["adj[required] = {course};", "degree[course]++;"],
  ][memory];
  const free = (u: string) => (flags ? `!blocked[${u}]` : `degree[${u}] == 0`);
  const build = [adjacency, flags ? "std::vector<bool> blocked(n, false);" : "std::vector<int> degree(n, 0);", eachPair(...record)];
  if (rule < 0) return translationUnit({ signature, body: [build, pending("qué materias arrancan la cola y cuándo hay un ciclo."), unfinished("elegí cómo usar la cola.")] });
  const start: Line = ["std::vector<int> queue;",
    rule === 2 ? braces(`if (${free("0")})`, "queue.push_back(0);") : braces("for (int u = 0; u < n; u++)", braces(`if (${free("u")})`, "queue.push_back(u);"))];
  const enqueue = rule === 3 ? braces("if (!queued[v])", "queued[v] = true;", "queue.push_back(v);") : braces(`if (${free("v")})`, "queue.push_back(v);");
  return translationUnit({ signature, body: [build, start,
    rule === 3 && ["std::vector<bool> queued(n, false);", braces("for (int u : queue)", "queued[u] = true;")],
    "std::vector<int> order;", "std::size_t head = 0;",
    braces("while (head < queue.size())",
      "int u = queue[head];", "head++;", "order.push_back(u);",
      braces("for (int v : adj[u])", flags ? "blocked[v] = false;" : "degree[v]--;", enqueue)),
    rule === 1 ? "return order;" : ordered] });
}
