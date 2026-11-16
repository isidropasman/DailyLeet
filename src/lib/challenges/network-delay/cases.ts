import type { Judge } from "../module";

export const networkDelayJudge: Judge = {
  cases: [
    { input: [2, 2, 1, 1, 2, 3, 1, 3, 4, 1], target: 4, expected: 2 },
    { input: [1], target: 1, expected: 0 },
    { input: [1, 1, 2, 1], target: 2, expected: 1 },
    { input: [2, 1, 2, 1], target: 2, expected: -1 },
    { input: [1, 1, 2, 10, 1, 3, 1, 3, 2, 1], target: 3, expected: 2 },
    { input: [1, 1, 2, 1, 2, 3, 1, 3, 4, 1, 4, 5, 1, 1, 6, 2, 6, 5, 1], target: 6, expected: 3 },
    { input: [1, 1, 2, 5, 2, 3, 1, 1, 3, 10], target: 3, expected: 6 },
    { input: [1, 1, 2, 2, 1, 3, 7, 2, 3, 1, 3, 4, 1, 2, 5, 9, 4, 5, 1], target: 5, expected: 5 },
    { input: [1, 1, 2, 1, 2, 1, 1], target: 3, expected: -1 },
    { input: [1, 1, 2, 4, 1, 3, 1, 3, 2, 1, 2, 4, 1, 3, 4, 9], target: 4, expected: 3 },
    { input: [2, 1, 2, 1, 2, 3, 2, 1, 3, 2], target: 3, expected: -1 },
    { input: [3, 3, 1, 4, 3, 2, 1, 2, 1, 1, 1, 4, 1, 2, 4, 6, 4, 5, 2, 1, 5, 7], target: 5, expected: 5 },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory !== 2,
  feedback: {
    optimal: "Dijkstra con heap: cada nodo se cierra una vez y cada enlace entra al heap a lo sumo una vez, O((V + E) log V).",
    slow: "Es correcto, pero relajar todo n − 1 veces cuesta O(V·E), y buscar el mínimo a mano O(V²): solo conviene si el grafo es denso.",
    hint: "Revisá los atajos con más saltos pero menos tiempo, los nodos inalcanzables y qué ordena el heap: la distancia acumulada, no el peso del último enlace.",
  },
};
