import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Tramos sin cortes", difficulty: "Medio", topic: "Intervalos",
  description: "Cada tramo es [inicio, fin] e incluye sus dos extremos. Uní todos los tramos que comparten al menos un punto, aunque sea solo el borde, y devolvé los que quedan ordenados por inicio. Los tramos llegan aplanados, [inicio₀, fin₀, inicio₁, fin₁, …], en cualquier orden, y la respuesta va aplanada igual.",
  example: "[[1, 3], [2, 6], [8, 10], [15, 18]]", expected: "[1, 6, 8, 10, 15, 18]",
  explanation: "[1, 3] y [2, 6] comparten del 2 al 3: quedan como [1, 6]. [8, 10] y [15, 18] no tocan a nadie y siguen igual.",
  sample: { input: [1, 3, 2, 6, 8, 10, 15, 18] },
  constraints: ["0 ≤ cantidad de tramos ≤ 10⁴", "0 ≤ inicio ≤ fin ≤ 10⁴", "[1, 4] y [4, 5] se tocan en el 4: se unen"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás los tramos que se unen?", options: [option("Ordenar y barrer", "Por inicio; cada tramo se pega al último o abre uno nuevo."), option("Todos contra todos", "Unir cualquier par que se pise hasta que no cambie nada."), option("Pintar una línea de tiempo", "Marcar cada punto cubierto y leer los bloques."), option("Barrer sin ordenar", "En el orden en que llegan.")] },
    { title: "Solape", question: "¿Cuándo el tramo nuevo se pega al último?", options: [option("inicio ≤ fin del último", "Tocarse en el borde cuenta."), option("inicio < fin del último", "Tienen que pisarse de verdad."), option("inicio ≤ fin del anterior", "Comparar con el tramo previo de la lista."), option("inicio ≤ fin del último + 1", "Los enteros vecinos también se pegan.")] },
    { title: "Fusión", question: "¿Cómo actualizás el último al pegarle un tramo?", options: [option("fin = max(fin, nuevo fin)", "El que llega puede quedar adentro."), option("fin = nuevo fin", "El que llega termina después."), option("Recorrer el grupo", "Recalcular el fin con todos sus tramos."), option("Descartar el nuevo", "Si se pisa, ya está cubierto.")] },
  ],
  lesson: "Si ordenás por inicio, cada tramo solo puede pegarse al último que armaste: los anteriores terminan antes. Se pega si su inicio es ≤ al fin del último, y el fin pasa a ser el máximo de los dos, porque el que llega puede quedar adentro. Ordenar cuesta O(n log n) y el barrido, O(n).",
  resource: { title: "Problema original: Merge Intervals", url: "https://leetcode.com/problems/merge-intervals/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
