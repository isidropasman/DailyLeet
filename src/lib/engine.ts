import { program } from "./program";
import { isLegacyKind, isModuleKind, type Choices, type Kind, type LegacyKind } from "./challenges";
import { modules } from "./challenges/registry";
import { judges } from "./challenges/judges";
import { recordOf } from "./challenges/record";
import type { CaseVerdict } from "./challenges/module";

export type Frame = { index: number; left: number; memory: (string | number)[]; value: number; cells?: (string | number)[] };
export type Output = number | boolean | string | number[];
export type Case = { input: string | number[]; target?: number; other?: string; expected: Output };
export type ExecutionError = "TLE" | "runtime";
export type TestExecution = { passed: boolean; label: string; input?: string | number[]; target?: number; other?: string; expected?: Output; actual?: Output; reason?: string; error?: ExecutionError };
export type Evaluation = { score: number; passed: number; total: number; efficient: boolean; tests: TestExecution[]; feedback: string[]; breakdown?: { correctness: number; efficiency: number; time: number } };
export type RunResult = { ok: true; output: Output; frames: Frame[]; inPlace: boolean } | { ok: false; error: ExecutionError; frames: Frame[] };

// Counted per case: one tick per loop iteration (and per explicit tick() call). Terminating combos on the
// 12 small cases stay orders of magnitude below it; only non-terminating traps reach it.
export const STEP_BUDGET = 200_000;
const LOOP_HEAD = /\b(?:for|while)\b[^\n]*?\)\s*\{|\bdo\s*\{/g;

class BudgetExceeded {}

export function instrument(source: string): string {
  return source.replace(LOOP_HEAD, match => `${match} tick();`);
}

function isOutput(value: unknown): value is Output {
  return typeof value === "number" || typeof value === "boolean" || typeof value === "string" || (Array.isArray(value) && value.every(item => typeof item === "number"));
}

export function runSource(source: string, params: string[], args: (string | number | number[])[]): RunResult {
  const frames: Frame[] = [];
  const emit = (index: number, left: number, memory: (string | number)[], value: number, cells?: (string | number)[]) => {
    if (frames.length < 160) frames.push({ index, left, memory: memory.slice(0, 32), value, ...(cells ? { cells: cells.slice(0,32) } : {}) });
  };
  let steps = 0;
  const tick = () => { if (++steps > STEP_BUDGET) throw new BudgetExceeded(); };
  // Only fixed templates selected by validated integer choices become executable code.
  const execute = new Function(...params, "emit", "tick", instrument(source)) as (...values: unknown[]) => unknown;
  const working = args.map(arg => (Array.isArray(arg) ? [...arg] : arg));
  try {
    const output = execute(...working, emit, tick);
    if (!isOutput(output)) return { ok: false, error: "runtime", frames };
    return { ok: true, output, frames, inPlace: Array.isArray(output) && output === working[0] };
  } catch (error) {
    return { ok: false, error: error instanceof BudgetExceeded ? "TLE" : "runtime", frames };
  }
}

export function run(kind: Kind, choices: Choices, input: string | number[], target = 0, other = ""): RunResult {
  if (isLegacyKind(kind)) return runSource(program(kind, choices), ["input", "target", "other"], [input, target, other]);
  const values = { input, target, other };
  const signature = modules[kind].signature;
  return runSource(modules[kind].program(choices), signature.map(param => param.name), signature.map(param => values[param.role]));
}

const legacyCases: Record<LegacyKind, Case[]> = {
  substring: [
    { input: "abcabcbb", expected: 3 }, { input: "", expected: 0 }, { input: "a", expected: 1 },
    { input: "bbbbb", expected: 1 }, { input: "pwwkew", expected: 3 }, { input: "abba", expected: 2 },
    { input: "dvdf", expected: 3 }, { input: "tmmzuxt", expected: 5 }, { input: "anviaj", expected: 5 },
    { input: "aabcad", expected: 4 }, { input: "abcdef", expected: 6 }, { input: "abcbde", expected: 4 },
  ],
  "two-sum": [
    { input: [3,2,4], target: 6, expected: [1,2] }, { input: [], target: 0, expected: [] },
    { input: [3], target: 6, expected: [] }, { input: [3,3], target: 6, expected: [0,1] },
    { input: [0,4,3,0], target: 0, expected: [0,3] }, { input: [-3,4,3,90], target: 0, expected: [0,2] },
    { input: [2,7,11,15], target: 9, expected: [0,1] }, { input: [5,1,8,2], target: 7, expected: [0,3] },
    { input: [1,2,3], target: 10, expected: [] }, { input: [1,5,3,7], target: 8, expected: [0,3] },
    { input: [-2,-5,-1], target: -6, expected: [1,2] }, { input: [4,1,6,8], target: 7, expected: [1,2] },
  ],
  brackets: [
    { input: "{[()]}", expected: true }, { input: "", expected: true }, { input: "()[]{}", expected: true },
    { input: "([)]", expected: false }, { input: "((", expected: false }, { input: ")(", expected: false },
    { input: "(]", expected: false }, { input: "((()))", expected: true }, { input: "[({})]", expected: true },
    { input: "(()", expected: false }, { input: "())(", expected: false }, { input: "([]){}", expected: true },
  ],
  stock: [
    {input:[7,1,5,3,6,4],expected:5},{input:[],expected:0},{input:[5],expected:0},
    {input:[9,7,4,1],expected:0},{input:[1,2,3,4],expected:3},{input:[3,2,6,1,4],expected:4},
    {input:[4,4,4],expected:0},{input:[2,8,1,3],expected:6},{input:[0,0,4],expected:4},
    {input:[5,1,2,0,6],expected:6},{input:[1,9,2,3],expected:8},{input:[2,1,2,1,0,1,2],expected:2},
  ],
  "move-zeroes": [
    {input:[0,1,0,3,12],expected:[1,3,12,0,0]},{input:[],expected:[]},{input:[0],expected:[0]},
    {input:[1],expected:[1]},{input:[0,0,0],expected:[0,0,0]},{input:[3,1,2],expected:[3,1,2]},
    {input:[0,-2,0,4,-1],expected:[-2,4,-1,0,0]},{input:[1,0,2,0],expected:[1,2,0,0]},
    {input:[0,0,1],expected:[1,0,0]},{input:[-1,0,-2,0],expected:[-1,-2,0,0]},
    {input:[1,1,0,1],expected:[1,1,1,0]},{input:[0,2,0,0,3,0,1],expected:[2,3,1,0,0,0,0]},
  ],
  anagram: [
    {input:"anagram",other:"nagaram",expected:true},{input:"",other:"",expected:true},{input:"a",other:"a",expected:true},
    {input:"rat",other:"car",expected:false},{input:"aab",other:"aba",expected:true},{input:"aab",other:"abb",expected:false},
    {input:"ad",other:"bc",expected:false},{input:"ab",other:"a",expected:false},{input:"a",other:"ab",expected:false},
    {input:"zzxy",other:"xzyz",expected:true},{input:"",other:"a",expected:false},{input:"ab",other:"aa",expected:false},
  ],
};

export const cases: Record<Kind, Case[]> = {
  ...legacyCases,
  ...recordOf(Object.keys(judges).filter(isModuleKind), kind => judges[kind].cases),
};

function correct(kind: LegacyKind, output: Output, item: Case, inPlace: boolean): boolean {
  if (kind === "move-zeroes") return inPlace && Array.isArray(output) && Array.isArray(item.expected) && output.length === item.expected.length && output.every((value,index) => value === (item.expected as number[])[index]);
  if (kind !== "two-sum") return output === item.expected;
  if (!Array.isArray(output) || !Array.isArray(item.input) || !Array.isArray(item.expected)) return false;
  if (item.expected.length === 0) return output.length === 0;
  const [a,b] = output;
  return output.length === 2 && Number.isInteger(a) && Number.isInteger(b) && a !== b && a >= 0 && b >= 0 && a < item.input.length && b < item.input.length && item.input[a] + item.input[b] === item.target;
}

const sameOutput = (a: Output, b: Output) => JSON.stringify(a) === JSON.stringify(b);

const failureReason: Record<ExecutionError, string> = {
  TLE: `No terminó: superó el presupuesto de ${STEP_BUDGET.toLocaleString("es-AR")} pasos (TLE).`,
  runtime: "El programa lanzó un error al ejecutarse.",
};

function judgeCase(kind: Kind, choices: Choices, item: Case, i: number): TestExecution {
  const label = i === 0 ? "Ejemplo del enunciado" : `Caso ${i + 1}`;
  const base = { label, input: item.input, target: item.target, other: item.other, expected: item.expected };
  const execution = run(kind, choices, item.input, item.target, item.other);
  if (!execution.ok) return { ...base, passed: false, error: execution.error, reason: failureReason[execution.error] };
  const actual = execution.output;
  if (isModuleKind(kind)) {
    const compare = judges[kind].compare;
    const verdict: CaseVerdict = compare ? compare(actual, item, { inPlace: execution.inPlace }) : sameOutput(actual, item.expected) ? { passed: true } : { passed: false };
    return { ...base, passed: verdict.passed, actual, ...(!verdict.passed && verdict.reason ? { reason: verdict.reason } : {}) };
  }
  return { ...base, passed: correct(kind, actual, item, execution.inPlace), actual, ...(kind === "move-zeroes" && !execution.inPlace ? { reason: "El contrato exige modificar y devolver el array original; esta solución creó otro." } : {}) };
}

export function checkCase(kind: Kind, choices: Choices, item: Case): TestExecution {
  return judgeCase(kind, choices, item, 0);
}

function legacyEfficient(kind: LegacyKind, choices: Choices): boolean {
  return kind === "move-zeroes" ? choices[0] <= 1 : kind === "anagram" ? choices[0] === 0 && choices[1] <= 1 : choices[0] === 0 && (kind !== "two-sum" || choices[1] === 0);
}

const legacyHints: Record<LegacyKind, string> = {
  substring: "Revisá los repetidos dentro de la ventana: el inicio nunca debe retroceder y la ventana debe volver a ser válida.",
  "two-sum": "Revisá los duplicados, los negativos y el orden entre buscar e insertar. Dos valores iguales deben venir de índices distintos.",
  brackets: "Revisá el orden de anidamiento, los tipos de cierre y las aperturas pendientes al terminar.",
  stock: "Respetá el orden de los días: conservá el mínimo anterior y no pierdas una ganancia mejor al llegar un día peor.",
  "move-zeroes": "Conservá el orden, los negativos y el array original. El puntero de escritura solo avanza cuando conservás un valor.",
  anagram: "Contá cada aparición: longitud, presencia o suma de códigos no bastan para reconocer un anagrama.",
};

export function evaluate(kind: Kind, choices: Choices, elapsed: number): Evaluation {
  const tests = cases[kind].map((item, i) => judgeCase(kind, choices, item, i));
  const passed = tests.filter(t => t.passed).length;
  const efficient = isModuleKind(kind) ? judges[kind].efficient(choices) : legacyEfficient(kind, choices);
  const complete = passed === tests.length;
  const ratio = passed / tests.length;
  const breakdown = {
    correctness: Math.round(90 * ratio),
    efficiency: Math.round((efficient ? 7 : 2) * ratio),
    time: Math.round(3 * ratio * (1 - Math.max(0, Math.min(300, elapsed)) / 300)),
  };
  const score = Math.max(1, breakdown.correctness + breakdown.efficiency + breakdown.time);
  const feedback = [complete ? "Tu algoritmo pasó todos los casos de evaluación." : "Tu algoritmo funciona en algunos casos, pero todavía hay entradas válidas que lo rompen."];
  if (tests.some(t => t.error === "TLE")) feedback.push("Al menos un caso no terminó: tu programa entró en un ciclo sin fin o superó el presupuesto de pasos.");
  if (isModuleKind(kind)) {
    const notes = judges[kind].feedback;
    if (complete) feedback.push(efficient ? notes.optimal : notes.slow);
    else feedback.push(notes.hint);
    return { score, passed, total: tests.length, efficient, tests, feedback, breakdown };
  }
  if (choices[0] === 1 && kind !== "move-zeroes" && kind !== "anagram") feedback.push("El recorrido exhaustivo puede ser correcto, pero su costo crece de forma cuadrática en el peor caso.");
  if (kind === "anagram" && choices[0] === 1) feedback.push("Ordenar es válido; su costo es O(n log n), frente al recorrido lineal con contadores.");
  if (complete && efficient) feedback.push("Tu enfoque procesa los datos en tiempo lineal: O(n), promedio cuando usa Map o Set.");
  if (!complete) feedback.push(legacyHints[kind]);
  return { score, passed, total: tests.length, efficient, tests, feedback, breakdown };
}
