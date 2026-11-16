import type { Judge } from "../module";

export const courseScheduleJudge: Judge = {
  cases: [
    { input: [1, 0, 2, 0, 3, 1, 3, 2], target: 4, expected: [0, 2, 1, 3] },
    { input: [], target: 1, expected: [0] },
    { input: [1, 0], target: 2, expected: [0, 1] },
    { input: [1, 0, 0, 1], target: 2, expected: [] },
    { input: [], target: 3, expected: [2, 1, 0] },
    { input: [1, 0, 2, 1], target: 3, expected: [0, 1, 2] },
    { input: [0, 1, 1, 2, 2, 0], target: 3, expected: [] },
    { input: [1, 0, 2, 1, 3, 2, 1, 3], target: 4, expected: [] },
    { input: [1, 0, 2, 0, 3, 1, 3, 2, 4, 3], target: 5, expected: [0, 2, 1, 3, 4] },
    { input: [2, 0, 2, 1, 3, 2], target: 4, expected: [1, 0, 2, 3] },
    { input: [5, 4, 4, 3, 1, 0], target: 6, expected: [3, 4, 5, 2, 0, 1] },
    { input: [0, 0], target: 3, expected: [] },
  ],
  efficient: ([approach]) => approach === 0,
  // Any topological order is valid; `expected` is one of them, and [] only when there is a cycle.
  compare: (actual, item) => {
    const n = item.target ?? 0;
    const pairs = Array.isArray(item.input) ? item.input : [];
    if (!Array.isArray(actual)) return { passed: false };
    if (Array.isArray(item.expected) && item.expected.length === 0) {
      return actual.length === 0 ? { passed: true } : { passed: false, reason: "Las correlativas tienen un ciclo: no hay orden posible y había que devolver []." };
    }
    const position = new Map(actual.map((course, index) => [course, index]));
    if (actual.length !== n || position.size !== n || actual.some(course => !Number.isInteger(course) || course < 0 || course >= n)) {
      return { passed: false, reason: `No es un orden de las ${n} materias: cada una tiene que aparecer exactamente una vez.` };
    }
    for (let i = 0; i < pairs.length; i += 2) {
      const course = pairs[i];
      const required = pairs[i + 1];
      if ((position.get(required) ?? 0) > (position.get(course) ?? 0)) return { passed: false, reason: `La materia ${course} aparece antes que su correlativa ${required}.` };
    }
    return { passed: true };
  },
  feedback: {
    optimal: "Cada materia entra a la cola una vez y cada correlativa se descuenta una vez: O(V + E).",
    slow: "Las pasadas sucesivas son correctas, pero cada pasada recorre todo el grafo: O(V·(V + E)).",
    hint: "Revisá los ciclos que no arrancan en la raíz, los autociclos y las materias sueltas: una materia entra a la cola recién cuando no le queda ninguna correlativa.",
  },
};
