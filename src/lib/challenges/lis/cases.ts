import type { Judge } from "../module";

export const lisJudge: Judge = {
  cases: [
    { input: [10, 9, 2, 5, 3, 7, 101, 18], expected: 4 },
    { input: [], expected: 0 },
    { input: [7], expected: 1 },
    { input: [7, 7, 7, 7], expected: 1 },
    { input: [0, 1, 0, 3, 2, 3], expected: 4 },
    { input: [1, 10, 2, 3, 4], expected: 4 },
    { input: [5, 6, 7, 1, 2, 8], expected: 4 },
    { input: [4, 10, 4, 3, 8, 9], expected: 3 },
    { input: [3, 5, 6, 2, 5, 4, 19, 5, 6, 7, 12], expected: 6 },
    { input: [9, 8, 7, 6], expected: 1 },
    { input: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15], expected: 6 },
    { input: [2, 2, 3, 3, 1, 4], expected: 3 },
  ],
  efficient: ([approach, , rule]) => approach === 0 && rule !== 2,
  feedback: {
    optimal: "Colas mínimas con búsqueda binaria: O(n log n) de tiempo y O(n) de memoria.",
    slow: "Es correcto, pero no llega a O(n log n): la DP cuadrática cuesta O(n²) y la búsqueda lineal en las colas O(n · L).",
    hint: "Revisá los repetidos (estrictamente creciente no acepta iguales) y que reemplazar una cola nunca tire prefijos que todavía pueden crecer.",
  },
};
