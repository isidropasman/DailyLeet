import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "El rectángulo escondido", difficulty: "Brutal", topic: "Stacks",
  description: "Cada barra del histograma tiene ancho 1 y la altura que indica el array. Devolvé el área del rectángulo más grande que entra completo dentro del histograma.",
  example: "[2, 1, 5, 6, 2, 3]", expected: "10",
  explanation: "Las barras 5 y 6 (posiciones 2 y 3) forman un rectángulo de altura 5 y ancho 2: área 10. Ningún otro es más grande.",
  sample: { input: [2, 1, 5, 6, 2, 3] },
  constraints: ["0 ≤ heights.length ≤ 10⁵", "0 ≤ heights[i] ≤ 10⁴"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el rectángulo más grande?", options: [option("Pila creciente", "Cada barra sabe dónde termina cuando llega una más baja."), option("Expandir desde cada barra", "Ir a izquierda y derecha mientras no baje."), option("Dos punteros desde los extremos", "Como en Container With Most Water."), option("Altura × barras que la alcanzan", "Contar cuántas barras son al menos igual de altas.")] },
    { title: "Memoria", question: "¿Qué guardás en la pila?", options: [option("Índices, con centinela 0 al final", "Una barra de altura 0 vacía la pila."), option("Alturas", "El ancho es cuántas sacaste."), option("Índices, sin centinela", "Lo que queda en la pila no importa."), option("Pila decreciente", "Sacás cuando llega una más alta.")] },
    { title: "Regla", question: "¿Qué ancho tiene la barra que sacás?", options: [option("i − nuevoTope − 1", "O i si la pila queda vacía."), option("i − sacado", "Desde la barra que sacaste."), option("i − nuevoTope", "O i si la pila queda vacía."), option("Pila vacía → ancho 1", "Si no queda nadie, solo ella.")] },
  ],
  lesson: "Para cada barra, el rectángulo más grande con su altura va desde la primera barra más baja a su izquierda hasta la primera más baja a su derecha. Una pila de índices con alturas crecientes da las dos cosas: la barra que llega y la saca es el borde derecho, y el nuevo tope es el izquierdo. Un 0 al final vacía la pila. Cada índice entra y sale una vez: O(n).",
  resource: { title: "Problema original: Largest Rectangle in Histogram", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
