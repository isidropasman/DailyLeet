import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de días. El espacio no cuenta el array de respuesta.",
  cost: ([approach]) =>
    approach === 1 ? { time: "O(n²)", space: "O(1)" }
    : approach > 1 ? { time: "O(n)", space: "O(1)" }
    : { time: "O(n)", space: "O(n)" },
  keyIdea: {
    summary: "Los días sin resolver forman una pila cuyas temperaturas no suben. Un día nuevo resuelve desde arriba todos los pendientes estrictamente más fríos.",
    detail: "Si un día pendiente es más frío que el de arriba de la pila, ya lo habría resuelto el de arriba. Por eso la pila queda ordenada y alcanza con mirar el tope. Cada índice entra y sale una vez: O(n) en total, aunque haya un while adentro del for.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Cada día espera en la pila hasta que llega uno más cálido. Cada índice entra y sale una sola vez, así que todo es O(n)." },
      { verdict: "correcta pero más lenta", why: "Para cada día recorrés hacia adelante hasta el primero más cálido. Es correcto, pero con temperaturas que bajan es O(n²)." },
      broken("Reusar la respuesta del día siguiente da un solo salto; ese día puede seguir siendo más frío.", [72, 70, 71, 75],
        "Para el 72 mira el 70 (más frío) y salta a su respuesta: el 71, que también es más frío. Anota 2 sin seguir saltando. Devuelve [2, 1, 1, 0]; esperado [3, 1, 1, 0]."),
      broken("El día más caluroso que viene te salva, pero no es el primero más cálido.", [71, 72, 75],
        "Para el 71, el máximo de lo que sigue es el 75 (día 2): anota 2. El 72 del día siguiente ya era más cálido. Devuelve [2, 1, 0]; esperado [1, 1, 0]."),
    ],
    [
      { verdict: "óptima", why: "Guardás índices: con el índice tenés la temperatura y además la distancia i − j para la respuesta." },
      broken("Un solo pendiente no alcanza: varios días pueden esperar al mismo día cálido.", [70, 70, 71],
        "El segundo 70 reemplaza al primero, que queda olvidado. El 71 resuelve solo al día 1. Devuelve [0, 1, 0]; esperado [2, 1, 0]."),
      broken("Con una cola mirás el pendiente más viejo, que suele ser el más caluroso: bloquea a los más fríos que llegaron después.", [72, 70, 71, 75],
        "El 71 compara contra el 72 del frente de la cola y no resuelve al 70, que esperaba atrás. Recién el 75 vacía todo. Devuelve [3, 2, 1, 0]; esperado [3, 1, 1, 0]."),
      broken("Reemplazar el tope cuando la temperatura es igual pierde un día que también espera.", [70, 70, 71],
        "El segundo 70 reemplaza al primero en el tope. El 71 resuelve al día 1 y el día 0 queda sin respuesta. Devuelve [0, 1, 0]; esperado [2, 1, 0]."),
    ],
    [
      { verdict: "óptima", why: "Resolvés todos los pendientes estrictamente más fríos, de arriba hacia abajo. Un día igual no los resuelve." },
      broken("Una temperatura igual no es «más cálida»: con >= resolvés días que todavía tienen que esperar.", [70, 70, 71],
        "El segundo 70 resuelve al primero con distancia 1. Esperado: el primero espera al 71, a 2 días. Devuelve [1, 1, 0]; esperado [2, 1, 0]."),
      broken("Un día cálido puede resolver varios pendientes de una vez; con un if resolvés uno solo.", [70, 70, 71],
        "El 71 resuelve al día 1 y no vuelve a mirar: el día 0 queda en la pila hasta el final. Devuelve [0, 1, 0]; esperado [2, 1, 0]."),
      broken("La distancia al nuevo tope sirve en el histograma, no acá: la espera es i − j, desde el día resuelto.", [70, 70, 71],
        "Al resolver el día 1, el nuevo tope es el día 0 y anota 2 − 0 = 2. Devuelve [2, 2, 0]; esperado [2, 1, 0]."),
    ],
  ],
  tradeOffs: [
    { title: "Fuerza bruta acotada", detail: "Si las temperaturas van de 30 a 100, podés recorrer de atrás para adelante guardando el próximo índice de cada temperatura: O(n·71) sin pila. Con un rango no acotado vuelve a ser la pila." },
    { title: "Mirar hacia adelante en datos chicos", detail: "Con decenas de días, el doble loop es más fácil de revisar y no tiene casos borde de igualdad. La pila paga recién con miles de elementos o datos que bajan mucho tiempo." },
    { title: "Streaming", detail: "La pila funciona online: cada día nuevo resuelve pendientes sin conocer el futuro. Mirar hacia adelante necesita el array completo." },
  ],
  pattern: {
    heuristic: "Si ves «para cada elemento, el próximo mayor (o menor)», pensá en una pila monótona de índices.",
    detail: "La pila guarda los elementos que todavía no encontraron respuesta, en un orden que hace que solo importe el tope. Decidí con cuidado si la igualdad resuelve o no: es el error más común.",
  },
  related: [
    { title: "Next Greater Element II", url: "https://leetcode.com/problems/next-greater-element-ii/" },
    { title: "Largest Rectangle in Histogram", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
  ],
  interview: {
    question: "¿Y si «más cálido» incluyera los días iguales?",
    answer: "Cambia solo la condición del while: con >=, un día igual resuelve a los pendientes. Es justo la regla «Mientras no sea más frío», que acá es incorrecta y en esa variante pasa a ser la correcta. La pila sigue siendo O(n).",
  },
};
