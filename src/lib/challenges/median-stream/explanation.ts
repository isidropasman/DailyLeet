import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = cantidad de números que llegan. El tiempo es el total de las n inserciones.",
  optimalTime: /^O\(n log n\)$/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(n²)", space: "O(n)" }
    : approach === 2 ? { time: "O(n)", space: "O(1)" }
    : approach === 3 ? { time: "O(n log n)", space: "O(n)" }
    : memory === 2 ? { time: "O(n² log n)", space: "O(n)" }
    : memory === 3 ? { time: "O(n²)", space: "O(n)" }
    : { time: "O(n log n)", space: "O(n)" },
  keyIdea: {
    summary: "Dos mitades: un max-heap con los menores y un min-heap con los mayores, con a lo sumo uno más abajo. La mediana es el tope de abajo o el promedio de los dos topes.",
    detail: "La invariante es doble: tamaños balanceados y todo lo de abajo ≤ todo lo de arriba. Si x entra abajo y el mayor de abajo sube, el orden entre mitades se mantiene aunque x sea enorme; después, si arriba quedaron más, uno baja. Cada paso es un push o un pop: O(log n).",
  },
  steps: [
    [
      { verdict: "óptima", why: "Con dos heaps balanceados, cada número cuesta O(log n) y la mediana se lee de los topes." },
      { verdict: "correcta pero más lenta", why: "La búsqueda binaria encuentra la posición en O(log n), pero insertar en el medio de un array corre todo lo que sigue: O(n) por número, O(n²) en total." },
      broken("La media se mueve con los valores extremos; la mediana no.", [5, 15, 1, 3],
        "Con 5, 15, 1 la media es 7 y la mediana es 5; con el 3, la media es 6 y la mediana 4. Devuelve [5, 10, 7, 6]; esperado [5, 10, 5, 4]."),
      broken("Guardar solo los menores tira la mitad de arriba: con cantidad par falta el segundo del medio.", [1, 2],
        "Con 1 y 2 guarda ⌈2/2⌉ = 1 número, el 1, y devuelve su tope. El promedio con el 2 ya no se puede calcular. Devuelve [1, 1]; esperado [1, 1.5]."),
    ],
    [
      { verdict: "óptima", why: "Negar los números de abajo convierte el min-heap en un max-heap: su tope es el mayor de la mitad de abajo." },
      broken("Sin negar, el heap de abajo da el menor de su mitad, no el mayor: los dos del medio salen mal.", [5, 15, 1, 3],
        "Después de 5, 15 y 1, la mitad de abajo queda {1, 15}: al sacar el menor en vez del mayor, el 15 nunca sube. Su tope es 1. Devuelve [5, 10, 1, 2]; esperado [5, 10, 5, 4]."),
      { verdict: "correcta pero más lenta", why: "Reordenar todo el array en cada inserción siempre deja la mediana en el medio, pero cuesta O(n log n) por número." },
      broken("Mirar solo los extremos no ordena: un número que no es el menor va atrás aunque sea menor que lo que ya está ahí.", [5, 15, 1, 3],
        "Quedan [1, 5, 15] y el 3, que no es menor o igual al 1, va atrás: [1, 5, 15, 3]. El medio es 5 y 15. Devuelve [5, 10, 5, 10]; esperado [5, 10, 5, 4]."),
    ],
    [
      { verdict: "óptima", why: "Pasar x por abajo y subir el mayor mantiene todo lo de abajo ≤ todo lo de arriba; el rebalanceo mantiene los tamaños. Con cantidad par, promedio exacto." },
      broken("Balancear solo por tamaño rompe el orden entre mitades: un número grande se queda abajo.", [2, 1, 5, 7, 2, 0, 5],
        "Después de 2 y 1, abajo está el 1 y arriba el 2. El 5 entra abajo y, como los tamaños dan, se queda ahí: el tope de abajo es 5, mayor que el 2 de arriba. Devuelve [2, 1.5, 5, 3.5, 5, 2, 5]; esperado [2, 1.5, 2, 3.5, 2, 2, 2]."),
      broken("Con cantidad par, la mediana es el promedio de los dos del medio, no el de abajo.", [1, 2],
        "Con 1 y 2 devuelve el tope de abajo, 1. Devuelve [1, 1]; esperado [1, 1.5]."),
      broken("La división entera pierde el .5 y, con negativos, redondea hacia abajo.", [1, 2],
        "Con 1 y 2 calcula (1 + 2) >> 1 = 1. Devuelve [1, 1]; esperado [1, 1.5]."),
    ],
  ],
  tradeOffs: [
    { title: "Rango acotado", detail: "Si los valores están en un rango chico (por ejemplo, 0 a 100), un array de 101 contadores responde la mediana en O(100) sin heaps." },
    { title: "Ventana deslizante", detail: "Si la mediana es de los últimos k números (LC 480), hay que sacar elementos arbitrarios: los heaps necesitan borrado diferido, o conviene un multiset ordenado." },
    { title: "Lista ordenada en datos chicos", detail: "Con cientos de números, la inserción binaria en un array es más simple y rápida en la práctica: correr memoria contigua es barato. Los heaps pagan con decenas de miles." },
  ],
  pattern: {
    heuristic: "Si ves «mediana (o percentil) de un stream», pensá en dos heaps balanceados.",
    detail: "Un heap da el extremo de un conjunto en O(1). Partiendo los datos en dos mitades, los extremos que se tocan son justo los del medio. Lo delicado es mantener las dos invariantes: tamaños y orden entre mitades.",
  },
  related: [
    { title: "Sliding Window Median", url: "https://leetcode.com/problems/sliding-window-median/" },
    { title: "IPO", url: "https://leetcode.com/problems/ipo/" },
  ],
  interview: {
    question: "¿Y si el 99% de los números está entre 0 y 100?",
    answer: "Contadores para 0..100 más dos heaps (o contadores) para los que quedan afuera. Casi todas las consultas se resuelven recorriendo 101 contadores, y los valores raros siguen en O(log n).",
  },
};
