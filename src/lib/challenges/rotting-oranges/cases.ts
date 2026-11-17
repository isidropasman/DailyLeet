import type { Judge } from "../module";

export const rottingOrangesJudge: Judge = {
  cases: [
    { input: [2, 1, 0, 1, 1, 1, 0, 1, 1], target: 3, expected: 4 },
    { input: [2, 1, 1, 1, 0, 0, 0, 0, 1], target: 3, expected: -1 },
    { input: [0, 2], target: 2, expected: 0 },
    { input: [1], target: 1, expected: -1 },
    { input: [0], target: 1, expected: 0 },
    { input: [2], target: 1, expected: 0 },
    { input: [1, 2], target: 2, expected: 1 },
    { input: [2, 1, 1, 1], target: 2, expected: 2 },
    { input: [2, 0, 0, 1], target: 2, expected: -1 },
    { input: [0, 2, 1, 0], target: 2, expected: -1 },
    { input: [2, 1, 1, 1, 2], target: 5, expected: 2 },
    { input: [2, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 2], target: 5, expected: 7 },
  ],
  efficient: ([approach]) => approach === 0,
  feedback: {
    optimal: "BFS multi-fuente: cada celda entra a la cola una vez, O(m · n).",
    slow: "Simular minuto a minuto es correcto, pero cada minuto recorre toda la grilla: O((m · n)²).",
    hint: "Revisá las grillas sin fruta sana, las sanas que nadie alcanza y los bordes de cada fila: en la grilla aplanada, i + 1 puede ser la fila de abajo.",
  },
};
