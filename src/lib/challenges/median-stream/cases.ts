import type { Judge } from "../module";

export const medianStreamJudge: Judge = {
  cases: [
    { input: [5, 15, 1, 3], expected: [5, 10, 5, 4] },
    { input: [], expected: [] },
    { input: [7], expected: [7] },
    { input: [1, 2], expected: [1, 1.5] },
    { input: [2, 1, 5, 7, 2, 0, 5], expected: [2, 1.5, 2, 3.5, 2, 2, 2] },
    { input: [-1, -2, -3, -4, -5], expected: [-1, -1.5, -2, -2.5, -3] },
    { input: [6, 10, 2, 6, 5, 0, 6, 3, 1, 0, 0], expected: [6, 8, 6, 6, 6, 5.5, 6, 5.5, 5, 4, 3] },
    { input: [1, 1, 1, 1], expected: [1, 1, 1, 1] },
    { input: [10, 9, 8, 1, 2, 3], expected: [10, 9.5, 9, 8.5, 8, 5.5] },
    { input: [-3, 2], expected: [-3, -0.5] },
    { input: [1, 3, 5, 7, 9, 2, 4, 6, 8], expected: [1, 2, 3, 4, 5, 4, 4, 4.5, 5] },
    { input: [100, -100, 50, -50, 0], expected: [100, 0, 50, 0, 0] },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory !== 2,
  feedback: {
    optimal: "Dos heaps balanceados: cada número nuevo cuesta O(log n) y la mediana se lee de los topes en O(1).",
    slow: "Mantener una lista ordenada es correcto, pero insertar en el medio (o reordenar todo) cuesta O(n) o más por número.",
    hint: "Revisá la cantidad par con números impares o negativos, y qué pasa cuando llega un número chico después de uno grande: todo lo de abajo tiene que ser ≤ todo lo de arriba.",
  },
};
