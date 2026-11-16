import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Memoria corta", difficulty: "Medio", topic: "Diseño",
  description: "Implementá una caché de capacidad cap. get(k) devuelve el valor o −1. put(k, v) inserta o actualiza. Si te pasás de capacidad, desalojás la clave usada hace más tiempo. Leer y escribir cuentan como «usar». Las operaciones llegan como tripletas [op, k, v] (op 0 = get, 1 = put) y devolvés los resultados de cada get.",
  example: "cap = 2: put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)", expected: "[1, -1, -1, 3, 4]",
  explanation: "get(1) refresca la 1, así que put(3, 3) desaloja a la 2. Después put(4, 4) desaloja a la 1, que quedó como la menos reciente.",
  sample: { input: [1, 1, 1, 1, 2, 2, 0, 1, 0, 1, 3, 3, 0, 2, 0, 1, 4, 4, 0, 1, 0, 0, 3, 0, 0, 4, 0], target: 2 },
  constraints: ["1 ≤ cap ≤ 3000", "Hasta 2 · 10⁵ operaciones", "get y put en O(1)"],
  steps: [
    { title: "Enfoque", question: "¿Cómo sabés cuál desalojar?", options: [option("Hashmap ordenado por recencia", "Un Map (orden de inserción) o hashmap + lista doble."), option("Lista de claves por recencia", "Mover al final con búsqueda lineal."), option("Cola FIFO + Map", "Sale la primera que entró."), option("Menos frecuente", "Sale la menos usada; desempata la más vieja.")] },
    { title: "Memoria", question: "¿Dónde guardás el orden?", options: [option("Map: borrar y reinsertar", "El primero del Map es el más viejo."), option("Objeto JS", "cache[k] = v y desalojás Object.keys(cache)[0]."), option("Map + array de orden", "Un array aparte con las claves."), option("Map + contador propio", "size++ en cada put.")] },
    { title: "Regla", question: "¿Qué cuenta como uso y cuándo desalojás?", options: [option("Leer y escribir refrescan", "Desalojás después de insertar, si size > cap."), option("Solo escribir refresca", "get no toca el orden."), option("Desalojar antes de insertar", "Si size ≥ cap, sacás una antes del put."), option("Sale el más reciente", "El último de la estructura.")] },
  ],
  lesson: "Un Map de JS itera en orden de inserción: si en cada get y put borrás la clave y la volvés a insertar, el primer elemento es siempre el menos usado. Desalojar es sacar ese primero, después de insertar y solo si te pasaste. Ojo con el objeto plano: sus claves enteras se iteran de menor a mayor, no por inserción. En otros lenguajes el equivalente es hashmap + lista doblemente enlazada (o LinkedHashMap en Java).",
  resource: { title: "Problema original: LRU Cache", url: "https://leetcode.com/problems/lru-cache/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
