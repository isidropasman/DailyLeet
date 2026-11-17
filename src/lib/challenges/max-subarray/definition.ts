import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "La mejor racha", difficulty: "Medio", topic: "Programación dinámica",
  description: "Tenés el balance de cada día, con ganancias y pérdidas. Elegí un tramo de días seguidos, con al menos un día, y devolvé la suma más alta que puede tener. Ojo: puede que todos los días sean pérdidas.",
  example: "[3, -4, 5, -1, 2, -6, 1]", expected: "6",
  explanation: "El tramo [5, −1, 2] suma 6. Sumarle el 3 no conviene porque en el medio está el −4, y estirarlo hasta el final agrega el −6.",
  sample: { input: [3, -4, 5, -1, 2, -6, 1] },
  constraints: ["1 ≤ nums.length ≤ 10⁵", "−10⁴ ≤ nums[i] ≤ 10⁴"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el mejor tramo?", options: [option("Extender o empezar de nuevo", "En cada día, el mejor tramo que termina ahí."), option("Probar todos los tramos", "Sumar desde cada comienzo hacia la derecha."), option("Prefijo menos el mínimo", "Restar el prefijo más chico visto hasta ahora."), option("Sumar los positivos", "Todo lo que suma, adentro.")] },
    { title: "Memoria", question: "¿Con qué arrancan cur y best?", options: [option("Con el primer número", "Y recorrer desde el segundo."), option("Con cero", "Y recorrer desde el primero."), option("Con el primero, desde el primero", "Recorrer todo el array."), option("best = −1", "Un centinela de «todavía nada».")] },
    { title: "Regla", question: "¿Cómo actualizás cur con el número actual?", options: [option("max(x, cur + x)", "Extender si conviene, si no empezar en x."), option("max(0, cur + x)", "Si la suma queda negativa, la tirás."), option("cur + x", "Sumar siempre."), option("Cortar en cada negativo", "Si x < 0, el tramo empieza en x.")] },
  ],
  lesson: "El mejor tramo que termina en i es x solo, o x más el mejor tramo que termina en i − 1: cur = max(x, cur + x). El mejor de esos valores es la respuesta, en O(n) y O(1) de memoria. Arrancá con el primer número y no con 0: si todos son negativos, la respuesta es negativa.",
  resource: { title: "Problema original: Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
