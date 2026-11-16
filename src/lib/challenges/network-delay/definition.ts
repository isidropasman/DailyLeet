import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Ping a todos", difficulty: "Brutal", topic: "Grafos",
  description: "Una red de n nodos con enlaces dirigidos (u, v, ms). Desde el nodo k mandás un ping. Devolvé cuánto tarda en llegar a todos los nodos; si alguno nunca lo recibe, devolvé −1.",
  example: "n = 4, k = 2, [[2, 1, 1], [2, 3, 1], [3, 4, 1]]", expected: "2",
  explanation: "Desde el 2, el ping llega al 1 y al 3 en 1 ms, y al 4 pasando por el 3 en 2 ms. El último en recibirlo es el 4.",
  sample: { input: [2, 2, 1, 1, 2, 3, 1, 3, 4, 1], target: 4 },
  constraints: ["1 ≤ n ≤ 100", "1 ≤ k ≤ n", "0 ≤ enlaces ≤ 6000", "0 ≤ ms ≤ 100", "Los enlaces son dirigidos"],
  steps: [
    { title: "Enfoque", question: "¿Cómo calculás el tiempo hasta cada nodo?", options: [option("Dijkstra", "Siempre expandís el nodo abierto más cercano."), option("Relajar todo n − 1 veces", "Bellman-Ford."), option("BFS", "El primer camino que llega, sumando los pesos."), option("Cola FIFO sin reencolar", "Cada nodo se procesa una sola vez.")] },
    { title: "Memoria", question: "¿Qué ordena la frontera?", options: [option("Min-heap de (distancia acumulada, nodo)", "Más dist[] para descartar entradas viejas."), option("Min-heap de (peso del enlace, nodo)", "El enlace más barato primero."), option("Sin heap", "Buscar linealmente el mínimo abierto."), option("Max-heap", "El comparador al revés.")] },
    { title: "Regla", question: "¿Cuándo queda fija una distancia y qué devolvés?", options: [option("Cerrar al sacar", "Descartás entradas viejas; max(dist), −1 si queda ∞."), option("Cerrar al descubrir", "Apenas lo ves, su distancia queda fija."), option("Máximo de los alcanzados", "Ignorás los ∞."), option("Sumar todos los tiempos", "El tiempo total de la red.")] },
  ],
  lesson: "El ping llega a cada nodo por el camino más rápido, así que la respuesta es la mayor de las distancias mínimas desde k, o −1 si alguna es ∞. Dijkstra expande siempre el nodo abierto con menor distancia acumulada: con pesos no negativos, esa distancia ya no puede mejorar y el nodo queda cerrado. Ordenar por el peso del último enlace es Prim, que arma un árbol barato, no caminos cortos.",
  resource: { title: "Problema original: Network Delay Time", url: "https://leetcode.com/problems/network-delay-time/" },
};

export const activeSteps = (approach: number) => (approach === 0 ? [0, 1, 2] : approach === 1 ? [0, 2] : [0]);
