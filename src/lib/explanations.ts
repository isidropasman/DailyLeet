import { activeSteps, challenges, isChoices, isModuleKind, type Choices, type Kind, type LegacyKind } from "./challenges";
import { modules } from "./challenges/registry";
import { recordOf } from "./challenges/record";
import { broken, type CaseInput, type Cost, type Explanation, type Verdict } from "./explanation-types";
import type { Evaluation, Output, TestExecution } from "./engine";

const legacyExplanations: Record<LegacyKind, Explanation> = {
  substring: {
    optimal: [0, 0, 0],
    notation: "n = largo del string · k = caracteres distintos (≤ 26 acá)",
    cost: ([approach, , rule]) =>
      approach === 3 ? { time: "O(n)", space: "O(k)" }
      : approach === 2 ? { time: "O(n log n)", space: "O(n)" }
      : approach === 1 ? { time: rule === 0 ? "O(n·k)" : "O(n²)", space: "O(k)" }
      : { time: "O(n)", space: "O(k)" },
    keyIdea: {
      summary: "La ventana nunca contiene repetidos y su inicio solo avanza: cada carácter entra y sale una vez, así que todo es O(n).",
      detail: "Cuando el carácter nuevo ya está en la ventana, el inicio salta justo después de su aparición anterior. Si el inicio retrocede o se reinicia, perdés ventanas válidas o contás inválidas. Con un Map de últimas posiciones saltás en O(1); con un Set quitás de a uno, pero el total sigue siendo lineal (amortizado).",
    },
    steps: [
      [
        { verdict: "óptima", why: "Expandís a la derecha y ajustás el inicio: cada índice entra y sale de la ventana como mucho una vez." },
        { verdict: "correcta pero más lenta", why: "Desde cada comienzo extendés hasta el primer repetido. Es correcto, pero repite trabajo: O(n·k) con este alfabeto y O(n²) si el alfabeto no está acotado." },
        broken("Ordenar destruye la contigüidad: los caracteres de la subcadena dejan de ser vecinos.", "pwwkew",
          '"pwwkew" ordenado es "ekpwww". La ventana crece por e, k, p, w y corta en la segunda w: devuelve 4. Esa subcadena no existe en el original; la respuesta es 3 ("wke").'),
        broken("Contar distintos mide el alfabeto, no la subcadena: ignora que un repetido parte la ventana.", "pwwkew",
          'Los distintos de "pwwkew" son {p, w, k, e}: devuelve 4. Ninguna subcadena contigua tiene las cuatro sin repetir; la mejor es "wke" (3).'),
      ],
      [
        { verdict: "óptima", why: "Map de carácter a último índice: ante un repetido el inicio salta a anterior + 1 en O(1). El Math.max evita retroceder cuando esa aparición ya quedó fuera de la ventana (\"abba\")." },
        { verdict: "óptima", why: "Set con la ventana: ante un repetido quitás desde el inicio hasta sacarlo. Cada carácter se borra como mucho una vez, así que sigue siendo O(n) amortizado." },
        broken("Comparar solo con el carácter anterior detecta \"dd\" pero no \"d…d\": el repetido puede estar en cualquier lugar de la ventana.", "dvdf",
          'En "dvdf", la segunda d se compara solo con la v: no la ve repetida. La ventana llega a "dvdf" (4), con dos d. Esperado: 3 ("vdf").'),
        broken("Comparar solo con el primer carácter de la ventana no ve los repetidos del medio.", "abba",
          'En "abba", la segunda b se compara con la a del inicio: pasa. La ventana "abb" ya mide 3, con dos b. Esperado: 2.'),
      ],
      [
        { verdict: "óptima", why: "Mover el inicio justo después del repetido, sin retroceder: la ventana vuelve a ser válida sin descartar nada que sirva." },
        broken("Reiniciar descarta también los caracteres válidos que estaban después del repetido.", "dvdf",
          '"dv" mide 2. La segunda d vacía la ventana y el inicio pasa a la f: se pierden la v y la d. Nunca ve "vdf"; devuelve 2 en vez de 3.'),
        broken("Avanzar un solo lugar no alcanza cuando el repetido estaba más adentro: la ventana conserva el duplicado.", "abba",
          'Con la segunda b, el inicio avanza a la primera b, pero no la saca. Después la ventana "bba" mide 3 y tiene dos b. Esperado: 2.'),
        broken("Seguir contando es no tener regla: la ventana nunca se achica.", "abba",
          'En "abba" la ventana nunca se ajusta y termina siendo "abba" (4). Esperado: 2 ("ab" o "ba").'),
      ],
    ],
    tradeOffs: [
      { title: "Map o Set", detail: "El Map salta directo; el Set hace hasta 2n operaciones pero no necesita el Math.max, que es la fuente típica del bug de \"abba\". Con alfabeto chico, un array[128] de últimos índices le gana a ambos: sin hashing y con mejor localidad de caché." },
      { title: "Fuerza bruta acotada", detail: "Con 26 letras, \"todos los comienzos\" cortando en el primer repetido es O(26·n): lineal en la práctica y más fácil de leer. Deja de servir con Unicode o alfabetos grandes, donde se vuelve O(n²)." },
      { title: "Streaming", detail: "La ventana solo mira hacia adelante: funciona sobre un stream de caracteres guardando O(k) de estado, sin tener el texto entero en memoria." },
    ],
    pattern: {
      heuristic: "Si ves «subcadena o subarray contiguo más largo/corto que cumple X», pensá en ventana deslizante con dos punteros que solo avanzan.",
      detail: "La pregunta clave: ¿cuándo deja de ser válida la ventana y qué tengo que guardar para repararla barato? Si agrandar una ventana inválida nunca la arregla, el patrón aplica.",
    },
    related: [
      { title: "Longest Repeating Character Replacement", url: "https://leetcode.com/problems/longest-repeating-character-replacement/" },
      { title: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/" },
    ],
    interview: {
      question: "¿Y si te piden la subcadena más larga con a lo sumo k caracteres distintos?",
      answer: "Misma ventana, pero el Map guarda conteos: agregás por la derecha y, mientras haya más de k claves, descontás desde el inicio y borrás las que lleguen a 0. Sigue siendo O(n) de tiempo y O(k) de espacio. Cambia la condición de validez, no el patrón.",
    },
  },

  "two-sum": {
    optimal: [0, 0, 0],
    notation: "n = largo del array",
    cost: ([approach, memory]) =>
      approach === 1 ? { time: "O(n²)", space: "O(1)" }
      : approach > 1 ? { time: "O(n)", space: "O(1)" }
      : memory === 1 ? { time: "O(n²)", space: "O(n)" }
      : memory === 2 ? { time: "O(n)", space: "O(1)" }
      : { time: "O(n) promedio", space: "O(n)" },
    keyIdea: {
      summary: "Por cada número x, la pregunta es «¿ya vi objetivo − x?». Un Map responde eso en O(1), así que alcanza con una pasada.",
      detail: "Buscar antes de insertar garantiza que el Map solo tiene posiciones anteriores: nunca emparejás un elemento consigo mismo. Los duplicados como [3, 3] funcionan solos, porque el primer 3 ya está guardado cuando llega el segundo.",
    },
    steps: [
      [
        { verdict: "óptima", why: "Convierte «buscar una pareja» (O(n²)) en «buscar un valor» (O(1) promedio con un Map)." },
        { verdict: "correcta pero más lenta", why: "Prueba las n·(n−1)/2 parejas. Es correcta y no usa memoria extra, pero con 10.000 números son unos 50 millones de sumas." },
        broken("La pareja puede estar en cualquier par de posiciones, no solo en vecinas.", [0, 4, 3, 0],
          "Compara 0 + 4, 4 + 3 y 3 + 0: ninguna da 0. La pareja válida usa los índices 0 y 3, que no son vecinos. Devuelve [].", { target: 0 }),
        broken("Los dos punteros solo funcionan sobre un array ordenado: ahí mover un extremo sube o baja la suma de forma predecible.", [3, 2, 4],
          "3 + 4 = 7 > 6: mueve la derecha. 3 + 2 = 5 < 6: mueve la izquierda y se cruzan. Nunca prueba 2 + 4. Devuelve [] en vez de [1, 2].", { target: 6 }),
      ],
      [
        { verdict: "óptima", why: "valor → índice: lo que tenés que devolver son posiciones, así que el Map guarda exactamente eso." },
        { verdict: "correcta pero más lenta", why: "Funciona, pero buscar en una lista cuesta O(n) por consulta: volvés a O(n²) y además gastás O(n) de memoria. Lo peor de los dos mundos." },
        broken("Recordar solo el último número limita la búsqueda a parejas vecinas.", [0, 4, 3, 0],
          "Al llegar al último 0 busca otro 0, pero solo recuerda el 3. El 0 del índice 0 ya se olvidó. Devuelve [].", { target: 0 }),
        broken("Guardar el valor como si fuera su índice devuelve números que no son posiciones.", [3, 3],
          "Guarda 3 → 3. El segundo 3 encuentra su complemento y devuelve [3, 1]: el índice 3 no existe en un array de largo 2.", { target: 6 }),
      ],
      [
        { verdict: "óptima", why: "Buscar antes de registrar: el Map solo tiene índices anteriores, así que la pareja siempre usa dos posiciones distintas." },
        broken("Registrar antes de buscar deja que un número se empareje consigo mismo cuando vale la mitad del objetivo.", [3],
          "Registra 3 → 0 y busca 6 − 3 = 3: lo encuentra en su propio índice. Devuelve [0, 0], usando la misma posición dos veces.", { target: 6 }),
        broken("El signo no tiene nada que ver: los negativos y el cero también forman parejas.", [-2, -5, -1],
          "Ningún número es positivo, así que el Map queda vacío. La pareja −5 + −1 = −6 nunca se encuentra. Devuelve [].", { target: -6 }),
        broken("Evitar registrar las mitades rompe justo el caso de los duplicados.", [3, 3],
          "El primer 3 es su propio complemento: no se registra. El segundo 3 busca un 3 y no lo encuentra. Devuelve [] en vez de [0, 1].", { target: 6 }),
      ],
    ],
    tradeOffs: [
      { title: "Memoria o tiempo", detail: "El doble for usa O(1) de memoria. Con n chico (unas decenas) o memoria muy limitada, suele ser más rápido en la práctica: no hay hashing ni asignaciones." },
      { title: "Ordenar + dos punteros", detail: "Si el array ya viene ordenado, dos punteros resuelven en O(n) con O(1) extra. Si necesitás todas las parejas o trabajás con tripletas, ordenar pares (valor, índice) en O(n log n) es la base de 3Sum." },
      { title: "Datos que no entran en memoria", detail: "Con miles de millones de números el Map no entra: ordenás externamente y aplicás dos punteros, o particionás por hash en disco y resolvés cada partición por separado." },
    ],
    pattern: {
      heuristic: "Si ves «encontrá dos elementos que cumplan una relación», pensá: para cada x, ¿qué valor exacto la completa? Si es único, buscalo en un hash.",
      detail: "Pasás de buscar parejas en O(n²) a buscar un valor en O(1). Funciona cuando la relación determina un único complemento (suma, diferencia, XOR). Si la relación es «menor que» o «el más cercano», necesitás orden, no hash.",
    },
    related: [
      { title: "Two Sum II – Input Array Is Sorted", url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
      { title: "3Sum", url: "https://leetcode.com/problems/3sum/" },
    ],
    interview: {
      question: "¿Y si el array viene ordenado y te piden O(1) de memoria extra?",
      answer: "Dos punteros en los extremos: si la suma es menor que el objetivo, avanzás la izquierda; si es mayor, retrocedés la derecha. Cada paso descarta todas las parejas de un extremo sin perder la solución, así que es O(n). Es la opción «Extremos sin ordenar» del juego: falla solo porque acá el array no viene ordenado.",
    },
  },

  brackets: {
    optimal: [0, 0, 0],
    notation: "n = largo del string",
    cost: ([approach, memory]) =>
      approach === 1 ? { time: "O(n²)", space: "O(n)" }
      : approach > 1 ? { time: "O(n)", space: "O(1)" }
      : memory >= 2 ? { time: "O(n)", space: "O(1)" }
      : { time: "O(n)", space: "O(n)" },
    keyIdea: {
      summary: "Lo último que abrís es lo primero que cerrás (LIFO). Una pila representa exactamente las aperturas pendientes, en ese orden.",
      detail: "Son tres condiciones: cada cierre tiene una apertura pendiente, es del mismo tipo que la más reciente y, al terminar, no queda nada abierto. Un contador no ve ni el tipo ni el orden: por eso \"([)]\" y \")(\" lo engañan.",
    },
    steps: [
      [
        { verdict: "óptima", why: "Una pasada: cada apertura entra a la pila y cada cierre resuelve la más reciente." },
        { verdict: "correcta pero más lenta", why: "Borrar \"()\", \"[]\" y \"{}\" hasta que no cambie nada es correcto, pero cada pasada cuesta O(n) y \"((((…))))\" necesita n/2 pasadas: O(n²)." },
        broken("Contar compara cantidades, pero no el orden ni los tipos.", ")(",
          'El balance pasa a −1 con ")" y vuelve a 0 con "(". Termina en 0 y lo acepta, aunque el cierre llegó antes que su apertura.'),
        broken("El espejo solo funciona para anidamientos puros como \"{[()]}\". Las secuencias concatenadas no son simétricas.", "()[]{}",
          'Compara "(" con "}": no forman pareja y devuelve false. Pero "()[]{}" es válido: son tres pares, uno al lado del otro.'),
      ],
      [
        { verdict: "óptima", why: "Push al abrir, pop al cerrar: la cima siempre es la apertura que tiene que cerrarse ahora." },
        broken("Una cola saca la apertura más vieja: acepta cruces y rechaza anidamientos.", "([)]",
          'La cola queda [(, [. Con ")" saca "(", la primera: coincide. Con "]" saca "[": coincide. Acepta "([)]", que está cruzado. También rechaza "{[()]}".'),
        broken("Un Set pierde las repeticiones: dos \"(\" abiertas cuentan como una.", "(()",
          'Entra la primera "(", la segunda no (ya estaba). El ")" la saca y el Set queda vacío: acepta "(()", aunque queda una apertura sin cerrar.'),
        broken("Recordar solo la última apertura olvida todas las anteriores.", "(()",
          'Guarda "(", la reemplaza por la otra "(" y el ")" la consume. No queda nada pendiente y acepta "(()", aunque falta un cierre.'),
      ],
      [
        { verdict: "óptima", why: "Hacen falta las dos condiciones: coincidir en cada cierre detecta cruces y tipos; terminar vacío detecta aperturas pendientes." },
        broken("Sin comparar tipos, cualquier cierre resuelve cualquier apertura. Con el enfoque de eliminar parejas esta regla sí alcanza: el reemplazo ya exige el tipo correcto.", "(]",
          '"(" entra a la pila; "]" la saca sin compararla. La pila termina vacía y acepta "(]".'),
        broken("Si no exigís una pila vacía al final, las aperturas sin cerrar pasan.", "((",
          'Las dos "(" quedan en la pila. Nunca llega un cierre que pueda fallar, así que devuelve true.'),
        broken("Tener longitud par es necesario, pero no suficiente.", "((",
          '"((" tiene largo 2: lo acepta, aunque no cierra nada.'),
      ],
    ],
    tradeOffs: [
      { title: "Un solo tipo de paréntesis", detail: "Si solo hay \"()\", no hace falta la pila: un contador que nunca baja de 0 y termina en 0 es correcto con O(1) de memoria. El contador del juego falla porque hay tres tipos y porque no corta cuando el balance queda negativo." },
      { title: "Legibilidad", detail: "Eliminar parejas con replaceAll se escribe en una línea y se entiende enseguida. Para inputs chicos, como un campo de formulario, el O(n²) no se nota." },
      { title: "Streaming y fail fast", detail: "La pila funciona sobre un stream y puede cortar en el primer cierre inválido: sirve para validar archivos grandes sin leerlos completos. Con una tabla {')': '(', …}, agregar \"<>\" es una sola línea." },
    ],
    pattern: {
      heuristic: "Si ves anidamiento, «lo último abierto se cierra primero» o deshacer, pensá en una pila.",
      detail: "Las pilas aparecen en parsers, evaluación de expresiones, undo/redo y en «siguiente elemento mayor» (pila monótona). La señal es que el elemento relevante siempre es el más reciente sin resolver.",
    },
    related: [
      { title: "Minimum Remove to Make Valid Parentheses", url: "https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses/" },
      { title: "Decode String", url: "https://leetcode.com/problems/decode-string/" },
    ],
    interview: {
      question: "¿Cómo devolvés la posición del primer error, para mostrarle al usuario dónde está?",
      answer: "Con la misma pila, pero guardando índices en lugar de caracteres. Si un cierre no coincide o la pila está vacía, el error está en ese índice. Si al final quedan aperturas, reportás una de las pendientes; lo habitual es la del fondo de la pila, la más vieja sin cerrar. Sigue siendo O(n).",
    },
  },

  stock: {
    optimal: [0, 0, 0],
    notation: "n = cantidad de días",
    cost: ([approach]) =>
      approach === 1 ? { time: "O(n²)", space: "O(1)" }
      : approach === 2 ? { time: "O(n log n)", space: "O(n)" }
      : { time: "O(n)", space: "O(1)" },
    keyIdea: {
      summary: "Para vender hoy, la mejor compra posible es el mínimo de los días anteriores. Con ese mínimo y la mejor ganancia vista alcanza una pasada.",
      detail: "Es programación dinámica con dos variables: mínimo = min(mínimo, precio) y mejor = max(mejor, precio − mínimo anterior). El orden importa: la compra siempre está a la izquierda de la venta. Por eso no podés ordenar.",
    },
    steps: [
      [
        { verdict: "óptima", why: "Un recorrido que conserva el mínimo previo y la mejor ganancia: O(n) de tiempo y O(1) de espacio." },
        { verdict: "correcta pero más lenta", why: "Prueba cada compra con cada venta posterior: son n·(n−1)/2 pares. Es correcto, pero repite la búsqueda del mínimo para cada venta." },
        broken("Ordenar borra la cronología: el precio máximo puede estar antes que el mínimo.", [9, 7, 4, 1],
          "Ordenado queda [1, 4, 7, 9] → 9 − 1 = 8. Pero el 9 es del primer día y el 1 del último: venderías antes de comprar. Esperado: 0."),
        broken("Mirar solo días consecutivos pierde las subas que duran varios días.", [1, 2, 3, 4],
          "Las diferencias diarias son 1, 1 y 1: devuelve 1. Comprar a 1 y vender a 4 da 3."),
      ],
      [
        { verdict: "óptima", why: "El mínimo hasta ahora es la mejor compra posible para cualquier venta futura." },
        broken("Conservar el máximo es justo lo contrario de lo que buscás.", [1, 2, 3, 4],
          "Con precios en subida, el máximo siempre es el precio de ayer: cada ganancia vale 1. Esperado: 3 (comprar a 1, vender a 4)."),
        broken("Reemplazar la compra cada día reduce el problema a días consecutivos.", [1, 2, 3, 4],
          "La compra pasa a 1, 2 y 3: siempre es el día anterior. La ganancia máxima queda en 1 en vez de 3."),
        broken("Quedarte con el primer día ignora los mínimos que aparecen después.", [3, 2, 6, 1, 4],
          "Con la compra fija en 3, la mejor venta es 6 → 3. Si comprás el segundo día (a 2) y vendés a 6, ganás 4."),
      ],
      [
        { verdict: "óptima", why: "max(mejor, ganancia de hoy): una buena ganancia no se pierde cuando llega un día peor y, como empieza en 0, nunca devuelve negativos." },
        broken("Quedarte con la última ganancia pisa el máximo con lo que pase al final.", [2, 8, 1, 3],
          "El segundo día vende a 8 y gana 6. El último día la reemplaza por 3 − 1 = 2. Devuelve 2 en vez de 6."),
        broken("El valor absoluto cuenta las pérdidas como ganancias.", [9, 7, 4, 1],
          "El precio solo baja: 9, 7, 4, 1. La pérdida 4 − 7 = −3 se cuenta como +3. Esperado: 0 (no operar)."),
        broken("Conservar el mínimo nunca supera el 0 inicial.", [0, 0, 4],
          "Aparece la ganancia 4 − 0 = 4, pero min(0, 4) = 0. Devuelve 0 en vez de 4."),
      ],
    ],
    tradeOffs: [
      { title: "Feed en vivo", detail: "La solución con O(1) de memoria funciona con precios en streaming: actualizás el mínimo y la mejor ganancia en cada tick, sin guardar historia." },
      { title: "Muchas consultas por rango", detail: "Si te preguntan la mejor ganancia en muchos rangos [i, j], recorrer cada uno es O(n) por consulta. Un segment tree que guarde (mínimo, máximo, mejor) por nodo responde cada rango en O(log n)." },
      { title: "Fuerza bruta como oráculo", detail: "El doble for es obviamente correcto: sirve como referencia en tests property-based para validar la versión rápida con arrays aleatorios." },
    ],
    pattern: {
      heuristic: "Si ves «el mejor par i < j» y el orden importa, recorré j y mantené el mejor i visto hasta ahora.",
      detail: "Es el mismo truco que Kadane: el resumen del prefijo se actualiza en O(1). La pregunta guía es: para este j, ¿qué resumen del pasado necesito?",
    },
    related: [
      { title: "Best Time to Buy and Sell Stock II", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/" },
      { title: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/" },
    ],
    interview: {
      question: "¿Y si podés comprar y vender todas las veces que quieras, sin tener dos acciones a la vez?",
      answer: "Sumás todas las subas consecutivas: Σ max(0, p[i] − p[i−1]). Toda suba larga es la suma de sus subas diarias, así que capturarlas todas es óptimo. Es O(n) y O(1). Es justo la idea de «Solo días consecutivos», que acá falla pero en esa variante es la respuesta.",
    },
  },

  "move-zeroes": {
    optimal: [0, 0, 0],
    notation: "n = largo del array",
    cost: ([approach, memory]) =>
      approach === 2 ? { time: "O(n)", space: "O(n)" }
      : approach === 3 ? { time: "O(n log n)", space: "O(n) (TimSort)" }
      : memory === 2 ? { time: "O(n)", space: "O(n) (agranda el array)" }
      : { time: "O(n)", space: "O(1)" },
    keyIdea: {
      summary: "Usás dos punteros: lectura recorre todo y escritura marca el próximo lugar libre. Escritura solo avanza cuando conservás un valor; así el orden se mantiene sin otro array.",
      detail: "Invariante: todo lo que está antes de escritura son los no-ceros ya vistos, en su orden original. Escritura nunca adelanta a lectura, así que nunca pisás algo que todavía no leíste. Al final, desde escritura hasta el fin quedan ceros: los rellenás o ya los dejaron ahí los intercambios.",
    },
    steps: [
      [
        { verdict: "óptima", why: "Copiás los no-ceros hacia adelante y rellenás el final con ceros: O(n), O(1) extra y exactamente n escrituras." },
        { verdict: "óptima", why: "Intercambiás cada no-cero con la posición de escritura y los ceros van quedando atrás solos. O(n), O(1) y sin pasada de relleno." },
        broken("Los valores quedan bien, pero en un array nuevo: el contrato pide modificar y devolver el original, con O(1) extra.", [],
          "Incluso con [] devuelve un array nuevo. El resultado se ve igual, pero quien tiene la referencia al original no ve ningún cambio. Por contrato, falla los 12 casos."),
        broken("Ordenar mueve los ceros, pero también reordena el resto (y cuesta O(n log n)).", [3, 1, 2],
          "No hay ceros, así que no debería cambiar nada. Ordenado queda [1, 2, 3]: se pierde el orden original [3, 1, 2]."),
      ],
      [
        { verdict: "óptima", why: "Escritura empieza en 0 y solo avanza: siempre apunta a la primera posición sin valor definitivo." },
        broken("Empezar en 1 deja la posición 0 sin escribir y corre todo un lugar, hasta salir del array.", [1],
          "Lee el 1 y lo escribe en la posición 1, que no existe: el array crece a [1, 1]."),
        broken("Empezar desde el final escribe fuera del array y no compacta nada hacia adelante.", [3, 1, 2],
          "Escritura arranca en la posición 2: copia el 3 ahí (pisa el 2), el 1 en la 3 y después vuelve a leer el 3 que copió. El array crece a [3, 1, 3, 1, 3]."),
        broken("Reiniciar escritura en cada vuelta hace que todo se escriba en la posición 0: cada valor pisa al anterior.", [3, 1, 2],
          "El 3, el 1 y el 2 se escriben uno tras otro en la posición 0. Queda el 2 adelante y el relleno completa con ceros: [2, 0, 0]."),
      ],
      [
        { verdict: "óptima", why: "Conservás todo lo que no es cero, negativos incluidos, y escritura avanza solo cuando escribiste algo." },
        broken("Si escritura avanza en cada vuelta, va a la par de lectura y nunca compacta.", [0, 0, 1],
          "Lectura y escritura avanzan juntas: el 1 se copia sobre sí mismo en la posición 2. Los ceros quedan adelante: [0, 0, 1]."),
        broken("Con ≥ 0, el cero cuenta como un valor a conservar y se descartan los negativos.", [0, 0, 1],
          "Los ceros pasan el filtro (0 ≥ 0) y se copian adelante como cualquier valor. El array queda igual: [0, 0, 1]."),
        broken("Saltear el último elemento lo deja sin procesar y el relleno lo pisa con un cero.", [1],
          "Con un solo elemento, el loop no corre. Escritura queda en 0 y el relleno escribe [0]: se pierde el 1."),
      ],
    ],
    tradeOffs: [
      { title: "Mutar o copiar", detail: "En React, Redux o cualquier estado inmutable, filtrar a un array nuevo es lo correcto: mutar el original rompe la detección de cambios. In-place conviene cuando el contrato lo pide o cuando la memoria importa (arrays enormes, embebidos)." },
      { title: "Compactar o intercambiar", detail: "Compactar siempre hace n escrituras. Intercambiar con un guard (read !== write) no escribe nada hasta el primer cero: si los ceros son raros, escribe mucho menos, algo que importa en memoria flash o en buffers compartidos." },
      { title: "Si el orden no importara", detail: "Con dos punteros desde los extremos, cambiando cada cero por el último no-cero, harías menos escrituras todavía. Conservar el orden es lo que obliga a recorrer de izquierda a derecha." },
    ],
    pattern: {
      heuristic: "Si ves «modificá in-place conservando el orden» o «filtrá sin memoria extra», pensá en un puntero de lectura y otro de escritura.",
      detail: "Escritura nunca adelanta a lectura, así que nunca pisás datos sin leer. Es el patrón de Remove Element, Remove Duplicates y el compactado de un garbage collector.",
    },
    related: [
      { title: "Remove Element", url: "https://leetcode.com/problems/remove-element/" },
      { title: "Sort Colors", url: "https://leetcode.com/problems/sort-colors/" },
    ],
    interview: {
      question: "¿Cómo minimizás la cantidad de escrituras en el array?",
      answer: "Intercambiás solo cuando read !== write. Si no hay ceros, no hacés ninguna escritura; en general son 2 por cada no-cero que aparece después del primer cero. Compactar y rellenar siempre hace n.",
    },
  },

  anagram: {
    optimal: [0, 0, 0],
    notation: "n = largo de las palabras · k = letras distintas (≤ 26)",
    cost: ([approach, memory]) =>
      approach === 1 ? { time: "O(n log n)", space: "O(n)" }
      : approach === 2 ? { time: "O(n)", space: "O(k)" }
      : approach === 3 ? { time: "O(n)", space: "O(1)" }
      : memory === 1 || memory === 3 ? { time: "O(n)", space: "O(1)" }
      : { time: "O(n)", space: "O(k)" },
    keyIdea: {
      summary: "Dos palabras son anagramas si y solo si tienen la misma cantidad de cada letra. Contás una, descontás la otra y todo tiene que quedar en cero.",
      detail: "Lo importante es la multiplicidad: \"aab\" y \"abb\" tienen las mismas letras, pero no las mismas cantidades. Si comparás longitudes primero, alcanza con verificar que ningún contador termine distinto de cero.",
    },
    steps: [
      [
        { verdict: "óptima", why: "Contar y descontar: O(n) de tiempo y O(k) de espacio; con 26 letras, espacio constante." },
        { verdict: "correcta pero más lenta", why: "Si quedan iguales después de ordenarlas, son anagramas. Es correcto y simple, pero cuesta O(n log n) y crea copias de O(n)." },
        broken("Un Set guarda qué letras hay, no cuántas.", "aab",
          'Los Sets son {a, b} y {a, b}, y las palabras tienen el mismo largo: acepta. Pero "aab" tiene dos a y "abb" tiene una sola.', { other: "abb" }),
        broken("Sumar códigos colisiona: letras distintas pueden dar la misma suma.", "ad",
          "a + d = 97 + 100 = 197; b + c = 98 + 99 = 197. Mismo largo y misma suma: acepta dos palabras que no comparten ninguna letra.", { other: "bc" }),
      ],
      [
        { verdict: "óptima", why: "Un Map de letra → contador sirve para cualquier alfabeto, Unicode incluido." },
        { verdict: "óptima", why: "26 contadores indexados por código − 97: sin hashing y contiguos en memoria. Es lo más rápido para a–z, pero falla con cualquier carácter fuera de ese rango." },
        broken("Un Set de pendientes no puede representar dos apariciones de la misma letra.", "aab",
          'La segunda a no suma nada: queda {a, b}. Al consumir "aba", la última a ya no está y devuelve false, aunque son anagramas.', { other: "aba" }),
        broken("Un único contador mide la longitud total, no cada letra.", "ad",
          'Suma 2 con "ad" y resta 2 con "bc": termina en 0 y acepta, aunque no comparten ninguna letra.', { other: "bc" }),
      ],
      [
        { verdict: "óptima", why: "Mismo largo, descontar y exigir todo en cero: si sobra o falta una letra, algún contador queda distinto de 0." },
        broken("Sumar en lugar de restar duplica los contadores: nunca vuelven a cero.", "a",
          'El contador de a vale 1 después de la primera palabra y 2 después de la segunda. Como exige todo en 0, rechaza "a" frente a "a".', { other: "a" }),
        broken("Verificar solo presencia acepta letras repetidas de más, siempre que existan en la primera palabra.", "ab",
          'Contadores: a = 1, b = 1. La segunda palabra pregunta dos veces por la a y nunca descuenta: acepta "aa", aunque falta la b.', { other: "aa" }),
        broken("Sin comparar largos y aceptando contadores positivos, a la segunda palabra le pueden faltar letras.", "ab",
          'Descuenta la a y queda b = 1. Como solo exige ≥ 0, acepta "a", aunque le falta la b.', { other: "a" }),
      ],
    ],
    tradeOffs: [
      { title: "Map o array[26]", detail: "El array es más rápido (sin hash, datos contiguos, mejor uso de caché), pero asume a–z. Con acentos, mayúsculas o emojis, charCodeAt − 97 indexa fuera de rango. Con input de usuarios en producción, usá un Map sobre code points." },
      { title: "Ordenar", detail: "Es una línea y es difícil equivocarse. Para strings cortos, como nombres o tags, el log n no se nota y el código se revisa en dos segundos. Además, la palabra ordenada sirve como clave para agrupar anagramas." },
      { title: "La suma como filtro", detail: "Una suma es una mala prueba de igualdad, pero un buen descarte rápido: si las sumas difieren, seguro no son anagramas; si coinciden, recién ahí contás. Es la lógica de un hash: descartar barato y confirmar caro." },
    ],
    pattern: {
      heuristic: "Si ves «los mismos elementos sin importar el orden», pensá en contar frecuencias (un multiconjunto), no en Sets.",
      detail: "Un contador por clave resuelve anagramas, permutaciones dentro de una ventana y «¿alcanzan las letras de la revista para armar la nota?». Si además la ventana se mueve, el contador se actualiza en O(1) por paso.",
    },
    related: [
      { title: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams/" },
      { title: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/" },
    ],
    interview: {
      question: "¿Qué cambia si las palabras pueden tener cualquier carácter Unicode?",
      answer: "El array de 26 deja de servir: usás un Map. Además, tenés que iterar por code points (for…of, no s[i] ni charCodeAt, que parten un emoji en dos surrogates) y normalizar con s.normalize(\"NFC\") para que «é» precompuesta y «e» + acento combinado cuenten igual. El algoritmo no cambia; cambia qué es «una letra».",
    },
  },
};

export const explanations: Record<Kind, Explanation> = {
  ...legacyExplanations,
  ...recordOf(Object.keys(modules).filter(isModuleKind), kind => modules[kind].explanation),
};

export type ChoiceSummary = { step: number; title: string; option: string; active: boolean; verdict: Verdict | "válida con tu enfoque" | null; why: string | null };
export type Failure = {
  label: string; input: string; expected: string; actual: string; reason?: string;
  culprit: { step: string; option: string; why: string } | null;
  trace: { input: string; text: string; sameCase: boolean } | null;
};
export type SolutionExplanation = {
  status: Verdict;
  headline: string;
  cost: Cost;
  choices: ChoiceSummary[];
  skipped: string | null;
  failure: Failure | null;
};

const json = (value: Output | string | number[]) => JSON.stringify(value).replaceAll(",", ", ");

export function formatCase(kind: Kind, item: Partial<CaseInput>): string {
  if (item.input === undefined) return "No disponible en esta partida";
  if (isModuleKind(kind)) return modules[kind].formatCase({ ...item, input: item.input });
  if (kind === "two-sum") return `${json(item.input)}, objetivo = ${item.target ?? 0}`;
  if (kind === "anagram") return `s = ${JSON.stringify(item.input)}, t = ${JSON.stringify(item.other ?? "")}`;
  return json(item.input);
}

const sameCase = (test: TestExecution, item: CaseInput) =>
  JSON.stringify(test.input) === JSON.stringify(item.input) && test.target === item.target && test.other === item.other;

const caseSize = (test: TestExecution) =>
  test.input === undefined ? Number.POSITIVE_INFINITY : test.input.length + (test.other?.length ?? 0);

export function smallestFailing(tests: TestExecution[]): TestExecution | null {
  return tests.reduce<TestExecution | null>((best, test) => test.passed || (best && caseSize(best) <= caseSize(test)) ? best : test, null);
}

export function explainResult(kind: Kind, choices: Choices, evaluation: Evaluation): SolutionExplanation | null {
  const challenge = challenges.find(c => c.kind === kind);
  if (!challenge || !isChoices(choices) || evaluation.tests.length === 0) return null;
  const explanation = explanations[kind];
  const used = activeSteps(kind, choices[0]);
  const complete = evaluation.passed === evaluation.total;
  const status: Verdict = !complete ? "incorrecta" : evaluation.efficient ? "óptima" : "correcta pero más lenta";
  const cost = explanation.cost(choices);

  const summaries: ChoiceSummary[] = challenge.steps.map((step, index) => {
    const active = used.includes(index);
    const option = explanation.steps[index][choices[index]];
    const verdict = !active ? null : complete && option.verdict === "incorrecta" ? "válida con tu enfoque" : option.verdict;
    return { step: index, title: step.title, option: active ? step.options[choices[index]].title : "No se usa", active, verdict, why: active ? option.why : null };
  });

  const unused = challenge.steps.filter((_, index) => !used.includes(index)).map(step => step.title);
  const skipped = unused.length === 0 ? null
    : `Con «${challenge.steps[0].options[choices[0]].title}», el programa no usa ${unused.length === 1 ? `la decisión de ${unused[0]}` : `las decisiones de ${unused.join(" y ")}`}: no se ejecutaron y no afectan el resultado.`;

  const failing = smallestFailing(evaluation.tests);
  let failure: Failure | null = null;
  if (failing) {
    const culpritStep = used.find(index => explanation.steps[index][choices[index]].verdict === "incorrecta");
    const culpritOption = culpritStep === undefined ? null : explanation.steps[culpritStep][choices[culpritStep]];
    failure = {
      label: failing.label,
      input: formatCase(kind, failing),
      expected: failing.expected === undefined ? "No disponible" : json(failing.expected),
      actual: failing.error === "TLE" ? "No terminó (TLE)" : failing.error === "runtime" ? "Error de ejecución" : failing.actual === undefined ? "No disponible" : json(failing.actual),
      ...(failing.reason ? { reason: failing.reason } : {}),
      culprit: culpritStep === undefined || !culpritOption ? null : { step: challenge.steps[culpritStep].title, option: challenge.steps[culpritStep].options[choices[culpritStep]].title, why: culpritOption.why },
      trace: culpritOption?.verdict === "incorrecta" ? { input: formatCase(kind, culpritOption.counterexample), text: culpritOption.counterexample.trace, sameCase: sameCase(failing, culpritOption.counterexample) } : null,
    };
  }

  const headline = status === "óptima" ? `Pasa los ${evaluation.total} casos en ${cost.time} de tiempo y ${cost.space} de espacio: es una solución óptima.`
    : status === "correcta pero más lenta" ? `Pasa los ${evaluation.total} casos con ${cost.time} de tiempo y ${cost.space} de espacio. Hay una solución más eficiente.`
    : `Falla ${evaluation.total - evaluation.passed} de ${evaluation.total} casos. El más chico que lo rompe es ${failure?.input ?? "uno de los ocultos"}.`;

  return { status, headline, cost, choices: summaries, skipped, failure };
}
