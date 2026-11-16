import type { Choices } from "./challenges";

export function additionalProgram(kind: "stock" | "move-zeroes" | "anagram", [approach, memory, rule]: Choices): string {
  if (approach < 0) return "/* Elegí un enfoque para empezar a construir. */";
  if (kind === "stock") {
    if (approach === 1) return `let best = 0;\nfor (let buy = 0; buy < input.length; buy++) {\n  for (let sell = buy + 1; sell < input.length; sell++) {\n    best = Math.max(best, input[sell] - input[buy]);\n    emit(sell, buy, [input[buy]], best);\n  }\n}\nreturn best;`;
    if (approach === 2) return `const sorted = [...input].sort((a, b) => a - b);\nconst best = sorted.length ? sorted[sorted.length - 1] - sorted[0] : 0;\nemit(0, 0, sorted, best);\nreturn best;`;
    if (approach === 3) return `let best = 0;\nfor (let i = 1; i < input.length; i++) {\n  best = Math.max(best, input[i] - input[i - 1]);\n  emit(i, i - 1, [input[i - 1]], best);\n}\nreturn best;`;
    const updateBuy = memory < 0 ? "/* Pendiente: actualizar el precio de compra. */" : memory === 0 ? "buy = Math.min(buy, input[i]);" : memory === 1 ? "buy = Math.max(buy, input[i]);" : memory === 2 ? "buy = input[i];" : "";
    const updateBest = rule < 0 ? "/* Pendiente: actualizar la ganancia. */" : rule === 0 ? "best = Math.max(best, gain);" : rule === 1 ? "best = Math.max(0, gain);" : rule === 2 ? "best = Math.max(best, Math.abs(gain));" : "best = Math.min(best, gain);";
    return `let best = 0;\n${memory < 0 ? "/* Pendiente: qué precio de compra conservar. */" : "let buy = input[0] ?? 0;"}\nfor (let i = 1; i < input.length; i++) {\n  const gain = input[i] - buy;\n  ${updateBest}\n  emit(i, 0, [buy], best);\n  ${updateBuy}\n}\nreturn best;`;
  }
  if (kind === "move-zeroes") {
    if (approach === 2) return `const result = input.filter(value => value !== 0);\nwhile (result.length < input.length) result.push(0);\nemit(0, 0, result, result.length, result);\nreturn result;`;
    if (approach === 3) return `input.sort((a, b) => a - b);\nemit(0, 0, input, input.length, input);\nreturn input;`;
    const initialize = memory < 0 ? "/* Pendiente: dónde empezar a escribir. */" : `let write = ${memory === 1 ? "1" : memory === 2 ? "input.length - 1" : "0"};`;
    const change = approach === 0 ? "input[write] = input[read];" : "const value = input[write] ?? 0;\n    input[write] = input[read];\n    input[read] = value;";
    const action = rule < 0 ? "/* Pendiente: cuándo conservar el valor y avanzar. */" : `if (${rule === 2 ? "input[read] >= 0" : "input[read] !== 0"}) {\n    ${change}\n    ${rule === 1 ? "" : "write++;"}\n  }\n  ${rule === 1 ? "write++;" : ""}`;
    return `const length = input.length;\n${initialize}\nfor (let read = 0; read < ${rule === 3 ? "length - 1" : "length"}; read++) {\n  ${memory === 3 ? "write = 0;" : ""}\n  ${action}\n  emit(read, write, input, write, input);\n}\n${approach === 0 ? "while (write < length) input[write++] = 0;" : ""}\nemit(length - 1, 0, input, write, input);\nreturn input;`;
  }
  if (approach === 1) return `const first = [...input].sort().join("");\nconst second = [...other].sort().join("");\nemit(0, 0, [first, second], first.length);\nreturn first === second;`;
  if (approach === 2) return `const first = new Set(input);\nconst second = new Set(other);\nemit(0, 0, [...first], first.size);\nreturn input.length === other.length && first.size === second.size && [...first].every(ch => second.has(ch));`;
  if (approach === 3) return `let first = 0;\nlet second = 0;\nfor (const ch of input) first += ch.charCodeAt(0);\nfor (const ch of other) second += ch.charCodeAt(0);\nemit(0, 0, [first, second], first - second);\nreturn input.length === other.length && first === second;`;
  const declaration = memory < 0 ? "/* Pendiente: estructura para las apariciones. */" : memory === 0 || memory === 3 ? "const counts = new Map();" : memory === 1 ? "const counts = Array(26).fill(0);" : "const counts = new Set();";
  const key = memory === 3 ? '"all"' : "ch";
  const insert = memory < 0 ? "/* Pendiente: guardar cada aparición. */" : memory === 0 || memory === 3 ? `counts.set(${key}, (counts.get(${key}) ?? 0) + 1);` : memory === 1 ? "counts[ch.charCodeAt(0) - 97]++;" : "counts.add(ch);";
  const lookup = memory === 0 || memory === 3 ? `(counts.get(${key}) ?? 0)` : memory === 1 ? "counts[ch.charCodeAt(0) - 97]" : "Number(counts.has(ch))";
  const consume = rule < 0 ? "/* Pendiente: cómo consumir la segunda palabra. */" : rule === 2 ? `if (${lookup} <= 0) return false;` : memory === 0 || memory === 3 ? `counts.set(${key}, ${lookup} ${rule === 1 ? "+" : "-"} 1);` : memory === 1 ? `counts[ch.charCodeAt(0) - 97]${rule === 1 ? "++" : "--"};` : rule === 1 ? "counts.add(ch);" : "if (!counts.delete(ch)) return false;";
  const values = memory === 0 || memory === 3 ? "[...counts.values()]" : memory === 1 ? "counts" : "[counts.size]";
  const finish = rule < 0 ? "/* Pendiente: condición de aceptación. */" : rule === 2 ? "return true;" : `return ${values}.every(value => value ${rule === 3 ? ">=" : "==="} 0);`;
  return `${rule >= 0 && rule !== 3 ? "if (input.length !== other.length) return false;" : ""}\n${declaration}\nfor (let i = 0; i < input.length; i++) {\n  const ch = input[i];\n  ${insert}\n  ${memory >= 0 ? `emit(i, 0, ${values}, i + 1);` : ""}\n}\nfor (let i = 0; i < other.length; i++) {\n  const ch = other[i];\n  ${consume}\n  ${memory >= 0 ? `emit(i, 0, ${values}, i + 1);` : ""}\n}\n${finish}`;
}
