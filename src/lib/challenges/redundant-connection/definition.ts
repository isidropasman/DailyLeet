import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "El cable que sobra", difficulty: "Difícil", topic: "Grafos",
  description: "Una red de n nodos era un árbol, y alguien agregó un cable de más. Devolvé el cable que podés sacar para que vuelva a ser un árbol. Si hay varios, el que aparece último en la entrada.",
  example: "[[1, 2], [1, 3], [2, 3]]", expected: "[2, 3]",
  explanation: "Los tres cables forman un ciclo: sacando cualquiera queda un árbol. De los tres, [2, 3] es el último en la entrada.",
  sample: { input: [1, 2, 1, 3, 2, 3] },
  constraints: ["3 ≤ n ≤ 1000", "Hay exactamente n cables", "Los nodos van de 1 a n", "La red original era un árbol conexo"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el cable que sobra?", options: [option("Unir en orden", "El primer cable que une dos nodos ya conectados (Union-Find)."), option("DFS antes de cada cable", "¿Ya hay un camino entre u y v?"), option("Por grados", "El último cable con los dos extremos de grado ≥ 2."), option("Ordenar los cables primero", "Union-Find sobre los cables ordenados, para que sea determinístico.")] },
    { title: "Memoria", question: "¿Qué guardás de los nodos ya conectados?", options: [option("Padres con compresión y rango", "find aplana el camino; unís por rango."), option("Padres sin compresión", "find sube hasta la raíz cada vez."), option("Etiqueta de componente", "comp[u] = comp[v] al unir."), option("Nodos vistos", "Si ya viste los dos extremos, es el cable de más.")] },
    { title: "Regla", question: "¿Cómo procesás cada cable?", options: [option("Comparar raíces y unir raíces", "Si find(u) == find(v), sobra; si no, unís las raíces."), option("Unir nodos, no raíces", "parent[u] = v."), option("Comparar padres directos", "parent[u] == parent[v], sin find."), option("Unir y después preguntar", "union(u, v); si find(u) == find(v), sobra.")] },
  ],
  lesson: "Recorrés los cables en orden y unís componentes. El primer cable cuyos extremos ya están en la misma componente cierra el único ciclo, y como es el último del ciclo en la entrada, es la respuesta. Con Union-Find (compresión de camino y rango), cada cable cuesta O(α(n)). Lo que define «misma componente» es la raíz, no el padre ni haber visto el nodo.",
  resource: { title: "Problema original: Redundant Connection", url: "https://leetcode.com/problems/redundant-connection/" },
};

export const activeSteps = (approach: number) => (approach === 1 || approach === 2 ? [0] : [0, 1, 2]);
