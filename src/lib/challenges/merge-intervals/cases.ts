import type { Judge } from "../module";

export const mergeIntervalsJudge: Judge = {
  cases: [
    { input: [1, 3, 2, 6, 8, 10, 15, 18], expected: [1, 6, 8, 10, 15, 18] },
    { input: [], expected: [] },
    { input: [4, 7], expected: [4, 7] },
    { input: [1, 4, 4, 5], expected: [1, 5] },
    { input: [1, 2, 3, 4], expected: [1, 2, 3, 4] },
    { input: [1, 10, 2, 3], expected: [1, 10] },
    { input: [2, 3, 0, 1], expected: [0, 1, 2, 3] },
    { input: [1, 10, 2, 3, 4, 5], expected: [1, 10] },
    { input: [5, 5, 1, 2, 2, 5], expected: [1, 5] },
    { input: [6, 8, 1, 9, 2, 4, 4, 7], expected: [1, 9] },
    { input: [1, 4, 0, 4], expected: [0, 4] },
    { input: [0, 0, 1, 4, 5, 7, 6, 6, 9, 12, 8, 8], expected: [0, 0, 1, 4, 5, 7, 8, 8, 9, 12] },
  ],
  efficient: ([approach, , merge]) => approach === 0 && merge !== 2,
  feedback: {
    optimal: "Ordenar y barrer: O(n log n) de tiempo.",
    slow: "Es correcto, pero cuesta más: unir todos contra todos repite pasadas O(n²) y recorrer el grupo en cada fusión es O(n²) si todo se pisa.",
    hint: "Revisá los bordes: [1, 4] y [4, 5] se tocan y se unen, [1, 2] y [3, 4] no, y un tramo puede quedar entero adentro de otro.",
  },
};
