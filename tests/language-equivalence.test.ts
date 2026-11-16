import { test, type TestContext } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { challenges, isModuleKind, type Choices, type Kind } from "../src/lib/challenges";
import { cases, instrument, run, runSource, STEP_BUDGET, type Case } from "../src/lib/engine";
import { previewInLanguage, type PreviewLanguage } from "../src/lib/language-preview";
import { activeChoices } from "../src/lib/preview-lines";

type Program = { id: string; choices: Choices; source: string };
type Arg = string | number | number[];
type Toolchain = { ok: true; commands: Record<string, string> } | { ok: false; reason: string };
type Language = {
  id: Exclude<PreviewLanguage, "typescript" | "javascript">;
  toolchain: () => Toolchain;
  // Returns one stdout line per (program, case): "<programId> <caseIndex>\t<json>\t<in-place|copy>", "...\terror" or "...\ttle".
  // Sources are instrumented first: every loop body calls a step counter that aborts with "tle" after STEP_BUDGET.
  execute: (dir: string, commands: Record<string, string>, programs: Program[], args: Arg[][]) => string;
  // Compiles/parses previews without running them; throws with the compiler output on failure.
  check: (dir: string, commands: Record<string, string>, programs: Program[]) => void;
};

const TIMEOUT_MS = 300_000;

function runTool(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw new Error(`${command} ${args.join(" ")} failed: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? result.signal}\n${result.stdout}\n${result.stderr}`.slice(0, 8000));
  return result.stdout;
}

function works(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 30_000 });
  return !result.error && result.status === 0;
}

function allChoices(): Choices[] {
  const combos: Choices[] = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) combos.push([a, b, c]);
  return combos;
}

function partialChoices(): Choices[] {
  const combos: Choices[] = [];
  for (let a = -1; a < 4; a++) for (let b = -1; b < 4; b++) for (let c = -1; c < 4; c++) if (a < 0 || b < 0 || c < 0) combos.push([a, b, c]);
  return combos;
}

function caseArgs(item: Case): Arg[] {
  return [item.input, ...(item.target === undefined ? [] : [item.target]), ...(item.other === undefined ? [] : [item.other])];
}

// Contract: a JS combo that throws must also throw in the other language ("error"), and a JS combo that exceeds
// the step budget must exceed it there too ("tle"). Every language counts one step per loop iteration.
function jsOutcome(kind: Kind, choices: Choices, item: Case): string {
  const result = run(kind, choices, item.input, item.target, item.other);
  if (!result.ok) return result.error === "TLE" ? "tle" : "error";
  return `${JSON.stringify(result.output)}\t${result.inPlace ? "in-place" : "copy"}`;
}

// 2 and 2.0 are the same number: compare parsed JSON so float formatting differences between languages do not count.
function normalize(outcome: string): string {
  const [json, shape] = outcome.split("\t");
  if (shape === undefined) return outcome;
  try {
    return `${JSON.stringify(JSON.parse(json))}\t${shape}`;
  } catch {
    return outcome;
  }
}

function instrumentPython(source: string): string {
  const lines = source.split("\n");
  return lines.flatMap((line, index) => {
    if (!/^\s*(?:for|while)\b.*:\s*$/.test(line)) return [line];
    const body = lines.slice(index + 1).find(next => next.trim() !== "") ?? "";
    return [line, `${/^\s*/.exec(body)?.[0] ?? ""}tick()`];
  }).join("\n");
}

const instrumentBraced = (call: string) => (source: string) => instrument(source).replaceAll(" tick();", ` ${call};`);

function signatureParams(source: string, pattern: RegExp): string[] {
  const match = pattern.exec(source);
  if (!match) throw new Error(`Could not find solve(...) signature in:\n${source}`);
  return match[1].split(",").map(param => param.trim()).filter(Boolean);
}

const python: Language = {
  id: "python",
  toolchain: () => {
    for (const candidate of ["/opt/homebrew/bin/python3", "python3"]) if (works(candidate, ["--version"])) return { ok: true, commands: { python: candidate } };
    return { ok: false, reason: "python3 not found (tried /opt/homebrew/bin/python3 and PATH)" };
  },
  execute: (dir, { python: bin }, programs, args) => {
    writeFileSync(join(dir, "programs.json"), JSON.stringify({ programs: programs.map(({ id, source }) => [id, instrumentPython(source)]), cases: args }));
    writeFileSync(join(dir, "driver.py"), [
      "import copy, json, sys",
      `BUDGET = ${STEP_BUDGET}`,
      "class TimeLimit(BaseException): pass",
      "steps = 0",
      "def tick():",
      "    global steps",
      "    steps += 1",
      "    if steps > BUDGET: raise TimeLimit()",
      "data = json.load(open(sys.argv[1]))",
      "for program_id, source in data['programs']:",
      "    namespace = {'tick': tick}",
      "    exec(compile(source, program_id, 'exec'), namespace)",
      "    solve = namespace['solve']",
      "    for index, case in enumerate(data['cases']):",
      "        args = copy.deepcopy(case)",
      "        label = f'{program_id} {index}'",
      "        steps = 0",
      "        try:",
      "            result = solve(*args)",
      "        except TimeLimit:",
      "            print(f'{label}\\ttle')",
      "            continue",
      "        except Exception:",
      "            print(f'{label}\\terror')",
      "            continue",
      "        shape = 'in-place' if isinstance(result, list) and result is args[0] else 'copy'",
      "        print(f\"{label}\\t{json.dumps(result, separators=(',', ':'))}\\t{shape}\")",
    ].join("\n"));
    return runTool(bin, ["-I", "driver.py", "programs.json"], dir);
  },
  check: (dir, { python: bin }, programs) => {
    writeFileSync(join(dir, "partials.json"), JSON.stringify(programs.map(({ id, source }) => [id, source])));
    writeFileSync(join(dir, "check.py"), [
      "import json, sys",
      "for program_id, source in json.load(open(sys.argv[1])):",
      "    compile(source, program_id, 'exec')",
    ].join("\n"));
    runTool(bin, ["-I", "check.py", "partials.json"], dir);
  },
};

function javaLiteral(type: string, value: Arg): string {
  if (type === "String" && typeof value === "string") return JSON.stringify(value);
  if (type === "int" && typeof value === "number") return String(value);
  if (type === "int[]" && Array.isArray(value)) return `new int[] {${value.join(", ")}}`;
  if (type === "List<Integer>" && Array.isArray(value)) return `new ArrayList<>(List.of(${value.join(", ")}))`;
  throw new Error(`Java harness does not know how to pass ${JSON.stringify(value)} as ${type}`);
}

function javaUnit(programs: Program[], extra: string[]): string {
  const imports = new Set<string>(["import java.util.ArrayList;", "import java.util.List;", "import java.util.function.Supplier;"]);
  const classes = programs.map(({ id, source }) => {
    for (const line of source.split("\n")) if (line.startsWith("import ")) imports.add(line);
    if (!/^class Solution \{$/m.test(source)) throw new Error(`Java preview must declare "class Solution {":\n${source}`);
    return source.split("\n").filter(line => !line.startsWith("import ")).join("\n").replace(/^class Solution \{$/m, `class Solution_${id} {`);
  });
  return [...imports, "", ...classes, "", ...extra].join("\n");
}

function javaCommands(): Toolchain {
  const homes = [process.env.JAVA_HOME, "/opt/homebrew/opt/openjdk"].filter((home): home is string => Boolean(home));
  for (const home of homes) {
    const javac = join(home, "bin", "javac");
    const java = join(home, "bin", "java");
    if (existsSync(javac) && works(javac, ["-version"]) && works(java, ["-version"])) return { ok: true, commands: { javac, java } };
  }
  return { ok: false, reason: `No working JDK found (tried ${homes.join(", ")}); /usr/bin/java is a stub on macOS, install openjdk or set JAVA_HOME` };
}

const java: Language = {
  id: "java",
  toolchain: javaCommands,
  execute: (dir, { javac, java: bin }, programs, args) => {
    const runners = programs.map(({ id, source }) => {
      const params = signatureParams(source, /public static [^\n(]+ solve\(([^)]*)\)/);
      const calls = args.map((caseArgs, index) => {
        if (caseArgs.length !== params.length) throw new Error(`Java solve takes ${params.length} params but the case has ${caseArgs.length} args`);
        const declarations = params.map((param, position) => {
          const type = param.slice(0, param.lastIndexOf(" "));
          return `        ${type} arg${position} = ${javaLiteral(type, caseArgs[position])};`;
        });
        const names = params.map((_, position) => `arg${position}`).join(", ");
        return ["    {", ...declarations, `        report("${id} ${index}", arg0, () -> Solution_${id}.solve(${names}));`, "    }"].join("\n");
      });
      return `static void run_${id}() {\n${calls.join("\n")}\n}`;
    });
    const main = [
      "class TimeLimit extends RuntimeException {",
      "    private static final long serialVersionUID = 1L;",
      "}",
      "class Budget {",
      "    static long steps = 0;",
      `    static void tick() { if (++steps > ${STEP_BUDGET}L) throw new TimeLimit(); }`,
      "}",
      "public class Main {",
      "static final StringBuilder out = new StringBuilder();",
      "static String quote(String text) { return '\"' + text.replace(\"\\\\\", \"\\\\\\\\\").replace(\"\\\"\", \"\\\\\\\"\") + '\"'; }",
      "static String show(Object value) {",
      "    if (value instanceof String text) return quote(text);",
      "    if (value instanceof double[] array) { StringBuilder text = new StringBuilder(\"[\"); for (int i = 0; i < array.length; i++) text.append(i == 0 ? \"\" : \",\").append(array[i]); return text.append(\"]\").toString(); }",
      "    if (value instanceof Double number) return number.toString();",
      "    if (value instanceof int[] array) { StringBuilder text = new StringBuilder(\"[\"); for (int i = 0; i < array.length; i++) text.append(i == 0 ? \"\" : \",\").append(array[i]); return text.append(\"]\").toString(); }",
      "    if (value instanceof List<?> list) { StringBuilder text = new StringBuilder(\"[\"); for (int i = 0; i < list.size(); i++) text.append(i == 0 ? \"\" : \",\").append(list.get(i) == null ? \"null\" : list.get(i)); return text.append(\"]\").toString(); }",
      "    if (value instanceof Integer || value instanceof Boolean) return value.toString();",
      "    throw new IllegalStateException(\"Unsupported result type \" + value);",
      "}",
      "static void report(String label, Object input, Supplier<Object> call) {",
      "    Object result;",
      "    Budget.steps = 0;",
      "    try { result = call.get(); } catch (TimeLimit error) { out.append(label).append(\"\\ttle\\n\"); return; } catch (RuntimeException | StackOverflowError error) { out.append(label).append(\"\\terror\\n\"); return; }",
      "    out.append(label).append('\\t').append(show(result)).append('\\t').append(result == input && !(result instanceof String) ? \"in-place\" : \"copy\").append('\\n');",
      "}",
      ...runners,
      "public static void main(String[] args) {",
      ...programs.map(({ id }) => `    run_${id}();`),
      "    System.out.print(out);",
      "}",
      "}",
    ];
    writeFileSync(join(dir, "Main.java"), javaUnit(programs.map(program => ({ ...program, source: instrumentBraced("Budget.tick()")(program.source) })), main));
    runTool(javac, ["-Xlint:all", "-Werror", "-d", "out", "Main.java"], dir);
    return runTool(bin, ["-cp", "out", "Main"], dir);
  },
  check: (dir, { javac }, programs) => {
    writeFileSync(join(dir, "Partials.java"), javaUnit(programs, []));
    runTool(javac, ["-d", "partials", "Partials.java"], dir);
  },
};

function cppValue(type: string, value: Arg): string {
  if (type === "std::string" && typeof value === "string") return `${type}{${JSON.stringify(value)}}`;
  if (type === "int" && typeof value === "number") return String(value);
  if (/^std::vector<(?:int|std::optional<int>)>$/.test(type) && Array.isArray(value)) return `${type}{${value.join(", ")}}`;
  throw new Error(`C++ harness does not know how to pass ${JSON.stringify(value)} as ${type}`);
}

function cppUnit(programs: Program[], extra: string[], prelude: string[] = []): string {
  const includes = new Set<string>(["#include <iostream>", "#include <optional>", "#include <sstream>", "#include <stdexcept>", "#include <string>", "#include <vector>"]);
  const namespaces = programs.map(({ id, source }) => {
    for (const line of source.split("\n")) if (line.startsWith("#include ")) includes.add(line);
    return `namespace combo_${id} {\n${source.split("\n").filter(line => !line.startsWith("#include ")).join("\n")}\n}`;
  });
  return [...includes, "", ...prelude, "", ...namespaces, "", ...extra].join("\n");
}

function cppCommands(): Toolchain {
  for (const candidate of ["clang++", "/usr/bin/clang++"]) if (works(candidate, ["--version"])) return { ok: true, commands: { cxx: candidate } };
  return { ok: false, reason: "clang++ not found on PATH" };
}

const cpp: Language = {
  id: "cpp",
  toolchain: cppCommands,
  execute: (dir, { cxx }, programs, args) => {
    const runners = programs.map(({ id, source }) => {
      const params = signatureParams(source, /^[^\n]*\bsolve\(([^)]*)\) \{$/m);
      const calls = args.map((caseArgs, index) => {
        if (caseArgs.length !== params.length) throw new Error(`C++ solve takes ${params.length} params but the case has ${caseArgs.length} args`);
        const declarations = params.map((param, position) => {
          const type = param.slice(0, param.lastIndexOf(" ")).replace(/^const /, "").replace(/&$/, "");
          return `        ${type} arg${position} = ${cppValue(type, caseArgs[position])};`;
        });
        const names = params.map((_, position) => `arg${position}`).join(", ");
        return ["    {", ...declarations, `        report("${id} ${index}", arg0, [&]() -> decltype(auto) { return combo_${id}::solve(${names}); });`, "    }"].join("\n");
      });
      return `void run_${id}() {\n${calls.join("\n")}\n}`;
    });
    const main = [
      "std::string show(int value) { return std::to_string(value); }",
      "std::string show(double value) { std::ostringstream text; text.precision(17); text << value; return text.str(); }",
      "std::string show(const std::string& value) { std::string text = \"\\\"\"; for (char ch : value) { if (ch == '\"' || ch == '\\\\') text += '\\\\'; text += ch; } return text + '\"'; }",
      "std::string show(const std::vector<double>& values) { std::string text = \"[\"; for (std::size_t i = 0; i < values.size(); i++) text += (i ? \",\" : \"\") + show(values[i]); return text + ']'; }",
      "std::string show(bool value) { return value ? \"true\" : \"false\"; }",
      "std::string show(const std::vector<int>& values) { std::ostringstream text; text << '['; for (std::size_t i = 0; i < values.size(); i++) text << (i ? \",\" : \"\") << values[i]; text << ']'; return text.str(); }",
      "std::string show(const std::vector<std::optional<int>>& values) { std::ostringstream text; text << '['; for (std::size_t i = 0; i < values.size(); i++) { text << (i ? \",\" : \"\"); if (values[i]) text << *values[i]; else text << \"null\"; } text << ']'; return text.str(); }",
      "template <typename Input, typename Call>",
      "void report(const char* label, Input& input, Call call) {",
      "    budget_steps = 0;",
      "    try {",
      "        decltype(auto) result = call();",
      "        std::cout << label << '\\t' << show(result) << '\\t' << (static_cast<const void*>(&result) == static_cast<const void*>(&input) ? \"in-place\" : \"copy\") << '\\n';",
      "    } catch (const TimeLimit&) {",
      "        std::cout << label << \"\\ttle\\n\";",
      "    } catch (const std::exception&) {",
      "        std::cout << label << \"\\terror\\n\";",
      "    }",
      "}",
      ...runners,
      "int main() {",
      ...programs.map(({ id }) => `    run_${id}();`),
      "}",
    ];
    const prelude = ["struct TimeLimit {};", "inline long budget_steps = 0;", `inline void tick() { if (++budget_steps > ${STEP_BUDGET}) throw TimeLimit{}; }`];
    writeFileSync(join(dir, "driver.cpp"), cppUnit(programs.map(program => ({ ...program, source: instrumentBraced("tick()")(program.source) })), main, prelude));
    // Sanitizers + libc++ hardening turn any out-of-bounds access into a crash instead of a silent "match".
    // Unused-variable warnings stay off: some wrong choices (count but compare lengths, a counter that ignores
    // the letter) mirror the TS preview line by line and leave a variable unused on purpose.
    runTool(cxx, ["-std=c++20", "-O1", "-Wall", "-Wextra", "-Werror", "-Wno-unused-variable", "-Wno-unused-but-set-variable", "-fsanitize=address,undefined", "-fno-sanitize-recover=all", "-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG", "driver.cpp", "-o", "driver"], dir);
    return runTool(join(dir, "driver"), [], dir);
  },
  check: (dir, { cxx }, programs) => {
    writeFileSync(join(dir, "partials.cpp"), cppUnit(programs, []));
    runTool(cxx, ["-std=c++20", "-fsyntax-only", "partials.cpp"], dir);
  },
};

const languages: Language[] = [python, java, cpp];
// LANG_KINDS lets parallel workers check only the kinds they touch; the full run stays the default.
const onlyKinds = process.env.LANG_KINDS?.split(",").map(kind => kind.trim()).filter(Boolean);
const kinds = [...new Set(challenges.map(challenge => challenge.kind))].filter(kind => !onlyKinds?.length || onlyKinds.includes(kind));
const toolchains = new Map(languages.map(language => [language.id, language.toolchain()]));
const totals = { comparisons: 0, partials: 0 };

function withDir<T>(work: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "dailyleet-languages-"));
  try {
    return work(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function programsFor(kind: Kind, language: Language, choicesList: Choices[]): Program[] {
  return choicesList.map(choices => ({ id: choices.map(choice => (choice < 0 ? "p" : String(choice))).join(""), choices, source: previewInLanguage(kind, choices, language.id) }));
}

for (const kind of kinds) {
  const kindCases = cases[kind];
  test(`${kind} has engine cases`, () => assert.ok(kindCases && kindCases.length > 0, `engine.ts has no cases for ${kind}`));
  for (const language of languages) {
    test(`${language.id} matches the JS engine on every ${kind} combo`, { timeout: TIMEOUT_MS * 2 }, (t: TestContext) => {
      const toolchain = toolchains.get(language.id);
      if (!toolchain || !toolchain.ok) return t.skip(`${language.id} toolchain missing: ${toolchain && !toolchain.ok ? toolchain.reason : "unknown"}`);
      const programs = programsFor(kind, language, allChoices());
      for (const program of programs) assert.doesNotMatch(program.source, /Pendiente|Elegí/, `${language.id} ${kind} ${program.choices} is complete but shows a placeholder`);
      const stdout = withDir(dir => language.execute(dir, toolchain.commands, programs, kindCases.map(caseArgs)));
      const actual = new Map<string, string>();
      for (const line of stdout.split("\n").filter(Boolean)) {
        const tab = line.indexOf("\t");
        actual.set(line.slice(0, tab), line.slice(tab + 1));
      }
      const mismatches: string[] = [];
      for (const program of programs) {
        kindCases.forEach((item, index) => {
          const expected = jsOutcome(kind, program.choices, item);
          const got = actual.get(`${program.id} ${index}`);
          if (got === undefined || normalize(got) !== normalize(expected)) mismatches.push(`[${program.choices}] case ${index} ${JSON.stringify(caseArgs(item))}: js=${expected} ${language.id}=${got ?? "<missing>"}`);
        });
      }
      assert.equal(actual.size, programs.length * kindCases.length, `${language.id} printed ${actual.size} results, expected ${programs.length * kindCases.length}`);
      assert.deepEqual(mismatches, [], `${mismatches.length} mismatches:\n${mismatches.slice(0, 40).join("\n")}`);
      totals.comparisons += programs.length * kindCases.length;
      t.diagnostic(`${programs.length} combos x ${kindCases.length} cases`);
    });

    test(`${language.id} partial ${kind} previews are valid and marked as pending`, { timeout: TIMEOUT_MS }, (t: TestContext) => {
      const toolchain = toolchains.get(language.id);
      if (!toolchain || !toolchain.ok) return t.skip(`${language.id} toolchain missing: ${toolchain && !toolchain.ok ? toolchain.reason : "unknown"}`);
      const unique = new Map<string, Program>();
      for (const program of programsFor(kind, language, partialChoices())) {
        const effective = activeChoices(kind, program.choices);
        const resolved = effective.every(choice => choice >= 0);
        if (resolved) assert.equal(program.source, previewInLanguage(kind, effective, language.id), `${language.id} ${kind} ${program.choices} only leaves ignored steps pending`);
        else assert.match(program.source, /Pendiente|Elegí/, `${language.id} ${kind} ${program.choices} hides pending decisions`);
        if (![...unique.values()].some(existing => existing.source === program.source)) unique.set(program.id, program);
      }
      withDir(dir => language.check(dir, toolchain.commands, [...unique.values()]));
      totals.partials += unique.size;
    });
  }
}

const infiniteLoops: Record<Language["id"], string> = {
  python: "def solve(nums):\n    while True:\n        pass",
  java: "class Solution {\n    public static int solve(int[] nums) {\n        while (nums.length > 0) {\n        }\n        return 0;\n    }\n}",
  cpp: "int solve(const std::vector<int>& nums) {\n    while (!nums.empty()) {\n    }\n    return 0;\n}",
};

test("the JS engine reports a non-terminating program as TLE instead of hanging", () => {
  const result = runSource("while (input.length > 0) {\n}\nreturn 0;", ["input"], [[1]]);
  assert.deepEqual(result.ok ? "finished" : result.error, "TLE");
});

for (const language of languages) {
  test(`${language.id} harness reports a non-terminating program as tle, like the JS engine`, { timeout: TIMEOUT_MS }, (t: TestContext) => {
    const toolchain = toolchains.get(language.id);
    if (!toolchain || !toolchain.ok) return t.skip(`${language.id} toolchain missing: ${toolchain && !toolchain.ok ? toolchain.reason : "unknown"}`);
    const stdout = withDir(dir => language.execute(dir, toolchain.commands, [{ id: "loop", choices: [0, 0, 0], source: infiniteLoops[language.id] }], [[[1]]]));
    assert.equal(stdout.trim(), "loop 0\ttle");
  });
}

// The step counter is injected at "for/while (...) {" heads, so a loop without braces would escape the budget.
test("every loop in module programs and previews has braces, so the step budget sees it", () => {
  for (const kind of kinds.filter(isModuleKind)) for (const choices of allChoices()) {
    const sources = [previewInLanguage(kind, choices, "javascript"), previewInLanguage(kind, choices, "java"), previewInLanguage(kind, choices, "cpp")];
    for (const source of sources) for (const line of source.split("\n")) {
      if (/\b(?:for|while)\s*\(/.test(line) && !/^\s*\}\s*while/.test(line)) assert.match(line, /\)\s*\{/, `${kind} ${choices}: unbraced loop «${line.trim()}»`);
    }
  }
});

test("every language generator covers every challenge kind", () => {
  for (const kind of kinds) for (const language of languages) assert.doesNotThrow(() => previewInLanguage(kind, [0, 0, 0], language.id), `${language.id} cannot render ${kind}`);
});

test("summary", (t: TestContext) => {
  t.diagnostic(`language equivalence: ${totals.comparisons} JS-vs-language comparisons, ${totals.partials} distinct partial previews compiled`);
});
