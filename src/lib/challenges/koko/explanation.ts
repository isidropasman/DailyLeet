import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de pilas, max = la pila más grande",
  optimalTime: /^O\(n log max\)/,
  cost: ([approach]) =>
    approach === 1 ? { time: "O(n · max)", space: "O(1)" }
    : approach === 2 ? { time: "O(n)", space: "O(1)" }
    : approach === 3 ? { time: "O(n log n)", space: "O(n)" }
    : { time: "O(n log max)", space: "O(1)" },
  keyIdea: {
    summary: "Las horas totales nunca suben cuando la velocidad sube. «Alcanza en h horas» es falso hasta cierto v y verdadero desde ahí: buscás ese primer v con búsqueda binaria entre 1 y la pila más grande.",
    detail: "Cada pila lleva ⌈pila / v⌉ horas, porque la hora que sobra se pierde. Si mid alcanza, puede ser la respuesta: hi = mid la conserva dentro del rango. Si no alcanza, ninguna velocidad menor sirve: lo = mid + 1. El rango empieza en 1 porque, con muchas horas, la velocidad mínima puede ser más chica que cualquier pila.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Factible es monótono en v: la búsqueda binaria entre 1 y max encuentra la primera velocidad que alcanza en O(n log max)." },
      { verdict: "correcta pero más lenta", why: "Probar de 1 hacia arriba encuentra la misma velocidad, pero puede hacer hasta max pruebas de O(n) cada una: O(n · max)." },
      broken("Total sobre horas supone que podés repartir tareas entre pilas en la misma hora; cada hora atiende una sola pila.", [30, 11, 23, 4, 20],
        "Suma 88 y calcula ⌈88 / 5⌉ = 18. A velocidad 18 las pilas llevan 2 + 1 + 2 + 1 + 2 = 8 horas, más que 5. Devuelve 18; esperado 30.", { target: 5 }),
      broken("La respuesta no tiene por qué ser el tamaño de una pila: suele quedar entre dos.", [1000],
        "La única candidata es 1000, así que la devuelve. A velocidad 334 ya alcanza: ⌈1000 / 334⌉ = 3. Devuelve 1000; esperado 334.", { target: 3 }),
    ],
    [
      { verdict: "óptima", why: "⌈pila / v⌉: si quedan menos de v tareas, esa hora cuenta igual." },
      broken("La división entera descarta la última hora, la que termina el resto de la pila.", [1000],
        "Con v = 251 calcula ⌊1000 / 251⌋ = 3 horas y cree que alcanza. En realidad son 4. Devuelve 251; esperado 334.", { target: 3 }),
      broken("⌊pila / v⌋ + 1 se parece a ⌈pila / v⌉, pero suma una hora de más cuando la división es exacta.", [9, 8, 7],
        "Con v = 4 cuenta 3 + 3 + 2 = 8 horas, porque el 8 divide exacto y le suma una de más. En realidad son 7. Devuelve 5; esperado 4.", { target: 7 }),
      broken("Redondear al más cercano pierde la hora extra cuando el resto es menor que la mitad.", [1000],
        "Con v = 286, 1000 / 286 ≈ 3,5 redondea a 3 y cree que alcanza. En realidad son 4 horas. Devuelve 286; esperado 334.", { target: 3 }),
    ],
    [
      { verdict: "óptima", why: "Si mid alcanza, hi = mid lo conserva como candidata; si no, lo = mid + 1. El while termina con lo = hi en la primera velocidad que alcanza." },
      broken("hi = mid − 1 descarta mid justo cuando alcanza, y mid puede ser la respuesta.", [5, 5, 5, 5],
        "mid = 3 alcanza (8 horas) y lo descarta: hi = 2. Después mid = 1 no alcanza y el while corta en lo = 2, que lleva 12 horas. Devuelve 2; esperado 3.", { target: 8 }),
      broken("Con muchas horas, la velocidad mínima puede ser más chica que la pila más chica.", [1000],
        "El rango empieza y termina en 1000, así que no busca nada. Devuelve 1000; esperado 334.", { target: 3 }),
      broken("La primera velocidad que alcanza no es la mínima: la binaria todavía no terminó de achicar el rango.", [1000],
        "La primera prueba es mid = 500, que alcanza en 2 horas, y la devuelve. Devuelve 500; esperado 334.", { target: 3 }),
    ],
  ],
  tradeOffs: [
    { title: "Probar de a una con respuestas chicas", detail: "Si sabés que la respuesta es chica (por ejemplo, h apenas mayor que n con pilas acotadas), el barrido lineal es más simple y no tiene bordes. Con pilas de 10⁹ no termina." },
    { title: "Acotar el rango", detail: "lo puede arrancar en ⌈total / h⌉ y hi en la pila más grande. No cambia la complejidad, pero ahorra iteraciones. Ojo: el total con pilas de 10⁹ desborda un int de 32 bits." },
    { title: "Búsqueda sobre la respuesta", detail: "El mismo patrón sirve para «capacidad mínima del camión», «carga máxima por día» o «distancia mínima entre routers»: si tenés un chequeo monótono barato, buscás binariamente el parámetro." },
  ],
  pattern: {
    heuristic: "Si ves «el mínimo valor que cumple X» y cumplir X es monótono, pensá en búsqueda binaria sobre la respuesta.",
    detail: "No buscás en el array: buscás en el rango de respuestas posibles, con una función que dice si un valor alcanza. El invariante es que la respuesta siempre queda en [lo, hi]: por eso hi = mid y no mid − 1.",
  },
  related: [
    { title: "Capacity To Ship Packages Within D Days", url: "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/" },
    { title: "Split Array Largest Sum", url: "https://leetcode.com/problems/split-array-largest-sum/" },
  ],
  interview: {
    question: "¿Y si la velocidad pudiera ser un número real y te piden la mínima con precisión 10⁻⁶?",
    answer: "Misma binaria sobre un rango continuo: iterás un número fijo de veces (unas 60 alcanzan) o hasta que hi − lo < 10⁻⁶, con hi = mid si alcanza y lo = mid si no. Ya no hay + 1 ni − 1: los bordes se mueven a mid.",
  },
};
