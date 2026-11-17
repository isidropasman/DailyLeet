import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = largo del array",
  optimalTime: /^O\(log n\)/,
  cost: ([approach]) =>
    approach === 1 || approach === 2 ? { time: "O(n)", space: "O(1)" }
    : approach === 3 ? { time: "O(1)", space: "O(1)" }
    : { time: "O(log n)", space: "O(1)" },
  keyIdea: {
    summary: "El mínimo siempre queda en [lo, hi]. Si nums[mid] > nums[hi], la caída está a la derecha de mid; si no, mid..hi está ordenado y el mínimo es mid o algo a su izquierda.",
    detail: "nums[hi] es el único borde que sirve: en un array rotado, todo lo que está antes del corte es mayor que todo lo que está después, y hi siempre queda del lado de después o en el array sin rotar. Por eso nums[mid] > nums[hi] dice exactamente de qué lado del corte cae mid. Como mid puede ser el mínimo, hi = mid lo conserva; lo = mid + 1 descarta un valor que ya sabés que no es el mínimo.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Cada comparación con nums[hi] descarta la mitad del rango sin perder el mínimo: O(log n)." },
      { verdict: "correcta pero más lenta", why: "Mirar todos los valores encuentra el mínimo seguro, pero ignora que el array está casi ordenado: O(n)." },
      { verdict: "correcta pero más lenta", why: "La caída marca el mínimo y, si no hay caída, el array no está rotado y es nums[0]. Pero buscarla de a uno cuesta O(n)." },
      broken("El mínimo está justo después del corte, que puede caer en cualquier lugar, no en una punta.", [3, 1, 2],
        "Las puntas son 3 y 2, y se queda con la menor. El 1 está en el medio, después de la caída. Devuelve 2; esperado 1."),
    ],
    [
      { verdict: "óptima", why: "nums[hi] está del lado bajo del corte (o el array no está rotado): si nums[mid] es mayor, mid está antes del corte y el mínimo, a su derecha." },
      broken("Con mid = lo, nums[mid] > nums[lo] es siempre falso; y en un array sin rotar empuja lo hasta el máximo.", [2, 1],
        "lo = 0, hi = 1 y mid = 0: 2 > 2 es falso, así que hace hi = 0 y se queda con el 2. Devuelve 2; esperado 1."),
      broken("nums[0] no se mueve con el rango: cuando mid cae en 0 se compara consigo mismo, y sin rotación todo es mayor que nums[0].", [2, 1],
        "mid = 0 compara el 2 con nums[0], que es el mismo 2. 2 > 2 es falso, así que hace hi = 0. Devuelve 2; esperado 1."),
      broken("Invierte la dirección: que nums[mid] sea menor que nums[hi] dice que mid..hi está ordenado, así que el mínimo no está a la derecha.", [2, 1],
        "mid = 0: 2 < 1 es falso, así que cree que el mínimo está a la izquierda y hace hi = 0. Devuelve 2; esperado 1."),
    ],
    [
      { verdict: "óptima", why: "Si nums[mid] > nums[hi], mid no es el mínimo: lo = mid + 1. Si no, mid puede serlo: hi = mid. El while termina con lo = hi en el mínimo." },
      broken("hi = mid − 1 descarta mid justo cuando mid..hi está ordenado, y mid puede ser el mínimo.", [3, 1, 2],
        "mid = 1 apunta al mínimo y 1 < 2, pero hace hi = 0 y lo descarta. El rango queda en [0, 0]. Devuelve 3; esperado 1."),
      broken("lo = mid no avanza cuando mid = lo: con dos elementos y el mínimo a la derecha, el rango no cambia nunca.", [2, 1],
        "lo = 0, hi = 1 y mid = 0. Como 2 > 1, hace lo = 0 y vuelve a calcular el mismo mid. No termina (TLE); esperado 1."),
      broken("Que mid..hi esté ordenado no dice que mid sea el mínimo: puede haber valores más chicos a su izquierda.", [1, 2, 3],
        "mid = 1 y 2 < 3, así que devuelve el 2 sin mirar la izquierda. El 1 estaba antes. Devuelve 2; esperado 1."),
    ],
  ],
  tradeOffs: [
    { title: "Recorrer con arrays chicos", detail: "Con unos pocos cientos de elementos, un min() lineal es más simple, no tiene bordes y la diferencia no se mide. La binaria gana cuando n es grande o consultás muchas veces." },
    { title: "Valores repetidos", detail: "Si puede haber repetidos, nums[mid] == nums[hi] no dice de qué lado está el corte. Hay que achicar con hi−− y el peor caso vuelve a ser O(n)." },
    { title: "Guardar el corte", detail: "Si vas a hacer muchas búsquedas sobre el mismo array rotado, encontrá el índice del mínimo una vez. Con ese offset, cualquier búsqueda binaria normal funciona con índices desplazados." },
  ],
  pattern: {
    heuristic: "Si ves un array «ordenado pero rotado» y te piden O(log n), pensá en binaria comparando nums[mid] contra un borde del rango.",
    detail: "No hace falta que todo el rango esté ordenado: alcanza con que una comparación diga de qué lado está lo que buscás. El invariante es que el mínimo siempre queda en [lo, hi]: por eso hi = mid y no mid − 1, y lo = mid + 1 y no mid.",
  },
  related: [
    { title: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
    { title: "Find Minimum in Rotated Sorted Array II", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array-ii/" },
    { title: "Find Peak Element", url: "https://leetcode.com/problems/find-peak-element/" },
  ],
  interview: {
    question: "¿Y si en vez del mínimo te piden la posición de un valor target en el array rotado?",
    answer: "Misma binaria: en cada paso una de las dos mitades está ordenada (lo..mid si nums[lo] ≤ nums[mid]). Si target cae dentro del rango de esa mitad, vas ahí; si no, a la otra. Ahí comparar con nums[lo] sí sirve, porque buscás un valor, no el corte.",
  },
};
