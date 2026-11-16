import type { Judge } from "../module";

export const subarraySumJudge: Judge = {
  cases: [
    { input: [1, 1, 1], target: 2, expected: 2 },
    { input: [], target: 0, expected: 0 },
    { input: [5], target: 5, expected: 1 },
    { input: [1, 2, 3], target: 3, expected: 2 },
    { input: [0, 0, 0], target: 0, expected: 6 },
    { input: [1], target: 0, expected: 0 },
    { input: [1, -1, 0], target: 0, expected: 3 },
    { input: [-1, -1, 1], target: -1, expected: 3 },
    { input: [3, 4, 7, 2, -3, 1, 4, 2], target: 7, expected: 4 },
    { input: [1, -1, 1, -1], target: 0, expected: 4 },
    { input: [2, -2, 2, -2, 2], target: 2, expected: 6 },
    { input: [10, 2, -2, -20, 10], target: -10, expected: 3 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Una pasada con un Map de prefijos: O(n) de tiempo promedio.",
    slow: "Sumar desde cada comienzo es correcto, pero cuesta O(n²).",
    hint: "Revisá los ceros, los negativos y un k ≤ 0: varios prefijos pueden repetirse y el subarray vacío no cuenta.",
  },
};
