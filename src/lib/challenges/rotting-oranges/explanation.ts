import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "m = filas, n = columnas, k = frutas con moho al empezar.",
  optimalTime: /^O\(m · n\)$/,
  cost: ([approach]) =>
    approach === 1 ? { time: "O((m · n)²)", space: "O(m · n)" }
    : approach === 2 ? { time: "O(k · m · n)", space: "O(m · n)" }
    : { time: "O(m · n)", space: "O(m · n)" },
  keyIdea: {
    summary: "El minuto en que cae cada fruta sana es su distancia a la fruta con moho más cercana. Un BFS que arranca con todas las fuentes en la cola calcula todas esas distancias a la vez.",
    detail: "La cola procesa por niveles: el nivel 0 son las frutas con moho del principio, el nivel 1 las sanas que tocan a alguna, y así. Cada sana se marca al encolarla, así que entra una sola vez y con su minuto mínimo. Cortás cuando no quedan sanas; si la cola se vacía antes, las que quedan nunca se contagian: −1.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Todas las fuentes arrancan juntas en la cola, así que cada nivel es un minuto real. Cada celda entra una vez: O(m · n)." },
      { verdict: "correcta pero más lenta", why: "Cada minuto contagia exactamente a las vecinas de las que ya tienen moho, así que da lo mismo. Pero recorre la grilla entera por minuto, y puede haber m · n minutos: O((m · n)²)." },
      broken("Cada fruta la contagia la fuente más cercana: hay que tomar el mínimo por celda, no el BFS más largo de una sola fuente.", [2, 1, 1, 1, 2],
        "Solo desde la izquierda, la tercera sana cae en el minuto 3; solo desde la derecha, también. Pero las dos contagian a la vez y se cruzan en el medio a los 2. Devuelve 3; esperado 2.", { target: 5 }),
      broken("La pila llega a cada celda por el primer camino que explora, no por el más corto, y le asigna ese minuto.", [2, 1, 1, 1],
        "Desde la esquina, la pila sigue por la derecha y baja: llega a la de abajo a la izquierda en el minuto 3, aunque está pegada a la esquina. Devuelve 3; esperado 2.", { target: 2 }),
    ],
    [
      { verdict: "óptima", why: "Arriba, abajo, izquierda y derecha, chequeando fila y columna: en la grilla aplanada, i + 1 en la última columna sería la fila de abajo." },
      broken("El moho no pasa en diagonal: con 8 direcciones, algunas sanas se contagian un minuto antes.", [2, 1, 1, 1],
        "La esquina con moho toca en diagonal a la de abajo a la derecha y la contagia en el minuto 1. En realidad le llega por un costado en el minuto 2. Devuelve 1; esperado 2.", { target: 2 }),
      broken("El contagio va para los cuatro lados: una sana a la izquierda o arriba del moho nunca se alcanza.", [1, 2],
        "La sana está a la izquierda de la que tiene moho, y solo mirás derecha y abajo. Nadie la contagia. Devuelve −1; esperado 1.", { target: 2 }),
      broken("En la grilla aplanada, i + 1 desde la última columna es el principio de la fila siguiente: el índice existe pero no es vecina.", [0, 2, 1, 0],
        "El moho está al final de la fila 0. i + 1 = 2 es la primera celda de la fila 1, que solo la toca en diagonal, y la contagia igual. Devuelve 1; esperado −1.", { target: 2 }),
    ],
    [
      { verdict: "óptima", why: "Cada nivel de la cola es un minuto y cortás apenas no quedan sanas. Si la cola se vacía con sanas adentro, nadie las alcanza: −1." },
      broken("Si la cola se vacía con sanas todavía en la grilla, esas frutas nunca se contagian y la respuesta es −1.", [1],
        "No hay moho: la cola arranca vacía y los minutos quedan en 0, pero la única fruta sigue sana. Devuelve 0; esperado −1.", { target: 1 }),
      broken("El último nivel de la cola no contagia a nadie: seguir hasta vaciarla suma un minuto de más.", [2],
        "No hay sanas, pero la cola tiene la fruta con moho: procesa ese nivel y suma un minuto que no contagió nada. Devuelve 1; esperado 0.", { target: 1 }),
      broken("Sin moho y sin sanas, no hay nada que contagiar: la respuesta es 0, no −1.", [0],
        "La grilla es un hueco. El atajo ve la cola vacía y devuelve −1 sin mirar que no quedaba ninguna sana. Devuelve −1; esperado 0.", { target: 1 }),
    ],
  ],
  tradeOffs: [
    { title: "Simular cuando la grilla es chica", detail: "En un juego por turnos con una grilla de 10 × 10 que cambia cada turno, recorrerla entera por minuto es simple y alcanza. Con 1000 × 1000 y propagación lenta, no termina." },
    { title: "Distancias por celda", detail: "Si además necesitás el minuto en que cae cada fruta (por ejemplo, para animarlo), guardá dist[] en vez de contar niveles. Es el mismo BFS, con O(m · n) de memoria extra." },
    { title: "Contagio con tiempos distintos", detail: "Si el contagio tarda distinto según la celda, la cola ya no alcanza: necesitás Dijkstra multi-fuente con un heap, O(m · n log(m · n))." },
  ],
  pattern: {
    heuristic: "Si ves «varias fuentes que se expanden a la vez» y preguntan cuánto tarda en cubrir todo, pensá en BFS multi-fuente.",
    detail: "Meter todas las fuentes en la cola al principio equivale a un nodo virtual conectado a todas: un solo BFS da la distancia de cada celda a la fuente más cercana. El máximo de esas distancias es el tiempo total.",
  },
  related: [
    { title: "Walls and Gates", url: "https://leetcode.com/problems/walls-and-gates/" },
    { title: "01 Matrix", url: "https://leetcode.com/problems/01-matrix/" },
    { title: "As Far from Land as Possible", url: "https://leetcode.com/problems/as-far-from-land-as-possible/" },
  ],
  interview: {
    question: "¿Y si el moho también pasara en diagonal?",
    answer: "Mismo BFS multi-fuente, con 8 direcciones en vez de 4: la opción «Las 8 direcciones» pasa a ser la correcta. La complejidad no cambia, O(m · n), porque cada celda sigue entrando una vez a la cola.",
  },
};
