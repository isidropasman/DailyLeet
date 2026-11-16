import { broken, type Explanation } from "../../explanation-types";

export const explanation: Explanation = {
  optimal: [0, 0, 0],
  notation: "n = largo del array",
  cost: ([approach, memory]) =>
    approach === 1 ? { time: "O(n²)", space: "O(1)" }
    : approach > 1 ? { time: "O(n)", space: "O(1)" }
    : memory === 2 ? { time: "O(n)", space: "O(1)" }
    : { time: "O(n) promedio", space: "O(n)" },
  keyIdea: {
    summary: "Un subarray que termina en i suma k cuando prefijo(i) − prefijo(anterior) = k. Contar cuántos prefijos anteriores valen prefijo − k da todos los subarrays en una pasada.",
    detail: "El Map guarda cuántas veces apareció cada prefijo, porque con ceros y negativos un mismo prefijo se repite. La semilla {0: 1} representa el prefijo vacío: sin ella no contás los subarrays que empiezan en 0. Buscar antes de registrar evita contar el subarray vacío.",
  },
  steps: [
    [
      { verdict: "óptima", why: "Cada subarray es la resta de dos prefijos: con un Map de cantidades contás todos los que terminan en i en O(1) promedio." },
      { verdict: "correcta pero más lenta", why: "Desde cada comienzo sumás hacia la derecha y contás los que dan k. Es correcto con negativos, pero cuesta O(n²)." },
      broken("La ventana deslizante supone que agrandarla sube la suma; con ceros y negativos eso no vale.", [0, 0, 0],
        "Con k = 0 la ventana nunca se achica: por cada final cuenta una sola ventana, la más larga. Devuelve 3; esperado 6.", { target: 0 }),
      broken("Reiniciar al llegar a k descarta subarrays que se solapan con el que contaste.", [1, 1, 1],
        "Cuenta [1, 1] y vuelve a 0. El 1 siguiente queda solo y nunca forma el segundo [1, 1]. Devuelve 1; esperado 2.", { target: 2 }),
    ],
    [
      { verdict: "óptima", why: "Prefijo → cantidad: si un prefijo se repitió, cada repetición es un comienzo distinto. La semilla {0: 1} cubre los subarrays que empiezan en 0." },
      broken("Un Set dice si un prefijo apareció, no cuántas veces: con ceros o negativos los prefijos se repiten.", [0, 0, 0],
        "Todos los prefijos valen 0. El Set suma 1 por paso aunque el 0 ya apareció 1, 2 y 3 veces. Devuelve 3; esperado 6.", { target: 0 }),
      broken("Comparar solo con el prefijo anterior mide subarrays de largo 1.", [1, 1, 1],
        "prefijo − anterior es siempre el número actual: 1, nunca 2. Devuelve 0; esperado 2.", { target: 2 }),
      broken("Sin la semilla {0: 1} falta el prefijo vacío: no contás los subarrays que empiezan en la posición 0.", [5],
        "El prefijo es 5 y busca 5 − 5 = 0, que no está en el Map vacío. Devuelve 0; esperado 1.", { target: 5 }),
    ],
    [
      { verdict: "óptima", why: "Buscar antes de registrar: solo emparejás con prefijos anteriores, así que cada subarray tiene al menos un elemento." },
      broken("Registrar antes de buscar empareja el prefijo consigo mismo: con k = 0 cuenta el subarray vacío.", [1],
        "Registra el prefijo 1 y después busca 1 − 0 = 1: lo encuentra. Devuelve 1; esperado 0.", { target: 0 }),
      broken("En Two Sum buscás k − x; acá la resta va al revés: prefijo − k.", [1, 1, 1],
        "Con prefijos 1, 2 y 3 busca 1, 0 y −1. Solo el 0 está. Devuelve 1; esperado 2.", { target: 2 }),
      broken("Un prefijo negativo es una suma acumulada, no un subarray: puede aportar igual.", [-1, -1, 1],
        "Con prefijo −2 busca −2 − (−1) = −1, que es negativo, y lo saltea. Así pierde el [−1] del medio. Devuelve 2; esperado 3.", { target: -1 }),
    ],
  ],
  tradeOffs: [
    { title: "Ventana deslizante sin negativos", detail: "Si todos los números son positivos, la ventana sí funciona y usa O(1) de memoria. Es la opción correcta para, por ejemplo, contar tramos de facturación que suman exactamente un monto." },
    { title: "Map contra array", detail: "Si los prefijos están acotados (por ejemplo, entre −10⁴ y 10⁴), un array con offset reemplaza al Map: sin hashing y con mejor caché." },
    { title: "Streaming", detail: "Los prefijos se calculan en orden, así que procesás un stream sin guardar los números. Lo que crece es el Map: O(cantidad de prefijos distintos)." },
  ],
  pattern: {
    heuristic: "Si ves «subarrays que suman exactamente k» y hay negativos, pensá en prefijos acumulados + hashmap de cantidades.",
    detail: "La suma de un rango es la resta de dos prefijos. Eso convierte «elegí un rango» en «buscá un valor anterior», que es lo mismo que Two Sum sobre los prefijos. Con solo positivos, alcanza una ventana.",
  },
  related: [
    { title: "Continuous Subarray Sum", url: "https://leetcode.com/problems/continuous-subarray-sum/" },
    { title: "Subarray Sums Divisible by K", url: "https://leetcode.com/problems/subarray-sums-divisible-by-k/" },
  ],
  interview: {
    question: "¿Y si te piden el subarray más largo que suma k, en vez de cuántos hay?",
    answer: "Mismo prefijo, otro Map: prefijo → primer índice donde apareció. En cada paso, si existe prefijo − k, la longitud es i − ese índice. Registrás solo la primera aparición para que el subarray sea lo más largo posible.",
  },
};
