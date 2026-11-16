import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Salas llenas", difficulty: "Difícil+", topic: "Intervalos",
  description: "Cada reunión es [inicio, fin): ocupa la sala desde el inicio y la libera justo en el fin. Devolvé la cantidad mínima de salas para que ninguna se pise. Si una termina a las 5 y otra empieza a las 5, pueden usar la misma sala. Las reuniones llegan aplanadas: [inicio₀, fin₀, inicio₁, fin₁, …], en cualquier orden.",
  example: "[[0, 30], [5, 10], [15, 20]]", expected: "2",
  explanation: "La reunión [0, 30) se pisa con [5, 10) y con [15, 20), pero esas dos no se pisan entre sí: alcanza con 2 salas.",
  sample: { input: [0, 30, 5, 10, 15, 20] },
  constraints: ["0 ≤ cantidad de reuniones ≤ 10⁴", "0 ≤ inicio < fin ≤ 10⁶", "El orden de entrada es arbitrario"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el momento más ocupado?", options: [option("Barrido de eventos", "+1 al empezar, −1 al terminar."), option("Contar en cada inicio", "El pico está en algún comienzo."), option("Cadena con la anterior", "Ordenar y ver si pisa a la previa."), option("Fusionar intervalos", "Cada grupo solapado, una sala.")] },
    { title: "Memoria", question: "¿Qué guardás de las reuniones?", options: [option("Lista de eventos", "Pares (tiempo, ±1)."), option("Solo el último fin", "Ordenar por inicio y comparar con el fin anterior."), option("Array de diferencias", "diff[inicio]++ y diff[fin]−− por cada minuto."), option("Fin inclusivo", "El evento de cierre va en fin + 1.")] },
    { title: "Regla", question: "¿Cómo ordenás los eventos y qué devolvés?", options: [option("Empate: cierre antes que apertura", "Ordenar por (tiempo, delta)."), option("Empate: apertura antes que cierre", "La nueva entra primero."), option("Devolver el contador final", "Lo que quedó ocupado al terminar."), option("Ordenar solo por tiempo", "El sort ya es estable.")] },
  ],
  lesson: "Las salas que necesitás son el máximo de reuniones activas al mismo tiempo. Convertís cada reunión en dos eventos, +1 en el inicio y −1 en el fin, los ordenás y acumulás: el pico es la respuesta, en O(n log n). Como el fin es abierto, en un empate el cierre va antes que la apertura: la sala se libera justo a tiempo.",
  resource: { title: "Problema original: Meeting Rooms II", url: "https://leetcode.com/problems/meeting-rooms-ii/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
