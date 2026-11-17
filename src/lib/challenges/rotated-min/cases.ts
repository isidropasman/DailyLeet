import type { Judge } from "../module";

export const rotatedMinJudge: Judge = {
  cases: [
    { input: [5, 7, 9, 1, 3], expected: 1 },
    { input: [1], expected: 1 },
    { input: [2, 1], expected: 1 },
    { input: [1, 2], expected: 1 },
    { input: [1, 2, 3], expected: 1 },
    { input: [3, 1, 2], expected: 1 },
    { input: [2, 3, 1], expected: 1 },
    { input: [6, 8, 10, 12, 2, 4], expected: 2 },
    { input: [11, 13, 15, 17], expected: 11 },
    { input: [-3, -1, 0, 5, 9, -8], expected: -8 },
    { input: [30, 5, 10, 15, 20, 25], expected: 5 },
    { input: [1000000000, -1000000000, 0], expected: -1000000000 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Búsqueda binaria contra el borde derecho: O(log n) de tiempo.",
    slow: "Recorrer el array es correcto, pero cuesta O(n): no aprovecha que cada mitad está casi ordenada.",
    hint: "Revisá los bordes: un array sin rotar, uno de dos elementos y que mid puede ser el mínimo.",
  },
};
