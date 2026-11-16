import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, javaClass, pending, unfinished } from "../../java-preview";

const signature = "List<Integer> solve(int[] ops, int capacity)";

type Store = { declare: string[]; has: string; read: string; touch: (value: string) => Line; size: string; evictOldest: Line; evictNewest: Line };

const mapTouch = (value: string) => ["cache.remove(key);", `cache.put(key, ${value});`];
const oldest = "cache.remove(cache.keySet().iterator().next());";
const newest = ["List<Integer> keys = new ArrayList<>(cache.keySet());", "cache.remove(keys.get(keys.size() - 2));"];

const stores: Store[] = [
  { declare: ["Map<Integer, Integer> cache = new LinkedHashMap<>();"], has: "cache.containsKey(key)", read: "cache.get(key)", touch: mapTouch, size: "cache.size()", evictOldest: oldest, evictNewest: newest },
  { declare: ["Map<Integer, Integer> cache = new TreeMap<>();"], has: "cache.containsKey(key)", read: "cache.get(key)", touch: mapTouch, size: "cache.size()", evictOldest: oldest, evictNewest: newest },
  { declare: ["Map<Integer, Integer> cache = new HashMap<>();", "List<Integer> order = new ArrayList<>();"], has: "cache.containsKey(key)", read: "cache.get(key)",
    touch: value => ["order.remove(Integer.valueOf(key));", "order.add(key);", `cache.put(key, ${value});`], size: "cache.size()",
    evictOldest: "cache.remove(order.remove(0));", evictNewest: "cache.remove(order.remove(order.size() - 2));" },
  { declare: ["Map<Integer, Integer> cache = new LinkedHashMap<>();", "int size = 0;"], has: "cache.containsKey(key)", read: "cache.get(key)", touch: mapTouch, size: "size",
    evictOldest: [braces("if (cache.size() > 0)", oldest), "size--;"],
    evictNewest: ["List<Integer> keys = new ArrayList<>(cache.keySet());", braces("if (keys.size() > 1)", "cache.remove(keys.get(keys.size() - 2));"), "size--;"] },
];

const loop = (...body: Line[]) => braces("for (int i = 0; i < ops.length; i += 3)", "int op = ops[i];", "int key = ops[i + 1];", "int val = ops[i + 2];", ...body);

function ifElse(condition: string, then: Line, otherwise: Line): string[] {
  const [, ...body] = braces("", then);
  const [, ...rest] = braces("", otherwise);
  return [`if (${condition}) {`, ...body.slice(0, -1), "} else {", ...rest];
}

function operations(memory: number, rule: number): Line {
  const store = stores[memory];
  if (rule < 0) return ifElse("op == 0", pending("qué hace get con el orden."), pending("cuándo y a quién desalojar."));
  const write = [store.touch("val"), memory === 3 && "size++;"];
  const put = rule === 2 ? [braces(`if (${store.size} >= capacity)`, store.evictOldest), write]
    : [write, braces(`if (${store.size} > capacity)`, rule === 3 ? store.evictNewest : store.evictOldest)];
  return ifElse("op == 0", ifElse(store.has, [`int hit = ${store.read};`, rule !== 1 && store.touch("hit"), "out.add(hit);"], "out.add(-1);"), put);
}

export function java([approach, memory, rule]: Choices): string {
  const out = "List<Integer> out = new ArrayList<>();";
  if (approach < 0) return javaClass(signature, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return javaClass(signature, { body: ["List<Integer> keys = new ArrayList<>();", "Map<Integer, Integer> values = new HashMap<>();", out,
    loop(ifElse("op == 0",
      ifElse("values.containsKey(key)", ["keys.remove(Integer.valueOf(key));", "keys.add(key);", "out.add(values.get(key));"], "out.add(-1);"),
      [braces("if (values.containsKey(key))", "keys.remove(Integer.valueOf(key));"), "keys.add(key);", "values.put(key, val);", braces("if (keys.size() > capacity)", "values.remove(keys.remove(0));")])),
    "return out;"] });
  if (approach === 2) return javaClass(signature, { body: ["List<Integer> queue = new ArrayList<>();", "Map<Integer, Integer> values = new HashMap<>();", out,
    loop(ifElse("op == 0", "out.add(values.containsKey(key) ? values.get(key) : -1);",
      [braces("if (!values.containsKey(key))", "queue.add(key);"), "values.put(key, val);", braces("if (values.size() > capacity)", "values.remove(queue.remove(0));")])),
    "return out;"] });
  if (approach === 3) return javaClass(signature, { body: ["Map<Integer, Integer> values = new HashMap<>();", "Map<Integer, Integer> uses = new HashMap<>();", "Map<Integer, Integer> last = new HashMap<>();", "int time = 0;", out,
    loop("time++;",
      braces("if (op == 0)",
        braces("if (values.containsKey(key))", "uses.put(key, uses.get(key) + 1);", "last.put(key, time);", "out.add(values.get(key));"),
        braces("if (!values.containsKey(key))", "out.add(-1);")),
      braces("if (op == 1)",
        braces("if (!values.containsKey(key) && values.size() >= capacity)", "int victim = -1;",
          braces("for (int k : values.keySet())",
            braces("if (victim < 0 || uses.get(k) < uses.get(victim) || (uses.get(k).equals(uses.get(victim)) && last.get(k) < last.get(victim)))", "victim = k;")),
          "values.remove(victim);", "uses.remove(victim);"),
        "values.put(key, val);", "uses.put(key, uses.getOrDefault(key, 0) + 1);", "last.put(key, time);")),
    "return out;"] });
  return javaClass(signature, { body: [
    memory < 0 ? pending("dónde guardar las claves y su orden.") : stores[memory].declare,
    out,
    loop(memory < 0 ? pending("cómo leer y escribir en la caché.") : operations(memory, rule)),
    "return out;"] });
}
