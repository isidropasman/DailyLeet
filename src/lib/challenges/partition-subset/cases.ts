import type { Judge } from "../module";

export const partitionSubsetJudge: Judge = {
  cases: [
    { input: [1, 5, 11, 5], expected: true },
    { input: [1, 2, 3, 5], expected: false },
    { input: [1], expected: false },
    { input: [2], expected: false },
    { input: [1, 1], expected: true },
    { input: [1, 3], expected: false },
    { input: [1, 2, 5], expected: false },
    { input: [3, 3, 2, 2, 2], expected: true },
    { input: [2, 2, 1, 1], expected: true },
    { input: [1, 2, 3, 4, 5, 6, 7], expected: true },
    { input: [100, 50, 50], expected: true },
    { input: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13], expected: false },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Mochila 0/1 sobre las sumas: O(n · S) de tiempo y O(S) de memoria.",
    slow: "Probar todos los subconjuntos es correcto, pero son 2ⁿ grupos: con 30 números ya no termina.",
    hint: "Revisá la suma impar, el caso base dp[0] y que cada número se use una sola vez: el sentido del recorrido importa.",
  },
};
