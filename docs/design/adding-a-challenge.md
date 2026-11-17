# Agregar un desafío

Checklist para sumar uno de los desafíos de `challenges.md` (o uno nuevo). Seguilo en orden. Las implementaciones de referencia son `src/lib/challenges/daily-temperatures/` (salida `number[]`) y `src/lib/challenges/subarray-sum/` (entrada con `target`, salida `number`). Copiá la carpeta que más se parezca y adaptala.

## 0. Nombre del kind

Usá exactamente el nombre de `weeklyPlan` (`src/lib/challenges.ts`). Si no coincide, el scheduler sigue usando el fallback y el test de catálogo falla.

| Semana | Lun | Mar | Mié | Jue | Vie | Sáb | Dom |
|---|---|---|---|---|---|---|---|
| S1 | `daily-temperatures` ✅ | `min-window` | `subarray-sum` ✅ | `koko` | `course-schedule` | `meeting-rooms` | `largest-rectangle` |
| S2 | `edit-distance` | `lru-cache` | `coin-change` | `median-stream` | `redundant-connection` | `lis` | `network-delay` |

Bloque de prioridad (`priorityPlan`): del 2026-11-18 al 2026-11-23 se juegan `max-subarray`, `container-water`, `merge-intervals`, `rotated-min`, `rotting-oranges` y `partition-subset`. El 2026-11-24 el plan semanal sigue donde quedó (`subarray-sum`). Un kind nuevo puede ir en cualquiera de las dos listas; el test de catálogo exige que todo módulo esté planificado.

## 1. Carpeta `src/lib/challenges/<kind>/`

| Archivo | Exporta | Qué contiene |
|---|---|---|
| `definition.ts` | `definition`, `activeSteps` | Textos del desafío (`Omit<Challenge, "kind">`), `sample` = caso 1, y qué pasos usa cada enfoque. |
| `program.ts` | `program`, `typescript` | Cuerpo JS que ejecuta el engine (con `emit(...)` para el visualizador) y los reemplazos de texto que lo convierten en el preview TS. |
| `cases.ts` | `<camel>Judge: Judge` | Los 12 casos, `efficient`, `feedback` y, si hace falta, `compare`. **Solo lo importa el server.** |
| `python.ts` / `java.ts` / `cpp.ts` | `python` / `java` / `cpp` | Previews que hacen lo mismo que `program`, línea por línea. |
| `explanation.ts` | `explanation: Explanation` | Explicación post-partida (ver `explanations.md`). |
| `index.ts` | `<camel>: ChallengeModule` | Une todo: `signature`, `formatCase` y lo anterior. |

Contratos (`src/lib/challenges/module.ts`):

- **Índice 0 = óptimo** en los tres pasos. `activeSteps(approach)` devuelve los pasos que usa ese enfoque, siempre incluido el 0.
- **`signature`**: un `Param` por argumento, en orden: `{ name, role: "input" | "target" | "other", ts }`. El engine pasa `case.input`, `case.target` o `case.other` según `role`. `program` usa esos mismos nombres (`nums`, `k`…); nada de `input`.
- **`program(choices)`** devuelve un cuerpo de función JS. Recibe los pasos inactivos fijados en 0. Para previews puede recibir `-1`: el enfoque pendiente devuelve `jsChooseApproach` y una decisión pendiente se renderiza con `jsPending("…")`. Armá el código con `render(...)` y `jsBlock(head, ...body)`. Así no quedan líneas vacías.
- **Todo loop lleva llaves** y la cabeza va en una sola línea: `for (...) {`, `while (...) {`, `do {`. El presupuesto de pasos se inyecta ahí. Un test falla si aparece un loop sin llaves en JS, Java o C++.
- **Recursión**: evitala en las trampas. Si un template la necesita, poné `tick();` como primera línea de la función: cuenta como paso y los previews la eliminan. Una recursión infinita da `runtime` en JS (stack overflow) y `error` en los otros lenguajes. Ojo: en C++ la recursión infinita crashea el harness.
- **`emit(index, left, memory, value, cells?)`** siempre en su propia línea (los previews la eliminan). El visualizador (`src/app/game.tsx`) pinta `cells`, o `sample.input` si no hay `cells`. Marca `index` como cursor, resalta `left..index` y muestra `memory` y `value`. Guarda hasta 160 frames.
- **Salida**: tiene que ser un `Output` (`number | boolean | string | number[]`). Si hace falta otra forma, ampliá la unión en `engine.ts` y `isOutput`, y agregá `show` para Java y C++ en `tests/language-equivalence.test.ts`. Avisá antes: es un cambio compartido.
- **`compare`** (opcional): `(actual, item, { inPlace }) => { passed: true } | { passed: false, reason? }`. Usalo para salidas en cualquier orden, para "cualquier respuesta válida" (Course Schedule, Min Window) o para contratos in-place. Sin `compare`, se compara con JSON contra `expected`.
- **Previews Python/Java/C++** reciben `choices` ya efectivas (inactivas = 0, pendientes = −1). Usá los helpers de cada lenguaje: `fn`, `block`, `pending` de `python-preview.ts`; `javaClass(signature, { body })`, `braces`, `pending`, `unfinished` de `java-preview.ts`; `translationUnit({ signature, body })`, `braces`, `pending`, `unfinished` de `cpp-preview.ts`. Los imports de Java y C++ se detectan solos. En Python, si necesitás `deque`, agregá `from collections import deque` arriba. Un preview parcial tiene que compilar: en Java, terminá con `return` o con `unfinished(...)`.
- Tipos de parámetros que entiende el harness: Java `int`, `String`, `int[]`, `List<Integer>`; C++ `int`, `std::string`, `std::vector<int>`, `const …&`. Salidas: Java `int`, `boolean`, `String`, `double`, `int[]`, `double[]`, `List<…>`; C++ `int`, `bool`, `double`, `std::string`, `std::vector<int>`, `std::vector<double>`. Los números se comparan como JSON parseado, así que `2` y `2.0` son iguales.

## 2. Registro: dos líneas

`src/lib/challenges/registry.ts` (client-safe):

```ts
import { koko } from "./koko";
// …
  koko,                       // dentro de `modules`; usá "kind-con-guion": camelCase
```

`src/lib/challenges/judges.ts` (server-only). TypeScript falla hasta que exista la entrada:

```ts
import { kokoJudge } from "./koko/cases";
// …
  koko: kokoJudge,
```

No hay nada más que tocar. `Kind`, `challenges` (aparece en Práctica), `cases`, `activeSteps`, los previews en los 5 lenguajes, `explanations` y `dailyChallenge()` se derivan del registro. Si el kind ya figura en `weeklyPlan`, desde ese momento se juega en su día en vez del fallback.

> Si dos agentes trabajan en paralelo, el único conflicto posible es una línea en cada registro: resolvelo conservando las dos.

## 3. Derivar casos y explicaciones con el engine

1. Copiá los 12 casos de la tabla de `challenges.md`. El caso 1 es el ejemplo y tiene que coincidir con `definition.sample`.
2. Corré este probe (cambiá el kind) y compará `fails` con la columna "Lo rompen" del diseño. Si no coinciden, el template no implementa la trampa que se diseñó. Revisá contra `verify.py` (`/private/tmp/claude-501/-Users-isidropasman-DailyLeet/534d73fa-55f1-4a8f-97f5-cdeb4890e88d/scratchpad/verify.py`), que tiene la semántica exacta de cada trampa.

```bash
cat > /tmp/probe.ts <<'EOF'
import { evaluate } from "/Users/isidropasman/DailyLeet/src/lib/engine";
import { smallestFailing } from "/Users/isidropasman/DailyLeet/src/lib/explanations";
import type { Choices, Kind } from "/Users/isidropasman/DailyLeet/src/lib/challenges";
const kind = "koko" as Kind;
const pass: string[] = [];
for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) { const r = evaluate(kind, [a, b, c], 0); if (r.passed === r.total) pass.push(`${a}${b}${c}`); }
console.log("passing:", pass.join(" "));
for (let step = 0; step < 3; step++) for (let o = 1; o < 4; o++) {
  const ch: Choices = [0, 0, 0]; ch[step] = o;
  const r = evaluate(kind, ch, 0); const f = smallestFailing(r.tests);
  console.log(`${"AMR"[step]}${o} fails[${r.tests.map((t, i) => t.passed ? "" : i + 1).filter(Boolean)}] smallest=${JSON.stringify(f?.input)} target=${f?.target} other=${f?.other} actual=${f?.error ?? JSON.stringify(f?.actual)} expected=${JSON.stringify(f?.expected)}`);
}
EOF
npx tsx /tmp/probe.ts
```

3. `explanation.ts`: cada opción incorrecta usa `broken(why, input, trace, { target | other })` con **el caso `smallest` que imprime el probe**. La traza termina con «Devuelve X; esperado Y.» y usa los valores `actual`/`expected` reales. Si el óptimo no es O(n), declará `optimalTime` (por ejemplo `/^O\(n log m\)/`): el test exige que `cost(choices).time` lo cumpla si y solo si `efficient(choices)`, en cada combinación que pasa 12/12.
4. `efficient(choices)` en `cases.ts` tiene que dar `true` para el óptimo y `false` para los subóptimos que pasan.

## 4. Verificar

```bash
pnpm typecheck
pnpm test             # incluye catalog, engine, explanations y language-equivalence
pnpm test:languages   # solo el harness (64 combos × 12 casos × Python/Java/C++, más los previews parciales)
```

Toolchains: `python3` (Homebrew o PATH), JDK en `JAVA_HOME` o `/opt/homebrew/opt/openjdk` (el `/usr/bin/java` de macOS no sirve) y `clang++`. Si falta alguno, el test se **saltea** (no falla). Revisá que en la salida no haya `# skipped`.

Qué verifican los tests, sin listas por kind (todo kind registrado entra solo):

- **Equivalencia**: cada combo da el mismo resultado en Python, Java y C++ que en el engine JS: valor, forma (in-place/copia), `error` o `tle`.
- **Previews parciales**: cada combinación con `-1` compila y muestra «Pendiente»/«Elegí». Si el `-1` cae en un paso ignorado, el preview es idéntico al completo.
- **Explicaciones**: cada veredicto, contraejemplo y complejidad contra el engine, más `explainResult` en las 64 combinaciones.
- **Catálogo**: el plan semanal, el fallback y los días ya emitidos.

## Presupuesto de ejecución (TLE)

- `engine.ts` inyecta `tick();` después de cada `for (...) {`, `while (...) {` y `do {` (`instrument`). Corta con un centinela a los `STEP_BUDGET` = 200.000 pasos por caso. El caso falla con `error: "TLE"` y el motivo «No terminó…»; `run` devuelve `{ ok: false, error: "TLE" }` y nunca cuelga el server. Cualquier otra excepción da `error: "runtime"`.
- El harness instrumenta igual los previews (Python: después de cada `for …:`/`while …:`; Java/C++: misma regex) con el mismo presupuesto, e imprime `tle`. Un TLE en JS tiene que ser TLE en los cuatro lenguajes.
- Los previews que ve el jugador no muestran `tick()`.

## Pendientes conocidos

- `/api/simulate` evalúa cualquier kind en práctica (oráculo, ver `game-loop.md` §7). Lo resuelve el backend, no este checklist.
- El modal «Cómo se juega» de `game.tsx` todavía dice «El catálogo rota seis retos».
