import type { Choices, LegacyKind } from "./challenges";
import { activeChoices, flat, indent, render, type Line } from "./preview-lines";

export const pending = (text: string) => `// Pendiente: ${text}`;
export const unfinished = (text: string) => `throw new UnsupportedOperationException("Pendiente: ${text}");`;

export function braces(head: string, ...body: Line[]): string[] {
  return [`${head} {`, ...indent(...body), "}"];
}

export type Method = { body: Line[]; helpers?: Line[] };

const signatures: Record<LegacyKind, string> = {
  substring: "int solve(String s)",
  "two-sum": "int[] solve(int[] nums, int target)",
  brackets: "boolean solve(String s)",
  stock: "int solve(int[] prices)",
  "move-zeroes": "List<Integer> solve(List<Integer> nums)",
  anagram: "boolean solve(String s, String t)",
};

const libraries = ["ArrayDeque", "ArrayList", "Arrays", "Collections", "Deque", "HashMap", "HashSet", "LinkedHashMap", "List", "Map", "Objects", "PriorityQueue", "Set", "TreeMap"];

function solutionClass(kind: LegacyKind, method: Method): string {
  return javaClass(signatures[kind], method);
}

export function javaClass(signature: string, { body, helpers = [] }: Method): string {
  const members = flat(braces(`public static ${signature}`, ...body), helpers.length > 0 && ["", ...flat(...helpers)]);
  const source = render(members);
  const imports = libraries.filter(name => new RegExp(`\\b${name}\\b`).test(source)).map(name => `import java.util.${name};`);
  return render(imports, imports.length > 0 && "", braces("class Solution", members));
}

function substring([approach, memory, rule]: Choices): Method {
  if (approach === 3) {
    return { body: ["Set<Character> seen = new HashSet<>();", braces("for (int right = 0; right < s.length(); right++)", "seen.add(s.charAt(right));"), "return seen.size();"] };
  }
  const start = approach === 1 ? "start" : "left";
  const declaration = memory < 0 ? pending("qué información guardar.") : memory === 0 ? "Map<Character, Integer> seen = new HashMap<>();" : "Set<Character> seen = new HashSet<>();";
  const repeat = memory === 0 ? "seen.containsKey(ch)" : memory === 1 ? "seen.contains(ch)" : memory === 2 ? `right > ${start} && s.charAt(right - 1) == ch` : `right > ${start} && s.charAt(${start}) == ch`;
  const record = memory < 0 ? pending("registrar el carácter actual.") : memory === 0 ? "seen.put(ch, right);" : "seen.add(ch);";
  const onRepeat = (action: Line[]): Line => (memory < 0 ? pending("cómo reconocer un repetido.") : rule === 3 ? null : braces(`if (${repeat})`, rule < 0 ? pending(approach === 1 ? "qué hacer con el repetido." : "cómo ajustar la ventana.") : action));
  if (approach === 1) {
    return {
      body: [
        "int best = 0;",
        braces("for (int start = 0; start < s.length(); start++)",
          declaration,
          braces("for (int right = start; right < s.length(); right++)",
            "char ch = s.charAt(right);",
            onRepeat([rule === 0 ? "break;" : rule === 1 ? "seen.clear();" : "continue;"]),
            record,
            "best = Math.max(best, right - start + 1);",
          ),
        ),
        "return best;",
      ],
    };
  }
  const update = rule === 0
    ? memory === 0 ? ["left = Math.max(left, seen.get(ch) + 1);"] : [braces("while (left < right && s.charAt(left) != ch)", "seen.remove(s.charAt(left));", "left++;"), "seen.remove(s.charAt(left));", "left++;"]
    : rule === 1 ? ["left = right + 1;", "seen.clear();"] : ["seen.remove(s.charAt(left));", "left++;"];
  return {
    body: [
      approach === 2 && ["char[] letters = s.toCharArray();", "Arrays.sort(letters);", "s = new String(letters);"],
      "int left = 0;",
      "int best = 0;",
      declaration,
      braces("for (int right = 0; right < s.length(); right++)",
        "char ch = s.charAt(right);",
        onRepeat(update),
        record,
        "best = Math.max(best, right - left + 1);",
      ),
      "return best;",
    ],
  };
}

function twoSum([approach, memory, rule]: Choices): Method {
  if (approach === 1 || approach === 2) {
    return {
      body: [
        braces("for (int i = 0; i < nums.length; i++)",
          braces(`for (int j = i + 1; j < ${approach === 1 ? "nums.length" : "Math.min(nums.length, i + 2)"}; j++)`,
            "if (nums[i] + nums[j] == target) return new int[] {i, j};",
          ),
        ),
        "return new int[0];",
      ],
    };
  }
  if (approach === 3) {
    return {
      body: [
        "int left = 0;",
        "int right = nums.length - 1;",
        braces("while (left < right)",
          "int sum = nums[left] + nums[right];",
          "if (sum == target) return new int[] {left, right};",
          "if (sum < target) left++;",
          "else right--;",
        ),
        "return new int[0];",
      ],
    };
  }
  const insert = memory < 0 ? [pending("guardar el valor actual.")] : memory === 0 ? ["seen.put(value, i);"] : memory === 1 ? ["seen.add(new int[] {value, i});"] : memory === 2 ? ["seen.clear();", "seen.put(value, i);"] : ["seen.put(value, value);"];
  const after = rule === 0 ? insert : rule === 2 ? braces("if (value > 0)", insert) : rule === 3 ? braces("if (value != complement)", insert) : null;
  const lookup = memory === 1
    ? "Integer previous = seen.stream().filter(pair -> pair[0] == complement).map(pair -> pair[1]).findFirst().orElse(null);"
    : "Integer previous = seen.get(complement);";
  return {
    body: [
      memory < 0 ? pending("estructura para recordar valores.") : memory === 1 ? "List<int[]> seen = new ArrayList<>();" : "Map<Integer, Integer> seen = new HashMap<>();",
      braces("for (int i = 0; i < nums.length; i++)",
        "int value = nums[i];",
        "int complement = target - value;",
        rule === 1 && insert,
        rule < 0 && pending("cuándo registrar el valor actual."),
        memory < 0 ? pending("buscar el complemento en la estructura.") : [lookup, "if (previous != null) return new int[] {previous, i};"],
        after,
      ),
      "return new int[0];",
    ],
  };
}

function brackets([approach, memory, rule]: Choices): Method {
  const pairs = "Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');";
  const parity = "return s.length() % 2 == 0;";
  if (approach === 3) {
    return {
      body: [
        pairs,
        braces("for (int i = 0; i < s.length() / 2; i++)",
          "int other = s.length() - 1 - i;",
          "if (!Objects.equals(pairs.get(s.charAt(other)), s.charAt(i))) return false;",
        ),
        parity,
      ],
    };
  }
  if (approach === 1) {
    return {
      body: [
        "String remaining = s;",
        "String previous;",
        "do {",
        indent("previous = remaining;", 'remaining = remaining.replace("()", "").replace("[]", "").replace("{}", "");'),
        "} while (!remaining.equals(previous));",
        rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : rule === 2 ? 'return remaining.chars().noneMatch(ch -> ")]}".indexOf(ch) >= 0);' : "return remaining.isEmpty();",
      ],
    };
  }
  if (approach === 2) {
    return {
      body: [
        "int balance = 0;",
        braces("for (char ch : s.toCharArray())", 'balance += "([{<".indexOf(ch) >= 0 ? 1 : -1;'),
        rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : "return balance == 0;",
      ],
    };
  }
  const take = memory === 1 ? "pending.pollFirst()" : "pending.pollLast()";
  const close = memory < 0
    ? [pending("recuperar la apertura correspondiente.")]
    : rule < 0 ? [`Character opening = ${take};`, pending("validar el cierre.")]
    : rule === 1 || rule === 3 ? [`${take};`]
    : [`Character opening = ${take};`, "if (!Objects.equals(opening, pairs.get(ch))) return false;"];
  const finish = rule < 0 ? unfinished("condición final de validez.") : rule === 2 ? "return true;" : rule === 3 ? parity : memory < 0 ? unfinished("condición final de validez.") : "return pending.isEmpty();";
  return {
    body: [
      memory < 0 ? pending("estructura para las aperturas.") : "Deque<Character> pending = new ArrayDeque<>();",
      pairs,
      braces("for (char ch : s.toCharArray())",
        'if ("([{".indexOf(ch) >= 0) {',
        indent(memory < 0 ? pending("guardar la apertura.") : memory === 2 ? "if (!pending.contains(ch)) pending.addLast(ch);" : memory === 3 ? ["pending.clear();", "pending.addLast(ch);"] : "pending.addLast(ch);"),
        "} else {",
        indent(close),
        "}",
      ),
      finish,
    ],
  };
}

function stock([approach, memory, rule]: Choices): Method {
  if (approach === 1) {
    return {
      body: [
        "int best = 0;",
        braces("for (int buy = 0; buy < prices.length; buy++)",
          braces("for (int sell = buy + 1; sell < prices.length; sell++)", "best = Math.max(best, prices[sell] - prices[buy]);"),
        ),
        "return best;",
      ],
    };
  }
  if (approach === 2) return { body: ["int[] sorted = prices.clone();", "Arrays.sort(sorted);", "return sorted.length > 0 ? sorted[sorted.length - 1] - sorted[0] : 0;"] };
  if (approach === 3) {
    return { body: ["int best = 0;", braces("for (int i = 1; i < prices.length; i++)", "best = Math.max(best, prices[i] - prices[i - 1]);"), "return best;"] };
  }
  return {
    body: [
      "int best = 0;",
      "int buy = prices.length > 0 ? prices[0] : 0;",
      braces("for (int i = 1; i < prices.length; i++)",
        "int gain = prices[i] - buy;",
        rule < 0 ? pending("actualizar la ganancia.") : ["best = Math.max(best, gain);", "best = Math.max(0, gain);", "best = Math.max(best, Math.abs(gain));", "best = Math.min(best, gain);"][rule],
        memory < 0 ? pending("actualizar el precio de compra.") : [["buy = Math.min(buy, prices[i]);"], ["buy = Math.max(buy, prices[i]);"], ["buy = prices[i];"], []][memory],
      ),
      "return best;",
    ],
  };
}

function moveZeroes([approach, memory, rule]: Choices): Method {
  if (approach === 2) {
    return {
      body: [
        "List<Integer> result = new ArrayList<>();",
        braces("for (int value : nums)", "if (value != 0) result.add(value);"),
        "while (result.size() < nums.size()) result.add(0);",
        "return result;",
      ],
    };
  }
  if (approach === 3) return { body: ["Collections.sort(nums);", "return nums;"] };
  const loop = `for (int read = 0; read < ${rule === 3 ? "length - 1" : "length"}; read++)`;
  if (memory < 0) return { body: ["int length = nums.size();", pending("dónde empezar a escribir."), braces(loop, pending("cuándo conservar el valor y avanzar.")), "return nums;"] };
  // Starting the write pointer at 1 or at the end lets it run past the list; JS grows the array there.
  const grows = memory === 1 || memory === 2;
  const assign = (index: string, value: string) => (grows ? `put(nums, ${index}, ${value});` : `nums.set(${index}, ${value});`);
  const change = approach === 0
    ? [assign("write", "nums.get(read)")]
    : grows ? ["Integer value = write < nums.size() ? nums.get(write) : 0;", assign("write", "nums.get(read)"), "nums.set(read, value);"] : ["Collections.swap(nums, write, read);"];
  return {
    body: [
      "int length = nums.size();",
      `int write = ${memory === 1 ? "1" : memory === 2 ? "length - 1" : "0"};`,
      braces(loop,
        memory === 3 && "write = 0;",
        rule < 0 ? pending("cuándo conservar el valor y avanzar.") : [braces(`if (nums.get(read) ${rule === 2 ? ">=" : "!="} 0)`, change, rule !== 1 && "write++;"), rule === 1 && "write++;"],
      ),
      approach === 0 && braces("while (write < length)", assign("write++", "0")),
      "return nums;",
    ],
    helpers: grows ? [
      braces("private static void put(List<Integer> nums, int index, Integer value)",
        "// Los arrays de JavaScript crecen al asignar más allá del final (dejando huecos) e ignoran índices negativos.",
        "if (index < 0) return;",
        "while (nums.size() <= index) nums.add(null);",
        "nums.set(index, value);",
      ),
    ] : [],
  };
}

function anagram([approach, memory, rule]: Choices): Method {
  if (approach === 1) {
    return { body: ["char[] first = s.toCharArray();", "char[] second = t.toCharArray();", "Arrays.sort(first);", "Arrays.sort(second);", "return Arrays.equals(first, second);"] };
  }
  if (approach === 2) {
    return {
      body: [
        "Set<Character> first = new HashSet<>();",
        "Set<Character> second = new HashSet<>();",
        braces("for (char ch : s.toCharArray())", "first.add(ch);"),
        braces("for (char ch : t.toCharArray())", "second.add(ch);"),
        "return s.length() == t.length() && first.equals(second);",
      ],
    };
  }
  if (approach === 3) {
    return {
      body: [
        "int first = 0;",
        "int second = 0;",
        braces("for (char ch : s.toCharArray())", "first += ch;"),
        braces("for (char ch : t.toCharArray())", "second += ch;"),
        "return s.length() == t.length() && first == second;",
      ],
    };
  }
  const slot = "counts[ch - 'a']";
  const declaration = memory < 0 ? pending("estructura para las apariciones.") : ["Map<Character, Integer> counts = new HashMap<>();", "int[] counts = new int[26];", "Set<Character> counts = new HashSet<>();", "int count = 0;"][memory];
  const insert = memory < 0 ? pending("guardar cada aparición.") : ["counts.put(ch, counts.getOrDefault(ch, 0) + 1);", `${slot}++;`, "counts.add(ch);", "count++;"][memory];
  const step = rule === 1 ? "++" : "--";
  const consume: Line = memory < 0 || rule < 0 ? pending("cómo consumir la segunda palabra.")
    : rule === 2 ? ["if (counts.getOrDefault(ch, 0) <= 0) return false;", `if (${slot} <= 0) return false;`, "if (!counts.contains(ch)) return false;", "if (count <= 0) return false;"][memory]
    : memory === 0 ? `counts.put(ch, counts.getOrDefault(ch, 0) ${rule === 1 ? "+" : "-"} 1);`
    : memory === 1 ? `${slot}${step};`
    : memory === 2 ? rule === 1 ? "counts.add(ch);" : "if (!counts.remove(ch)) return false;"
    : `count${step};`;
  const op = rule === 3 ? ">=" : "==";
  const finish = rule < 0 || (memory < 0 && rule !== 2) ? unfinished("condición de aceptación.")
    : rule === 2 ? "return true;"
    : [`return counts.values().stream().allMatch(value -> value ${op} 0);`, `return Arrays.stream(counts).allMatch(value -> value ${op} 0);`, `return counts.size() ${op} 0;`, `return count ${op} 0;`][memory];
  return {
    body: [
      rule >= 0 && rule !== 3 && "if (s.length() != t.length()) return false;",
      declaration,
      braces("for (char ch : s.toCharArray())", insert),
      braces("for (char ch : t.toCharArray())", consume),
      finish,
    ],
  };
}

const generators: Record<LegacyKind, (choices: Choices) => Method> = {
  substring, "two-sum": twoSum, brackets, stock, "move-zeroes": moveZeroes, anagram,
};

export function javaPreview(kind: LegacyKind, choices: Choices): string {
  const effective = activeChoices(kind, choices);
  if (effective[0] < 0) return solutionClass(kind, { body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  return solutionClass(kind, generators[kind](effective));
}
