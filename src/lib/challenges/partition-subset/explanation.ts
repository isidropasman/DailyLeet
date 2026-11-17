import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de números, S = suma total",
  optimalTime: /^O\(n · S\)$/,
  cost: ([approach]) =>
    approach === 1 ? { time: "O(2ⁿ · n) exponencial", space: "O(1)" }
    : approach === 2 ? { time: "O(n log n)", space: "O(n)" }
    : approach === 3 ? { time: "O(n)", space: "O(1)" }
    : { time: "O(n · S)", space: "O(S)" },
  keyIdea: {
    summary: "Dos grupos iguales existen si y solo si algún grupo suma S/2. dp[j] dice si llegás a j con los números vistos, y cada número x se usa una sola vez.",
    detail: "Si S es impar, no hay reparto. Si no, dp arranca con dp[0] = true: sin números solo llegás a 0. Cada x propone dp[j − x] para cada j ≥ x. Recorrés j de mayor a menor para que dp[j − x] todavía sea el de antes de x. Así ningún número cuenta dos veces. Son n pasadas de S/2 casillas: O(n · S).",
  },
  steps: [
    [
      { verdict: "óptima", why: "Hay a lo sumo S/2 + 1 sumas distintas: marcarlas una vez por número cuesta O(n · S), no 2ⁿ." },
      { verdict: "correcta pero más lenta", why: "Probar cada subconjunto es correcto, pero son 2ⁿ grupos. Muchos suman lo mismo y los volvés a sumar igual." },
      broken("Repartir de mayor a menor en la bolsa más liviana no mira adelante: puede trabar un reparto que existe.", [3, 3, 2, 2, 2],
        "Pone un 3 en cada bolsa y reparte los 2: 3 + 2 + 2 = 7 contra 3 + 2 = 5. El reparto era [3, 3] y [2, 2, 2]. Devuelve false; esperado true."),
      broken("Que S sea par es necesario, pero no alcanza: además tiene que haber un grupo que sume S/2.", [2],
        "La suma es 2, par, así que dice que sí. Con un solo número un grupo suma 2 y el otro 0. Devuelve true; esperado false."),
    ],
    [
      { verdict: "óptima", why: "dp[0] = true es el único punto de partida: el grupo vacío suma 0. Todo lo demás se construye desde ahí." },
      broken("Sin dp[0] = true no hay de dónde partir: el || nunca produce un true.", [1, 1],
        "La meta es 1 y dp[1] = dp[1] || dp[0] queda en false con los dos 1. Devuelve false; esperado true."),
      broken("Marcar cada número de entrada lo cuenta dos veces: ya está en dp[x] y el recorrido lo vuelve a sumar.", [1, 3],
        "La meta es 2 y arranca con dp[1] = true. Con x = 1, dp[2] = dp[1] usa el 1 dos veces. Devuelve true; esperado false."),
      broken("Llegar a S siempre se puede: es el grupo con todos los números. La meta es S/2.", [2],
        "La tabla llega hasta 2 y dp[2] = dp[0] con x = 2. Devuelve true; esperado false."),
    ],
    [
      { verdict: "óptima", why: "Bajando, dp[j − x] todavía no incluye a x: cada número se suma una sola vez." },
      broken("Subiendo, dp[j − x] ya puede incluir a x: el mismo número se suma varias veces.", [1, 3],
        "La meta es 2. Con x = 1 marca dp[1] y enseguida dp[2] = dp[1], usando el 1 dos veces. Devuelve true; esperado false."),
      broken("Pisar dp[j] con dp[j − x] olvida las sumas que ya se lograban sin x.", [2, 2, 1, 1],
        "La meta es 3 y con los 2 llega a dp[2]. El primer 1 lo pisa con dp[1] = false y el segundo pisa dp[3] con ese dp[2]. Devuelve false; esperado true."),
      broken("Sin j = x, ningún número puede arrancar un grupo: dp[x] = dp[0] nunca se marca.", [1, 1],
        "La meta es 1 y con x = 1 el recorrido j > 1 no hace nada. Devuelve false; esperado true."),
    ],
  ],
  tradeOffs: [
    { title: "Pocos números, sumas enormes", detail: "Con n ≤ 20 y valores de 10⁹, la tabla de S/2 casillas no entra en memoria. Ahí gana probar subconjuntos, o meet in the middle: dos mitades de 2^(n/2) sumas y búsqueda binaria." },
    { title: "Bitset de sumas", detail: "Guardás las sumas alcanzables como bits y cada número hace bits |= bits << x. Es el mismo O(n · S), pero de a 64 sumas por operación: en C++ con std::bitset vuela." },
    { title: "Tabla 2D para reconstruir", detail: "Si además te piden qué números van en cada grupo, la tabla n × (S/2 + 1) te deja volver atrás desde dp[n][S/2]. Pagás O(n · S) de memoria en vez de O(S)." },
  ],
  pattern: {
    heuristic: "Si ves «elegí algunos elementos, cada uno a lo sumo una vez, para llegar exacto a un valor», pensá en mochila 0/1: dp[j] sobre los valores y j de mayor a menor.",
    detail: "Primero reducí el problema a una meta concreta (acá S/2). Después: caso base dp[0], un número por vez y recorrido descendente. Si cada elemento se pudiera repetir, sería el recorrido ascendente, como en Coin Change.",
  },
  related: [
    { title: "Target Sum", url: "https://leetcode.com/problems/target-sum/" },
    { title: "Last Stone Weight II", url: "https://leetcode.com/problems/last-stone-weight-ii/" },
    { title: "Partition to K Equal Sum Subsets", url: "https://leetcode.com/problems/partition-to-k-equal-sum-subsets/" },
  ],
  interview: {
    question: "¿Y si cada número se puede usar todas las veces que quieras para llegar a S/2?",
    answer: "Pasa a ser mochila sin límite: recorrés j de menor a mayor, justo la opción que acá era incorrecta. Así dp[j − x] ya puede incluir a x y el mismo número se suma de nuevo.",
  },
};
