import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "|s| y |t| = largos de los strings, Σ = letras distintas de t",
  optimalTime: /^O\(\|s\| \+ \|t\|\)/,
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(|s| · (|s| + |t|))", space: "O(Σ)" }
    : approach > 1 ? { time: "O(|s| · |t|)", space: "O(Σ)" }
    : memory === 2 ? { time: "O(|s| · Σ + |t|)", space: "O(Σ)" }
    : { time: "O(|s| + |t|)", space: "O(Σ)" },
  keyIdea: {
    summary: "La ventana crece por la derecha hasta cubrir t y se encoge por la izquierda mientras siga cubriendo. Cada ventana válida que registrás es la más corta que termina en esa posición.",
    detail: "need[c] cuenta cuántas c faltan todavía: arranca con las de t y baja con cada c que entra, aunque quede negativo si sobran. missing solo baja cuando need[c] era positivo, es decir, cuando esa letra hacía falta. Así la validez se chequea en O(1) y cada puntero avanza a lo sumo |s| veces.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Cada puntero avanza a lo sumo |s| veces y el contador de faltantes dice en O(1) si la ventana cubre t: O(|s| + |t|)." },
      { verdict: "correcta pero más lenta", why: "Desde cada comienzo crecés hasta cubrir t y te quedás con la más corta. Es correcto, pero cada comienzo puede recorrer todo s: O(|s|²)." },
      broken("La ventana más corta puede ser más larga que t: entre las letras útiles puede haber otras.", "acbbaca",
        "Ningún fragmento de 3 letras tiene dos a y una b: «bac» tiene una sola a y «aca» no tiene b. Devuelve \"\"; esperado \"baca\".", { other: "aba" }),
      broken("Ir de la primera aparición a la última no cuenta repeticiones ni busca la ventana más corta.", "a",
        "La primera a está en la posición 0 y devuelve \"a\", aunque t pide dos a. Devuelve \"a\"; esperado \"\".", { other: "aa" }),
    ],
    [
      { verdict: "óptima", why: "need[c] guarda cuántas c faltan, con repeticiones, y missing cuántas letras faltan en total: la validez es missing === 0." },
      broken("Un conjunto dice qué letras aparecen en t, no cuántas veces: con letras repetidas pide de menos.", "a",
        "El conjunto de \"aa\" es {a}: una sola a alcanza para cubrirlo. Devuelve \"a\"; esperado \"\".", { other: "aa" }),
      { verdict: "correcta pero más lenta", why: "Comparar la ventana con t letra por letra en cada paso es correcto, pero cada chequeo cuesta O(Σ) en vez de O(1)." },
      broken("Descontar cada letra de t que entra, aunque ya sobre, hace que una repetida cubra a otra que falta.", "aab",
        "Las dos a descuentan y missing llega a 0 sin ninguna b: registra \"aa\". Después \"ab\" tiene el mismo largo y no la reemplaza. Devuelve \"aa\"; esperado \"ab\".", { other: "ab" }),
    ],
    [
      { verdict: "óptima", why: "Mientras la ventana cubra t, la registrás y recortás por la izquierda. Cuando deja de cubrir, ya mediste la más corta que termina en right." },
      broken("Recortar una sola letra por paso deja ventanas válidas sin achicar del todo.", "ab",
        "Con la b la ventana \"ab\" cubre t: la registra y recorta la a. \"b\" sigue cubriendo, pero ya no vuelve a mirar. Devuelve \"ab\"; esperado \"b\".", { other: "b" }),
      broken("Registrar después de recortar guarda una ventana que ya no cubre t.", "a",
        "\"a\" cubre t, pero recorta antes de registrar y guarda el fragmento vacío que quedó. Devuelve \"\"; esperado \"a\".", { other: "a" }),
      broken("Reiniciar después de cada hallazgo descarta la ventana sin achicarla y pierde las que se solapan.", "ab",
        "\"ab\" cubre t: la registra y empieza de cero después de la b, sin probar \"b\". Devuelve \"ab\"; esperado \"b\".", { other: "b" }),
    ],
  ],
  tradeOffs: [
    { title: "Array de 128 contra Map", detail: "Con ASCII, un array de 128 enteros reemplaza al Map: sin hashing y con mejor caché. Con Unicode completo volvés al Map." },
    { title: "Filtrar s primero", detail: "Si t tiene pocas letras y s es enorme, podés guardar solo las posiciones de s con letras de t y deslizar la ventana sobre esa lista. Misma complejidad, menos pasos cuando casi todo s es ruido." },
    { title: "Comparar mapas con alfabetos chicos", detail: "Si Σ es chico (por ejemplo, ADN con 4 letras), comparar los conteos completos es O(4) por paso y queda más simple de leer que el contador de faltantes." },
  ],
  pattern: {
    heuristic: "Si ves «la ventana más corta que contiene…», pensá en dos punteros: expandir hasta que sea válida y encoger mientras lo siga siendo.",
    detail: "La clave es chequear la validez en O(1): un contador de faltantes que solo cambia cuando una letra cruza el umbral de lo necesario. Las repeticiones son la trampa: contá cuántas veces hace falta cada letra, no si aparece.",
  },
  related: [
    { title: "Permutation in String", url: "https://leetcode.com/problems/permutation-in-string/" },
    { title: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/" },
  ],
  interview: {
    question: "¿Y si t pudiera aparecer como subsecuencia y no como multiconjunto? (las letras de t en orden, no necesariamente juntas)",
    answer: "Ya no alcanza con contar: es Minimum Window Subsequence. Desde cada posición avanzás buscando las letras de t en orden y, cuando terminás, volvés hacia atrás para encontrar el comienzo más tardío. Queda O(|s| · |t|), o con DP sobre (posición en s, posición en t).",
  },
};
