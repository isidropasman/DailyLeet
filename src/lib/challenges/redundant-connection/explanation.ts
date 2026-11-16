import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de nodos (y de cables). α(n) es la inversa de Ackermann: menor que 5 para cualquier n real.",
  optimalTime: /^O\(n·α\(n\)\)$/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(n²)", space: "O(n)" }
    : approach === 2 ? { time: "O(n)", space: "O(n)" }
    : approach === 3 ? { time: "O(n log n)", space: "O(n)" }
    : memory === 0 ? { time: "O(n·α(n))", space: "O(n)" }
    : memory === 3 ? { time: "O(n)", space: "O(n)" }
    : { time: "O(n²)", space: "O(n)" },
  keyIdea: {
    summary: "Recorrés los cables en orden y unís componentes. El primer cable cuyos dos extremos ya tienen la misma raíz cierra el ciclo: ese es el que sobra.",
    detail: "Hay un único ciclo, y el cable que lo cierra al recorrer en orden es el último del ciclo en la entrada, que es justo el que pide el enunciado. «Misma componente» significa misma raíz en Union-Find. La compresión de camino y la unión por rango mantienen los árboles chatos, así que cada find es casi O(1).",
  },
  steps: [
    [
      { verdict: "óptima", why: "Union-Find en el orden de la entrada: el primer cable que une dos nodos ya conectados es el último del ciclo. Con compresión y rango, O(n·α(n))." },
      { verdict: "correcta pero más lenta", why: "Antes de agregar cada cable buscás con un DFS si ya hay camino entre u y v. Es correcto, pero cada búsqueda puede recorrer todo el grafo: O(n²)." },
      broken("Un extremo de grado ≥ 2 no significa que el cable esté en el ciclo: puede ser una rama que cuelga de él.", [1, 2, 2, 3, 1, 3, 3, 4, 4, 5],
        "El ciclo es 1-2-3. Los grados quedan 1:2, 2:2, 3:3, 4:2, 5:1. Desde el final, [4, 5] no sirve (el 5 tiene grado 1), pero [3, 4] sí, aunque es una rama. Devuelve [3, 4]; esperado [1, 3]."),
      broken("Ordenar cambia cuál cable cierra el ciclo: el que sobra depende del orden de la entrada, no del numérico.", [1, 2, 3, 4, 2, 3, 1, 4],
        "Ordenados quedan [1, 2], [1, 4], [2, 3], [3, 4], y el ciclo se cierra con [3, 4]. En la entrada, el último del ciclo es [1, 4]. Devuelve [3, 4]; esperado [1, 4]."),
    ],
    [
      { verdict: "óptima", why: "La compresión de camino aplana el árbol en cada find y la unión por rango evita cadenas largas: cada operación es O(α(n))." },
      { verdict: "correcta pero más lenta", why: "Sin compresión, find sube por la cadena de padres. El resultado es el mismo, pero uniendo siempre en la misma dirección el árbol puede degenerar en una cadena: O(n) por find, O(n²) en total." },
      broken("Copiar la etiqueta solo a u no re-etiqueta al resto de su componente: los nodos que ya estaban con u quedan con la etiqueta vieja.", [1, 2, 1, 3, 2, 3],
        "[1, 2] deja comp[1] = 2. [1, 3] pisa comp[1] = 3, pero el 2 sigue con etiqueta 2. En [2, 3] las etiquetas son 2 y 3, distintas, así que no lo detecta. Devuelve []; esperado [2, 3]."),
      broken("Haber visto los dos nodos no significa que estén conectados: un cable puede juntar dos componentes distintas.", [1, 2, 3, 4, 2, 3, 1, 4],
        "[1, 2] y [3, 4] son dos componentes separadas. [2, 3] tiene los dos extremos vistos, pero las une: no cierra ningún ciclo. Lo devuelve igual. Devuelve [2, 3]; esperado [1, 4]."),
    ],
    [
      { verdict: "óptima", why: "Dos nodos están conectados si tienen la misma raíz. Si no, unís las raíces, así cada componente sigue siendo un solo árbol." },
      broken("Unir nodos en vez de raíces pisa el padre de u y lo desengancha de su componente.", [1, 2, 1, 3, 2, 3],
        "[1, 2] deja parent[1] = 2. [1, 3] pisa parent[1] = 3, y el 2 queda solo. En [2, 3] las raíces son 2 y 3, distintas. Devuelve []; esperado [2, 3]."),
      broken("El padre directo no es la raíz: dos nodos de la misma componente pueden tener padres distintos.", [1, 2, 3, 4, 2, 3, 1, 4],
        "Después de unir todo, el 1 es la raíz y el 4 cuelga del 3. En [1, 4] compara parent[1] = 1 con parent[4] = 3, distintos, aunque los dos tienen raíz 1. Devuelve []; esperado [1, 4]."),
      broken("Si unís antes de preguntar, la pregunta siempre da verdadero: devuelve el primer cable.", [1, 2, 2, 1],
        "Une 1 y 2 y después pregunta si tienen la misma raíz: sí, porque los acaba de unir. Devuelve [1, 2]; esperado [2, 1]."),
    ],
  ],
  tradeOffs: [
    { title: "DFS en grafos chicos", detail: "Con pocas decenas de nodos, buscar un camino antes de cada cable es más fácil de revisar y también te da el ciclo completo. Union-Find paga cuando hay miles de cables o llegan de a uno." },
    { title: "Solo compresión o solo rango", detail: "Cualquiera de las dos por separado ya da O(log n) por operación. Juntas llegan a O(α(n)). En la práctica, la compresión sola suele alcanzar." },
    { title: "Grafo dirigido", detail: "Si los cables tienen dirección (LC 685), además del ciclo puede haber un nodo con dos padres. Union-Find sigue sirviendo, pero hay que separar esos dos casos." },
  ],
  pattern: {
    heuristic: "Si ves «¿este par ya está conectado?» mientras agregás aristas, pensá en Union-Find.",
    detail: "Union-Find responde conectividad incremental en O(α(n)). Lo que define la componente es la raíz: compará raíces y uní raíces. Haber visto un nodo o compartir el padre directo no alcanza.",
  },
  related: [
    { title: "Redundant Connection II", url: "https://leetcode.com/problems/redundant-connection-ii/" },
    { title: "Number of Provinces", url: "https://leetcode.com/problems/number-of-provinces/" },
  ],
  interview: {
    question: "¿Y si los cables llegan de a uno y tenés que avisar apenas aparece uno de más?",
    answer: "Es exactamente Union-Find online: cada cable nuevo es un find de cada extremo y, si las raíces difieren, un union. Avisás en el primer cable con raíces iguales. No necesitás la lista completa ni ordenar nada.",
  },
};
