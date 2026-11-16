import { option, type ChallengeModule } from "../module";

export const definition: ChallengeModule["definition"] = {
  title: "Suma con deuda", difficulty: "Medio+", topic: "Arrays",
  description: "Contá cuántos subarrays contiguos suman exactamente k. Ojo: puede haber números negativos y ceros.",
  example: "[1, 1, 1], k = 2", expected: "2",
  explanation: "Los subarrays [1, 1] que empiezan en la posición 0 y en la 1 suman 2. No hay otros.",
  sample: { input: [1, 1, 1], target: 2 },
  constraints: ["0 ≤ nums.length ≤ 20.000", "−1000 ≤ nums[i] ≤ 1000", "−10⁷ ≤ k ≤ 10⁷"],
  steps: [
    { title: "Enfoque", question: "¿Cómo recorrés los subarrays?", options: [option("Prefijos acumulados", "Un subarray es la resta de dos prefijos."), option("Todos los comienzos", "Sumar desde cada posición hacia la derecha."), option("Ventana deslizante", "Achicar por la izquierda cuando la suma se pasa."), option("Acumular y reiniciar", "Cuando llegás a k, contás y empezás de cero.")] },
    { title: "Memoria", question: "¿Qué guardás de los prefijos?", options: [option("Prefijo → cantidad", "Un Map que arranca con {0: 1}."), option("Prefijos vistos", "Un Set que arranca con {0}."), option("Solo el prefijo anterior", "Comparar con el paso previo."), option("Prefijo → cantidad, sin semilla", "El Map arranca vacío.")] },
    { title: "Regla", question: "¿Cómo usás el prefijo actual?", options: [option("Buscar, después registrar", "Solo cuentan los prefijos anteriores."), option("Registrar, después buscar", "Incluir también el prefijo actual."), option("Buscar el complemento", "Como en Two Sum: k − prefijo."), option("Ignorar prefijos negativos", "No pueden aportar a la cuenta.")] },
  ],
  lesson: "La suma de nums[i..j] es prefijo[j] − prefijo[i − 1]. Por cada prefijo, la cantidad de subarrays que terminan acá y suman k es cuántos prefijos anteriores valen prefijo − k: un Map de cantidades lo responde en O(1), con la semilla {0: 1} para el subarray que empieza en 0. Con negativos, una ventana deslizante no sirve: la suma no crece de forma monótona.",
  resource: { title: "Problema original: Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k/" },
};

export const activeSteps = (approach: number) => (approach > 0 ? [0] : [0, 1, 2]);
