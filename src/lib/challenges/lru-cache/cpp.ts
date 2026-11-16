import type { Choices } from "../../challenges";
import type { Line } from "../../preview-lines";
import { braces, pending, translationUnit, unfinished } from "../../cpp-preview";

const signature = "std::vector<int> solve(const std::vector<int>& ops, int capacity)";

type Store = { declare: string[]; has: string; read: string; touch: (value: string) => Line; size: string; evictOldest: Line; evictNewest: Line };

const listDeclare = ["std::list<std::pair<int, int>> entries;", "std::unordered_map<int, std::list<std::pair<int, int>>::iterator> where;"];
const listTouch = (value: string) => [braces("if (where.count(key))", "entries.erase(where[key]);"), `entries.push_back({key, ${value}});`, "where[key] = --entries.end();"];
const listOldest = ["where.erase(entries.front().first);", "entries.pop_front();"];
const listNewest = ["auto victim = --entries.end();", "--victim;", "where.erase(victim->first);", "entries.erase(victim);"];

const stores: Store[] = [
  { declare: listDeclare, has: "where.count(key)", read: "where[key]->second", touch: listTouch, size: "static_cast<int>(entries.size())", evictOldest: listOldest, evictNewest: listNewest },
  { declare: ["std::map<int, int> cache;"], has: "cache.count(key)", read: "cache[key]", touch: value => ["cache.erase(key);", `cache[key] = ${value};`], size: "static_cast<int>(cache.size())",
    evictOldest: "cache.erase(cache.begin());", evictNewest: ["auto victim = --cache.end();", "--victim;", "cache.erase(victim);"] },
  { declare: ["std::unordered_map<int, int> cache;", "std::vector<int> order;"], has: "cache.count(key)", read: "cache[key]",
    touch: value => ["auto at = std::ranges::find(order, key);", braces("if (at != order.end())", "order.erase(at);"), "order.push_back(key);", `cache[key] = ${value};`], size: "static_cast<int>(cache.size())",
    evictOldest: ["cache.erase(order.front());", "order.erase(order.begin());"], evictNewest: ["int victim = order[order.size() - 2];", "order.erase(order.end() - 2);", "cache.erase(victim);"] },
  { declare: [...listDeclare, "int size = 0;"], has: "where.count(key)", read: "where[key]->second", touch: listTouch, size: "size",
    evictOldest: [braces("if (!entries.empty())", listOldest), "size--;"],
    evictNewest: [braces("if (entries.size() > 1)", listNewest), "size--;"] },
];

const loop = (...body: Line[]) => braces("for (int i = 0; i + 2 < static_cast<int>(ops.size()); i += 3)", "int op = ops[i];", "int key = ops[i + 1];", "int val = ops[i + 2];", ...body);

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
  return ifElse("op == 0", ifElse(store.has, [`int hit = ${store.read};`, rule !== 1 && store.touch("hit"), "out.push_back(hit);"], "out.push_back(-1);"), put);
}

export function cpp([approach, memory, rule]: Choices): string {
  const out = "std::vector<int> out;";
  if (approach < 0) return translationUnit({ signature, body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  if (approach === 1) return translationUnit({ signature, body: ["std::vector<int> keys;", "std::unordered_map<int, int> values;", out,
    loop(ifElse("op == 0",
      ifElse("values.count(key)", ["keys.erase(std::ranges::find(keys, key));", "keys.push_back(key);", "out.push_back(values[key]);"], "out.push_back(-1);"),
      [braces("if (values.count(key))", "keys.erase(std::ranges::find(keys, key));"), "keys.push_back(key);", "values[key] = val;",
        braces("if (static_cast<int>(keys.size()) > capacity)", "values.erase(keys.front());", "keys.erase(keys.begin());")])),
    "return out;"] });
  if (approach === 2) return translationUnit({ signature, body: ["std::vector<int> queue;", "std::unordered_map<int, int> values;", out,
    loop(ifElse("op == 0", "out.push_back(values.count(key) ? values[key] : -1);",
      [braces("if (!values.count(key))", "queue.push_back(key);"), "values[key] = val;",
        braces("if (static_cast<int>(values.size()) > capacity)", "values.erase(queue.front());", "queue.erase(queue.begin());")])),
    "return out;"] });
  if (approach === 3) return translationUnit({ signature, body: ["std::unordered_map<int, int> values;", "std::unordered_map<int, int> uses;", "std::unordered_map<int, int> last;", "int time = 0;", out,
    loop("time++;",
      braces("if (op == 0)",
        braces("if (values.count(key))", "uses[key]++;", "last[key] = time;", "out.push_back(values[key]);"),
        braces("if (!values.count(key))", "out.push_back(-1);")),
      braces("if (op == 1)",
        braces("if (!values.count(key) && static_cast<int>(values.size()) >= capacity)", "int victim = -1;",
          braces("for (const auto& [k, value] : values)",
            braces("if (victim < 0 || uses[k] < uses[victim] || (uses[k] == uses[victim] && last[k] < last[victim]))", "victim = k;")),
          "values.erase(victim);", "uses.erase(victim);"),
        "values[key] = val;", "uses[key]++;", "last[key] = time;")),
    "return out;"] });
  return translationUnit({ signature, body: [
    memory < 0 ? pending("dónde guardar las claves y su orden.") : stores[memory].declare,
    out,
    loop(memory < 0 ? pending("cómo leer y escribir en la caché.") : operations(memory, rule)),
    "return out;"] });
}
