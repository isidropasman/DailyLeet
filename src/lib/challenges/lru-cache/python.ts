import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { block, fn, pending } from "../../python-preview";

type Store = { declare: string[]; has: string; read: string; touch: (value: string) => Line; size: string; evictOldest: Line; evictNewest: Line };

const dictTouch = (value: string) => ["cache.pop(key, None)", `cache[key] = ${value}`];

const stores: Store[] = [
  { declare: ["cache = {}"], has: "key in cache", read: "cache[key]", touch: dictTouch, size: "len(cache)",
    evictOldest: "del cache[next(iter(cache))]", evictNewest: ["keys = list(cache)", "del cache[keys[-2]]"] },
  { declare: ["cache = {}"], has: "key in cache", read: "cache[key]", touch: dictTouch, size: "len(cache)",
    evictOldest: "del cache[sorted(cache)[0]]", evictNewest: ["keys = sorted(cache)", "del cache[keys[-2]]"] },
  { declare: ["cache = {}", "order = []"], has: "key in cache", read: "cache[key]",
    touch: value => ["if key in order:", block("order.remove(key)"), "order.append(key)", `cache[key] = ${value}`], size: "len(cache)",
    evictOldest: "del cache[order.pop(0)]", evictNewest: "del cache[order.pop(-2)]" },
  { declare: ["cache = {}", "size = 0"], has: "key in cache", read: "cache[key]", touch: dictTouch, size: "size",
    evictOldest: ["if len(cache) > 0:", block("del cache[next(iter(cache))]"), "size -= 1"],
    evictNewest: ["keys = list(cache)", "if len(keys) > 1:", block("del cache[keys[-2]]"), "size -= 1"] },
];

const loop = (...body: Line[]) => ["for i in range(0, len(ops), 3):", block("op = ops[i]", "key = ops[i + 1]", "val = ops[i + 2]", ...body)];

function operations(memory: number, rule: number): Line {
  const store = stores[memory];
  if (rule < 0) return ["if op == 0:", block(pending("qué hace get con el orden.")), "else:", block(pending("cuándo y a quién desalojar."))];
  const write = [store.touch("val"), memory === 3 && "size += 1"];
  const put = rule === 2 ? [`if ${store.size} >= capacity:`, block(store.evictOldest), write]
    : [write, `if ${store.size} > capacity:`, block(rule === 3 ? store.evictNewest : store.evictOldest)];
  return ["if op == 0:",
    block(`if ${store.has}:`, block(`hit = ${store.read}`, rule !== 1 && store.touch("hit"), "out.append(hit)"), "else:", block("out.append(-1)")),
    "else:", block(put)];
}

export function python([approach, memory, rule]: Choices): string {
  const args = "ops, capacity";
  if (approach < 0) return fn(args, "# Elegí un enfoque para empezar a construir.");
  if (approach === 1) return fn(args, "keys = []", "values = {}", "out = []",
    loop("if op == 0:",
      block("if key in values:", block("keys.remove(key)", "keys.append(key)", "out.append(values[key])"), "else:", block("out.append(-1)")),
      "else:",
      block("if key in values:", block("keys.remove(key)"), "keys.append(key)", "values[key] = val", "if len(keys) > capacity:", block("del values[keys.pop(0)]"))),
    "return out");
  if (approach === 2) return fn(args, "queue = []", "values = {}", "out = []",
    loop("if op == 0:", block("out.append(values[key] if key in values else -1)"),
      "else:", block("if key not in values:", block("queue.append(key)"), "values[key] = val", "if len(values) > capacity:", block("del values[queue.pop(0)]"))),
    "return out");
  if (approach === 3) return fn(args, "values = {}", "uses = {}", "last = {}", "time = 0", "out = []",
    loop("time += 1",
      "if op == 0:",
      block("if key in values:", block("uses[key] += 1", "last[key] = time", "out.append(values[key])"), "if key not in values:", block("out.append(-1)")),
      "if op == 1:",
      block("if key not in values and len(values) >= capacity:",
        block("victim = -1",
          "for k in values:", block("if victim < 0 or uses[k] < uses[victim] or (uses[k] == uses[victim] and last[k] < last[victim]):", block("victim = k")),
          "del values[victim]", "del uses[victim]"),
        "values[key] = val", "uses[key] = uses.get(key, 0) + 1", "last[key] = time")),
    "return out");
  return fn(args,
    memory < 0 ? pending("dónde guardar las claves y su orden.") : stores[memory].declare,
    "out = []",
    loop(memory < 0 ? pending("cómo leer y escribir en la caché.") : operations(memory, rule)),
    "return out");
}
