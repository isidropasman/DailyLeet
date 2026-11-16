import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Siempre para arriba", difficulty: "Difícil+", topic: "Programación dinámica",
  description: "Devolvé el largo de la subsecuencia estrictamente creciente más larga. Podés saltear elementos, pero no reordenarlos.",
  example: "[10, 9, 2, 5, 3, 7, 101, 18]", expected: "4",
  explanation: "2, 3, 7, 101 (o 2, 5, 7, 18) crece en cada paso y tiene 4 elementos. No hay una de 5.",
  sample: { input: [10, 9, 2, 5, 3, 7, 101, 18] },
  constraints: ["0 ≤ nums.length ≤ 2500", "−10⁴ ≤ nums[i] ≤ 10⁴", "Estrictamente creciente: dos iguales no cuentan", "Objetivo: O(n log n)"],
  steps: [
    { title: "Enfoque", question: "¿Cómo construís la subsecuencia?", options: [option("Colas mínimas", "tails[k] = menor final de una subsecuencia de largo k + 1."), option("DP cuadrática", "best[i] = 1 + max(best[j]) con nums[j] < nums[i]."), option("Greedy", "Agregar si supera al último elegido."), option("Racha creciente", "El tramo contiguo más largo.")] },
    { title: "Memoria", question: "¿Qué hacés con las colas?", options: [option("Reemplazar la cola", "x pasa a ser la cola en su posición."), option("Conservar la más grande", "tails[i] = max(tails[i], x)."), option("Pila monótona", "Sacar desde esa posición y apilar x; te quedás con el tamaño máximo."), option("Solo la última cola", "Si x no la supera, la reemplaza.")] },
    { title: "Regla", question: "¿En qué posición cae x?", options: [option("lowerBound", "Primera cola ≥ x, con búsqueda binaria."), option("upperBound", "Primera cola > x, con búsqueda binaria."), option("Búsqueda lineal", "Primera cola ≥ x, recorriendo."), option("Una posición antes", "lowerBound − 1.")] },
  ],
  lesson: "tails[k] guarda el menor final posible de una subsecuencia creciente de largo k + 1, y siempre está ordenado. Cada x reemplaza la primera cola ≥ x (o se agrega al final si las supera a todas): achicar una cola nunca rompe una subsecuencia, solo deja más lugar para crecer. Con búsqueda binaria es O(n log n). Para que sea estrictamente creciente, la búsqueda es lowerBound: un x igual a una cola la reemplaza, no la extiende.",
  resource: { title: "Problema original: Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
