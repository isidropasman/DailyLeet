import type { Judge } from "../module";

export const meetingRoomsJudge: Judge = {
  cases: [
    { input: [0, 30, 5, 10, 15, 20], expected: 2 },
    { input: [], expected: 0 },
    { input: [7, 10], expected: 1 },
    { input: [1, 5, 5, 10], expected: 1 },
    { input: [5, 10, 1, 5], expected: 1 },
    { input: [0, 2, 1, 4, 3, 6], expected: 2 },
    { input: [1, 10, 2, 7, 3, 4, 5, 6], expected: 3 },
    { input: [1, 3, 1, 3, 1, 3], expected: 3 },
    { input: [2, 4, 7, 10, 1, 2], expected: 1 },
    { input: [6, 9, 1, 6, 6, 7, 2, 6], expected: 2 },
    { input: [0, 5, 5, 10, 10, 15, 0, 15], expected: 2 },
    { input: [9, 10, 4, 9, 4, 17], expected: 2 },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory === 0,
  feedback: {
    optimal: "Barrido de eventos ordenados: O(n log n) de tiempo.",
    slow: "Es correcto, pero cuesta más: contar en cada inicio es O(n²) y el array de diferencias recorre cada minuto hasta el último fin.",
    hint: "Revisá los empates: una reunión que termina a las 5 libera la sala para la que empieza a las 5, sin importar en qué orden llegaron.",
  },
};
