import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Esperando el calor", difficulty: "Medio", topic: "Arrays",
  description: "Tenés las temperaturas de cada día. Para cada día, devolvé cuántos días tenés que esperar hasta uno estrictamente más cálido. Si no llega nunca, devolvé 0.",
  example: "[73, 74, 75, 71, 69, 72, 76, 73]", expected: "[1, 1, 4, 2, 1, 1, 0, 0]",
  explanation: "Después del 75 (día 2) bajan las temperaturas hasta el 76 del día 6: hay que esperar 4 días. Los dos últimos días nunca ven uno más cálido.",
  sample: { input: [73, 74, 75, 71, 69, 72, 76, 73] },
  constraints: ["0 ≤ temperatures.length ≤ 100.000", "30 ≤ temperatures[i] ≤ 100", "«Más cálido» significa mayor, no igual"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el próximo día más cálido?", options: [option("Pila de pendientes", "Los días esperan hasta que llega uno más cálido."), option("Mirar hacia adelante", "Para cada día, buscar el próximo más cálido."), option("De atrás para adelante", "Reusar la respuesta del día siguiente."), option("Saltar al máximo", "El día más caluroso que viene te salva.")] },
    { title: "Memoria", question: "¿Qué guardás de los días sin resolver?", options: [option("Pila de índices", "Guardás posiciones, no temperaturas."), option("El último pendiente", "Un solo índice alcanza."), option("Cola de pendientes", "Primero en llegar, primero en resolverse."), option("Pila sin repetidos", "Si llega una temperatura igual, reemplazás el tope.")] },
    { title: "Regla", question: "¿Qué hacés cuando llega un día nuevo?", options: [option("Mientras sea más cálido", "Resolvés todos los que supera."), option("Mientras no sea más frío", "Igual también cuenta."), option("Uno por día", "Cada día cálido resuelve un pendiente."), option("Distancia al nuevo tope", "Como en el histograma.")] },
  ],
  lesson: "Los días sin resolver forman una pila de temperaturas que no sube: cada día nuevo resuelve, de arriba hacia abajo, todos los pendientes estrictamente más fríos. Cada índice entra y sale una vez, así que es O(n). Mirar hacia adelante desde cada día también es correcto, pero cuesta O(n²).",
  resource: { title: "Problema original: Daily Temperatures", url: "https://leetcode.com/problems/daily-temperatures/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
