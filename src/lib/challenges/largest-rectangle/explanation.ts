import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de barras",
  cost: ([approach]) =>
    approach > 0 ? { time: "O(n²)", space: "O(1)" }
    : { time: "O(n)", space: "O(n)" },
  keyIdea: {
    summary: "El rectángulo más alto que usa una barra va desde la primera barra más baja a su izquierda hasta la primera más baja a su derecha. Una pila de índices con alturas crecientes te da los dos bordes en el momento en que la barra sale.",
    detail: "Cuando llega una barra más baja, saca a las más altas: esa barra es el borde derecho. El borde izquierdo es el nuevo tope, porque todo lo que había entre los dos ya salió por ser más alto. Así que el ancho es i − nuevoTope − 1, o i si la pila quedó vacía. El 0 al final vacía la pila. Cada índice entra y sale una vez: O(n).",
  },
  steps: [
    [
      { verdict: "óptima", why: "Cada barra sale de la pila cuando llega una más baja, y en ese momento conocés sus dos bordes. Cada índice entra y sale una vez: O(n)." },
      { verdict: "correcta pero más lenta", why: "Desde cada barra te extendés a los dos lados mientras no baje. Es correcto, pero con barras iguales o crecientes cuesta O(n²)." },
      broken("Mover el lado más bajo sirve en Container With Most Water, donde solo importan los extremos. Acá importa la barra más baja del medio, y el rectángulo óptimo puede quedar descartado.", [6, 2, 5, 4, 5, 1, 6],
        "El 6 de la izquierda nunca es el más bajo, así que achica solo por la derecha y nunca prueba [5, 4, 5], de altura 4 y área 12. Lo mejor que ve es 2 × 5. Devuelve 10; esperado 12."),
      broken("Contar las barras que llegan a una altura ignora que tienen que ser contiguas.", [2, 1, 2],
        "Hay dos barras de altura 2 y cuenta 2 × 2 = 4, pero el 1 del medio las separa. Devuelve 4; esperado 3."),
    ],
    [
      { verdict: "óptima", why: "Con índices sabés la altura y también la posición, que es lo que necesitás para el ancho. El 0 al final saca todo lo que quedaba en la pila." },
      broken("Contar cuántas sacaste en esta vuelta olvida las barras más altas que ya habían salido antes: también estaban dentro del ancho.", [2, 1, 2],
        "El 2 del principio sale cuando llega el 1. Al final, el 1 sale después de un solo 2 y mide ancho 2. Su rectángulo real tiene ancho 3. Devuelve 2; esperado 3."),
      broken("Sin centinela, las barras que quedan en la pila al final nunca se miden: justo las que no tienen una más baja a la derecha.", [7],
        "El 7 entra a la pila y nunca llega una barra más baja. Termina sin medir nada. Devuelve 0; esperado 7."),
      broken("En una pila decreciente, la barra que llega no es el borde derecho de las que saca: es más alta que ellas.", [7],
        "El centinela 0 no es más alto que el 7, así que no saca a nadie y el 7 queda sin medir. Devuelve 0; esperado 7."),
    ],
    [
      { verdict: "óptima", why: "La barra que sacás se extiende a la derecha hasta i − 1 y a la izquierda hasta justo después del nuevo tope. Si la pila queda vacía, no hay nada más bajo a la izquierda y llega hasta 0: ancho i." },
      broken("Contar desde la barra que sacás olvida el tramo a su izquierda: las barras más altas que ya salieron también entran en el rectángulo.", [2, 1, 2],
        "Cuando sale el 1, su posición es 1 y mide 3 − 1 = 2, aunque llega hasta la posición 0. Devuelve 2; esperado 3."),
      broken("Sin el −1, el ancho incluye al nuevo tope, que es más bajo que la barra que sacás.", [2, 4],
        "Al sacar el 4 el nuevo tope es el índice 0 y mide 2 − 0 = 2: un rectángulo de 4 × 2 que incluye al 2. Devuelve 8; esperado 4."),
      broken("Si la pila queda vacía, no hay ninguna barra más baja a la izquierda: el rectángulo llega hasta el principio, no mide 1.", [2, 1, 2],
        "Al final sale el 1 y la pila queda vacía: le asigna ancho 1 aunque el 1 cubre las tres posiciones. Devuelve 2; esperado 3."),
    ],
  ],
  tradeOffs: [
    { title: "Dos pasadas con arrays", detail: "Podés calcular, con dos pilas separadas, el primer menor a la izquierda y a la derecha de cada barra, y después recorrer una vez. Sigue siendo O(n), con más memoria pero menos casos borde en un solo loop." },
    { title: "Expandir en datos chicos", detail: "Con decenas de barras, expandir desde cada una es fácil de revisar y no tiene el riesgo del off-by-one en el ancho." },
    { title: "Divide y vencerás", detail: "La barra más baja divide el problema en dos mitades. Con un segment tree para el mínimo queda O(n log n). Es útil si te preguntan muchos rangos distintos." },
  ],
  pattern: {
    heuristic: "Si ves «para cada elemento, hasta dónde se extiende antes de encontrar uno menor», pensá en una pila monótona creciente con centinela.",
    detail: "La barra que saca da el borde derecho y el nuevo tope da el izquierdo. El centinela evita un segundo loop para vaciar la pila. Es la misma idea de Daily Temperatures, pero acá el ancho se mide contra el nuevo tope, no contra la barra que sale.",
  },
  related: [
    { title: "Maximal Rectangle", url: "https://leetcode.com/problems/maximal-rectangle/" },
    { title: "Sum of Subarray Minimums", url: "https://leetcode.com/problems/sum-of-subarray-minimums/" },
  ],
  interview: {
    question: "¿Cómo usás esto para el rectángulo de 1 más grande en una matriz binaria?",
    answer: "Recorrés la matriz por filas y mantenés, para cada columna, cuántos 1 seguidos hay hasta la fila actual: eso es un histograma. Por cada fila corrés esta pila. Queda O(filas × columnas).",
  },
};
