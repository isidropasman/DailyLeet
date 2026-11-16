import { broken, type Explanation } from "../../explanation-types";

const get = (key: number) => [0, key, 0];
const put = (key: number, value: number) => [1, key, value];
const ops = (...list: number[][]) => list.flat();

const updateThenNew = ops(put(2, 1), put(1, 1), put(2, 3), put(4, 1), get(1), get(2));
const frequentButOld = ops(put(2, 1), put(2, 2), get(2), put(1, 1), put(4, 1), get(2));

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "q = cantidad de operaciones, cap = capacidad",
  optimalTime: /^O\(1\)/,
  cost: ([approach, memory]) =>
    approach === 1 || (approach === 0 && memory === 2) ? { time: "O(cap) por operación", space: "O(cap)" }
    : approach === 3 ? { time: "O(cap) por desalojo", space: "O(cap)" }
    : { time: "O(1) por operación", space: "O(cap)" },
  keyIdea: {
    summary: "Un Map de JS itera en orden de inserción. Si en cada get y put borrás la clave y la reinsertás, el primer elemento es siempre el usado hace más tiempo.",
    detail: "Borrar y reinsertar mueve la clave al final en O(1), así que el Map es a la vez el hashmap y la lista de recencia. Desalojás después de insertar y solo si te pasaste: actualizar una clave existente no cambia el tamaño y no tiene que sacar a nadie. En Java es LinkedHashMap; en C++, hashmap + lista doblemente enlazada.",
  },
  steps: [
    [
      { verdict: "óptima", why: "El orden de inserción del Map es el orden de uso: mover una clave al final y sacar la primera son O(1)." },
      { verdict: "correcta pero más lenta", why: "El orden en un array es correcto, pero buscar la clave para moverla cuesta O(cap) en cada operación." },
      broken("FIFO desaloja la que entró primero aunque la hayas usado después: ni get ni put la refrescan.", updateThenNew,
        "put(2, 3) actualiza la 2 pero la deja primera en la cola. put(4, 1) desaloja a la 2 en vez de a la 1. Devuelve [1, −1]; esperado [−1, 3].", { target: 2 }),
      broken("LFU no es LRU: una clave usada muchas veces hace rato sobrevive a una recién usada.", frequentButOld,
        "La 2 suma tres usos y la 1 uno solo. put(4, 1) desaloja a la 1, aunque la 2 es la menos reciente. Devuelve [2, 2]; esperado [2, −1].", { target: 2 }),
    ],
    [
      { verdict: "óptima", why: "Map + borrar y reinsertar: el primero del Map es el más viejo y cada operación es O(1)." },
      broken("En un objeto JS las claves enteras se iteran de menor a mayor, no por orden de inserción: Object.keys(cache)[0] es la clave más chica.", frequentButOld,
        "Antes de put(4, 1) el objeto tiene {1, 2}. Object.keys da [\"1\", \"2\"] y desaloja a la 1, la más reciente. Devuelve [2, 2]; esperado [2, −1].", { target: 2 }),
      { verdict: "correcta pero más lenta", why: "El array de orden da el mismo resultado, pero indexOf y splice cuestan O(cap) por operación." },
      broken("Un contador propio suma también cuando actualizás una clave que ya estaba: cree que la caché está llena cuando no lo está.", ops(put(7, 7), put(7, 8), get(7)),
        "put(7, 8) lleva el contador a 2 con una sola clave. Como 2 > 1, desaloja a la más vieja: la 7 que acaba de escribir. Devuelve [−1]; esperado [8].", { target: 1 }),
    ],
    [
      { verdict: "óptima", why: "Leer y escribir mueven la clave al final. Desalojás después de insertar y solo si te pasaste de capacidad." },
      broken("Si get no refresca, una clave leída recién sigue figurando como vieja.", ops(put(5, 5), put(1, 1), get(5), put(9, 9), get(1), get(5), get(9)),
        "get(5) lee la 5 pero no la mueve. put(9, 9) desaloja a la 5 en vez de a la 1. Devuelve [5, 1, −1, 9]; esperado [5, −1, 5, 9].", { target: 2 }),
      broken("Desalojar antes de insertar también saca a alguien cuando el put actualiza una clave existente, que no cambia el tamaño.", ops(get(2), put(2, 6), get(1), put(1, 5), put(1, 2), get(1), get(2)),
        "Con {2, 1} llena, put(1, 2) desaloja a la 2 antes de actualizar la 1. Devuelve [−1, −1, 2, −1]; esperado [−1, −1, 2, 6].", { target: 2 }),
      broken("El último de la estructura es el más reciente: sacarlo es lo contrario de LRU.", updateThenNew,
        "Después de put(4, 1) el orden es 1, 2, 4. Desaloja a la 2, la más reciente antes de la 4. Devuelve [1, −1]; esperado [−1, 3].", { target: 2 }),
    ],
  ],
  tradeOffs: [
    { title: "Lista doble + hashmap", detail: "Fuera de JS (o si necesitás moverte desde un nodo al vecino) se implementa a mano: el hashmap apunta al nodo y la lista mantiene el orden. Es lo que hace LinkedHashMap por dentro." },
    { title: "LRU aproximado", detail: "Redis no mantiene el orden exacto: muestrea unas pocas claves y desaloja la más vieja de la muestra. Pierde exactitud y gana memoria y velocidad con millones de claves." },
    { title: "LFU para accesos sesgados", detail: "Si unas pocas claves se piden todo el tiempo, LFU las protege mejor de un barrido que lee muchas claves una sola vez. Cuesta mantener contadores y envejecerlos." },
  ],
  pattern: {
    heuristic: "Si ves «desalojar la usada hace más tiempo» con O(1), pensá en hashmap + orden de recencia (Map de JS, LinkedHashMap o lista doble).",
    detail: "El hashmap responde dónde está la clave; la lista, quién es la más vieja. Definí qué cuenta como uso y desalojá solo cuando el tamaño real supera la capacidad.",
  },
  related: [
    { title: "LFU Cache", url: "https://leetcode.com/problems/lfu-cache/" },
    { title: "Design Hit Counter", url: "https://leetcode.com/problems/design-hit-counter/" },
  ],
  interview: {
    question: "¿Cómo le agregás expiración por tiempo (TTL) a cada clave?",
    answer: "Guardás junto al valor el instante de vencimiento. En get, si venció, la borrás y devolvés −1. Para no acumular vencidas que nadie lee, un heap por vencimiento (o una limpieza periódica) las saca; el orden LRU sigue igual.",
  },
};
