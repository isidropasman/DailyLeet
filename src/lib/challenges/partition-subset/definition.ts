import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Mitad y mitad", difficulty: "Medio", topic: "Programación dinámica",
  description: "Tenés una lista de números positivos. Decidí si podés repartirlos todos en dos grupos que sumen exactamente lo mismo. Cada número va a un solo grupo.",
  example: "nums = [1, 5, 11, 5]", expected: "true",
  explanation: "[1, 5, 5] y [11] suman 11 cada uno.",
  sample: { input: [1, 5, 11, 5] },
  constraints: ["1 ≤ nums.length ≤ 200", "1 ≤ nums[i] ≤ 100"],
  steps: [
    { title: "Enfoque", question: "¿Cómo decidís si hay un reparto parejo?", options: [option("Sumas alcanzables", "dp[j] = ¿algún grupo de números suma j?"), option("Probar todos los subconjuntos", "Cada número entra o no: 2ⁿ grupos."), option("Greedy en dos bolsas", "De mayor a menor, cada número a la bolsa más liviana."), option("Mirar la paridad", "Si la suma total es par, se puede.")] },
    { title: "Memoria", question: "¿Cómo arranca la tabla?", options: [option("Hasta S/2 y dp[0] = true", "Sin números solo llegás a 0."), option("Hasta S/2, todo en false", "Nada es alcanzable hasta construirlo."), option("Hasta S/2, cada número marcado", "Cada número solo ya es una suma."), option("Hasta S y dp[0] = true", "Buscás llegar a la suma total.")] },
    { title: "Recorrido", question: "¿Cómo recorrés j con cada número x?", options: [option("De S/2 bajando hasta x", "dp[j] = dp[j] || dp[j − x]."), option("De x subiendo hasta S/2", "dp[j] = dp[j] || dp[j − x]."), option("Bajando y pisando", "dp[j] = dp[j − x]."), option("Bajando sin tocar j = x", "Solo mientras j > x.")] },
  ],
  lesson: "Repartir en dos grupos iguales es lo mismo que encontrar un grupo que sume S/2. dp[j] dice si algún grupo de los números vistos suma j: arranca con dp[0] = true y cada número x propone dp[j − x]. Recorrés j de mayor a menor para que dp[j − x] todavía no incluya a x: cada número se usa una sola vez. Si S es impar, la respuesta es false sin mirar nada más.",
  resource: { title: "Problema original: Partition Equal Subset Sum", url: "https://leetcode.com/problems/partition-equal-subset-sum/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
