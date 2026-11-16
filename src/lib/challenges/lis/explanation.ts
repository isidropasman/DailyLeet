import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = largo del array, L = largo de la respuesta",
  optimalTime: /^O\(n log n\)$/,
  cost: ([approach, , rule]) =>
    approach === 1 ? { time: "O(n²)", space: "O(n)" }
    : approach > 1 ? { time: "O(n)", space: "O(1)" }
    : rule === 2 ? { time: "O(n · L)", space: "O(L)" }
    : { time: "O(n log n)", space: "O(L)" },
  keyIdea: {
    summary: "tails[k] es el menor final posible de una subsecuencia creciente de largo k + 1. Cada número reemplaza la primera cola ≥ x, o se agrega al final si las supera a todas.",
    detail: "tails está siempre ordenado, así que la posición sale con búsqueda binaria. Reemplazar una cola por un número menor no rompe ninguna subsecuencia: deja un final más bajo, con más lugar para crecer. El largo de tails es la respuesta, aunque su contenido no sea una subsecuencia real. lowerBound (≥) hace que un número igual reemplace en vez de extender: así la subsecuencia es estrictamente creciente.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Las colas mínimas resumen todas las subsecuencias posibles en un array ordenado: cada número es una búsqueda binaria, O(n log n)." },
      { verdict: "correcta pero más lenta", why: "Para cada i mirás todos los j anteriores: es correcto con repetidos y negativos, pero cuesta O(n²)." },
      broken("Agregar solo si supera al último elegido se casa con el primer camino: un número grande temprano bloquea a los siguientes.", [1, 10, 2, 3, 4],
        "Elige 1 y 10. El 2, el 3 y el 4 no superan al 10. Devuelve 2; esperado 4."),
      broken("Una subsecuencia puede saltear elementos: el tramo contiguo más largo es otra cosa.", [1, 10, 2, 3, 4],
        "Las rachas son 1, 10 y 2, 3, 4. La mejor tiene 3, pero 1, 2, 3, 4 saltea el 10. Devuelve 3; esperado 4."),
    ],
    [
      { verdict: "óptima", why: "Reemplazar la cola baja el final de esa longitud: nada se pierde y los números siguientes tienen más chances de extenderla." },
      broken("Conservar la cola más grande nunca baja un final: tails[i] = max(tails[i], x) deja todo como estaba.", [1, 10, 2, 3, 4],
        "Las colas quedan en [1, 10]. El 2 cae en la posición del 10 y max(10, 2) lo deja en 10; lo mismo con el 3 y el 4. Devuelve 2; esperado 4."),
      broken("La pila monótona tira las colas desde la posición de x, y esos prefijos todavía podían crecer.", [0, 1, 0, 3, 2, 3],
        "El segundo 0 vacía [0, 1] y deja [0]. Después arma [0, 2, 3]: el máximo que ve es 3. 0, 1, 2, 3 necesitaba el 1 que tiró. Devuelve 3; esperado 4."),
      broken("Tocar solo la última cola desordena tails: el número nuevo no es necesariamente mayor que las colas de adentro.", [5, 6, 7, 1, 2, 8],
        "El 1 reemplaza al 7: [5, 6, 1]. El 2 supera al 1 y se agrega: [5, 6, 1, 2]. El 8 la lleva a 5. Devuelve 5; esperado 4."),
    ],
    [
      { verdict: "óptima", why: "lowerBound encuentra la primera cola ≥ x en O(log L). Un número igual reemplaza a su cola, así que no cuenta como creciente." },
      broken("upperBound (primera cola > x) deja pasar a un número igual: arma subsecuencias no decrecientes.", [7, 7, 7, 7],
        "Cada 7 cae después del 7 anterior y se agrega al final: [7, 7, 7, 7]. Devuelve 4; esperado 1."),
      { verdict: "correcta pero más lenta", why: "Recorrer las colas da la misma posición que lowerBound, pero cuesta O(L) por número: O(n · L) en total." },
      broken("Una posición antes reemplaza una cola que no tenía que tocar y nunca extiende desde adentro.", [1, 10, 2, 3, 4],
        "El 2 tenía que reemplazar al 10, pero pisa al 1: [2, 10]. El 3 y el 4 hacen lo mismo. Devuelve 2; esperado 4."),
    ],
  ],
  tradeOffs: [
    { title: "Reconstruir la subsecuencia", detail: "tails da el largo, no los elementos. Para devolver la subsecuencia guardás, por cada número, el índice de la cola anterior al insertarlo y reconstruís desde el último." },
    { title: "DP cuadrática con n chico", detail: "Con unos pocos cientos de elementos, O(n²) es instantáneo y se adapta fácil a variantes: contar cuántas LIS hay o pesar cada elemento." },
    { title: "No decreciente", detail: "Si la consigna acepta iguales, el cambio es una sola línea: upperBound en vez de lowerBound. La trampa de hoy es la respuesta correcta de esa variante." },
  ],
  pattern: {
    heuristic: "Si ves «subsecuencia creciente más larga» con n grande, pensá en colas mínimas + búsqueda binaria (patience sorting).",
    detail: "Guardás, por cada largo, el mejor final posible. El array queda ordenado y cada número solo ajusta una posición. La igualdad decide entre lowerBound y upperBound.",
  },
  related: [
    { title: "Russian Doll Envelopes", url: "https://leetcode.com/problems/russian-doll-envelopes/" },
    { title: "Number of Longest Increasing Subsequence", url: "https://leetcode.com/problems/number-of-longest-increasing-subsequence/" },
  ],
  interview: {
    question: "¿Cómo lo aplicás a sobres que se meten uno dentro de otro (ancho y alto)?",
    answer: "Ordenás por ancho ascendente y, con ancho igual, por alto descendente. Después corrés LIS estricta sobre los altos: el orden descendente impide encadenar dos sobres del mismo ancho.",
  },
};
