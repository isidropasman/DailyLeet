import type { Judge } from "../module";

export const coinChangeJudge: Judge = {
  cases: [
    { input: [1, 2, 5], target: 11, expected: 3 },
    { input: [2], target: 3, expected: -1 },
    { input: [1], target: 0, expected: 0 },
    { input: [1, 3, 4], target: 6, expected: 2 },
    { input: [2, 5], target: 3, expected: -1 },
    { input: [3, 7], target: 5, expected: -1 },
    { input: [2, 3], target: 7, expected: 3 },
    { input: [5, 10, 25], target: 30, expected: 2 },
    { input: [1, 5, 6, 9], target: 11, expected: 2 },
    { input: [7], target: 14, expected: 2 },
    { input: [4, 3], target: 2, expected: -1 },
    { input: [9, 6, 5, 1], target: 12, expected: 2 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "DP por monto: O(amount · n) de tiempo y O(amount) de memoria.",
    slow: "Probar cada moneda sin memo es correcto, pero recalcula los mismos montos: crece de forma exponencial.",
    hint: "Revisá los montos imposibles (tienen que terminar en −1), el monto 0 y si la moneda más grande realmente lleva al mínimo.",
  },
};
