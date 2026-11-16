import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "List<Integer> solve(int[] prerequisites, int n)";
const eachPair = (...body: Line[]) => braces("for (int i = 0; i < prerequisites.length; i += 2)",
  "int course = prerequisites[i];", "int required = prerequisites[i + 1];", ...body);
const adjacency = (name: string) => [`List<List<Integer>> ${name} = new ArrayList<>();`, braces("for (int u = 0; u < n; u++)", `${name}.add(new ArrayList<>());`)];
const ordered = [braces("if (order.size() != n)", "return new ArrayList<>();"), "return order;"];

export function java([approach, memory, rule]: Choices): string {
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: [adjacency("adj"), eachPair("adj.get(required).add(course);"),
    "boolean[] seen = new boolean[n];", "List<Integer> order = new ArrayList<>();",
    braces("for (int start = 0; start < n; start++)",
      braces("if (seen[start])", "continue;"),
      "seen[start] = true;", "List<Integer> stack = new ArrayList<>(List.of(start));", "List<Integer> cursor = new ArrayList<>(List.of(0));",
      braces("while (stack.size() > 0)",
        "int top = stack.size() - 1;", "int u = stack.get(top);",
        braces("if (cursor.get(top) < adj.get(u).size())",
          "int v = adj.get(u).get(cursor.get(top));", "cursor.set(top, cursor.get(top) + 1);",
          braces("if (!seen[v])", "seen[v] = true;", "stack.add(v);", "cursor.add(0);")),
        braces("else", "stack.remove(top);", "cursor.remove(top);", "order.add(u);"))),
    "Collections.reverse(order);", "return order;"] });
  if (approach === 2) return javaClass(signature, { body: [adjacency("needs"), eachPair("needs.get(course).add(required);"),
    "boolean[] done = new boolean[n];", "List<Integer> order = new ArrayList<>();", "boolean progress = true;",
    braces("while (progress)", "progress = false;",
      braces("for (int u = 0; u < n; u++)",
        braces("if (done[u])", "continue;"),
        "boolean ready = true;",
        braces("for (int p : needs.get(u))", braces("if (!done[p])", "ready = false;")),
        braces("if (ready)", "done[u] = true;", "order.add(u);", "progress = true;"))),
    ordered] });
  if (approach === 3) return javaClass(signature, { body: ["int[] degree = new int[n];", eachPair("degree[course]++;"),
    "List<Integer> order = new ArrayList<>();",
    braces("for (int u = 0; u < n; u++)", "order.add(u);"),
    "order.sort((a, b) -> degree[a] - degree[b]);",
    "return order;"] });
  if (memory < 0) return javaClass(signature, { body: [pending("cómo guardar las correlativas."), pending("qué materias arrancan la cola y cuándo liberás una."), unfinished("elegí cómo guardar las correlativas.")] });
  const flags = memory === 2;
  const record = [
    ["adj.get(required).add(course);", "degree[course]++;"],
    ["adj.get(course).add(required);", "degree[required]++;"],
    ["adj.get(required).add(course);", "blocked[course] = true;"],
    ["adj.set(required, new ArrayList<>(List.of(course)));", "degree[course]++;"],
  ][memory];
  const free = (u: string) => (flags ? `!blocked[${u}]` : `degree[${u}] == 0`);
  const build = [adjacency("adj"), flags ? "boolean[] blocked = new boolean[n];" : "int[] degree = new int[n];", eachPair(...record)];
  if (rule < 0) return javaClass(signature, { body: [build, pending("qué materias arrancan la cola y cuándo hay un ciclo."), unfinished("elegí cómo usar la cola.")] });
  const start: Line = ["List<Integer> queue = new ArrayList<>();",
    rule === 2 ? braces(`if (${free("0")})`, "queue.add(0);") : braces("for (int u = 0; u < n; u++)", braces(`if (${free("u")})`, "queue.add(u);"))];
  const enqueue = rule === 3 ? braces("if (!queued[v])", "queued[v] = true;", "queue.add(v);") : braces(`if (${free("v")})`, "queue.add(v);");
  return javaClass(signature, { body: [build, start,
    rule === 3 && ["boolean[] queued = new boolean[n];", braces("for (int u : queue)", "queued[u] = true;")],
    "List<Integer> order = new ArrayList<>();", "int head = 0;",
    braces("while (head < queue.size())",
      "int u = queue.get(head);", "head++;", "order.add(u);",
      braces("for (int v : adj.get(u))", flags ? "blocked[v] = false;" : "degree[v]--;", enqueue)),
    rule === 1 ? "return order;" : ordered] });
}
