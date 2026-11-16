import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

const args = "prerequisites, n";
const eachPair = (...body: Line[]): Line => ["for i in range(0, len(prerequisites), 2):", block("course = prerequisites[i]", "required = prerequisites[i + 1]", ...body)];
const adjacency = "adj = [[] for _ in range(n)]";
const ordered = ["if len(order) != n:", block("return []"), "return order"];

export function python([approach, memory, rule]: Choices): string {
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, adjacency, eachPair("adj[required].append(course)"),
    "seen = [False] * n", "order = []",
    "for start in range(n):",
    block("if seen[start]:", block("continue"),
      "seen[start] = True", "stack = [start]", "cursor = [0]",
      "while len(stack) > 0:",
      block("top = len(stack) - 1", "u = stack[top]",
        "if cursor[top] < len(adj[u]):",
        block("v = adj[u][cursor[top]]", "cursor[top] += 1", "if not seen[v]:", block("seen[v] = True", "stack.append(v)", "cursor.append(0)")),
        "else:",
        block("stack.pop()", "cursor.pop()", "order.append(u)"))),
    "order.reverse()", "return order");
  if (approach === 2) return fn(args, "needs = [[] for _ in range(n)]", eachPair("needs[course].append(required)"),
    "done = [False] * n", "order = []", "progress = True",
    "while progress:",
    block("progress = False", "for u in range(n):",
      block("if done[u]:", block("continue"), "ready = True",
        "for p in needs[u]:", block("if not done[p]:", block("ready = False")),
        "if ready:", block("done[u] = True", "order.append(u)", "progress = True"))),
    ordered);
  if (approach === 3) return fn(args, "degree = [0] * n", eachPair("degree[course] += 1"),
    "order = []", "for u in range(n):", block("order.append(u)"),
    "order.sort(key=lambda u: degree[u])", "return order");
  if (memory < 0) return fn(args, pending("cómo guardar las correlativas."), pending("qué materias arrancan la cola y cuándo liberás una."), "return []");
  const flags = memory === 2;
  const record = [
    ["adj[required].append(course)", "degree[course] += 1"],
    ["adj[course].append(required)", "degree[required] += 1"],
    ["adj[required].append(course)", "blocked[course] = True"],
    ["adj[required] = [course]", "degree[course] += 1"],
  ][memory];
  const free = (u: string) => (flags ? `not blocked[${u}]` : `degree[${u}] == 0`);
  const build = [adjacency, flags ? "blocked = [False] * n" : "degree = [0] * n", eachPair(...record)];
  if (rule < 0) return fn(args, build, pending("qué materias arrancan la cola y cuándo hay un ciclo."), "return []");
  const start: Line = rule === 2 ? `queue = [0] if ${free("0")} else []`
    : ["queue = []", "for u in range(n):", block(`if ${free("u")}:`, block("queue.append(u)"))];
  const enqueue: Line = rule === 3 ? ["if not queued[v]:", block("queued[v] = True", "queue.append(v)")] : [`if ${free("v")}:`, block("queue.append(v)")];
  return fn(args, build, start,
    rule === 3 && ["queued = [False] * n", "for u in queue:", block("queued[u] = True")],
    "order = []", "head = 0",
    "while head < len(queue):",
    block("u = queue[head]", "head += 1", "order.append(u)",
      "for v in adj[u]:", block(flags ? "blocked[v] = False" : "degree[v] -= 1", enqueue)),
    rule === 1 ? "return order" : ordered);
}
