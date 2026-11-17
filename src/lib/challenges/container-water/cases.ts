import type { Judge } from "../module";

export const containerWaterJudge: Judge = {
  cases: [
    { input: [1, 8, 6, 2, 5, 4, 8, 3, 7], expected: 49 },
    { input: [1, 1], expected: 1 },
    { input: [0, 5], expected: 0 },
    { input: [1, 2, 1], expected: 2 },
    { input: [2, 1, 3], expected: 4 },
    { input: [5, 1, 2], expected: 4 },
    { input: [4, 3, 2, 1, 4], expected: 16 },
    { input: [1, 2, 4, 3], expected: 4 },
    { input: [4, 1, 10, 1, 4], expected: 16 },
    { input: [5, 5, 5, 5], expected: 15 },
    { input: [2, 3, 4, 5, 18, 17, 6], expected: 17 },
    { input: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], expected: 25 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Dos punteros desde los extremos: O(n) de tiempo y O(1) de memoria.",
    slow: "Probar todos los pares es correcto, pero cuesta O(n²): con 10⁵ paredes son 5 · 10⁹ pares.",
    hint: "Revisá qué pared descartás (la más baja ya dio su mejor par), que el agua llega hasta la más baja y que la distancia es r − l, no la cantidad de paredes.",
  },
};
