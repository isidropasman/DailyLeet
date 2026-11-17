import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = largo del array",
  cost: ([approach]) => (approach === 1 ? { time: "O(n²)", space: "O(1)" } : { time: "O(n)", space: "O(1)" }),
  keyIdea: {
    summary: "cur es la mejor suma de un tramo que termina justo en i. Ese tramo es x solo o x pegado al mejor que termina en i − 1: cur = max(x, cur + x), y best guarda el máximo de todos.",
    detail: "Si lo que venías arrastrando es negativo, pegarte a eso solo te resta: conviene empezar de nuevo en x. Como todo tramo termina en alguna posición, mirar el mejor de cada final cubre todos. best arranca en el primer número y no en 0, porque el tramo no puede ser vacío y la respuesta puede ser negativa.",
  },
  steps: [
    [
      { verdict: "óptima", why: "En cada posición decidís si extender el tramo o empezar de nuevo: una pasada, O(n) y O(1) de memoria." },
      { verdict: "correcta pero más lenta", why: "Sumar desde cada comienzo prueba todos los tramos y no se equivoca, pero cuesta O(n²)." },
      broken("Actualizar el mínimo antes de restar deja que el prefijo se reste a sí mismo: eso es el tramo vacío, que vale 0.", [-7],
        "El prefijo es −7 y el mínimo pasa a ser −7. La resta da 0, que le gana al −7. Devuelve 0; esperado −7."),
      broken("Juntar todos los positivos ignora que el tramo tiene que ser contiguo.", [2, -1, 2],
        "Suma los dos 2 y salta el −1, pero para unirlos hay que pasar por él. Devuelve 4; esperado 3."),
    ],
    [
      { verdict: "óptima", why: "cur y best arrancan en el primer número, que ya es un tramo válido. Recorrer desde el segundo evita contarlo dos veces." },
      broken("Con best = 0 suponés que el tramo puede ser vacío. Si todos son negativos, el 0 gana.", [-7],
        "cur = max(−7, 0 − 7) = −7, pero best ya vale 0 y el −7 no lo supera. Devuelve 0; esperado −7."),
      broken("Si arrancás con el primero y también lo recorrés, lo sumás dos veces.", [1],
        "cur = 1 y en la primera vuelta vuelve a procesar el 1: max(1, 1 + 1) = 2. Devuelve 2; esperado 1."),
      broken("−1 no significa «todavía nada»: es un valor que compite, y cur nunca se compara con best antes de la primera vuelta.", [1],
        "Con un solo número el loop no corre: cur = 1 nunca llega a best. Devuelve −1; esperado 1."),
    ],
    [
      { verdict: "óptima", why: "Si lo anterior suma negativo, x solo es mejor que x + lo anterior: max(x, cur + x) elige el mejor tramo que termina en i." },
      broken("max(0, cur + x) tira el número actual junto con lo anterior: cuando conviene empezar de nuevo, arranca en 0 y no en x.", [-2, 1],
        "Con x = 1, cur + x = −1 y max(0, −1) = 0. Pierde el 1 solo y best queda en 0. Devuelve 0; esperado 1."),
      broken("Sumar siempre calcula prefijos: nunca suelta el comienzo, aunque lo anterior reste.", [-2, 1],
        "Arrastra el −2: cur = −2 + 1 = −1 y nunca prueba el 1 solo. Devuelve −1; esperado 1."),
      broken("Lo que importa no es si x es negativo, sino si lo que venís arrastrando lo es.", [-2, 1],
        "El 1 no es negativo, así que extiende el tramo del −2: cur = −1. Nunca prueba el 1 solo. Devuelve −1; esperado 1."),
    ],
  ],
  tradeOffs: [
    { title: "Probar todos los tramos con n chico", detail: "Si n es de unos cientos y además necesitás filtrar tramos por otra condición (largo, fechas, feriados), el doble loop es más fácil de adaptar y de auditar." },
    { title: "Prefijos cuando el tramo tiene largo mínimo", detail: "Con prefijo − mínimo, actualizando el mínimo después de restar, también es O(n). Y si te piden tramos de al menos L días, solo cambiás qué prefijos entran al mínimo; Kadane no se adapta tan fácil." },
    { title: "Streaming", detail: "Kadane guarda dos números y procesa cada valor una vez: sirve para el mejor tramo de un stream de métricas sin guardar la historia." },
  ],
  pattern: {
    heuristic: "Si ves «el mejor tramo contiguo» de algo que se acumula, pensá en «el mejor que termina en i» y una decisión local: extender o empezar de nuevo.",
    detail: "Es programación dinámica en una dimensión con un solo estado anterior, así que no necesitás el array de DP. La pregunta clave es qué guardás por posición; con productos, por ejemplo, necesitás el máximo y el mínimo porque un negativo los da vuelta.",
  },
  related: [
    { title: "Maximum Product Subarray", url: "https://leetcode.com/problems/maximum-product-subarray/" },
    { title: "Maximum Sum Circular Subarray", url: "https://leetcode.com/problems/maximum-sum-circular-subarray/" },
  ],
  interview: {
    question: "¿Y si el tramo puede ser vacío, de forma que la respuesta nunca baja de 0?",
    answer: "Ahí best = 0 y cur = max(0, cur + x) pasan a ser correctas: el tramo vacío vale 0 y ningún negativo le gana. Es la versión de Kadane que aparece en muchos libros, y por eso la trampa es tan común cuando el tramo no puede ser vacío.",
  },
};
