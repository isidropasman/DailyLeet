import type { Judge } from "../module";

export const largestRectangleJudge: Judge = {
  cases: [
    { input: [2, 1, 5, 6, 2, 3], expected: 10 },
    { input: [], expected: 0 },
    { input: [7], expected: 7 },
    { input: [2, 4], expected: 4 },
    { input: [1, 2, 3, 4, 5], expected: 9 },
    { input: [5, 4, 3, 2, 1], expected: 9 },
    { input: [2, 1, 2], expected: 3 },
    { input: [6, 2, 5, 4, 5, 1, 6], expected: 12 },
    { input: [3, 3, 3, 3], expected: 12 },
    { input: [0, 0, 0], expected: 0 },
    { input: [4, 2, 0, 3, 2, 5], expected: 6 },
    { input: [2, 1, 4, 5, 1, 3, 3], expected: 8 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Cada barra entra y sale de la pila una sola vez: O(n) de tiempo.",
    slow: "Expandir desde cada barra es correcto, pero con barras iguales o crecientes cuesta O(n²).",
    hint: "Revisá el ancho: la barra que sacás se extiende hacia la izquierda hasta el nuevo tope de la pila, no hasta su propia posición, y lo que queda en la pila al final también cuenta.",
  },
};
