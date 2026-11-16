import { additionalChallenges } from "./additional-challenges";
import { modules, type ModuleKind } from "./challenges/registry";

export type Choices = [number, number, number];
export type LegacyKind = "substring" | "two-sum" | "brackets" | "stock" | "move-zeroes" | "anagram";
export type Kind = LegacyKind | ModuleKind;
export type Step = { title: string; question: string; options: { title: string; detail: string }[] };
export type Challenge = {
  kind: Kind; title: string; difficulty: string; topic: string; description: string;
  example: string; expected: string; explanation: string; constraints: string[];
  sample: { input: string | number[]; target?: number; other?: string };
  steps: Step[]; lesson: string; resource: { title: string; url: string };
};

const option = (title: string, detail: string) => ({ title, detail });

const legacyChallenges: (Challenge & { kind: LegacyKind })[] = [
  {
    kind: "substring", title: "Sin repetir", difficulty: "Medio", topic: "Strings",
    description: "Encontrá la longitud de la subcadena más larga sin caracteres repetidos. Los caracteres tienen que ser consecutivos: no podés saltarte ninguno.",
    example: '"abcabcbb"', expected: "3", explanation: '"abc" tiene tres caracteres distintos. No hay una subcadena válida más larga.',
    sample: { input: "abcabcbb" },
    constraints: ["0 ≤ s.length ≤ 10.000", "Solo letras minúsculas de a–z", "Devolvé una longitud, no el texto"],
    steps: [
      { title: "Enfoque", question: "¿Cómo vas a recorrer el string?", options: [option("Una ventana móvil", "Expandir a la derecha y ajustar el comienzo."), option("Todos los comienzos", "Explorar una subcadena desde cada posición."), option("Ordenar primero", "Agrupar caracteres iguales antes de recorrer."), option("Contar los distintos", "Recorrer el string completo una sola vez.")] },
      { title: "Memoria", question: "¿Qué información necesitás guardar?", options: [option("Última posición", "Un Map de carácter a índice."), option("Caracteres de la ventana", "Un Set con los caracteres presentes."), option("Solo el anterior", "Comparar con el carácter inmediatamente anterior."), option("Solo el primero", "Comparar con el carácter inicial del segmento.")] },
      { title: "Regla", question: "¿Qué hacés cuando aparece un repetido?", options: [option("Descartar hasta eliminarlo", "Mover el inicio lo necesario, sin retroceder."), option("Empezar de cero", "Descartar toda la ventana, incluido el repetido."), option("Avanzar una posición", "Mover el inicio exactamente un lugar."), option("Seguir contando", "Conservar la ventana y actualizar su longitud.")] },
    ],
    lesson: "Una ventana válida no contiene repetidos. Su inicio solo avanza. Con un Map podés saltar a la posición posterior a la aparición anterior; con un Set, quitás caracteres hasta que el nuevo deje de estar presente. Ambos caminos pueden ser correctos y lineales.",
    resource: { title: "Profundizá: Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  },
  {
    kind: "two-sum", title: "La pareja exacta", difficulty: "Fácil", topic: "Arrays",
    description: "Encontrá los índices de dos números que sumen el objetivo. No podés usar la misma posición dos veces. Si no existe una pareja, devolvé un array vacío.",
    example: "[3, 2, 4], objetivo = 6", expected: "[1, 2]", explanation: "Los valores en las posiciones 1 y 2 son 2 y 4: juntos suman 6.",
    sample: { input: [3,2,4], target: 6 },
    constraints: ["0 ≤ nums.length ≤ 10.000", "Puede haber negativos y duplicados", "Cualquier pareja válida es aceptada"],
    steps: [
      { title: "Enfoque", question: "¿Cómo buscás la pareja?", options: [option("Buscar el complemento", "Por cada número, buscar objetivo − número."), option("Probar todas las parejas", "Comparar cada posición con las siguientes."), option("Solo vecinos", "Comparar posiciones consecutivas."), option("Extremos sin ordenar", "Mover dos punteros según la suma actual.")] },
      { title: "Memoria", question: "¿Cómo conservás la información del recorrido?", options: [option("Valor → índice", "Guardar el índice de cada número en un Map."), option("Una lista de pares", "Guardar valor e índice; buscar en la lista."), option("Solo el último", "Recordar únicamente el número anterior."), option("Valor → valor", "Guardar el número como si fuera su posición.")] },
      { title: "Regla", question: "¿Cuándo registrás el número actual?", options: [option("Después de buscar", "Buscar primero entre posiciones anteriores."), option("Antes de buscar", "Agregar el actual y después consultar."), option("Solo si es positivo", "Excluir ceros y negativos del registro."), option("Solo si es distinto del complemento", "Evitar registrar mitades del objetivo.")] },
    ],
    lesson: "Al buscar antes de insertar, el registro contiene únicamente posiciones anteriores: nunca podés usar un elemento dos veces. Un Map logra tiempo O(n); probar parejas o buscar en una lista también puede ser correcto, pero cuesta O(n²).",
    resource: { title: "Profundizá: Two Sum", url: "https://leetcode.com/problems/two-sum/" },
  },
  {
    kind: "brackets", title: "Todo en su lugar", difficulty: "Medio", topic: "Stacks",
    description: "Determiná si una secuencia de paréntesis, corchetes y llaves está balanceada. Cada cierre debe corresponder a la última apertura todavía pendiente.",
    example: '"{[()]}"', expected: "true", explanation: "Cada cierre corresponde a la apertura más reciente. No quedan aperturas pendientes.",
    sample: { input: "{[()]}" },
    constraints: ["0 ≤ s.length ≤ 10.000", "Solo contiene ()[]{}", "El string vacío es válido"],
    steps: [
      { title: "Enfoque", question: "¿Cómo relacionás aperturas y cierres?", options: [option("Resolver de adentro hacia afuera", "Cada cierre resuelve la última apertura."), option("Eliminar parejas adyacentes", "Repetir reemplazos hasta que no cambie nada."), option("Contar aperturas y cierres", "Comparar cantidades, sin importar el orden."), option("Separar en dos mitades", "Comparar cada posición con su espejo.")] },
      { title: "Memoria", question: "¿Qué estructura representa lo pendiente?", options: [option("Una pila", "La última apertura es la primera que sale."), option("Una cola", "La primera apertura es la primera que sale."), option("Un Set", "Guardar los tipos de apertura sin repeticiones."), option("Un único carácter", "Recordar solo la apertura más reciente.")] },
      { title: "Regla", question: "¿Qué condición hace válida la secuencia?", options: [option("Coincidir siempre y terminar vacío", "Cada cierre coincide y no queda nada pendiente."), option("Solo terminar vacío", "Aceptar cierres de cualquier tipo."), option("Solo coincidir los cierres", "Permitir aperturas pendientes al final."), option("Solo tener longitud par", "Aceptar cualquier secuencia de tamaño par.")] },
    ],
    lesson: "El anidamiento exige orden LIFO: lo último que abrís es lo primero que cerrás. Contar no detecta cruces como ([)]. Una solución válida también debe rechazar cierres sin apertura y aperturas pendientes al terminar.",
    resource: { title: "Profundizá: Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/" },
  },
  ...additionalChallenges,
];

export function isModuleKind(kind: string): kind is ModuleKind {
  return Object.hasOwn(modules, kind);
}

export function isLegacyKind(kind: Kind): kind is LegacyKind {
  return !isModuleKind(kind);
}

const moduleChallenges: Challenge[] = Object.keys(modules).filter(isModuleKind).map(kind => ({ kind, ...modules[kind].definition }));

// The legacy six stay playable as practice/tutorial; the weekly plan below decides what is daily.
export const challenges: Challenge[] = [...legacyChallenges, ...moduleChallenges];

const DAY_MS = 86_400_000;
const dayNumberOf = (day: string) => Math.floor(Date.parse(day) / DAY_MS);
const ROLLOUT = dayNumberOf("2026-11-14");
export const PLAN_START = "2026-11-16";

// Designer's two-week plan (docs/design/challenges.md), Monday first. Kinds not implemented yet fall back to the legacy rotation.
export const weeklyPlan = {
  S1: ["daily-temperatures", "min-window", "subarray-sum", "koko", "course-schedule", "meeting-rooms", "largest-rectangle"],
  S2: ["edit-distance", "lru-cache", "coin-change", "median-stream", "redundant-connection", "lis", "network-delay"],
} as const;

export type Slot =
  | { source: "legacy"; kind: LegacyKind }
  | { source: "plan"; week: "S1" | "S2"; kind: ModuleKind }
  | { source: "fallback"; week: "S1" | "S2"; planned: string; kind: LegacyKind };

const legacyRotation = (dayNumber: number) => legacyChallenges[(dayNumber - ROLLOUT + 3) % 6].kind;

// Already-issued days must keep their original challenge: the formulas before PLAN_START are frozen.
export function scheduleFor(day: string): Slot {
  const dayNumber = dayNumberOf(day);
  if (dayNumber < ROLLOUT) return { source: "legacy", kind: legacyChallenges[dayNumber % 3].kind };
  const offset = dayNumber - dayNumberOf(PLAN_START);
  if (offset < 0) return { source: "legacy", kind: legacyRotation(dayNumber) };
  const week = Math.floor(offset / 7) % 2 === 0 ? "S1" : "S2";
  const planned = weeklyPlan[week][offset % 7];
  return isModuleKind(planned) ? { source: "plan", week, kind: planned } : { source: "fallback", week, planned, kind: legacyRotation(dayNumber) };
}

export function dailyChallenge(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  const { kind } = scheduleFor(day);
  const challenge = challenges.find(item => item.kind === kind);
  if (!challenge) throw new Error(`Scheduled kind ${kind} is not in the catalog`);
  return { ...challenge, day, number: dayNumberOf(day) - 20_000 };
}

export function isChoices(value: unknown): value is Choices {
  return Array.isArray(value) && value.length === 3 && value.every(n => Number.isInteger(n) && n >= 0 && n <= 3);
}

export function activeSteps(kind: Kind, approach: number): number[] {
  if (isModuleKind(kind)) return modules[kind].activeSteps(approach);
  if ((kind === "stock" || kind === "anagram") && approach > 0) return [0];
  if (kind === "move-zeroes" && approach > 1) return [0];
  if ((kind === "two-sum" && approach > 0) || (kind === "substring" && approach === 3) || (kind === "brackets" && approach === 3)) return [0];
  if (kind === "brackets" && (approach === 1 || approach === 2)) return [0,2];
  return [0,1,2];
}
