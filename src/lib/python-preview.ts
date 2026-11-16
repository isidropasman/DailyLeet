import type { Choices, LegacyKind } from "./challenges";
import { activeChoices, flat, indent, render, type Line } from "./preview-lines";

export const pending = (text: string) => `# Pendiente: ${text}`;
export const unfinished = (text: string) => `raise NotImplementedError("Pendiente: ${text}")`;

export function block(...lines: Line[]): string[] {
  const body = flat(...lines);
  return indent(body.every(line => line.trimStart().startsWith("#")) ? [...body, "pass"] : body);
}

export function fn(args: string, ...body: Line[]): string {
  return render(`def solve(${args}):`, block(...body));
}

function substring([approach, memory, rule]: Choices): string {
  if (approach === 3) return fn("s", "seen = set()", "for ch in s:", block("seen.add(ch)"), "return len(seen)");
  const start = approach === 1 ? "start" : "left";
  const declaration = memory < 0 ? pending("qué información guardar.") : memory === 0 ? "seen = {}" : "seen = set()";
  const repeat = memory < 2 ? "ch in seen" : memory === 2 ? `right > ${start} and s[right - 1] == ch` : `right > ${start} and s[${start}] == ch`;
  const record = memory < 0 ? pending("registrar el carácter actual.") : memory === 0 ? "seen[ch] = right" : "seen.add(ch)";
  const forget = (index: string) => (memory === 0 ? `seen.pop(s[${index}], None)` : `seen.discard(s[${index}])`);
  const onRepeat = (action: Line[]) => (memory < 0 ? pending("cómo reconocer un repetido.") : rule === 3 ? null : [`if ${repeat}:`, block(rule < 0 ? pending(approach === 1 ? "qué hacer con el repetido." : "cómo ajustar la ventana.") : action)]);
  if (approach === 1) {
    return fn("s",
      "best = 0",
      "for start in range(len(s)):",
      block(
        declaration,
        "for right in range(start, len(s)):",
        block("ch = s[right]", onRepeat([rule === 0 ? "break" : rule === 1 ? "seen.clear()" : "continue"]), record, "best = max(best, right - start + 1)"),
      ),
      "return best",
    );
  }
  const update = rule === 0
    ? memory === 0 ? ["left = max(left, seen[ch] + 1)"] : ["while left < right and s[left] != ch:", block(forget("left"), "left += 1"), forget("left"), "left += 1"]
    : rule === 1 ? ["left = right + 1", "seen.clear()"] : [forget("left"), "left += 1"];
  return fn("s",
    approach === 2 && 's = "".join(sorted(s))',
    "left = 0",
    "best = 0",
    declaration,
    "for right in range(len(s)):",
    block("ch = s[right]", onRepeat(update), record, "best = max(best, right - left + 1)"),
    "return best",
  );
}

function twoSum([approach, memory, rule]: Choices): string {
  if (approach === 1 || approach === 2) {
    return fn("nums, target",
      "for i in range(len(nums)):",
      block(`for j in range(i + 1, ${approach === 1 ? "len(nums)" : "min(len(nums), i + 2)"}):`, block("if nums[i] + nums[j] == target:", block("return [i, j]"))),
      "return []",
    );
  }
  if (approach === 3) {
    return fn("nums, target",
      "left = 0",
      "right = len(nums) - 1",
      "while left < right:",
      block("total = nums[left] + nums[right]", "if total == target:", block("return [left, right]"), "if total < target:", block("left += 1"), "else:", block("right -= 1")),
      "return []",
    );
  }
  const insert = memory < 0 ? [pending("guardar el valor actual.")] : memory === 0 ? ["seen[value] = i"] : memory === 1 ? ["seen.append((value, i))"] : memory === 2 ? ["seen.clear()", "seen[value] = i"] : ["seen[value] = value"];
  const after = rule === 0 ? insert : rule === 2 ? ["if value > 0:", block(insert)] : rule === 3 ? ["if value != complement:", block(insert)] : null;
  return fn("nums, target",
    memory < 0 ? pending("estructura para recordar valores.") : memory === 1 ? "seen = []" : "seen = {}",
    "for i in range(len(nums)):",
    block(
      "value = nums[i]",
      "complement = target - value",
      rule === 1 && insert,
      rule < 0 && pending("cuándo registrar el valor actual."),
      memory < 0
        ? pending("buscar el complemento en la estructura.")
        : [memory === 1 ? "previous = next((index for number, index in seen if number == complement), None)" : "previous = seen.get(complement)", "if previous is not None:", block("return [previous, i]")],
      after,
    ),
    "return []",
  );
}

function brackets([approach, memory, rule]: Choices): string {
  const pairs = 'pairs = {")": "(", "]": "[", "}": "{"}';
  if (approach === 3) {
    return fn("s",
      pairs,
      "for i in range(len(s) // 2):",
      block("other = len(s) - 1 - i", "if pairs.get(s[other]) != s[i]:", block("return False")),
      "return len(s) % 2 == 0",
    );
  }
  const parity = "return len(s) % 2 == 0";
  if (approach === 1) {
    return fn("s",
      "remaining = s",
      "while True:",
      block("previous = remaining", 'remaining = remaining.replace("()", "").replace("[]", "").replace("{}", "")', "if remaining == previous:", block("break")),
      rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : rule === 2 ? 'return not any(ch in ")]}" for ch in remaining)' : "return len(remaining) == 0",
    );
  }
  if (approach === 2) {
    return fn("s",
      "balance = 0",
      "for ch in s:",
      block('balance += 1 if ch in "([{<" else -1'),
      rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : "return balance == 0",
    );
  }
  const take = memory === 1 ? "pending.pop(0)" : "pending.pop()";
  const close = memory < 0
    ? [pending("recuperar la apertura correspondiente.")]
    : rule < 0 ? [`opening = ${take} if pending else None`, pending("validar el cierre.")]
    : rule === 1 || rule === 3 ? ["if pending:", block(take)]
    : [`opening = ${take} if pending else None`, "if opening != pairs.get(ch):", block("return False")];
  const finish = rule < 0 ? unfinished("condición final de validez.") : rule === 2 ? "return True" : rule === 3 ? parity : memory < 0 ? unfinished("condición final de validez.") : "return len(pending) == 0";
  return fn("s",
    memory < 0 ? pending("estructura para las aperturas.") : "pending = []",
    pairs,
    "for ch in s:",
    block(
      'if ch in "([{":',
      block(memory < 0 ? pending("guardar la apertura.") : memory === 2 ? ["if ch not in pending:", block("pending.append(ch)")] : memory === 3 ? ["pending.clear()", "pending.append(ch)"] : "pending.append(ch)"),
      "else:",
      block(close),
    ),
    finish,
  );
}

function stock([approach, memory, rule]: Choices): string {
  if (approach === 1) {
    return fn("prices",
      "best = 0",
      "for buy in range(len(prices)):",
      block("for sell in range(buy + 1, len(prices)):", block("best = max(best, prices[sell] - prices[buy])")),
      "return best",
    );
  }
  if (approach === 2) return fn("prices", "ordered = sorted(prices)", "return ordered[-1] - ordered[0] if ordered else 0");
  if (approach === 3) {
    return fn("prices", "best = 0", "for i in range(1, len(prices)):", block("best = max(best, prices[i] - prices[i - 1])"), "return best");
  }
  return fn("prices",
    "best = 0",
    "buy = prices[0] if prices else 0",
    "for i in range(1, len(prices)):",
    block(
      "gain = prices[i] - buy",
      rule < 0 ? pending("actualizar la ganancia.") : ["best = max(best, gain)", "best = max(0, gain)", "best = max(best, abs(gain))", "best = min(best, gain)"][rule],
      memory < 0 ? pending("actualizar el precio de compra.") : [["buy = min(buy, prices[i])"], ["buy = max(buy, prices[i])"], ["buy = prices[i]"], []][memory],
    ),
    "return best",
  );
}

function moveZeroes([approach, memory, rule]: Choices): string {
  if (approach === 2) {
    return fn("nums", "result = [value for value in nums if value != 0]", "while len(result) < len(nums):", block("result.append(0)"), "return result");
  }
  if (approach === 3) return fn("nums", "nums.sort()", "return nums");
  const loop = `for read in range(${rule === 3 ? "length - 1" : "length"}):`;
  if (memory < 0) return fn("nums", "length = len(nums)", pending("dónde empezar a escribir."), loop, block(pending("cuándo conservar el valor y avanzar.")), "return nums");
  // Starting the write pointer at 1 or at the end lets it run past the array; JS grows the array there.
  const grows = memory === 1 || memory === 2;
  const assign = (index: string, value: string) => (grows ? `put(nums, ${index}, ${value})` : `nums[${index}] = ${value}`);
  const change = approach === 0
    ? [assign("write", "nums[read]")]
    : grows ? ["value = nums[write] if write < len(nums) else 0", assign("write", "nums[read]"), "nums[read] = value"] : ["nums[write], nums[read] = nums[read], nums[write]"];
  const helper = grows && [
    "def put(nums, index, value):",
    block(
      "# Los arrays de JavaScript crecen al asignar más allá del final (dejando huecos) e ignoran índices negativos.",
      "if index < 0:", block("return"),
      "while len(nums) <= index:", block("nums.append(None)"),
      "nums[index] = value",
    ),
    "",
    "",
  ];
  return render(helper, fn("nums",
    "length = len(nums)",
    `write = ${memory === 1 ? "1" : memory === 2 ? "length - 1" : "0"}`,
    loop,
    block(
      memory === 3 && "write = 0",
      rule < 0 ? pending("cuándo conservar el valor y avanzar.") : [`if nums[read] ${rule === 2 ? ">=" : "!="} 0:`, block(change, rule !== 1 && "write += 1"), rule === 1 && "write += 1"],
    ),
    approach === 0 && ["while write < length:", block(assign("write", "0"), "write += 1")],
    "return nums",
  ));
}

function anagram([approach, memory, rule]: Choices): string {
  if (approach === 1) return fn("s, t", "return sorted(s) == sorted(t)");
  if (approach === 2) return fn("s, t", "return len(s) == len(t) and set(s) == set(t)");
  if (approach === 3) return fn("s, t", "return len(s) == len(t) and sum(map(ord, s)) == sum(map(ord, t))");
  const slot = 'counts[ord(ch) - ord("a")]';
  const declaration = memory < 0 ? pending("estructura para las apariciones.") : ["counts = {}", "counts = [0] * 26", "counts = set()", "count = 0"][memory];
  const insert = memory < 0 ? pending("guardar cada aparición.") : ["counts[ch] = counts.get(ch, 0) + 1", `${slot} += 1`, "counts.add(ch)", "count += 1"][memory];
  const sign = rule === 1 ? "+" : "-";
  const consume: Line = memory < 0 || rule < 0 ? pending("cómo consumir la segunda palabra.")
    : rule === 2 ? [[`if counts.get(ch, 0) <= 0:`, `if ${slot} <= 0:`, "if ch not in counts:", "if count <= 0:"][memory], block("return False")]
    : memory === 0 ? `counts[ch] = counts.get(ch, 0) ${sign} 1`
    : memory === 1 ? `${slot} ${sign}= 1`
    : memory === 2 ? rule === 1 ? "counts.add(ch)" : ["if ch not in counts:", block("return False"), "counts.remove(ch)"]
    : `count ${sign}= 1`;
  const op = rule === 3 ? ">=" : "==";
  const finish = rule < 0 || (memory < 0 && rule !== 2) ? unfinished("condición de aceptación.")
    : rule === 2 ? "return True"
    : [`return all(value ${op} 0 for value in counts.values())`, `return all(value ${op} 0 for value in counts)`, `return len(counts) ${op} 0`, `return count ${op} 0`][memory];
  return fn("s, t",
    rule >= 0 && rule !== 3 && ["if len(s) != len(t):", block("return False")],
    declaration,
    "for ch in s:",
    block(insert),
    "for ch in t:",
    block(consume),
    finish,
  );
}

const generators: Record<LegacyKind, (choices: Choices) => string> = {
  substring, "two-sum": twoSum, brackets, stock, "move-zeroes": moveZeroes, anagram,
};

const args: Record<LegacyKind, string> = {
  substring: "s", "two-sum": "nums, target", brackets: "s", stock: "prices", "move-zeroes": "nums", anagram: "s, t",
};

export function pythonPreview(kind: LegacyKind, choices: Choices): string {
  const effective = activeChoices(kind, choices);
  if (effective[0] < 0) return fn(args[kind], "# Elegí un enfoque para empezar a construir.");
  return generators[kind](effective);
}
