import type { Choices, LegacyKind } from "./challenges";
import { additionalProgram } from "./additional-programs";

export function program(kind: LegacyKind, [approach, memory, rule]: Choices): string {
  if (kind === "stock" || kind === "move-zeroes" || kind === "anagram") return additionalProgram(kind, [approach,memory,rule]);
  if (kind === "substring") {
    const setup = approach === 2 ? 'input = [...input].sort().join("");' : "";
    const repeat = memory === 0 ? "seen.has(ch)" : memory === 1 ? "seen.has(ch)" : memory === 2 ? "right > left && input[right - 1] === ch" : "right > left && input[left] === ch";
    if (approach === 3) return `const seen = new Set();\nfor (let right = 0; right < input.length; right++) {\n  seen.add(input[right]);\n  emit(right, 0, [...seen], seen.size);\n}\nreturn seen.size;`;
    const update = rule === 0
      ? memory === 0 ? "left = Math.max(left, seen.get(ch) + 1);" : "while (left < right && input[left] !== ch) { seen.delete(input[left]); left++; }\n      seen.delete(input[left]); left++;"
      : rule === 1 ? "left = right + 1; seen.clear();" : rule === 2 ? "seen.delete(input[left]); left++;" : "";
    if (approach === 1) return `let best = 0;\nfor (let start = 0; start < input.length; start++) {\n  const seen = new ${memory === 0 ? "Map" : "Set"}();\n  for (let right = start; right < input.length; right++) {\n    const ch = input[right];\n    if (${repeat.replaceAll("left", "start")}) {\n      ${rule === 0 ? "break;" : rule === 1 ? "seen.clear();" : rule === 2 ? "continue;" : ""}\n    }\n    ${memory === 0 ? "seen.set(ch, right);" : "seen.add(ch);"}\n    best = Math.max(best, right - start + 1);\n    emit(right, start, [...seen.keys()], best);\n  }\n}\nreturn best;`;
    return `${setup}\nlet left = 0;\nlet best = 0;\nconst seen = new ${memory === 0 ? "Map" : "Set"}();\nfor (let right = 0; right < input.length; right++) {\n  const ch = input[right];\n  if (${repeat}) {\n    ${update}\n  }\n  ${memory === 0 ? "seen.set(ch, right);" : "seen.add(ch);"}\n  best = Math.max(best, right - left + 1);\n  emit(right, left, [...seen.keys()], best);\n}\nreturn best;`;
  }
  if (kind === "two-sum") {
    if (approach === 1 || approach === 2) return `for (let i = 0; i < input.length; i++) {\n  for (let j = i + 1; j < ${approach === 1 ? "input.length" : "Math.min(input.length, i + 2)"}; j++) {\n    emit(j, i, [input[i], input[j]], input[i] + input[j]);\n    if (input[i] + input[j] === target) return [i, j];\n  }\n}\nreturn [];`;
    if (approach === 3) return `let left = 0;\nlet right = input.length - 1;\nwhile (left < right) {\n  const sum = input[left] + input[right];\n  emit(right, left, [input[left], input[right]], sum);\n  if (sum === target) return [left, right];\n  if (sum < target) left++;\n  else right--;\n}\nreturn [];`;
    const insert = memory === 1 ? "seen.push([value, i]);" : memory === 2 ? "seen.clear(); seen.set(value, i);" : memory === 3 ? "seen.set(value, value);" : "seen.set(value, i);";
    return `const seen = ${memory === 1 ? "[]" : "new Map()"};\nfor (let i = 0; i < input.length; i++) {\n  const value = input[i];\n  const complement = target - value;\n  ${rule === 1 ? insert : ""}\n  const previous = ${memory === 1 ? "seen.find(pair => pair[0] === complement)?.[1]" : "seen.get(complement)"};\n  emit(i, previous ?? i, ${memory === 1 ? "seen.map(pair => pair[0])" : "[...seen.keys()]"}, complement);\n  if (previous !== undefined) return [previous, i];\n  ${rule === 1 ? "" : rule === 2 ? `if (value > 0) { ${insert} }` : rule === 3 ? `if (value !== complement) { ${insert} }` : insert}\n}\nreturn [];`;
  }
  if (approach === 1) return `let remaining = input;\nlet previous;\ndo {\n  previous = remaining;\n  remaining = remaining.replaceAll("()", "").replaceAll("[]", "").replaceAll("{}", "");\n  emit(0, 0, [...remaining], remaining.length);\n} while (remaining !== previous);\nreturn ${rule === 3 ? "input.length % 2 === 0" : rule === 2 ? "!/[)\\]}]/.test(remaining)" : 'remaining.length === 0'};`;
  if (approach === 2) return `let balance = 0;\nfor (let i = 0; i < input.length; i++) {\n  balance += "([{<".includes(input[i]) ? 1 : -1;\n  emit(i, 0, [balance], balance);\n}\nreturn ${rule === 3 ? "input.length % 2 === 0" : "balance === 0"};`;
  if (approach === 3) return `const pairs = { ")": "(", "]": "[", "}": "{" };\nfor (let i = 0; i < Math.floor(input.length / 2); i++) {\n  const other = input.length - 1 - i;\n  emit(other, i, [input[i], input[other]], i);\n  if (pairs[input[other]] !== input[i]) return false;\n}\nreturn input.length % 2 === 0;`;
  return `const pending = [];\nconst pairs = { ")": "(", "]": "[", "}": "{" };\nfor (let i = 0; i < input.length; i++) {\n  const ch = input[i];\n  if ("([{".includes(ch)) {\n    ${memory === 2 ? "if (!pending.includes(ch)) pending.push(ch);" : memory === 3 ? "pending.splice(0, pending.length, ch);" : "pending.push(ch);"}\n  } else {\n    const opening = pending.${memory === 1 ? "shift" : "pop"}();\n    ${rule === 1 || rule === 3 ? "" : "if (opening !== pairs[ch]) return false;"}\n  }\n  emit(i, 0, [...pending], pending.length);\n}\nreturn ${rule === 2 ? "true" : rule === 3 ? "input.length % 2 === 0" : "pending.length === 0"};`;
}

export function generateCode(kind: LegacyKind, choices: Choices): string {
  const signature = kind === "two-sum" ? "nums: number[], target: number" : kind === "stock" ? "prices: number[]" : kind === "move-zeroes" ? "nums: number[]" : kind === "anagram" ? "s: string, t: string" : "s: string";
  const body = program(kind, choices).split("\n").filter(line => !line.trim().startsWith("emit(")).join("\n")
    .replaceAll(/\binput\b/g, kind === "two-sum" || kind === "move-zeroes" ? "nums" : kind === "stock" ? "prices" : "s")
    .replaceAll(/\bother\b/g, "t")
    .replaceAll("new Map()", kind === "two-sum" ? "new Map<number, number>()" : "new Map<string, number>()")
    .replaceAll("new Set()", "new Set<string>()")
    .replaceAll("seen.get(ch) + 1", "seen.get(ch)! + 1")
    .replaceAll("const pending = []", "const pending: string[] = []")
    .replaceAll("const seen = []", "const seen: [number, number][] = []")
    .replaceAll("const pairs =", "const pairs: Record<string, string> =")
    .replaceAll("let previous;", "let previous: string;")
    .replaceAll("const counts = Array(26)", "const counts: number[] = Array(26)");
  return `function solve(${signature}) {\n${body.split("\n").map(line => `  ${line}`).join("\n")}\n}`;
}

export function previewCode(kind: LegacyKind, choices: Choices): string {
  if (choices.every(choice => choice >= 0)) return generateCode(kind, choices);
  if (kind === "stock" || kind === "move-zeroes" || kind === "anagram") return generateCode(kind, choices);
  const [approach, memory] = choices;
  const signature = kind === "two-sum" ? "nums: number[], target: number" : "s: string";
  let body: string;
  if (approach < 0) body = "  /* Elegí un enfoque para empezar a construir. */";
  else if (kind === "substring") {
    if (approach === 1) body = `  let best = 0;\n  for (let start = 0; start < s.length; start++) {\n    ${memory < 0 ? "/* Pendiente: qué información guardar. */" : memory === 0 ? "const seen = new Map<string, number>();" : "const seen = new Set<string>();"}\n    for (let right = start; right < s.length; right++) {\n      const ch = s[right];\n      ${memory < 0 ? "/* Pendiente: cómo reconocer un repetido. */" : `if (${memory < 2 ? "seen.has(ch)" : memory === 2 ? "right > start && s[right - 1] === ch" : "right > start && s[start] === ch"}) {\n        /* Pendiente: qué hacer con el repetido. */\n      }`}\n      best = Math.max(best, right - start + 1);\n    }\n  }\n  return best;`;
    else body = `  ${approach === 2 ? 's = [...s].sort().join("");\n  ' : ""}let left = 0;\n  let best = 0;\n  ${memory < 0 ? "/* Pendiente: qué información guardar. */" : memory === 0 ? "const seen = new Map<string, number>();" : "const seen = new Set<string>();"}\n  for (let right = 0; right < s.length; right++) {\n    const ch = s[right];\n    ${memory < 0 ? "/* Pendiente: cómo reconocer un repetido. */" : `if (${memory < 2 ? "seen.has(ch)" : memory === 2 ? "right > left && s[right - 1] === ch" : "right > left && s[left] === ch"}) {\n      /* Pendiente: cómo ajustar la ventana. */\n    }`}\n    ${memory < 0 ? "/* Pendiente: registrar el carácter actual. */" : memory === 0 ? "seen.set(ch, right);" : "seen.add(ch);"}\n    best = Math.max(best, right - left + 1);\n  }\n  return best;`;
  } else if (kind === "two-sum") {
    const declaration = memory < 0 ? "/* Pendiente: estructura para recordar valores. */" : memory === 1 ? "const seen: [number, number][] = [];" : "const seen = new Map<number, number>();";
    const record = memory < 0 ? "" : memory === 1 ? "const remember = () => { seen.push([value, i]); };" : memory === 2 ? "const remember = () => { seen.clear(); seen.set(value, i); };" : memory === 3 ? "const remember = () => { seen.set(value, value); };" : "const remember = () => { seen.set(value, i); };";
    const lookup = memory < 0 ? "/* Pendiente: buscar el complemento en la estructura. */" : memory === 1 ? "const previous = seen.find(pair => pair[0] === complement)?.[1];" : "const previous = seen.get(complement);";
    body = `  ${declaration}\n  for (let i = 0; i < nums.length; i++) {\n    const value = nums[i];\n    const complement = target - value;\n    ${record}\n    /* Pendiente: cuándo registrar el valor actual. */\n    ${lookup}\n    ${memory >= 0 ? "if (previous !== undefined) return [previous, i];" : ""}\n  }\n  return [];`;
  } else if (approach === 1 || approach === 2) {
    body = generateCode(kind, [approach,0,0]).split("\n").slice(1,-1).join("\n").replace(/  return .*;/, "  /* Pendiente: condición para aceptar el resultado. */");
  } else {
    const store = memory < 0 ? "/* Pendiente: estructura para las aperturas. */" : "const pending: string[] = [];";
    const add = memory < 0 ? "/* Pendiente: guardar la apertura. */" : memory === 2 ? "if (!pending.includes(ch)) pending.push(ch);" : memory === 3 ? "pending.splice(0, pending.length, ch);" : "pending.push(ch);";
    body = `  ${store}\n  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };\n  for (let i = 0; i < s.length; i++) {\n    const ch = s[i];\n    if ("([{".includes(ch)) {\n      ${add}\n    } else {\n      ${memory < 0 ? "/* Pendiente: recuperar la apertura correspondiente. */" : `const opening = pending.${memory === 1 ? "shift" : "pop"}();`}\n      /* Pendiente: validar el cierre. */\n    }\n  }\n  /* Pendiente: condición final de validez. */`;
  }
  return `function solve(${signature}) {\n${body}\n}`;
}
