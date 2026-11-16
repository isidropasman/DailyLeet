import type { Judge } from "../module";

export const kokoJudge: Judge = {
  cases: [
    { input: [3, 6, 7, 11], target: 8, expected: 4 },
    { input: [30, 11, 23, 4, 20], target: 5, expected: 30 },
    { input: [30, 11, 23, 4, 20], target: 6, expected: 23 },
    { input: [1], target: 1, expected: 1 },
    { input: [1000], target: 3, expected: 334 },
    { input: [4], target: 1, expected: 4 },
    { input: [30, 11], target: 100, expected: 1 },
    { input: [5, 5, 5, 5], target: 4, expected: 5 },
    { input: [5, 5, 5, 5], target: 8, expected: 3 },
    { input: [9, 8, 7], target: 7, expected: 4 },
    { input: [2, 2], target: 3, expected: 2 },
    { input: [312884470], target: 968709470, expected: 1 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Búsqueda binaria sobre la velocidad: O(n log max) de tiempo.",
    slow: "Probar velocidades de a una es correcto, pero cuesta O(n · max): con pilas de 10⁹ no termina.",
    hint: "Revisá los bordes: si una velocidad alcanza puede ser la respuesta, la mínima puede ser 1 y una pila que divide exacto no suma una hora extra.",
  },
};
