import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "V = cantidad de materias (n), E = cantidad de correlativas.",
  optimalTime: /^O\(V \+ E\)$/,
  cost: ([approach]) =>
    approach === 2 ? { time: "O(V·(V + E))", space: "O(V + E)" }
    : approach === 3 ? { time: "O(V log V + E)", space: "O(V)" }
    : { time: "O(V + E)", space: "O(V + E)" },
  keyIdea: {
    summary: "Una materia se puede cursar cuando no le queda ninguna correlativa pendiente. Kahn cuenta cuántas le faltan a cada una y encola solo las que llegan a cero.",
    detail: "Al sacar una materia de la cola, descontás uno a cada dependiente; el que llega a cero entra a la cola. Las materias de un ciclo nunca llegan a cero, así que no salen: si el orden final tiene menos de n materias, hay un ciclo y devolvés []. Cada materia entra una vez y cada correlativa se descuenta una vez.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Kahn: encolás las materias sin pendientes y liberás a sus dependientes. Cada materia y cada correlativa se procesan una vez, O(V + E), y el conteo final detecta los ciclos." },
      broken("Un DFS con un solo «visitado» ordena bien un grafo sin ciclos, pero no distingue una arista hacia atrás: nunca se entera de que hay un ciclo.", [0, 0],
        "La materia 0 es correlativa de sí misma. El DFS la marca, ve la arista 0 → 0 hacia una materia ya visitada y la ignora. Devuelve [2, 1, 0]; esperado [].", { target: 3 }),
      { verdict: "correcta pero más lenta", why: "Cada pasada toma las materias que ya tienen todas sus correlativas aprobadas. Es correcto y detecta ciclos (una pasada sin avances), pero puede hacer V pasadas sobre todo el grafo: O(V·(V + E))." },
      broken("Tener menos correlativas no significa que ya estén aprobadas, y ordenar nunca detecta un ciclo.", [0, 0],
        "Las materias 1 y 2 tienen 0 correlativas y la 0 tiene 1, así que ordena [1, 2, 0] y nunca mira que la 0 depende de sí misma. Devuelve [1, 2, 0]; esperado [].", { target: 3 }),
    ],
    [
      { verdict: "óptima", why: "Desde cada requisito llegás a sus dependientes, que son los que hay que descontar cuando el requisito sale de la cola." },
      broken("Con las aristas invertidas, la cola arranca por las materias que nadie necesita y el orden sale al revés.", [1, 0],
        "La 1 queda sin contador y la 0 con 1: la cola arranca por la 1 y después libera a la 0. Devuelve [1, 0]; esperado [0, 1].", { target: 2 }),
      broken("Un booleano no cuenta cuántas correlativas faltan: la primera que se aprueba libera la materia, y cada requisito la vuelve a encolar.", [2, 0, 2, 1, 3, 2],
        "La 2 necesita a la 0 y a la 1. Sacar la 0 la libera y la encola; sacar la 1 la encola otra vez, y lo mismo pasa con la 3. Salen 6 materias de 4, así que concluye que hay un ciclo. Devuelve []; esperado [1, 0, 2, 3]. Con un ciclo de verdad, la cola no se vacía nunca (TLE).", { target: 4 }),
      broken("Guardar un solo dependiente por requisito pisa los anteriores: esas materias nunca se descuentan.", [1, 0, 2, 0, 3, 1, 3, 2],
        "La 0 tiene dos dependientes y el Map se queda solo con la 2. Sacar la 0 libera a la 2, pero la 1 queda con un pendiente para siempre, y la 3 también. Salen 2 de 4 materias. Devuelve []; esperado [0, 2, 1, 3].", { target: 4 }),
    ],
    [
      { verdict: "óptima", why: "Encolás todas las materias libres desde el principio y, al final, si no salieron las n, las que faltan están en un ciclo." },
      broken("El orden parcial no es una respuesta: si quedaron materias afuera, es porque hay un ciclo y había que devolver [].", [0, 0],
        "La 0 depende de sí misma y nunca llega a cero. Salen la 1 y la 2 y se devuelven sin chequear. Devuelve [1, 2]; esperado [].", { target: 3 }),
      broken("La materia 0 no tiene por qué ser la única sin correlativas: las otras libres nunca entran a la cola.", [],
        "Sin correlativas, las tres están libres, pero la cola arranca solo con la 0. Sale una materia de 3, así que concluye que hay un ciclo. Devuelve []; esperado [2, 1, 0].", { target: 3 }),
      broken("Encolar al primer descuento saca materias a las que todavía les falta otra correlativa, y así un ciclo pasa por un orden completo.", [1, 0, 2, 1, 3, 2, 1, 3],
        "La 1 necesita a la 0 y a la 3, que está en el ciclo 1 → 2 → 3 → 1. Sacar la 0 descuenta a la 1 y la encola aunque le falta la 3; después salen la 2 y la 3. Salen las 4. Devuelve [0, 1, 2, 3]; esperado [].", { target: 4 }),
    ],
  ],
  tradeOffs: [
    { title: "DFS con tres colores", detail: "El DFS en post-orden también es O(V + E) si distinguís «en curso» de «terminado»: una arista hacia un nodo en curso es un ciclo. Es la opción natural si además querés mostrar cuál es el ciclo." },
    { title: "Orden determinístico", detail: "Si hay que devolver el orden lexicográficamente menor, cambiás la cola por un min-heap: O((V + E) log V). La cola común devuelve cualquier orden válido." },
    { title: "Por niveles", detail: "Si procesás la cola por tandas, cada tanda es un cuatrimestre: la cantidad de tandas es la cantidad mínima de cuatrimestres para recibirte (LC 1136)." },
  ],
  pattern: {
    heuristic: "Si ves «orden que respete dependencias» o «¿se puede terminar todo?», pensá en orden topológico con Kahn.",
    detail: "El contador de pendientes es la invariante: un nodo sale cuando llega a cero, ni antes ni después. La detección de ciclos sale gratis: los nodos de un ciclo nunca llegan a cero.",
  },
  related: [
    { title: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/" },
    { title: "Alien Dictionary", url: "https://leetcode.com/problems/alien-dictionary/" },
  ],
  interview: {
    question: "¿Y si te piden la cantidad mínima de cuatrimestres, sin límite de materias por cuatrimestre?",
    answer: "Mismo Kahn, pero sacás la cola por niveles: todas las materias libres de un nivel se cursan juntas y liberan el siguiente. La cantidad de niveles es la respuesta, y es el camino más largo del grafo. Si quedan materias afuera, sigue habiendo un ciclo.",
  },
};
