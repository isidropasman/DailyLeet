import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de tramos, T = el fin más tardío",
  optimalTime: /^O\(n log n\)/,
  cost: ([approach, , merge]) =>
    approach === 1 ? { time: "O(n³)", space: "O(n)" }
    : approach === 2 ? { time: "O(n · T)", space: "O(T)" }
    : approach === 3 ? { time: "O(n)", space: "O(n)" }
    : merge === 2 ? { time: "O(n²)", space: "O(n)" }
    : { time: "O(n log n)", space: "O(n)" },
  keyIdea: {
    summary: "Con los tramos ordenados por inicio, uno nuevo solo puede pisar al último que armaste: los anteriores terminan antes de que ese empiece. Alcanza con comparar contra el fin del último y estirarlo.",
    detail: "El fin del último es el máximo de todos los fines del grupo, no el del tramo más reciente: un tramo puede quedar entero adentro de otro. Por eso se actualiza con max. Y como los extremos son cerrados, tocarse en el borde (inicio = fin) ya es compartir un punto.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Ordenar cuesta O(n log n). Después, una sola pasada pega cada tramo al último o abre uno nuevo." },
      { verdict: "correcta pero más lenta", why: "Unir pares que se pisan hasta que no cambie nada llega al mismo resultado. Pero cada pasada compara todos contra todos: O(n³) en el peor caso." },
      broken("Una línea de puntos enteros no distingue «se tocan» de «son vecinos»: entre [1, 2] y [3, 4] no queda ningún entero libre.", [1, 2, 3, 4],
        "Pinta el 1, el 2, el 3 y el 4. No hay ningún punto vacío entre los dos tramos y los lee como un solo bloque. Devuelve [1, 4]; esperado [1, 2, 3, 4]."),
      broken("Sin ordenar, comparar con el último no alcanza: un tramo que llega después puede estar entero antes que él.", [2, 3, 0, 1],
        "Arranca con [2, 3]. [0, 1] empieza en 0 ≤ 3 y se pega, aunque termina antes de que empiece [2, 3]. Devuelve [2, 3]; esperado [0, 1, 2, 3]."),
    ],
    [
      { verdict: "óptima", why: "Se pega si comparte al menos un punto con el último. Con extremos cerrados, tocarse en el borde ya es compartir uno." },
      broken("Con < exigís que se pisen de verdad, pero [1, 4] y [4, 5] comparten el 4.", [1, 4, 4, 5],
        "[4, 5] empieza en 4, que no es < 4: abre un tramo nuevo. Devuelve [1, 4, 4, 5]; esperado [1, 5]."),
      broken("El tramo anterior de la lista puede haber quedado adentro del último: su fin no es el fin del grupo.", [1, 10, 2, 3, 4, 5],
        "[2, 3] se pega a [1, 10]. [4, 5] se compara con [2, 3]: 4 > 3 y abre un tramo nuevo, aunque [1, 10] lo cubre. Devuelve [1, 10, 4, 5]; esperado [1, 10]."),
      broken("Los tramos son continuos: entre 2 y 3 hay un hueco aunque no haya enteros en el medio.", [1, 2, 3, 4],
        "3 ≤ 2 + 1, así que [3, 4] se pega a [1, 2]. Devuelve [1, 4]; esperado [1, 2, 3, 4]."),
    ],
    [
      { verdict: "óptima", why: "El tramo nuevo puede terminar antes que el último: el max conserva el fin más lejano del grupo." },
      broken("El tramo que llega empieza después, pero no tiene por qué terminar después.", [1, 10, 2, 3],
        "[2, 3] se pega a [1, 10] y el fin pasa a 3: se pierde del 4 al 10. Devuelve [1, 3]; esperado [1, 10]."),
      { verdict: "correcta pero más lenta", why: "Recorrer todos los tramos del grupo da el mismo máximo. Pero si todo se pisa, en cada paso recorrés el grupo entero: O(n²)." },
      broken("Que se pisen no quiere decir que el nuevo quede adentro: puede estirar el fin.", [1, 4, 4, 5],
        "[4, 5] se pega a [1, 4] y se descarta: el fin queda en 4 y se pierde el 5. Devuelve [1, 4]; esperado [1, 5]."),
    ],
  ],
  tradeOffs: [
    { title: "Ordenar en el lugar", detail: "Si podés modificar la entrada, ordenás los pares ahí mismo y escribís el resultado encima con un índice de escritura. Te queda la memoria del sort, sin una lista aparte." },
    { title: "Tramos que llegan de a uno", detail: "Si los tramos llegan en streaming, reordenar todo en cada llegada es O(n log n) por tramo. Un árbol ordenado por inicio (TreeMap) inserta y fusiona con los vecinos en O(log n) amortizado." },
    { title: "Línea de tiempo con tiempos chicos", detail: "Si T está acotado (minutos de un día), un array de diferencias pinta la línea en O(n + T) sin ordenar. Con extremos cerrados, marcá puntos y huecos por separado (2t y 2t + 1) para que [1, 2] y [3, 4] no se peguen." },
  ],
  pattern: {
    heuristic: "Si ves «unir intervalos que se pisan», pensá en ordenar por inicio y comparar solo con el último que armaste.",
    detail: "Ordenar convierte una pregunta de todos contra todos en una de vecinos. Lo difícil son los bordes: decidí si tocarse cuenta como pisarse y acordate de que un tramo puede quedar entero adentro de otro.",
  },
  related: [
    { title: "Insert Interval", url: "https://leetcode.com/problems/insert-interval/" },
    { title: "Non-overlapping Intervals", url: "https://leetcode.com/problems/non-overlapping-intervals/" },
  ],
  interview: {
    question: "¿Y si dos tramos que solo se tocan en el borde no se tuvieran que unir, como reservas [inicio, fin) donde una termina justo cuando empieza la otra?",
    answer: "Cambia solo la comparación: el tramo se pega si inicio < fin del último. Es justo la opción «inicio < fin del último», que acá es incorrecta y en esa variante pasa a ser la correcta. El resto sigue igual: ordenar y barrer en O(n log n).",
  },
};
