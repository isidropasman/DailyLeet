import type { Judge } from "../module";

function covers(window: string, t: string): boolean {
  const need = new Map<string, number>();
  for (const ch of t) need.set(ch, (need.get(ch) ?? 0) + 1);
  for (const ch of window) need.set(ch, (need.get(ch) ?? 0) - 1);
  return [...need.values()].every(count => count <= 0);
}

export const minWindowJudge: Judge = {
  cases: [
    { input: "ADOBECODEBANC", other: "ABC", expected: "BANC" },
    { input: "a", other: "a", expected: "a" },
    { input: "a", other: "aa", expected: "" },
    { input: "aa", other: "aa", expected: "aa" },
    { input: "ab", other: "b", expected: "b" },
    { input: "aab", other: "ab", expected: "ab" },
    { input: "bba", other: "ab", expected: "ba" },
    { input: "abc", other: "d", expected: "" },
    { input: "aaflslflsldkalskaaa", other: "aaa", expected: "aaa" },
    { input: "cabwefgewcwaefgcf", other: "cae", expected: "cwae" },
    { input: "acbbaca", other: "aba", expected: "baca" },
    { input: "bdab", other: "ab", expected: "ab" },
  ],
  // Any shortest window is valid: the answer must be a substring of s, cover t and have the expected length.
  compare: (actual, item) => {
    if (typeof actual !== "string" || typeof item.input !== "string" || typeof item.expected !== "string") return { passed: false };
    const t = item.other ?? "";
    if (item.expected === "") return actual === "" ? { passed: true } : { passed: false, reason: "No existe ningún fragmento que cubra t: había que devolver \"\"." };
    if (!item.input.includes(actual)) return { passed: false, reason: "La respuesta no es un fragmento contiguo de s." };
    if (!covers(actual, t)) return { passed: false, reason: "El fragmento no contiene todas las letras de t, con sus repeticiones." };
    if (actual.length !== item.expected.length) return { passed: false, reason: `Cubre t, pero hay un fragmento más corto: de largo ${item.expected.length}.` };
    return { passed: true };
  },
  efficient: ([approach, memory]) => approach === 0 && memory === 0,
  feedback: {
    optimal: "Dos punteros con un contador de faltantes: O(|s| + |t|) de tiempo.",
    slow: "Es correcto, pero cuesta más: crecer desde cada comienzo es O(|s|²) y comparar mapas completos suma O(Σ) por paso.",
    hint: "Revisá las letras repetidas: si t tiene dos «a», la ventana necesita dos, y una «a» que sobra no descuenta nada. Después de cubrir, seguí encogiendo mientras siga válida.",
  },
};
