import type { Judge } from "../module";

export const redundantConnectionJudge: Judge = {
  cases: [
    { input: [1, 2, 1, 3, 2, 3], expected: [2, 3] },
    { input: [1, 2, 2, 3, 3, 4, 1, 4, 1, 5], expected: [1, 4] },
    { input: [1, 2, 2, 1], expected: [2, 1] },
    { input: [1, 2, 2, 3, 1, 3, 3, 4, 4, 5], expected: [1, 3] },
    { input: [3, 4, 1, 2, 2, 4, 3, 5, 2, 5], expected: [2, 5] },
    { input: [1, 4, 3, 4, 1, 3, 1, 2, 4, 5], expected: [1, 3] },
    { input: [2, 3, 5, 2, 1, 5, 4, 2, 4, 1], expected: [4, 1] },
    { input: [1, 2, 3, 4, 2, 3, 1, 4], expected: [1, 4] },
    { input: [1, 5, 3, 4, 3, 5, 4, 5, 2, 4], expected: [4, 5] },
    { input: [4, 5, 1, 2, 2, 4, 3, 4, 2, 3], expected: [2, 3] },
    { input: [1, 3, 3, 4, 1, 5, 3, 5, 2, 3], expected: [3, 5] },
    { input: [9, 10, 5, 8, 2, 6, 1, 5, 3, 8, 4, 9, 8, 10, 4, 10, 6, 8, 7, 9], expected: [4, 10] },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory === 0,
  feedback: {
    optimal: "Union-Find con compresión de camino y rango: cada arista cuesta O(α(n)), prácticamente constante.",
    slow: "Es correcto, pero sin compresión el árbol de padres puede degenerar en una cadena, y un DFS por arista cuesta O(n²).",
    hint: "Revisá qué pasa cuando una arista junta dos componentes que ya tenían nodos: estar visto no es estar conectado, y hay que comparar raíces, no padres.",
  },
};
