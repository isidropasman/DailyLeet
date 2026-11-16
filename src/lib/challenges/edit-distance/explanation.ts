import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = largo de a, m = largo de b",
  optimalTime: /^O\(nm\)$/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(nm)", space: "O(nm)" }
    : approach > 1 ? { time: "O(n + m)", space: "O(1)" }
    : memory === 0 || memory === 2 ? { time: "O(nm)", space: "O(m)" }
    : { time: "O(nm) con la tabla completa", space: "O(nm)" },
  keyIdea: {
    summary: "dp[i][j] es el costo de transformar los primeros i caracteres de a en los primeros j de b. Cada celda sale de tres vecinas: diagonal (reemplazar), arriba (borrar) e izquierda (insertar).",
    detail: "Si a[i − 1] = b[j − 1], el último carácter ya coincide y heredás la diagonal sin costo. Si no, pagás 1 más el mínimo de las tres operaciones. Los bordes valen i y j: transformar desde o hacia el vacío cuesta insertar o borrar todo. Cada fila depende solo de la anterior, así que dos filas alcanzan.",
  },
  steps: [
    [
      { verdict: "óptima", why: "La DP sobre prefijos considera las tres operaciones en cada celda: O(nm) de tiempo y, con dos filas, O(m) de memoria." },
      broken("n + m − 2 · LCS cuenta solo inserciones y borrados: un reemplazo le cuesta 2 en vez de 1.", "a",
        "No hay letras en común: LCS = 0. Borra la a e inserta la b. Devuelve 2; esperado 1.", { other: "b" }),
      broken("Comparar posición a posición no ve los corrimientos: un borrado al principio desalinea todo lo que sigue.", "abc",
        "Compara a con b y b con c (dos diferencias) y suma 1 por el largo. Borrar la a alcanzaba. Devuelve 3; esperado 1.", { other: "bc" }),
      broken("Contar letras en común ignora el orden: dos strings con las mismas letras parecen iguales.", "ab",
        "Las dos letras están en los dos strings: max(2, 2) − 2 = 0. Pero ab no es ba. Devuelve 0; esperado 2.", { other: "ba" }),
    ],
    [
      { verdict: "óptima", why: "Cada fila solo usa la anterior: con prev y cur tenés la diagonal, arriba e izquierda en O(m) de memoria." },
      { verdict: "correcta pero más lenta", why: "La tabla completa da el mismo resultado en el mismo O(nm) de tiempo, pero guarda O(nm) celdas cuando alcanzan dos filas." },
      broken("Con una sola fila, cuando llegás a row[j] ya pisaste row[j − 1]: la diagonal es el valor nuevo, no el de la fila anterior.", "a",
        "En la celda (1, 1) la diagonal debería ser 0, pero row[0] ya vale 1. Toma 1 + min(1, 1, 1). Devuelve 2; esperado 1.", { other: "b" }),
      broken("Sin bordes, transformar desde o hacia el vacío cuesta 0: falta dp[i][0] = i y dp[0][j] = j.", "",
        "a está vacío: no entra al loop y devuelve dp[0][3], que quedó en 0. Insertar abc cuesta 3. Devuelve 0; esperado 3.", { other: "abc" }),
    ],
    [
      { verdict: "óptima", why: "Si los últimos caracteres coinciden, heredás la diagonal. Si no, 1 + el mínimo entre reemplazar, borrar e insertar." },
      broken("Sin la diagonal no hay reemplazo: cambiar una letra cuesta borrar más insertar.", "a",
        "a y b difieren. Toma 1 + min(arriba = 1, izquierda = 1). Reemplazar costaba 1. Devuelve 2; esperado 1.", { other: "b" }),
      broken("dp está corrido en 1: la celda (i, j) habla de a[i − 1] y b[j − 1]. Con a[i] y b[j] (y el índice que da la vuelta al final) cada celda compara las letras equivocadas.", "abc",
        "La última celda (3, 2) tendría que comparar c con c y heredar la diagonal. Compara a[3 % 3] = a con b[2 % 2] = b y suma 1. Devuelve 2; esperado 1.", { other: "bc" }),
      broken("Reemplazar no siempre conviene: a veces borrar o insertar corrige un corrimiento entero.", "horse",
        "Con letras distintas siempre toma diagonal + 1: un borrado solo entra por los bordes, así que la r y la e de más terminan pagándose como reemplazos. Devuelve 4; esperado 3.", { other: "ros" }),
    ],
  ],
  tradeOffs: [
    { title: "Reconstruir las operaciones", detail: "Si además de la distancia necesitás la secuencia de cambios (un diff), te quedás con la tabla completa: el camino se reconstruye desde dp[n][m] hacia atrás. Con dos filas perdés esa información." },
    { title: "Distancia acotada", detail: "Si solo te importa si la distancia es ≤ k (un corrector que sugiere palabras a 1 o 2 cambios), alcanza con la banda |i − j| ≤ k: O(n·k) en vez de O(nm)." },
    { title: "Costos distintos", detail: "La misma tabla sirve con pesos por operación (por ejemplo, reemplazar teclas vecinas cuesta menos). Solo cambia la fórmula de la celda." },
  ],
  pattern: {
    heuristic: "Si comparás dos secuencias y la respuesta depende de prefijos de las dos, pensá en una tabla dp[i][j] sobre prefijos.",
    detail: "Definí qué significa la celda, escribí los bordes (el vacío contra un prefijo) y decidí de qué vecinas depende. Si cada fila solo mira la anterior, la memoria baja a O(m).",
  },
  related: [
    { title: "Longest Common Subsequence", url: "https://leetcode.com/problems/longest-common-subsequence/" },
    { title: "One Edit Distance", url: "https://leetcode.com/problems/one-edit-distance/" },
  ],
  interview: {
    question: "¿Cómo lo hacés en O(min(n, m)) de memoria con una sola fila?",
    answer: "Con una fila y una variable extra para la diagonal: antes de pisar row[j], guardás su valor viejo; ese es la diagonal de la celda siguiente. Y recorrés el string más corto como columnas.",
  },
};
