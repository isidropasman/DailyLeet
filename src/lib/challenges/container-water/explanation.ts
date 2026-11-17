import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de paredes",
  cost: ([approach]) => (approach === 1 ? { time: "O(n²)", space: "O(1)" } : { time: "O(n)", space: "O(1)" }),
  keyIdea: {
    summary: "El agua entre l y r es la pared más baja por la distancia. La más baja de las dos ya dio su mejor par: con cualquier pared de adentro la distancia baja y la altura no sube. Descartarla nunca pierde la respuesta.",
    detail: "Arrancás con la distancia máxima. Si height[l] < height[r], todo par (l, j) con j < r guarda como mucho height[l] · (j − l), menos que lo que ya mediste: podés avanzar l sin revisarlos. Cada paso descarta una pared, así que en n − 1 pasos cubriste todos los pares que podían ganar.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Empezar en los extremos y descartar siempre la pared más baja revisa n − 1 pares sin perder el mejor: O(n)." },
      { verdict: "correcta pero más lenta", why: "Probar cada par encuentra el máximo seguro, pero son n(n − 1)/2 pares: O(n²)." },
      broken("Las paredes más altas pueden estar pegadas: el agua también depende de la distancia.", [1, 2, 1],
        "Las dos más altas son el 2 y un 1 vecino: guardan 1 × 1. Los dos 1 de los extremos están a distancia 2. Devuelve 1; esperado 2."),
      broken("El mejor par no tiene por qué incluir a la más alta: dos paredes medianas y lejanas pueden ganarle.", [1, 2, 1],
        "Ancla el 2 del medio: con cada 1 guarda 1 × 1. Los dos 1 juntos guardan 1 × 2. Devuelve 1; esperado 2."),
    ],
    [
      { verdict: "óptima", why: "La pared más baja ya dio su mejor par con la distancia máxima que le queda: descartarla es seguro." },
      broken("Si descartás la más alta, la más baja sigue limitando el agua y la distancia solo baja.", [1, 2, 4, 3],
        "Con 1 y 3 descarta el 3 y se queda con el 1 hasta el final: mide 3, 2 y 1. Nunca prueba 2 y 3 a distancia 2. Devuelve 3; esperado 4."),
      broken("Mover los dos punteros saltea pares: la pared más alta todavía podía formar uno mejor.", [1, 2, 4, 3],
        "Mide 1 con 3 (3) y después 2 con 4 (2). Se saltea 2 con 3 a distancia 2. Devuelve 3; esperado 4."),
      broken("Alternar no mira las alturas: a veces descarta la pared que podía ganar.", [2, 3, 4, 5, 18, 17, 6],
        "La derecha pasa de 6 a 17 y a 18 mientras la izquierda sigue en paredes bajas. Cuando llega al 18, ya descartó el 17 y nunca los mide juntos. Devuelve 15; esperado 17."),
    ],
    [
      { verdict: "óptima", why: "El agua llega hasta la pared más baja y el ancho es la distancia r − l." },
      broken("Con la más alta el agua se escaparía por la más baja.", [0, 5],
        "Mide 5 × 1 = 5, pero una pared tiene altura 0 y no retiene nada. Devuelve 5; esperado 0."),
      broken("r − l + 1 cuenta paredes, no distancia: las paredes no tienen ancho.", [1, 1],
        "Entre las posiciones 0 y 1 cuenta 2 en vez de 1: mide 1 × 2. Devuelve 2; esperado 1."),
      broken("La izquierda no siempre es la más baja: cuando es la más alta, sobreestima el agua.", [5, 1, 2],
        "Con 5 y 2 mide 5 × 2 = 10, pero el agua llega solo hasta 2. Devuelve 10; esperado 4."),
    ],
  ],
  tradeOffs: [
    { title: "Todos los pares con n chico", detail: "Con unas pocas decenas de paredes, el doble for es más simple de leer y de auditar, y no tiene un argumento de correctitud sutil. Con 10⁵ paredes son 5 · 10⁹ pares y no termina." },
    { title: "Ordenar por altura", detail: "Si además necesitás responder «mejor par con al menos altura h» para muchos h, ordenar las paredes de más alta a más baja y llevar el índice mínimo y máximo vistos resuelve todas las consultas en O(n log n)." },
    { title: "Desborde", detail: "Altura 10⁴ por distancia 10⁵ da 10⁹, que entra justo en un int de 32 bits. Si las alturas crecen, el área necesita 64 bits aunque cada pared entre en un int." },
  ],
  pattern: {
    heuristic: "Si ves «el mejor par (i, j)» y el valor depende de la distancia y de un mínimo, pensá en dos punteros desde los extremos.",
    detail: "La clave es demostrar que un extremo ya no puede mejorar y descartarlo: así cada paso elimina una fila entera de pares. Funciona cuando achicar la distancia solo puede compensarse con algo que el extremo descartado nunca tendrá.",
  },
  related: [
    { title: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water/" },
    { title: "Two Sum II - Input Array Is Sorted", url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
    { title: "3Sum", url: "https://leetcode.com/problems/3sum/" },
  ],
  interview: {
    question: "¿Y si en vez de elegir dos paredes te piden toda el agua que queda atrapada entre todas las paredes después de llover?",
    answer: "Es Trapping Rain Water: sobre cada posición el agua llega hasta min(máximo a la izquierda, máximo a la derecha) menos su altura. Con dos punteros movés el lado con máximo más bajo, porque ese lado ya sabe su límite: O(n) y O(1) de memoria.",
  },
};
