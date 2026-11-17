import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Vuelta de tuerca", difficulty: "Medio", topic: "Búsqueda binaria",
  description: "Tenías una lista de números distintos ordenada de menor a mayor. Alguien cortó un tramo del principio y lo pegó al final (puede que no haya cortado nada). Devolvé el valor más chico de la lista que quedó.",
  example: "[5, 7, 9, 1, 3]", expected: "1",
  explanation: "Es [1, 3, 5, 7, 9] con el tramo [1, 3] pasado al final. El mínimo es 1, justo después de la caída de 9 a 1.",
  sample: { input: [5, 7, 9, 1, 3] },
  constraints: ["1 ≤ nums.length ≤ 10⁵", "−10⁹ ≤ nums[i] ≤ 10⁹", "Todos los valores son distintos", "La rotación va de 0 a n − 1 lugares"],
  steps: [
    { title: "Enfoque", question: "¿Cómo encontrás el mínimo?", options: [option("Binaria contra el borde", "Una de las dos mitades siempre está ordenada."), option("Recorrer todo", "Quedarte con el menor que veas."), option("Buscar la caída", "El primer nums[i] menor que el anterior."), option("Mirar las puntas", "El mínimo queda en un extremo del corte.")] },
    { title: "Memoria", question: "¿Qué comparación te dice que el mínimo está a la derecha de mid?", options: [option("nums[mid] > nums[hi]", "Contra el borde derecho del rango."), option("nums[mid] > nums[lo]", "Contra el borde izquierdo del rango."), option("nums[mid] > nums[0]", "Contra el primero del array."), option("nums[mid] < nums[hi]", "Si mid es chico, seguís hacia la derecha.")] },
    { title: "Regla", question: "¿Cómo movés los bordes?", options: [option("lo = mid + 1 / hi = mid", "mid puede ser el mínimo si no está a la derecha."), option("lo = mid + 1 / hi = mid − 1", "mid ya lo miraste."), option("lo = mid / hi = mid", "Los dos bordes caen sobre mid."), option("lo = mid + 1 / devolver nums[mid]", "Si no está a la derecha, ya lo encontraste.")] },
  ],
  lesson: "Compará nums[mid] con nums[hi]. Si es mayor, la caída está a la derecha de mid y el mínimo también: lo = mid + 1. Si es menor, mid..hi está ordenado y el mínimo es mid o algo a su izquierda: hi = mid. El mínimo nunca sale de [lo, hi] y lo encontrás en O(log n). Comparar con nums[lo] no sirve: no distingue un array sin rotar de uno rotado.",
  resource: { title: "Problema original: Find Minimum in Rotated Sorted Array", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
