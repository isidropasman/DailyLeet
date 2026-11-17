import type { Judge } from "../module";

export const maxSubarrayJudge: Judge = {
  cases: [
    { input: [3, -4, 5, -1, 2, -6, 1], expected: 6 },
    { input: [1], expected: 1 },
    { input: [-7], expected: -7 },
    { input: [-2, 1], expected: 1 },
    { input: [0, -1], expected: 0 },
    { input: [2, -1, 2], expected: 3 },
    { input: [-3, -1, -2], expected: -1 },
    { input: [1, 2, 3], expected: 6 },
    { input: [5, 4, -1, 7, 8], expected: 23 },
    { input: [8, -19, 5, -4, 20], expected: 21 },
    { input: [-5, -9, -2, -8, -3], expected: -2 },
    { input: [-2, -3, 4, -1, -2, 1, 5, -3], expected: 7 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Kadane: una pasada con el mejor tramo que termina en cada posición, O(n) de tiempo y O(1) de memoria.",
    slow: "Probar todos los tramos es correcto, pero cuesta O(n²).",
    hint: "Revisá los bordes: si todos son negativos la respuesta es negativa, y un tramo con un negativo en el medio puede convenir igual.",
  },
};
