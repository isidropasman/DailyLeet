import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Ritmo justo", difficulty: "Difícil", topic: "Búsqueda binaria",
  description: "Hay pilas de tareas y h horas. Cada hora atacás una sola pila a velocidad v: si a esa pila le quedan menos de v tareas, la terminás y el resto de la hora se pierde. Devolvé la mínima velocidad entera que termina todo en h horas.",
  example: "[3, 6, 7, 11], h = 8", expected: "4",
  explanation: "A velocidad 4 las pilas llevan 1 + 2 + 2 + 3 = 8 horas: entra justo. A velocidad 3 llevan 1 + 2 + 3 + 4 = 10 y no alcanza.",
  sample: { input: [3, 6, 7, 11], target: 8 },
  constraints: ["1 ≤ piles.length ≤ 10⁴", "piles.length ≤ h ≤ 10⁹", "1 ≤ piles[i] ≤ 10⁹"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás la velocidad mínima?", options: [option("Binaria sobre la velocidad", "Si una velocidad alcanza, cualquier mayor también."), option("Probar velocidades", "De 1 hacia arriba hasta que alcance."), option("Calcularla directo", "El total de tareas dividido las horas."), option("Binaria sobre las pilas", "La respuesta es el tamaño de alguna pila.")] },
    { title: "Memoria", question: "¿Cuántas horas lleva una pila a velocidad v?", options: [option("Redondear hacia arriba", "⌈pila / v⌉."), option("División entera", "⌊pila / v⌋."), option("Entera más uno", "⌊pila / v⌋ + 1."), option("Redondeo común", "round(pila / v).")] },
    { title: "Regla", question: "¿Cómo movés los bordes de la búsqueda?", options: [option("Si alcanza, hi = mid", "Si no, lo = mid + 1."), option("Si alcanza, hi = mid − 1", "Descartás la que ya sirvió."), option("Empezar en la pila más chica", "Más lento no tiene sentido."), option("Cortar al primer factible", "Ya encontraste una que sirve.")] },
  ],
  lesson: "Las horas totales bajan cuando la velocidad sube, así que «alcanza en h horas» es falso hasta cierto v y verdadero desde ahí. Una búsqueda binaria entre 1 y la pila más grande encuentra ese primer v en O(n log max). El detalle está en los bordes: si mid alcanza, puede ser la respuesta, así que hi = mid y no mid − 1.",
  resource: { title: "Problema original: Koko Eating Bananas", url: "https://leetcode.com/problems/koko-eating-bananas/" },
};

export const activeSteps = (approach: number) => (approach === 2 ? [0] : approach > 0 ? [0, 1] : [0, 1, 2]);
