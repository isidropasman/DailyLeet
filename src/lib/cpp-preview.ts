import type { Choices, LegacyKind } from "./challenges";
import { activeChoices, flat, indent, render, type Line } from "./preview-lines";

export const pending = (text: string) => `// Pendiente: ${text}`;
export const unfinished = (text: string) => `throw std::logic_error("Pendiente: ${text}");`;

export function braces(head: string, ...body: Line[]): string[] {
  return [`${head} {`, ...indent(...body), "}"];
}

export type CppFunction = { signature: string; body: Line[]; helpers?: Line[] };

const headers: [RegExp, string][] = [
  [/std::(?:max|min|ranges::|swap)\b/, "algorithm"],
  [/std::array\b/, "array"],
  [/std::abs\b/, "cstdlib"],
  [/std::deque\b/, "deque"],
  [/std::(?:greater|less)\b/, "functional"],
  [/std::ssize\b/, "iterator"],
  [/std::list\b/, "list"],
  [/std::map\b/, "map"],
  [/std::(?:optional|nullopt)\b/, "optional"],
  [/std::priority_queue\b/, "queue"],
  [/std::logic_error\b/, "stdexcept"],
  [/std::string\b/, "string"],
  [/std::string_view\b/, "string_view"],
  [/std::unordered_map\b/, "unordered_map"],
  [/std::unordered_set\b/, "unordered_set"],
  [/std::(?:pair|swap)\b/, "utility"],
  [/std::vector\b/, "vector"],
];

export function translationUnit({ signature, body, helpers = [] }: CppFunction): string {
  const functions = flat(helpers, helpers.length > 0 && "", braces(signature, ...body));
  const source = render(functions);
  const includes = [...new Set(headers.filter(([pattern]) => pattern.test(source)).map(([, header]) => `#include <${header}>`))];
  return render(includes, "", functions);
}

const contains = (chars: string) => `std::string_view("${chars}").find(ch) != std::string_view::npos`;

function substring([approach, memory, rule]: Choices): CppFunction {
  const signature = `int solve(${approach === 2 ? "std::string s" : "const std::string& s"})`;
  if (approach === 3) {
    return { signature, body: ["std::unordered_set<char> seen;", braces("for (char ch : s)", "seen.insert(ch);"), "return static_cast<int>(seen.size());"] };
  }
  const start = approach === 1 ? "start" : "left";
  const declaration = memory < 0 ? pending("qué información guardar.") : memory === 0 ? "std::unordered_map<char, int> seen;" : "std::unordered_set<char> seen;";
  const repeat = memory < 2 ? "seen.contains(ch)" : memory === 2 ? `right > ${start} && s[right - 1] == ch` : `right > ${start} && s[${start}] == ch`;
  const record = memory < 0 ? pending("registrar el carácter actual.") : memory === 0 ? "seen[ch] = right;" : "seen.insert(ch);";
  const onRepeat = (action: Line[]): Line => (memory < 0 ? pending("cómo reconocer un repetido.") : rule === 3 ? null : braces(`if (${repeat})`, rule < 0 ? pending(approach === 1 ? "qué hacer con el repetido." : "cómo ajustar la ventana.") : action));
  if (approach === 1) {
    return {
      signature,
      body: [
        "int best = 0;",
        braces("for (int start = 0; start < std::ssize(s); start++)",
          declaration,
          braces("for (int right = start; right < std::ssize(s); right++)",
            "char ch = s[right];",
            onRepeat([rule === 0 ? "break;" : rule === 1 ? "seen.clear();" : "continue;"]),
            record,
            "best = std::max(best, right - start + 1);",
          ),
        ),
        "return best;",
      ],
    };
  }
  const update = rule === 0
    ? memory === 0 ? ["left = std::max(left, seen[ch] + 1);"] : [braces("while (left < right && s[left] != ch)", "seen.erase(s[left]);", "left++;"), "seen.erase(s[left]);", "left++;"]
    : rule === 1 ? ["left = right + 1;", "seen.clear();"] : ["seen.erase(s[left]);", "left++;"];
  return {
    signature,
    body: [
      approach === 2 && "std::ranges::sort(s);",
      "int left = 0;",
      "int best = 0;",
      declaration,
      braces("for (int right = 0; right < std::ssize(s); right++)",
        "char ch = s[right];",
        onRepeat(update),
        record,
        "best = std::max(best, right - left + 1);",
      ),
      "return best;",
    ],
  };
}

function twoSum([approach, memory, rule]: Choices): CppFunction {
  const signature = "std::vector<int> solve(const std::vector<int>& nums, int target)";
  if (approach === 1 || approach === 2) {
    return {
      signature,
      body: [
        braces("for (int i = 0; i < std::ssize(nums); i++)",
          braces(`for (int j = i + 1; ${approach === 1 ? "j < std::ssize(nums)" : "j < std::ssize(nums) && j < i + 2"}; j++)`,
            "if (nums[i] + nums[j] == target) return {i, j};",
          ),
        ),
        "return {};",
      ],
    };
  }
  if (approach === 3) {
    return {
      signature,
      body: [
        "int left = 0;",
        "int right = static_cast<int>(nums.size()) - 1;",
        braces("while (left < right)",
          "int sum = nums[left] + nums[right];",
          "if (sum == target) return {left, right};",
          "if (sum < target) left++;",
          "else right--;",
        ),
        "return {};",
      ],
    };
  }
  const insert = memory < 0 ? [pending("guardar el valor actual.")] : memory === 0 ? ["seen[value] = i;"] : memory === 1 ? ["seen.emplace_back(value, i);"] : memory === 2 ? ["seen.clear();", "seen[value] = i;"] : ["seen[value] = value;"];
  const after = rule === 0 ? insert : rule === 2 ? braces("if (value > 0)", insert) : rule === 3 ? braces("if (value != complement)", insert) : null;
  const lookup = memory === 1 ? "std::ranges::find(seen, complement, &std::pair<int, int>::first)" : "seen.find(complement)";
  return {
    signature,
    body: [
      memory < 0 ? pending("estructura para recordar valores.") : memory === 1 ? "std::vector<std::pair<int, int>> seen;" : "std::unordered_map<int, int> seen;",
      braces("for (int i = 0; i < std::ssize(nums); i++)",
        "int value = nums[i];",
        "int complement = target - value;",
        rule === 1 && insert,
        rule < 0 && pending("cuándo registrar el valor actual."),
        memory < 0 ? pending("buscar el complemento en la estructura.") : `if (auto previous = ${lookup}; previous != seen.end()) return {previous->second, i};`,
        after,
      ),
      "return {};",
    ],
  };
}

const openingFor = braces("std::optional<char> openingFor(char closing)",
  braces("switch (closing)",
    "case ')': return '(';",
    "case ']': return '[';",
    "case '}': return '{';",
    "default: return std::nullopt;",
  ),
);

const removeAll = braces("std::string removeAll(std::string text, const std::string& pair)",
  braces("for (auto at = text.find(pair); at != std::string::npos; at = text.find(pair, at))", "text.erase(at, pair.size());"),
  "return text;",
);

function brackets([approach, memory, rule]: Choices): CppFunction {
  const signature = "bool solve(const std::string& s)";
  const parity = "return s.size() % 2 == 0;";
  if (approach === 3) {
    return {
      signature,
      helpers: [openingFor],
      body: [
        braces("for (int i = 0; i < std::ssize(s) / 2; i++)",
          "auto other = std::ssize(s) - 1 - i;",
          "if (openingFor(s[other]) != s[i]) return false;",
        ),
        parity,
      ],
    };
  }
  if (approach === 1) {
    return {
      signature,
      helpers: [removeAll],
      body: [
        "std::string remaining = s;",
        "std::string previous;",
        "do {",
        indent("previous = remaining;", 'remaining = removeAll(removeAll(removeAll(remaining, "()"), "[]"), "{}");'),
        "} while (remaining != previous);",
        rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : rule === 2 ? 'return remaining.find_first_of(")]}") == std::string::npos;' : "return remaining.empty();",
      ],
    };
  }
  if (approach === 2) {
    return {
      signature,
      body: [
        "int balance = 0;",
        braces("for (char ch : s)", `balance += ${contains("([{<")} ? 1 : -1;`),
        rule < 0 ? unfinished("condición para aceptar el resultado.") : rule === 3 ? parity : "return balance == 0;",
      ],
    };
  }
  const end = memory === 1 ? "front" : "back";
  const close = memory < 0
    ? [pending("recuperar la apertura correspondiente.")]
    : rule === 1 || rule === 3 ? [`if (!pending.empty()) pending.pop_${end}();`]
    : [
      "std::optional<char> opening;",
      braces("if (!pending.empty())", `opening = pending.${end}();`, `pending.pop_${end}();`),
      rule < 0 ? pending("validar el cierre.") : "if (opening != openingFor(ch)) return false;",
    ];
  const finish = rule < 0 ? unfinished("condición final de validez.") : rule === 2 ? "return true;" : rule === 3 ? parity : memory < 0 ? unfinished("condición final de validez.") : "return pending.empty();";
  return {
    signature,
    helpers: memory >= 0 && (rule === 0 || rule === 2) ? [openingFor] : [],
    body: [
      memory < 0 ? pending("estructura para las aperturas.") : memory === 1 ? "std::deque<char> pending;" : "std::vector<char> pending;",
      braces("for (char ch : s)",
        `if (${contains("([{")}) {`,
        indent(memory < 0 ? pending("guardar la apertura.") : memory === 2 ? "if (std::ranges::find(pending, ch) == pending.end()) pending.push_back(ch);" : memory === 3 ? ["pending.clear();", "pending.push_back(ch);"] : "pending.push_back(ch);"),
        "} else {",
        indent(close),
        "}",
      ),
      finish,
    ],
  };
}

function stock([approach, memory, rule]: Choices): CppFunction {
  const signature = "int solve(const std::vector<int>& prices)";
  if (approach === 1) {
    return {
      signature,
      body: [
        "int best = 0;",
        braces("for (int buy = 0; buy < std::ssize(prices); buy++)",
          braces("for (int sell = buy + 1; sell < std::ssize(prices); sell++)", "best = std::max(best, prices[sell] - prices[buy]);"),
        ),
        "return best;",
      ],
    };
  }
  if (approach === 2) return { signature, body: ["std::vector<int> sorted = prices;", "std::ranges::sort(sorted);", "return sorted.empty() ? 0 : sorted.back() - sorted.front();"] };
  if (approach === 3) {
    return { signature, body: ["int best = 0;", braces("for (int i = 1; i < std::ssize(prices); i++)", "best = std::max(best, prices[i] - prices[i - 1]);"), "return best;"] };
  }
  return {
    signature,
    body: [
      "int best = 0;",
      "int buy = prices.empty() ? 0 : prices[0];",
      braces("for (int i = 1; i < std::ssize(prices); i++)",
        "int gain = prices[i] - buy;",
        rule < 0 ? pending("actualizar la ganancia.") : ["best = std::max(best, gain);", "best = std::max(0, gain);", "best = std::max(best, std::abs(gain));", "best = std::min(best, gain);"][rule],
        memory < 0 ? pending("actualizar el precio de compra.") : [["buy = std::min(buy, prices[i]);"], ["buy = std::max(buy, prices[i]);"], ["buy = prices[i];"], []][memory],
      ),
      "return best;",
    ],
  };
}

function moveZeroes([approach, memory, rule]: Choices): CppFunction {
  if (approach === 2) {
    return {
      signature: "std::vector<int> solve(const std::vector<int>& nums)",
      body: [
        "std::vector<int> result;",
        braces("for (int value : nums)", "if (value != 0) result.push_back(value);"),
        "while (result.size() < nums.size()) result.push_back(0);",
        "return result;",
      ],
    };
  }
  // Starting the write pointer at 1 or at the end lets it run past the vector; JS grows the array there,
  // and only the end start combined with "advance every turn" can skip slots and leave holes.
  const grows = memory === 1 || memory === 2;
  const element = memory === 2 && rule === 1 && approach !== 3 ? "std::optional<int>" : "int";
  const signature = `std::vector<${element}>& solve(std::vector<${element}>& nums)`;
  if (approach === 3) return { signature, body: ["std::ranges::sort(nums);", "return nums;"] };
  const loop = `for (int read = 0; read < ${rule === 3 ? "length - 1" : "length"}; read++)`;
  if (memory < 0) return { signature, body: ["int length = static_cast<int>(nums.size());", pending("dónde empezar a escribir."), braces(loop, pending("cuándo conservar el valor y avanzar.")), "return nums;"] };
  const assign = (index: string, value: string) => (grows ? `put(nums, ${index}, ${value});` : `nums[${index}] = ${value};`);
  const change = approach === 0
    ? [assign("write", "nums[read]")]
    : grows ? [`${element} value = write < std::ssize(nums) ? nums[write] : 0;`, assign("write", "nums[read]"), "nums[read] = value;"] : ["std::swap(nums[write], nums[read]);"];
  return {
    signature,
    helpers: grows ? [
      braces(`void put(std::vector<${element}>& nums, int index, ${element} value)`,
        "// Los arrays de JavaScript crecen al asignar más allá del final (dejando huecos) e ignoran índices negativos.",
        "if (index < 0) return;",
        "if (index >= std::ssize(nums)) nums.resize(index + 1);",
        "nums[index] = value;",
      ),
    ] : [],
    body: [
      "int length = static_cast<int>(nums.size());",
      `int write = ${memory === 1 ? "1" : memory === 2 ? "length - 1" : "0"};`,
      braces(loop,
        memory === 3 && "write = 0;",
        rule < 0 ? pending("cuándo conservar el valor y avanzar.") : [braces(`if (nums[read] ${rule === 2 ? ">=" : "!="} 0)`, change, rule !== 1 && "write++;"), rule === 1 && "write++;"],
      ),
      approach === 0 && `while (write < length) ${assign("write++", "0")}`,
      "return nums;",
    ],
  };
}

function anagram([approach, memory, rule]: Choices): CppFunction {
  const signature = "bool solve(const std::string& s, const std::string& t)";
  if (approach === 1) {
    return { signature, body: ["std::string first = s;", "std::string second = t;", "std::ranges::sort(first);", "std::ranges::sort(second);", "return first == second;"] };
  }
  if (approach === 2) {
    return {
      signature,
      body: ["std::unordered_set<char> first(s.begin(), s.end());", "std::unordered_set<char> second(t.begin(), t.end());", "return s.size() == t.size() && first == second;"],
    };
  }
  if (approach === 3) {
    return {
      signature,
      body: ["int first = 0;", "int second = 0;", braces("for (char ch : s)", "first += ch;"), braces("for (char ch : t)", "second += ch;"), "return s.size() == t.size() && first == second;"],
    };
  }
  const slot = "counts[ch - 'a']";
  const declaration = memory < 0 ? pending("estructura para las apariciones.") : ["std::unordered_map<char, int> counts;", "std::array<int, 26> counts{};", "std::unordered_set<char> counts;", "int count = 0;"][memory];
  const insert = memory < 0 ? pending("guardar cada aparición.") : ["counts[ch]++;", `${slot}++;`, "counts.insert(ch);", "count++;"][memory];
  const step = rule === 1 ? "++" : "--";
  const consume: Line = memory < 0 || rule < 0 ? pending("cómo consumir la segunda palabra.")
    : rule === 2 ? ["if (counts[ch] <= 0) return false;", `if (${slot} <= 0) return false;`, "if (!counts.contains(ch)) return false;", "if (count <= 0) return false;"][memory]
    : memory === 0 ? `counts[ch]${step};`
    : memory === 1 ? `${slot}${step};`
    : memory === 2 ? rule === 1 ? "counts.insert(ch);" : "if (counts.erase(ch) == 0) return false;"
    : `count${step};`;
  const op = rule === 3 ? ">=" : "==";
  const finish = rule < 0 || (memory < 0 && rule !== 2) ? unfinished("condición de aceptación.")
    : rule === 2 ? "return true;"
    : [
      `return std::ranges::all_of(counts, [](const auto& entry) { return entry.second ${op} 0; });`,
      `return std::ranges::all_of(counts, [](int value) { return value ${op} 0; });`,
      `return std::ssize(counts) ${op} 0;`,
      `return count ${op} 0;`,
    ][memory];
  return {
    signature,
    body: [
      rule >= 0 && rule !== 3 && "if (s.size() != t.size()) return false;",
      declaration,
      braces("for (char ch : s)", insert),
      braces("for (char ch : t)", consume),
      finish,
    ],
  };
}

const generators: Record<LegacyKind, (choices: Choices) => CppFunction> = {
  substring, "two-sum": twoSum, brackets, stock, "move-zeroes": moveZeroes, anagram,
};

const placeholderSignatures: Record<LegacyKind, string> = {
  substring: "int solve(const std::string& s)",
  "two-sum": "std::vector<int> solve(const std::vector<int>& nums, int target)",
  brackets: "bool solve(const std::string& s)",
  stock: "int solve(const std::vector<int>& prices)",
  "move-zeroes": "std::vector<int>& solve(std::vector<int>& nums)",
  anagram: "bool solve(const std::string& s, const std::string& t)",
};

export function cppPreview(kind: LegacyKind, choices: Choices): string {
  const effective = activeChoices(kind, choices);
  if (effective[0] < 0) return translationUnit({ signature: placeholderSignatures[kind], body: ["// Elegí un enfoque para empezar a construir.", unfinished("elegí un enfoque.")] });
  return translationUnit(generators[kind](effective));
}
