import type { Judge } from "../module";

const get = (key: number) => [0, key, 0];
const put = (key: number, value: number) => [1, key, value];
const ops = (...list: number[][]) => list.flat();

export const lruCacheJudge: Judge = {
  cases: [
    { input: ops(put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)), target: 2, expected: [1, -1, -1, 3, 4] },
    { input: ops(get(1)), target: 1, expected: [-1] },
    { input: ops(put(1, 1), put(2, 2), get(1), get(2)), target: 1, expected: [-1, 2] },
    { input: ops(put(2, 1), put(1, 1), put(2, 3), put(4, 1), get(1), get(2)), target: 2, expected: [-1, 3] },
    { input: ops(put(1, 1), put(2, 2), put(1, 10), put(3, 3), get(1), get(2), get(3)), target: 2, expected: [10, -1, 3] },
    { input: ops(put(5, 5), put(1, 1), get(5), put(9, 9), get(1), get(5), get(9)), target: 2, expected: [5, -1, 5, 9] },
    { input: ops(put(1, 1), put(2, 2), put(3, 3), put(1, 4), put(4, 4), get(2), get(1)), target: 3, expected: [-1, 4] },
    { input: ops(put(2, 1), put(2, 2), get(2), put(1, 1), put(4, 1), get(2)), target: 2, expected: [2, -1] },
    { input: ops(put(7, 7), put(7, 8), get(7)), target: 1, expected: [8] },
    { input: ops(put(3, 3), put(1, 1), get(3), put(2, 2), get(1), get(3), get(2)), target: 2, expected: [3, -1, 3, 2] },
    { input: ops(put(1, 1), put(2, 2), put(3, 3), put(4, 4), get(4), get(3), get(2), get(1), put(5, 5), get(1), get(2), get(3), get(4), get(5)), target: 3, expected: [4, 3, 2, -1, -1, 2, 3, -1, 5] },
    { input: ops(get(2), put(2, 6), get(1), put(1, 5), put(1, 2), get(1), get(2)), target: 2, expected: [-1, -1, 2, 6] },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory !== 2,
  feedback: {
    optimal: "Un Map ordenado por recencia: get y put en O(1) cada uno.",
    slow: "Es correcto, pero mover una clave en un array de orden cuesta O(cap) por operación.",
    hint: "Revisá que get también refresque la clave, que actualizar una clave existente no desaloje a otra y que el orden sea el de uso, no el de las claves.",
  },
};
