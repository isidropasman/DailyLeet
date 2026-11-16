import type { Choices } from "../../challenges";
import { render, type Line } from "../../preview-lines";
import { jsBlock, jsChooseApproach, jsPending } from "../module";

type Store = { declare: string[]; has: string; read: string; touch: (value: string) => Line; size: string; evictOldest: Line; evictNewest: Line; trace: string };

const mapTouch = (value: string) => ["cache.delete(key);", `cache.set(key, ${value});`];

const stores: Store[] = [
  { declare: ["const cache = new Map();"], has: "cache.has(key)", read: "cache.get(key)", touch: mapTouch, size: "cache.size",
    evictOldest: "cache.delete(cache.keys().next().value);",
    evictNewest: ["const keys = [...cache.keys()];", "cache.delete(keys[keys.length - 2]);"], trace: "[...cache.keys()]" },
  { declare: ["const cache = {};"], has: "key in cache", read: "cache[key]", touch: value => ["delete cache[key];", `cache[key] = ${value};`], size: "Object.keys(cache).length",
    evictOldest: "delete cache[Object.keys(cache)[0]];",
    evictNewest: ["const keys = Object.keys(cache);", "delete cache[keys[keys.length - 2]];"], trace: "Object.keys(cache)" },
  { declare: ["const cache = new Map();", "const order = [];"], has: "cache.has(key)", read: "cache.get(key)",
    touch: value => ["const at = order.indexOf(key);", jsBlock("if (at >= 0)", "order.splice(at, 1);"), "order.push(key);", `cache.set(key, ${value});`], size: "cache.size",
    evictOldest: "cache.delete(order.shift());",
    evictNewest: "cache.delete(order.splice(order.length - 2, 1)[0]);", trace: "[...order]" },
  { declare: ["const cache = new Map();", "let size = 0;"], has: "cache.has(key)", read: "cache.get(key)", touch: mapTouch, size: "size",
    evictOldest: [jsBlock("if (cache.size > 0)", "cache.delete(cache.keys().next().value);"), "size--;"],
    evictNewest: ["const keys = [...cache.keys()];", jsBlock("if (keys.length > 1)", "cache.delete(keys[keys.length - 2]);"), "size--;"], trace: "[...cache.keys()]" },
];

const loop = (...body: Line[]) => jsBlock("for (let i = 0; i < ops.length; i += 3)", "const op = ops[i];", "const key = ops[i + 1];", "const val = ops[i + 2];", ...body);

function ifElse(condition: string, then: Line, otherwise: Line): string[] {
  const [, ...body] = jsBlock("", then);
  const [, ...rest] = jsBlock("", otherwise);
  return [`if (${condition}) {`, ...body.slice(0, -1), "} else {", ...rest];
}

function operations(memory: number, rule: number): Line {
  const store = stores[memory];
  if (rule < 0) return ifElse("op === 0", jsPending("qué hace get con el orden."), jsPending("cuándo y a quién desalojar."));
  const write = [store.touch("val"), memory === 3 && "size++;"];
  const put = rule === 2 ? [jsBlock(`if (${store.size} >= capacity)`, store.evictOldest), write]
    : [write, jsBlock(`if (${store.size} > capacity)`, rule === 3 ? store.evictNewest : store.evictOldest)];
  return [
    ifElse("op === 0", ifElse(store.has, [`const hit = ${store.read};`, rule !== 1 && store.touch("hit"), "out.push(hit);"], "out.push(-1);"), put),
    `emit(i / 3, 0, ${store.trace}, out.length > 0 ? out[out.length - 1] : -1, ${store.trace});`,
  ];
}

export function program([approach, memory, rule]: Choices): string {
  if (approach < 0) return jsChooseApproach;
  if (approach === 1) return render("const keys = [];", "const values = new Map();", "const out = [];",
    loop(
      ifElse("op === 0",
        ifElse("values.has(key)", ["keys.splice(keys.indexOf(key), 1);", "keys.push(key);", "out.push(values.get(key));"], "out.push(-1);"),
        [jsBlock("if (values.has(key))", "keys.splice(keys.indexOf(key), 1);"), "keys.push(key);", "values.set(key, val);", jsBlock("if (keys.length > capacity)", "values.delete(keys.shift());")]),
      "emit(i / 3, 0, [...keys], out.length > 0 ? out[out.length - 1] : -1, [...keys]);"),
    "return out;");
  if (approach === 2) return render("const queue = [];", "const values = new Map();", "const out = [];",
    loop(
      ifElse("op === 0", "out.push(values.has(key) ? values.get(key) : -1);",
        [jsBlock("if (!values.has(key))", "queue.push(key);"), "values.set(key, val);", jsBlock("if (values.size > capacity)", "values.delete(queue.shift());")]),
      "emit(i / 3, 0, [...queue], out.length > 0 ? out[out.length - 1] : -1, [...queue]);"),
    "return out;");
  if (approach === 3) return render("const values = new Map();", "const uses = new Map();", "const last = new Map();", "let time = 0;", "const out = [];",
    loop("time++;",
      jsBlock("if (op === 0)",
        jsBlock("if (values.has(key))", "uses.set(key, uses.get(key) + 1);", "last.set(key, time);", "out.push(values.get(key));"),
        jsBlock("if (!values.has(key))", "out.push(-1);")),
      jsBlock("if (op === 1)",
        jsBlock("if (!values.has(key) && values.size >= capacity)", "let victim = -1;",
          jsBlock("for (const k of values.keys())",
            jsBlock("if (victim < 0 || uses.get(k) < uses.get(victim) || (uses.get(k) === uses.get(victim) && last.get(k) < last.get(victim)))", "victim = k;")),
          "values.delete(victim);", "uses.delete(victim);"),
        "values.set(key, val);", "uses.set(key, (uses.get(key) ?? 0) + 1);", "last.set(key, time);"),
      "emit(i / 3, 0, [...values.keys()], out.length > 0 ? out[out.length - 1] : -1, [...values.keys()]);"),
    "return out;");
  return render(
    memory < 0 ? jsPending("dónde guardar las claves y su orden.") : stores[memory].declare,
    "const out = [];",
    loop(memory < 0 ? jsPending("cómo leer y escribir en la caché.") : operations(memory, rule)),
    "return out;");
}

export const typescript: [string, string][] = [
  ["const keys = [];", "const keys: number[] = [];"],
  ["const queue = [];", "const queue: number[] = [];"],
  ["const order = [];", "const order: number[] = [];"],
  ["const out = [];", "const out: number[] = [];"],
  ["const values = new Map();", "const values = new Map<number, number>();"],
  ["const uses = new Map();", "const uses = new Map<number, number>();"],
  ["const last = new Map();", "const last = new Map<number, number>();"],
  ["const cache = new Map();", "const cache = new Map<number, number>();"],
  ["const cache = {};", "const cache: Record<number, number> = {};"],
  ["const hit = cache.get(key);", "const hit = cache.get(key)!;"],
];
