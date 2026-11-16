import type { Judge } from "../module";

export const dailyTemperaturesJudge: Judge = {
  cases: [
    { input: [73, 74, 75, 71, 69, 72, 76, 73], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
    { input: [], expected: [] },
    { input: [50], expected: [0] },
    { input: [30, 40, 50, 60], expected: [1, 1, 1, 0] },
    { input: [60, 50, 40, 30], expected: [0, 0, 0, 0] },
    { input: [70, 70, 71], expected: [2, 1, 0] },
    { input: [73, 72, 71, 74], expected: [3, 2, 1, 0] },
    { input: [72, 70, 71, 75], expected: [3, 1, 1, 0] },
    { input: [71, 72, 75], expected: [1, 1, 0] },
    { input: [55, 55, 55], expected: [0, 0, 0] },
    { input: [30, 60, 90, 60, 30, 100], expected: [1, 1, 3, 2, 1, 0] },
    { input: [89, 62, 70, 58, 47, 47, 46, 76, 100, 70], expected: [8, 1, 5, 4, 3, 2, 1, 1, 0, 0] },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "Cada día entra y sale de la pila una sola vez: O(n) de tiempo.",
    slow: "Mirar hacia adelante desde cada día es correcto, pero en el peor caso cuesta O(n²).",
    hint: "Revisá las temperaturas repetidas y los días que esperan detrás de otro: «más cálido» es estrictamente mayor y un día nuevo puede resolver varios pendientes.",
  },
};
