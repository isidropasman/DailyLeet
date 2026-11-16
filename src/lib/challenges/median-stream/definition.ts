import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "El del medio", difficulty: "Difícil", topic: "Heaps",
  description: "Llegan números de a uno. Después de cada uno, devolvé la mediana de todos los que llegaron. Con cantidad par, es el promedio exacto de los dos del medio (puede tener decimales).",
  example: "[5, 15, 1, 3]", expected: "[5, 10, 5, 4]",
  explanation: "Con 5 la mediana es 5. Con 5 y 15 es el promedio, 10. Con 1, 5, 15 es 5. Con 1, 3, 5, 15 es el promedio de 3 y 5: 4.",
  sample: { input: [5, 15, 1, 3] },
  constraints: ["0 ≤ nums.length ≤ 50.000", "−100.000 ≤ nums[i] ≤ 100.000", "Cada consulta tiene que costar O(log n)", "Con cantidad par, el promedio exacto (puede ser x.5)"],
  steps: [
    { title: "Enfoque", question: "¿Cómo seguís la mediana mientras llegan números?", options: [option("Dos mitades", "Max-heap con la mitad de abajo, min-heap con la de arriba."), option("Lista ordenada", "Inserción binaria en un array."), option("Promedio corrido", "La media se parece a la mediana."), option("Un heap acotado", "Guardar los ⌈i/2⌉ menores; la mediana es el tope.")] },
    { title: "Memoria", question: "¿Dónde guardás los números?", options: [option("Max-heap (negado) + min-heap", "Abajo guardás −x para que el tope sea el mayor."), option("Dos min-heaps", "Los dos con el comparador por defecto."), option("Array reordenado", "push y sort en cada inserción."), option("Deque ordenada por extremos", "Si es menor o igual al primero va adelante; si no, atrás.")] },
    { title: "Regla", question: "¿Cómo insertás y qué devolvés?", options: [option("Pasar por abajo y rebalancear", "x entra abajo, el mayor de abajo sube y, si arriba quedan más, uno baja. Par: promedio exacto."), option("Insertar abajo y balancear por tamaño", "Sin pasar por el otro heap."), option("Par → tope de abajo", "La mediana inferior alcanza."), option("Par → (a + b) >> 1", "División entera.")] },
  ],
  lesson: "Partís los números en dos mitades: abajo un max-heap, arriba un min-heap, con todo lo de abajo ≤ todo lo de arriba y a lo sumo uno más abajo. La mediana sale de los topes en O(1) y cada inserción cuesta O(log n). Para no romper el orden entre mitades, cada número pasa por abajo y el mayor de abajo sube; después se rebalancea por tamaño.",
  resource: { title: "Problema original: Find Median from Data Stream", url: "https://leetcode.com/problems/find-median-from-data-stream/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
