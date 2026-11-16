import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "A = amount, n = cantidad de monedas",
  optimalTime: /^O\(A · n\)$/,
  cost: ([approach]) =>
    approach === 1 ? { time: "O(n^A) exponencial", space: "O(A) de pila" }
    : approach === 2 ? { time: "O(n log n)", space: "O(n)" }
    : { time: "O(A · n)", space: "O(A)" },
  keyIdea: {
    summary: "dp[a] es la mínima cantidad de monedas que suman a. Cada moneda c propone dp[a − c] + 1 y te quedás con el mínimo.",
    detail: "La tabla arranca en ∞ (imposible) salvo dp[0] = 0: el monto 0 no necesita monedas. Un monto imposible propaga ∞ y nunca gana un mínimo. Al final, si dp[amount] sigue en ∞, no hay forma y devolvés −1. Cada monto se calcula una vez: O(A · n).",
  },
  steps: [
    [
      { verdict: "óptima", why: "Calculás cada monto una sola vez, de abajo hacia arriba, mirando todas las monedas: O(A · n)." },
      { verdict: "correcta pero más lenta", why: "Probar cada moneda es correcto, pero sin memo recalcula los mismos montos una y otra vez: el árbol de llamadas crece de forma exponencial." },
      broken("La moneda más grande no siempre lleva al mínimo: depende de las denominaciones. {1, 2, 5} es canónico, por eso el ejemplo pasa.", [2, 3],
        "Toma 3 + 3 = 6 y le queda 1, que no se puede pagar. Con 2 + 2 + 3 alcanzaba. Devuelve −1; esperado 3.", { target: 7 }),
      broken("Contar combinaciones es otro problema (LC 518): suma formas, no busca el mínimo, y nunca devuelve −1.", [2],
        "No hay ninguna forma de sumar 3 con monedas de 2: ways[3] queda en 0. Devuelve 0; esperado −1.", { target: 3 }),
    ],
    [
      { verdict: "óptima", why: "∞ marca los montos que todavía no se pueden pagar y dp[0] = 0 es el único punto de partida." },
      broken("Con la tabla en 0, el min nunca sube: todo monto parece pagable sin monedas.", [2],
        "dp[3] arranca en 0 y min(0, …) lo deja en 0. Devuelve 0; esperado −1.", { target: 3 }),
      broken("−1 como «imposible» es menor que cualquier candidato: el min se queda con él.", [7],
        "dp[7] = min(−1, dp[0] + 1) = −1, y dp[14] = min(−1, dp[7] + 1) = −1. Devuelve −1; esperado 2.", { target: 14 }),
      broken("dp[0] = 1 suma una moneda fantasma a todo lo que se construye desde el 0.", [1],
        "Con amount = 0 la tabla es solo dp[0] = 1, que es mayor que amount: lo toma por imposible. Devuelve −1; esperado 0.", { target: 0 }),
    ],
    [
      { verdict: "óptima", why: "El min se queda con la mejor moneda para cada monto y ∞ (amount + 1) se convierte en −1 al final." },
      broken("Si no convertís ∞ en −1, un monto imposible devuelve el centinela.", [2],
        "dp[3] nunca baja de INF = amount + 1 = 4. Devuelve 4; esperado −1.", { target: 3 }),
      broken("Sin min, la última moneda que entra pisa a las anteriores aunque sea peor o imposible.", [2, 3],
        "dp[4] termina en dp[1] + 1 (imposible) aunque 2 + 2 servía, y dp[7] lo hereda por la moneda 3. Devuelve −1; esperado 3.", { target: 7 }),
      broken("La primera moneda que llega no es la mejor: una vez lleno, dp[a] no mejora.", [1, 2, 5],
        "La moneda 1 llega primero a cada monto y lo llena con dp[a − 1] + 1. Ni el 2 ni el 5 lo mejoran. Devuelve 11; esperado 3.", { target: 11 }),
    ],
  ],
  tradeOffs: [
    { title: "Greedy con monedas canónicas", detail: "Con sistemas como el peso o el euro, la moneda más grande siempre lleva al mínimo y el greedy es O(n log n) sin tabla. Sirve para dar vuelto en una caja, no para denominaciones arbitrarias." },
    { title: "Top-down con memo", detail: "La recursión con un Map de montos ya resueltos es el mismo O(A · n) y solo calcula los montos alcanzables. Pierde con montos grandes por la profundidad de la pila." },
    { title: "BFS por cantidad de monedas", detail: "Cada nivel suma una moneda: el primer nivel que llega a amount es la respuesta. Corta antes cuando la respuesta es chica, pero usa una cola de montos visitados." },
  ],
  pattern: {
    heuristic: "Si ves «mínima cantidad de piezas ilimitadas que suman exactamente X», pensá en una mochila sin límite: dp[a] = min(dp[a − c] + 1).",
    detail: "Definí qué es imposible (∞, nunca −1 ni 0) y cuál es el caso base. Contar formas usa la misma tabla con suma en vez de min: no los confundas.",
  },
  related: [
    { title: "Coin Change II", url: "https://leetcode.com/problems/coin-change-ii/" },
    { title: "Perfect Squares", url: "https://leetcode.com/problems/perfect-squares/" },
  ],
  interview: {
    question: "¿Y si cada moneda se puede usar una sola vez?",
    answer: "Pasa a ser mochila 0/1: recorrés las monedas afuera y los montos de mayor a menor, para que dp[a − c] todavía no incluya la moneda c. El min y el ∞ inicial quedan igual.",
  },
};
