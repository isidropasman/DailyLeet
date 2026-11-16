import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "V = cantidad de nodos (n), E = cantidad de enlaces.",
  optimalTime: /^O\(\(V \+ E\) log V\)$/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(V·E)", space: "O(V + E)" }
    : approach > 1 ? { time: "O(V + E)", space: "O(V + E)" }
    : memory === 2 ? { time: "O(V²)", space: "O(V + E)" }
    : { time: "O((V + E) log V)", space: "O(V + E)" },
  keyIdea: {
    summary: "El ping llega a cada nodo por su camino más rápido, así que la respuesta es la mayor de las distancias mínimas desde k, o −1 si alguna queda en ∞. Dijkstra las calcula expandiendo siempre el nodo abierto más cercano.",
    detail: "Con pesos no negativos, el nodo abierto con menor distancia acumulada ya no puede mejorar: cualquier otro camino pasa por un nodo que está al menos igual de lejos. Por eso se cierra al sacarlo del heap, no al descubrirlo. El heap ordena por distancia acumulada; las entradas viejas (con una distancia que ya mejoró) se descartan al sacarlas.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Dijkstra con heap: cada nodo se cierra una vez y cada enlace se relaja una vez, O((V + E) log V)." },
      { verdict: "correcta pero más lenta", why: "Bellman-Ford relaja todos los enlaces n − 1 veces. Es correcto (y hasta soporta pesos negativos), pero cuesta O(V·E)." },
      broken("BFS minimiza la cantidad de saltos, no el tiempo: el primer camino que llega no es el más rápido.", [1, 1, 2, 10, 1, 3, 1, 3, 2, 1],
        "Desde el 1, el BFS llega al 2 directo con 10 ms y ya no lo mira más. El camino 1 → 3 → 2 tarda 2 ms. Devuelve 10; esperado 2.", { target: 3 }),
      broken("Sin reencolar, un nodo que mejora después de procesado no propaga la mejora a sus vecinos.", [1, 1, 2, 4, 1, 3, 1, 3, 2, 1, 2, 4, 1, 3, 4, 9],
        "Procesa el 2 con 4 ms y le da 5 al 4. Después el 3 baja al 2 a 2 ms, pero el 2 ya se procesó y no vuelve a la cola: el 4 se queda con 5 en vez de 3. Devuelve 5; esperado 3.", { target: 4 }),
    ],
    [
      { verdict: "óptima", why: "El heap ordena por distancia acumulada: el que sale es el nodo abierto más cercano, que ya no puede mejorar." },
      broken("Ordenar por el peso del último enlace es Prim: arma un árbol barato, no caminos cortos.", [1, 1, 2, 1, 2, 3, 1, 3, 4, 1, 4, 5, 1, 1, 6, 2, 6, 5, 1],
        "Los enlaces de la cadena 1 → 2 → 3 → 4 → 5 pesan 1, así que salen antes que el 1 → 6 de 2 ms. El 5 se cierra por la cadena con 4 ms, aunque 1 → 6 → 5 tarda 3. Devuelve 4; esperado 3.", { target: 6 }),
      { verdict: "correcta pero más lenta", why: "Buscar el mínimo abierto recorriendo todos los nodos da O(V²). Es más lento que el heap en grafos ralos, pero le gana cuando E ≈ V²." },
      broken("Un max-heap expande primero el nodo más lejano y lo cierra con una distancia que todavía podía mejorar.", [1, 1, 2, 10, 1, 3, 1, 3, 2, 1],
        "Desde el 1 entran el 2 con 10 ms y el 3 con 1 ms. Sale primero el 2 y queda cerrado en 10; cuando sale el 3, el atajo 3 → 2 ya no cuenta. Devuelve 10; esperado 2.", { target: 3 }),
    ],
    [
      { verdict: "óptima", why: "Un nodo queda fijo cuando sale del heap con su distancia actual; las entradas viejas se descartan. La respuesta es el máximo, o −1 si alguno quedó en ∞." },
      broken("Al descubrir un nodo todavía no sabés si hay un camino más rápido que llega por otro lado.", [1, 1, 2, 10, 1, 3, 1, 3, 2, 1],
        "Desde el 1 descubre el 2 con 10 ms y lo fija. El camino 1 → 3 → 2, de 2 ms, aparece después y lo ignora. Devuelve 10; esperado 2.", { target: 3 }),
      broken("Ignorar los ∞ esconde los nodos a los que el ping nunca llega: ahí había que devolver −1.", [2, 1, 2, 1],
        "Desde el 2 no sale ningún enlace: el 1 queda en ∞. El máximo de los alcanzados es 0. Devuelve 0; esperado −1.", { target: 2 }),
      broken("Los pings viajan en paralelo: el tiempo hasta todos es el del último, no la suma.", [2, 2, 1, 1, 2, 3, 1, 3, 4, 1],
        "Las distancias desde el 2 son 1, 0, 1 y 2. Las suma en vez de tomar la mayor. Devuelve 4; esperado 2.", { target: 4 }),
    ],
  ],
  tradeOffs: [
    { title: "Grafo denso", detail: "Con E ≈ V², el Dijkstra sin heap (buscar el mínimo a mano) es O(V²) y le gana al heap, que pasa a O(V² log V). Con 100 nodos y 6000 enlaces, este problema está cerca de ese punto." },
    { title: "Pesos negativos", detail: "Dijkstra deja de valer con un solo peso negativo: un nodo cerrado podría mejorar. Bellman-Ford sí funciona y además detecta ciclos negativos." },
    { title: "Pesos 0 y 1", detail: "Si los pesos son solo 0 o 1, un BFS con deque (0-1 BFS) da O(V + E): los de peso 0 van adelante y los de peso 1 atrás." },
  ],
  pattern: {
    heuristic: "Si ves «tiempo mínimo desde un origen» con pesos no negativos, pensá en Dijkstra: heap por distancia acumulada y cerrar al sacar.",
    detail: "Las tres decisiones que lo rompen se parecen mucho a la correcta: ordenar por el peso del enlace (Prim), cerrar al descubrir y usar BFS. Todas pasan en árboles con pesos iguales; las delata un atajo con más saltos y menos tiempo.",
  },
  related: [
    { title: "Path with Maximum Probability", url: "https://leetcode.com/problems/path-with-maximum-probability/" },
    { title: "Cheapest Flights Within K Stops", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
  ],
  interview: {
    question: "¿Y si E ≈ V²? ¿Cuál conviene?",
    answer: "El Dijkstra sin heap: buscar el mínimo abierto a mano cuesta O(V) por nodo, O(V²) en total, mientras que el heap paga log V por cada uno de los ~V² enlaces. En grafos ralos es al revés. Bellman-Ford, O(V·E) = O(V³), no conviene en ningún caso con pesos no negativos.",
  },
};
