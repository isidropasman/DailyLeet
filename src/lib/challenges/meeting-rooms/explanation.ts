import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de reuniones, T = el fin más tardío",
  optimalTime: /^O\(n log n\)/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(n²)", space: "O(1)" }
    : approach > 1 ? { time: "O(n log n)", space: "O(n)" }
    : memory === 2 ? { time: "O(n + T)", space: "O(T)" }
    : { time: "O(n log n)", space: "O(n)" },
  keyIdea: {
    summary: "Las salas que necesitás son el máximo de reuniones activas al mismo tiempo. Cada reunión aporta +1 en su inicio y −1 en su fin: ordenás los eventos, acumulás y el pico es la respuesta.",
    detail: "Como el intervalo es [inicio, fin), una reunión que termina a las 5 ya no ocupa la sala a las 5. Por eso, ante un empate de tiempo, el −1 va antes que el +1. Ese desempate tiene que estar en la comparación del sort: si dependés del orden de entrada, el resultado cambia según cómo llegaron las reuniones.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Ordenar 2n eventos cuesta O(n log n) y después una pasada acumula las reuniones activas: el máximo es la cantidad de salas." },
      { verdict: "correcta pero más lenta", why: "El pico de ocupación siempre arranca en algún inicio, así que contar las activas en cada inicio es correcto. Cuesta O(n²)." },
      broken("Comparar solo con la reunión anterior mide una cadena de solapes, no cuántas hay activas a la vez.", [0, 2, 1, 4, 3, 6],
        "[1, 4) pisa a [0, 2) y [3, 6) pisa a [1, 4): la racha llega a 3. Pero [0, 2) ya terminó cuando empieza [3, 6). Devuelve 3; esperado 2."),
      broken("Fusionar cuenta grupos de reuniones que se tocan, no salas: dos reuniones seguidas que no se pisan comparten sala.", [1, 5, 5, 10],
        "[5, 10) no se pisa con [1, 5), así que arma un segundo grupo. Una sola sala alcanza para las dos. Devuelve 2; esperado 1."),
    ],
    [
      { verdict: "óptima", why: "Los pares (tiempo, ±1) alcanzan para reconstruir la ocupación en cada momento, y ocupan O(n)." },
      broken("Comparar con el último fin ignora las salas que se liberaron antes: solo mirás la reunión anterior.", [0, 2, 1, 4, 3, 6],
        "[3, 6) empieza antes del fin de [1, 4) y abre una sala nueva, aunque la de [0, 2) ya está libre. Devuelve 3; esperado 2."),
      { verdict: "correcta pero más lenta", why: "diff[inicio]++ y diff[fin]−− suman en el mismo minuto, así que el empate se resuelve solo. Es correcto, pero recorre todos los minutos hasta el último fin: O(n + T) de tiempo y O(T) de memoria, con T hasta 10⁶." },
      broken("El fin ya es abierto: correr el cierre a fin + 1 hace que una reunión siga ocupando la sala un minuto de más.", [1, 5, 5, 10],
        "El cierre de [1, 5) queda en 6, después de la apertura de [5, 10) en 5: las dos se pisan. Devuelve 2; esperado 1."),
    ],
    [
      { verdict: "óptima", why: "Con el fin abierto, una reunión que termina a las 5 libera la sala antes de que entre la que empieza a las 5: ordenar por (tiempo, delta) pone el −1 primero." },
      broken("Si la apertura va antes que el cierre, en un empate las dos reuniones cuentan juntas un instante.", [1, 5, 5, 10],
        "A las 5 suma la apertura de [5, 10) antes de restar el cierre de [1, 5): llega a 2. Devuelve 2; esperado 1."),
      broken("Al final del barrido todas las reuniones terminaron: el contador siempre vuelve a 0. La respuesta es el pico.", [7, 10],
        "Sube a 1 en el 7 y baja a 0 en el 10. Devuelve 0; esperado 1."),
      broken("Un sort estable conserva el orden de entrada en los empates, y ese orden depende de cómo llegaron las reuniones.", [5, 10, 1, 5],
        "La apertura del 5 se generó antes que el cierre del 5, porque [5, 10) llegó primero. El sort la deja adelante y cuenta 2. Devuelve 2; esperado 1."),
    ],
  ],
  tradeOffs: [
    { title: "Min-heap de fines", detail: "Ordenar por inicio y guardar en un min-heap el fin de cada sala ocupada también es O(n log n). Además te dice qué sala asignar a cada reunión, cosa que el barrido de eventos no hace." },
    { title: "Array de diferencias con tiempos chicos", detail: "Si los tiempos están acotados (por ejemplo, minutos de un día: T = 1440), el array de diferencias es O(n + T) sin ordenar nada y es más rápido que el sort." },
    { title: "Dos arrays ordenados", detail: "Ordenar inicios y fines por separado y avanzar con dos punteros evita armar pares. El desempate queda en la comparación: si inicio < fin, entra una reunión; si no, sale una." },
  ],
  pattern: {
    heuristic: "Si ves «cuántos intervalos se pisan como máximo», pensá en un barrido de eventos: +1 al abrir, −1 al cerrar, ordenados.",
    detail: "Lo que se pisa en un instante es la suma de los eventos anteriores. Lo difícil es el empate: decidí si el intervalo es abierto o cerrado en el fin y ponelo explícito en la comparación del sort.",
  },
  related: [
    { title: "Car Pooling", url: "https://leetcode.com/problems/car-pooling/" },
    { title: "Minimum Number of Arrows to Burst Balloons", url: "https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/" },
  ],
  interview: {
    question: "¿Y si además tenés que decir qué sala usa cada reunión?",
    answer: "Ordenás por inicio y mantenés un min-heap de (fin, sala) con las salas ocupadas. Para cada reunión, si el fin más temprano es ≤ su inicio, reusás esa sala; si no, abrís una nueva. Sigue siendo O(n log n) y la cantidad de salas abiertas es la misma respuesta.",
  },
};
