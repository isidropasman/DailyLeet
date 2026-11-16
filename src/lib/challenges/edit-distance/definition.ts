import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "El corrector", difficulty: "Medio", topic: "Programación dinámica",
  description: "Devolvé la mínima cantidad de operaciones para transformar a en b. Cada operación inserta, borra o reemplaza un carácter.",
  example: 'a = "horse", b = "ros"', expected: "3",
  explanation: "horse → rorse (reemplazás la h por r) → rose (borrás la r) → ros (borrás la e). Con menos de tres no se puede.",
  sample: { input: "horse", other: "ros" },
  constraints: ["0 ≤ a.length, b.length ≤ 500", "Solo letras minúsculas de a–z", "Insertar, borrar y reemplazar cuestan 1"],
  steps: [
    { title: "Enfoque", question: "¿Cómo medís la distancia?", options: [option("DP sobre prefijos", "dp[i][j] = costo entre a[:i] y b[:j]."), option("Vía LCS", "n + m − 2 · LCS."), option("Alinear y contar", "Diferencias posición a posición, más la diferencia de largos."), option("Letras en común", "max(n, m) − letras compartidas, sin importar el orden.")] },
    { title: "Memoria", question: "¿Cómo guardás la tabla?", options: [option("Dos filas", "prev y cur: la fila anterior alcanza."), option("Tabla completa", "(n + 1) × (m + 1) celdas."), option("Una sola fila in place", "Pisás la diagonal sin guardarla."), option("Tabla sin bordes", "dp[i][0] y dp[0][j] quedan en 0.")] },
    { title: "Regla", question: "¿Cómo calculás cada celda?", options: [option("Iguales → diagonal", "Si no, 1 + min(diagonal, arriba, izquierda)."), option("Sin reemplazo", "Si no, 1 + min(arriba, izquierda)."), option("Compará a[i] con b[j]", "Con los índices de la tabla."), option("Distintos → diagonal + 1", "Reemplazar siempre conviene.")] },
  ],
  lesson: "dp[i][j] es el costo de transformar los primeros i caracteres de a en los primeros j de b. Si a[i − 1] = b[j − 1], heredás la diagonal; si no, sumás 1 al mínimo entre reemplazar (diagonal), borrar (arriba) e insertar (izquierda). Los bordes valen i y j: transformar desde o hacia el vacío. Cada fila depende solo de la anterior, así que dos filas alcanzan: O(nm) de tiempo y O(m) de memoria.",
  resource: { title: "Problema original: Edit Distance", url: "https://leetcode.com/problems/edit-distance/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
