import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Vuelto exacto", difficulty: "Medio+", topic: "Programación dinámica",
  description: "Tenés monedas ilimitadas de cada denominación. Devolvé la mínima cantidad de monedas que suman exactamente amount, o −1 si no se puede.",
  example: "coins = [1, 2, 5], amount = 11", expected: "3",
  explanation: "5 + 5 + 1 = 11 con tres monedas. Con dos, lo máximo es 5 + 5 = 10.",
  sample: { input: [1, 2, 5], target: 11 },
  constraints: ["1 ≤ coins.length ≤ 12", "1 ≤ coins[i] ≤ 2³¹ − 1", "0 ≤ amount ≤ 10.000"],
  steps: [
    { title: "Enfoque", question: "¿Cómo buscás la mínima cantidad?", options: [option("DP por monto", "dp[a] = mínimo de monedas para sumar a."), option("Recursión sin memo", "Probar cada moneda y quedarte con la mejor."), option("Greedy", "Siempre la moneda más grande que entre."), option("Contar combinaciones", "ways[a] += ways[a − c].")] },
    { title: "Memoria", question: "¿Cómo arranca la tabla?", options: [option("∞ y dp[0] = 0", "Todo imposible salvo el monto 0."), option("Todo en 0", "Arranca sin monedas."), option("Todo en −1", "−1 significa «imposible»."), option("∞ y dp[0] = 1", "El monto 0 «es una forma».")] },
    { title: "Regla", question: "¿Cómo usás cada moneda?", options: [option("Quedarte con el mínimo", "dp[a] = min(dp[a], dp[a − c] + 1) y ∞ → −1 al final."), option("Devolver dp[amount] tal cual", "Ya es el mínimo."), option("Pisar con la última moneda", "dp[a] = dp[a − c] + 1."), option("Primera que llega", "Solo si dp[a] sigue vacío.")] },
  ],
  lesson: "dp[a] es la mínima cantidad de monedas para sumar a. Arranca en ∞ (imposible) salvo dp[0] = 0, y cada moneda c propone dp[a − c] + 1: te quedás con el mínimo. Al final, si dp[amount] sigue en ∞, la respuesta es −1. El greedy funciona con monedas «canónicas» como {1, 2, 5}, pero no en general: con {1, 3, 4} y 6, 3 + 3 le gana a 4 + 1 + 1.",
  resource: { title: "Problema original: Coin Change", url: "https://leetcode.com/problems/coin-change/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
