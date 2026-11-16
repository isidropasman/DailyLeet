import type { Judge } from "../module";

export const editDistanceJudge: Judge = {
  cases: [
    { input: "horse", other: "ros", expected: 3 },
    { input: "", other: "", expected: 0 },
    { input: "", other: "abc", expected: 3 },
    { input: "abc", other: "", expected: 3 },
    { input: "abc", other: "abc", expected: 0 },
    { input: "intention", other: "execution", expected: 5 },
    { input: "abc", other: "bc", expected: 1 },
    { input: "ab", other: "ba", expected: 2 },
    { input: "kitten", other: "sitting", expected: 3 },
    { input: "sunday", other: "saturday", expected: 3 },
    { input: "a", other: "b", expected: 1 },
    { input: "abcdef", other: "azced", expected: 3 },
  ],
  efficient: ([approach, memory]) => approach === 0 && memory !== 1,
  feedback: {
    optimal: "DP sobre prefijos con dos filas: O(nm) de tiempo y O(m) de memoria.",
    slow: "La tabla completa es correcta y cuesta el mismo O(nm) de tiempo, pero guarda O(nm) celdas cuando alcanzan dos filas.",
    hint: "Revisá los bordes (transformar desde o hacia el string vacío), que el reemplazo sea una operación más y que dp[i][j] compare a[i − 1] con b[j − 1].",
  },
};
