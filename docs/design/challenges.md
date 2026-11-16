# DailyLeet — Catálogo v2 (dos semanas)

Objetivo: que un senior/staff pueda **fallar** un desafío aunque conozca el problema. En este formato el jugador no escribe código: elige 3 decisiones. Que el problema sea "Hard" en LeetCode no lo hace difícil acá. Lo difícil es elegir bien entre opciones que se parecen mucho.

## Cómo medimos la dificultad en DailyLeet

La dificultad de LeetCode no predice la de este formato. Tres señales que sí la predicen:

1. **Trampas silenciosas**: opciones incorrectas que **pasan el ejemplo del enunciado**, que es el único caso que el jugador puede ejecutar antes de enviar (`/api/simulate` corre `challenge.sample`). Una trampa que rompe el ejemplo se descubre gratis.
2. **Casos que la delatan**: cuántos de los 12 casos rompe la trampa más fina. Si una trampa rompe un solo caso oculto, es brutal.
3. **Distancia conceptual**: si la opción correcta exige una invariante que no sale por reflejo (por ejemplo, desempatar cierre antes que apertura, o Prim vs Dijkstra).

Por eso el calendario ordena por la cantidad de trampas silenciosas y no por la etiqueta de LeetCode. Edit Distance (Hard en LC) queda un lunes, porque casi todas sus trampas rompen `horse/ros`. Network Delay (Medium en LC) queda un domingo, porque 6 de sus 7 trampas pasan el ejemplo y una de ellas rompe un único caso.

## Calendario

| Día | Semana 1 | Dif. | Silenciosas | Semana 2 | Dif. | Silenciosas |
|---|---|---|---|---|---|---|
| Lun | Esperando el calor (739) | Medio | 2/8 | El corrector (72) | Medio | 1/8 |
| Mar | Lo justo y necesario (76) | Medio | 2/7 | Memoria corta (146) | Medio | 2/7 |
| Mié | Suma con deuda (560) | Medio+ | 4/8 | Vuelto exacto (322) | Medio+ | 3/8 |
| Jue | Ritmo justo (875) | Difícil | 5/8 | El del medio (295) | Difícil | 2/7 + sutileza numérica |
| Vie | Correlativas (210) | Difícil | 5/8 | El cable que sobra (684) | Difícil | 4/7 |
| Sáb | Salas llenas (253) | Difícil+ | 5/7 | Siempre para arriba (300) | Difícil+ | 4/7 |
| Dom | El rectángulo escondido (84) | Brutal | 6/8 | Ping a todos (743) | Brutal | 6/7 |

"Silenciosas" cuenta las trampas que pasan el caso 1, sobre el total de trampas. Los subóptimos correctos no cuentan como trampa.

## Convenciones

- Cada desafío conserva el shape actual del engine: `Kind` nuevo, `Choices = [A, M, R]` con valores 0..3, 12 `Case`, un template por combinación en `program.ts`, y `activeSteps` para los enfoques que no usan Memoria o Regla.
- Índice canónico **0 = óptimo** en los tres pasos. El orden que ve el jugador se mezcla por jugador y por día (ver `game-loop.md`). Nunca se muestra el índice canónico.
- Veredictos: **✔ óptimo**, **✔ subóptimo** (pasa 12/12 pero `efficient = false`), **✘ trampa** (rompe al menos un caso). La lista "rompe" usa la numeración de la tabla de casos. El caso 1 es siempre el ejemplo del enunciado.
- Cuando un enfoque alternativo ignora Memoria o Regla, se indica como `activeSteps`. Para una trampa de Memoria o Regla, los otros dos pasos quedan en el óptimo.
- Las codificaciones de entrada están pensadas para el `Case` actual (`input: string | number[]`, `target?: number`, `other?: string`). Los cambios mínimos al engine están en la sección "Cambios al engine".

## Verificación

Script: `/private/tmp/claude-501/-Users-isidropasman-DailyLeet/534d73fa-55f1-4a8f-97f5-cdeb4890e88d/scratchpad/verify.py` (Python, sin dependencias). Para cada desafío:

- calcula los `expected` con una **referencia independiente** de los templates: brute force o DP memoizada, distinta del combo óptimo;
- comprueba que el combo `(0,0,0)` pasa 12/12;
- comprueba que cada subóptimo declarado pasa 12/12;
- comprueba que cada trampa, desviando un solo paso del óptimo, rompe al menos un caso;
- enumera los 64 combos y lista cuáles pasan.

Resultado final: **105/105 trampas fallan al menos un caso. El óptimo pasa 12/12 en los 14 desafíos y todos los subóptimos declarados pasan 12/12.** Ajustes que hubo que hacer durante la verificación:

- *Ping a todos*, trampa M1 (heap ordenado por peso de arista, el reflejo de Prim): con los casos originales **pasaba todo**. Agregué el caso 6, una cadena de aristas baratas contra un atajo con una arista más cara. Ahora la trampa rompe exactamente ese caso, que es la trampa más fina de todo el catálogo.
- *Correlativas*, trampa M2 (indegree booleano): con un ciclo **no termina** (re-encola sin fin). En el engine actual eso cuelga el `new Function` del server. Lo resolví con un presupuesto de pasos en el script; en producción hace falta un presupuesto real (ver "Cambios al engine").

---

## S1 · Lunes — Esperando el calor

**LeetCode 739 · Daily Temperatures** — https://leetcode.com/problems/daily-temperatures/ · Medio · Pila monótona

**Enunciado.** Tenés las temperaturas de cada día. Para cada día, devolvé cuántos días tenés que esperar hasta uno **estrictamente** más cálido. Si no llega nunca, devolvé 0.

**Ejemplo.** `[73,74,75,71,69,72,76,73]` → `[1,1,4,2,1,1,0,0]`

**Restricciones.** 0 ≤ n ≤ 100.000 · 30 ≤ t ≤ 100 · "Más cálido" significa mayor, no igual.

**Codificación.** `input: number[]` → `number[]`.

| Paso | # | Opción (título · detalle) | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Pila de pendientes · Los días esperan hasta que llega uno más cálido | `for i: while pila && cond(top): resolver(top); push(i)` | ✔ óptimo O(n) |
| | A1 | Mirar hacia adelante · Para cada día, buscar el próximo más cálido | doble loop | ✔ subóptimo O(n²), activeSteps=[0] |
| | A2 | De atrás para adelante · Reusar la respuesta del día siguiente | `ans[i] = t[i+1]>t[i] ? 1 : ans[i+1]>0 ? ans[i+1]+1 : 0` (un solo salto) | ✘ rompe 1, 8, 12 |
| | A3 | Saltar al máximo · El día más caluroso que viene te salva | distancia al máximo del sufijo | ✘ rompe 1, 4, 8, 9, 11, 12 |
| Memoria | M0 | Pila de índices · Guardás posiciones, no temperaturas | `stack: number[]` de índices | ✔ |
| | M1 | El último pendiente · Un solo índice alcanza | `pending = i` (reemplaza) | ✘ rompe 1, 6, 7, 8, 11, 12 |
| | M2 | Cola de pendientes · Primero en llegar, primero en resolverse | `shift()` en vez de `pop()` | ✘ rompe 1, 8, 12 |
| | M3 | Pila sin repetidos · Si llega una temperatura igual, reemplazás el tope | `if t[top]==t[i]: stack[-1]=i` | ✘ **silenciosa**, rompe 6, 12 |
| Regla | R0 | Mientras sea más cálido · Resolvés todos los que supera | `while t[i] > t[top]: ans[top] = i - top` | ✔ |
| | R1 | Mientras no sea más frío · Igual también cuenta | `while t[i] >= t[top]` | ✘ **silenciosa**, rompe 6, 10, 12 |
| | R2 | Uno por día · Cada día cálido resuelve un pendiente | `if` en vez de `while` | ✘ rompe 1, 6, 7, 8, 11, 12 |
| | R3 | Distancia al nuevo tope · Como en el histograma | `ans[top] = i - stack.top` (después del pop) | ✘ rompe 1, 6, 7, 8, 11, 12 |

Combos que pasan 12/12: `(0,0,0)` y todos los `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[73, 74, 75, 71, 69, 72, 76, 73]` | `[1, 1, 4, 2, 1, 1, 0, 0]` | A2, A3, M1, M2, R2, R3 |
| 2 | `[]` | `[]` | — |
| 3 | `[50]` | `[0]` | — |
| 4 | `[30, 40, 50, 60]` | `[1, 1, 1, 0]` | A3 |
| 5 | `[60, 50, 40, 30]` | `[0, 0, 0, 0]` | — |
| 6 | `[70, 70, 71]` | `[2, 1, 0]` | M1, M3, R1, R2, R3 |
| 7 | `[73, 72, 71, 74]` | `[3, 2, 1, 0]` | M1, R2, R3 |
| 8 | `[72, 70, 71, 75]` | `[3, 1, 1, 0]` | A2, A3, M1, M2, R2, R3 |
| 9 | `[71, 72, 75]` | `[1, 1, 0]` | A3 |
| 10 | `[55, 55, 55]` | `[0, 0, 0]` | R1 |
| 11 | `[30, 60, 90, 60, 30, 100]` | `[1, 1, 3, 2, 1, 0]` | A3, M1, R2, R3 |
| 12 | `[89, 62, 70, 58, 47, 47, 46, 76, 100, 70]` | `[8, 1, 5, 4, 3, 2, 1, 1, 0, 0]` | todas |

La trampa clave es **igualdad**: R1 (`>=`) y M3 (deduplicar) solo se notan con temperaturas repetidas, y el ejemplo no tiene ninguna. Es un buen lunes: la técnica es conocida y el error es de precisión, no de concepto.

---

## S1 · Martes — Lo justo y necesario

**LeetCode 76 · Minimum Window Substring** — https://leetcode.com/problems/minimum-window-substring/ · Medio en este formato (Hard en LC) · Ventana deslizante con conteos

**Enunciado.** Devolvé el fragmento más corto de `s` que contenga **todas** las letras de `t`, contando repeticiones. Si no existe, devolvé `""`.

**Ejemplo.** `s = "ADOBECODEBANC"`, `t = "ABC"` → `"BANC"`

**Restricciones.** 1 ≤ |s|, |t| ≤ 100.000 · letras ASCII · si `t` tiene dos `a`, la ventana necesita dos `a` · se acepta cualquier ventana de largo mínimo.

**Codificación.** `input: s`, `other: t` → `string`. Hace falta sumar `string` a `Output` y un validador: el resultado tiene que ser un substring de `s`, cubrir `t` y tener el largo esperado.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Expandir y encoger · La derecha suma, la izquierda recorta | dos punteros sobre `s` | ✔ óptimo O(\|s\|+\|t\|) |
| | A1 | Cada comienzo · Desde cada posición, crecer hasta cubrir | doble loop con conteo | ✔ subóptimo O(\|s\|²) |
| | A2 | Ventana fija · Del largo de `t` | probar `s[i:i+\|t\|]` | ✘ rompe 1, 10, 11 |
| | A3 | Primeras apariciones · De la primera letra útil a la última | `s[min(first):max(first)+1]` | ✘ rompe 1, 3, 4, 6, 7, 9, 10, 11, 12 |
| Memoria | M0 | Faltantes por letra + contador · `need[c]` y `missing` | `need = count(t); missing = \|t\|` | ✔ |
| | M1 | Conjunto de letras de t · Alcanza con saber cuáles faltan | `need = set(t)` | ✘ **silenciosa**, rompe 3, 4, 9, 11 |
| | M2 | Comparar mapas completos · `window ⊇ need` en cada paso | `while covers(window, need)` | ✔ subóptimo O(\|s\|·Σ) |
| | M3 | Contador sin tope · Cada letra útil descuenta | `if c in t: missing--` (cuenta también las sobrantes) | ✘ **silenciosa**, rompe 6, 7, 11 |
| Regla | R0 | Encoger mientras sea válida · Registrar y recortar | `while missing==0: best=...; quitar s[l++]` | ✔ |
| | R1 | Encoger una vez · Un paso de izquierda por paso de derecha | `if` en vez de `while` | ✘ rompe 1, 5, 6, 7, 9, 10, 11, 12 |
| | R2 | Registrar al romperse · Guardar la ventana apenas deja de ser válida | registra después de quitar | ✘ rompe 1, 2, 4, 5, 6, 7, 9, 10, 11, 12 |
| | R3 | Reiniciar al cubrir · Empezar de nuevo después de cada hallazgo | `l = r+1; need = reset` | ✘ rompe 1, 5, 6, 7, 9, 10, 11, 12 |

Combos que pasan: `(0,0,0)`, `(0,2,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `"ADOBECODEBANC", "ABC"` | `"BANC"` | A2, A3, R1, R2, R3 |
| 2 | `"a", "a"` | `"a"` | R2 |
| 3 | `"a", "aa"` | `""` | A3, M1 |
| 4 | `"aa", "aa"` | `"aa"` | A3, M1, R2 |
| 5 | `"ab", "b"` | `"b"` | R1, R2, R3 |
| 6 | `"aab", "ab"` | `"ab"` | A3, M3, R1, R2, R3 |
| 7 | `"bba", "ab"` | `"ba"` | A3, M3, R1, R2, R3 |
| 8 | `"abc", "d"` | `""` | — |
| 9 | `"aaflslflsldkalskaaa", "aaa"` | `"aaa"` | A3, M1, R1, R2, R3 |
| 10 | `"cabwefgewcwaefgcf", "cae"` | `"cwae"` | A2, A3, R1, R2, R3 |
| 11 | `"acbbaca", "aba"` | `"baca"` | A2, A3, M1, M3, R1, R2, R3 |
| 12 | `"bdab", "ab"` | `"ab"` | A3, R1, R2, R3 |

Las trampas clave son de **multiplicidad**: M1 (Set) y M3 (descontar sobrantes). Las dos pasan `"ABC"` porque el ejemplo no repite letras.

---

## S1 · Miércoles — Suma con deuda

**LeetCode 560 · Subarray Sum Equals K** — https://leetcode.com/problems/subarray-sum-equals-k/ · Medio+ · Prefix sums + hashmap

**Enunciado.** Contá cuántos subarrays contiguos suman exactamente `k`. Ojo: hay números negativos y ceros.

**Ejemplo.** `[1,1,1]`, `k = 2` → `2`

**Restricciones.** 0 ≤ n ≤ 20.000 · −1000 ≤ nums[i] ≤ 1000 · −10⁷ ≤ k ≤ 10⁷.

**Codificación.** `input: nums`, `target: k` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Prefijos acumulados · Un subarray es la resta de dos prefijos | `cur += x; cnt += seen[cur-k]` | ✔ óptimo O(n) |
| | A1 | Todos los comienzos · Sumar desde cada i | doble loop con suma corrida | ✔ subóptimo O(n²) |
| | A2 | Ventana deslizante · Achicar cuando la suma se pasa | `while s > k: s -= a[l++]` | ✘ **silenciosa**, rompe 5, 7, 8, 9, 10, 11, 12 |
| | A3 | Acumular y reiniciar · Cuando llegás a k, contás y empezás de cero | reinicio estilo Kadane | ✘ rompe 1, 5, 7, 8, 9, 10, 11, 12 |
| Memoria | M0 | Prefijo → cantidad · Un Map con semilla `{0: 1}` | `seen = new Map([[0,1]])` | ✔ |
| | M1 | Prefijos vistos · Un Set con semilla `{0}` | `has(cur-k) ? 1 : 0` | ✘ **silenciosa**, rompe 5, 7, 10, 11, 12 |
| | M2 | Solo el prefijo anterior · Comparar con el paso previo | `cur - prev == k` | ✘ rompe 1, 4, 5, 7, 8, 9, 10, 11, 12 |
| | M3 | Prefijo → cantidad, sin semilla · El Map arranca vacío | `seen = new Map()` | ✘ rompe 1, 3, 4, 5, 7, 8, 9, 10, 11, 12 |
| Regla | R0 | Buscar, después registrar · Solo prefijos anteriores | `cnt += get(cur-k); inc(cur)` | ✔ |
| | R1 | Registrar, después buscar · Incluye el prefijo actual | `inc(cur); cnt += get(cur-k)` | ✘ **silenciosa**, rompe 5, 6, 7, 10 (k = 0 cuenta el subarray vacío) |
| | R2 | Buscar el complemento · Como en Two Sum | `get(k-cur)` | ✘ rompe 1, 4, 8, 9, 10, 11, 12 |
| | R3 | Ignorar prefijos negativos · No pueden aportar | `if cur-k >= 0` | ✘ **silenciosa**, rompe solo 8 |

Combos que pasan: `(0,0,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[1, 1, 1], k=2` | `2` | A3, M2, M3, R2 |
| 2 | `[], k=0` | `0` | — |
| 3 | `[5], k=5` | `1` | M3 |
| 4 | `[1, 2, 3], k=3` | `2` | M2, M3, R2 |
| 5 | `[0, 0, 0], k=0` | `6` | A2, A3, M1, M2, M3, R1 |
| 6 | `[1], k=0` | `0` | R1 |
| 7 | `[1, -1, 0], k=0` | `3` | A2, A3, M1, M2, M3, R1 |
| 8 | `[-1, -1, 1], k=-1` | `3` | A2, A3, M2, M3, R2, R3 |
| 9 | `[3, 4, 7, 2, -3, 1, 4, 2], k=7` | `4` | A2, A3, M2, M3, R2 |
| 10 | `[1, -1, 1, -1], k=0` | `4` | A2, A3, M1, M2, M3, R1, R2 |
| 11 | `[2, -2, 2, -2, 2], k=2` | `6` | A2, A3, M1, M2, M3, R2 |
| 12 | `[10, 2, -2, -20, 10], k=-10` | `3` | A2, A3, M1, M2, M3, R2 |

La trampa clave es la **ventana deslizante con negativos**: A2 pasa el ejemplo y es el reflejo de quien acaba de hacer "Longest Substring". R3 es la más fina, porque solo la delata un `k` negativo.

---

## S1 · Jueves — Ritmo justo

**LeetCode 875 · Koko Eating Bananas** — https://leetcode.com/problems/koko-eating-bananas/ · Difícil · Búsqueda binaria sobre la respuesta

**Enunciado.** Hay pilas de tareas y `h` horas. Por hora atacás una sola pila a velocidad `v` (si quedan menos de `v`, esa hora se pierde igual). Devolvé la **mínima** velocidad entera que termina todo en `h` horas.

**Ejemplo.** `[3,6,7,11]`, `h = 8` → `4`

**Restricciones.** 1 ≤ n ≤ 10⁴ · n ≤ h ≤ 10⁹ · 1 ≤ pila ≤ 10⁹.

**Codificación.** `input: piles`, `target: h` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Binaria sobre la velocidad · Factible es monótono en v | `lo=1, hi=max` | ✔ óptimo O(n log max) |
| | A1 | Probar velocidades · De 1 hacia arriba | `v=1; while horas(v) > h: v++` | ✔ subóptimo O(n·max), activeSteps=[0,1] |
| | A2 | Calcularla directo · Total sobre horas | `ceil(sum/h)` | ✘ **silenciosa**, rompe 2, 3 |
| | A3 | Binaria sobre las pilas · La respuesta es alguna pila | buscar entre `sorted(set(piles))` | ✘ rompe 1, 5, 7, 9, 10, 12 |
| Memoria | M0 | Horas redondeando arriba · `⌈p/v⌉` | `(p + v - 1) / v \| 0` | ✔ |
| | M1 | División entera · `⌊p/v⌋` | `p / v \| 0` | ✘ rompe 1, 2, 3, 5, 6, 8, 9, 10 |
| | M2 | Entera más uno · `⌊p/v⌋ + 1` | sobrecuenta cuando divide exacto | ✘ **silenciosa**, rompe 3, 10 |
| | M3 | Redondeo común · `round(p/v)` | `Math.round(p/v)` | ✘ **silenciosa**, rompe 2, 3, 5, 6, 8 |
| Regla | R0 | Si alcanza, `hi = mid` · Si no, `lo = mid + 1` | `while lo < hi` | ✔ |
| | R1 | Si alcanza, `hi = mid − 1` · Descartar el que ya sirvió | pierde la respuesta | ✘ **silenciosa**, rompe 3, 9 |
| | R2 | Empezar en la pila más chica · Más lento no tiene sentido | `lo = min(piles)` | ✘ **silenciosa**, rompe 5, 7, 9, 10, 12 |
| | R3 | Cortar al primer factible · Ya encontraste una | `return mid` | ✘ rompe 1, 5, 7, 10, 12 |

Combos que pasan: `(0,0,0)` y `(1,0,·)`. Solo 5 de 64: es el desafío con menos margen.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[3, 6, 7, 11], h=8` | `4` | A3, M1, R3 |
| 2 | `[30, 11, 23, 4, 20], h=5` | `30` | A2, M1, M3 |
| 3 | `[30, 11, 23, 4, 20], h=6` | `23` | A2, M1, M2, M3, R1 |
| 4 | `[1], h=1` | `1` | — |
| 5 | `[1000], h=3` | `334` | A3, M1, M3, R2, R3 |
| 6 | `[4], h=1` | `4` | M1, M3 |
| 7 | `[30, 11], h=100` | `1` | A3, R2, R3 |
| 8 | `[5, 5, 5, 5], h=4` | `5` | M1, M3 |
| 9 | `[5, 5, 5, 5], h=8` | `3` | A3, M1, R1, R2 |
| 10 | `[9, 8, 7], h=7` | `4` | A3, M1, M2, R2, R3 |
| 11 | `[2, 2], h=3` | `2` | — |
| 12 | `[312884470], h=968709470` | `1` | A3, R2, R3 |

Las trampas clave son de **frontera**: R1 y R2 son errores clásicos de binary search que el ejemplo no detecta. M2 (`⌊p/v⌋+1`) parece un ceil pero sobrecuenta solo cuando la división es exacta.

---

## S1 · Viernes — Correlativas

**LeetCode 210 · Course Schedule II** — https://leetcode.com/problems/course-schedule-ii/ · Difícil · Orden topológico con detección de ciclos

**Enunciado.** Tenés `n` materias y pares `[a, b]`: para cursar `a` tenés que haber aprobado `b`. Devolvé **un** orden en el que se puedan cursar todas. Si las correlativas forman un ciclo, devolvé `[]`.

**Ejemplo.** `n = 4`, `[[1,0],[2,0],[3,1],[3,2]]` → `[0,2,1,3]` (también vale `[0,1,2,3]`).

**Restricciones.** 1 ≤ n ≤ 2000 · pares distintos · puede haber materias sueltas y autociclos.

**Codificación.** `input: number[]` con los pares aplanados `[a0,b0,a1,b1,…]`, `target: n` → `number[]`. Validador: si el esperado es `[]`, el resultado tiene que ser `[]`; si no, tiene que ser una permutación de `0..n-1` donde todo `b` aparece antes que su `a`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Sin pendientes primero · Cola de materias con indegree 0 (Kahn) | BFS por indegree | ✔ óptimo O(V+E) |
| | A1 | DFS en post-orden · Marcás visitado y agregás al volver | DFS con **un** solo estado | ✘ **silenciosa**, rompe 4, 7, 8, 12 (no detecta ciclos) |
| | A2 | Pasadas sucesivas · En cada pasada tomás lo que ya se puede cursar | loop hasta no avanzar | ✔ subóptimo O(V·(V+E)), activeSteps=[0] |
| | A3 | Ordenar por cantidad de correlativas · Menos requisitos, antes | `sort by indegree` | ✘ **silenciosa**, rompe 4, 7, 8, 9, 10, 12 |
| Memoria | M0 | Requisito → dependientes + indegree · `adj[b].push(a); deg[a]++` | | ✔ |
| | M1 | Materia → requisitos · `adj[a].push(b); deg[b]++` | aristas invertidas | ✘ rompe 1, 3, 6, 9, 10, 11 |
| | M2 | Bandera "tiene pendientes" · Booleano en vez de contador | `deg[a] = true` | ✘ rompe 1, 8, 9, 10; **con ciclos no termina** |
| | M3 | Un dependiente por materia · `Map<requisito, siguiente>` | sobrescribe | ✘ rompe 1, 9 |
| Regla | R0 | Si no salieron todas, hay ciclo · `order.length < n → []` | | ✔ |
| | R1 | Devolver lo que salió · El orden parcial alcanza | sin chequeo final | ✘ **silenciosa**, rompe 8, 12 |
| | R2 | Arrancar por la materia 0 · Es la primera de la lista | `queue = [0]` | ✘ **silenciosa**, rompe 5, 10, 11 |
| | R3 | Encolar al liberar un requisito · No hace falta esperar a cero | encola al primer decremento | ✘ **silenciosa**, rompe solo 8 |

Combos que pasan: `(0,0,0)` y `(2,·,·)`.

| # | Entrada | Esperado (uno válido) | Lo rompen |
|---|---|---|---|
| 1 | `n=4, [[1,0],[2,0],[3,1],[3,2]]` | `[0, 2, 1, 3]` | M1, M2, M3 |
| 2 | `n=1, []` | `[0]` | — |
| 3 | `n=2, [[1,0]]` | `[0, 1]` | M1 |
| 4 | `n=2, [[1,0],[0,1]]` | `[]` | A1, A3 |
| 5 | `n=3, []` | `[2, 1, 0]` | R2 |
| 6 | `n=3, [[1,0],[2,1]]` | `[0, 1, 2]` | M1 |
| 7 | `n=3, [[0,1],[1,2],[2,0]]` | `[]` | A1, A3 |
| 8 | `n=4, [[1,0],[2,1],[3,2],[1,3]]` | `[]` | A1, A3, M2, R1, R3 |
| 9 | `n=5, [[1,0],[2,0],[3,1],[3,2],[4,3]]` | `[0, 2, 1, 3, 4]` | A3, M1, M2, M3 |
| 10 | `n=4, [[2,0],[2,1],[3,2]]` | `[1, 0, 2, 3]` | A3, M1, M2, R2 |
| 11 | `n=6, [[5,4],[4,3],[1,0]]` | `[3, 4, 5, 2, 0, 1]` | M1, R2 |
| 12 | `n=3, [[0,0]]` | `[]` | A1, A3, R1 |

La trampa clave es **un ciclo que no arranca en la raíz** (caso 8: la materia 0 se libera, pero 1→2→3→1 queda trabado). R3 y R1 solo se ven ahí. A1 es la trampa conceptual: un DFS con un solo "visitado" ordena bien los DAGs, pero no distingue una arista hacia atrás.

---

## S1 · Sábado — Salas llenas

**LeetCode 253 · Meeting Rooms II** (premium; alternativa abierta: LintCode 919) — https://leetcode.com/problems/meeting-rooms-ii/ · Difícil+ · Barrido de eventos

**Enunciado.** Cada reunión es `[inicio, fin)`. Devolvé la cantidad mínima de salas para que ninguna se pise. Si una termina a las 5 y otra empieza a las 5, pueden usar la misma sala.

**Ejemplo.** `[[0,30],[5,10],[15,20]]` → `2`

**Restricciones.** 0 ≤ n ≤ 10⁴ · 0 ≤ inicio < fin ≤ 10⁶ · el orden de entrada es arbitrario.

**Codificación.** `input: number[]` aplanado `[s0,e0,s1,e1,…]` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Barrido de eventos · +1 al empezar, −1 al terminar | ordenar eventos y acumular | ✔ óptimo O(n log n) |
| | A1 | Contar en cada inicio · El pico está en algún comienzo | para cada `s`, contar activas | ✔ subóptimo O(n²), activeSteps=[0] |
| | A2 | Cadena con la anterior · Ordenar y ver si pisa a la previa | racha de solapes consecutivos | ✘ **silenciosa**, rompe 6, 11, 12 |
| | A3 | Fusionar intervalos · Cada grupo solapado, una sala | merge intervals | ✘ rompe 1, 4, 5, 6, 7, 8, 9, 11, 12 |
| Memoria | M0 | Lista de eventos · `(tiempo, ±1)` | | ✔ |
| | M1 | Solo el último fin · Ordenar por inicio y comparar | `if s < lastEnd: rooms++` | ✘ **silenciosa**, rompe 6, 10, 11, 12 |
| | M2 | Array de diferencias por minuto · `diff[s]++, diff[e]--` | O(T) memoria y tiempo | ✔ subóptimo (T = 10⁶), activeSteps=[0,1] |
| | M3 | Fin inclusivo · El evento de cierre va en `fin + 1` | `(e+1, −1)` | ✘ **silenciosa**, rompe 4, 5, 9, 10, 11, 12 |
| Regla | R0 | Empate: cierre antes que apertura · `sort by (t, delta)` | −1 antes que +1 | ✔ |
| | R1 | Empate: apertura antes que cierre · La nueva entra primero | +1 antes que −1 | ✘ **silenciosa**, rompe 4, 5, 9, 10, 11, 12 |
| | R2 | Devolver el contador final · Lo que quedó ocupado | `return cur` | ✘ rompe 1, 3–12 |
| | R3 | Ordenar solo por tiempo · El sort ya es estable | empate según orden de entrada | ✘ **silenciosa**, rompe 5, 9, 10, 12 |

Combos que pasan: `(0,0,0)`, `(0,2,·)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[[0,30],[5,10],[15,20]]` | `2` | A3, R2 |
| 2 | `[]` | `0` | — |
| 3 | `[[7,10]]` | `1` | R2 |
| 4 | `[[1,5],[5,10]]` | `1` | A3, M3, R1, R2 |
| 5 | `[[5,10],[1,5]]` | `1` | A3, M3, R1, R2, R3 |
| 6 | `[[0,2],[1,4],[3,6]]` | `2` | A2, A3, M1, R2 |
| 7 | `[[1,10],[2,7],[3,4],[5,6]]` | `3` | A3, R2 |
| 8 | `[[1,3],[1,3],[1,3]]` | `3` | A3, R2 |
| 9 | `[[2,4],[7,10],[1,2]]` | `1` | A3, M3, R1, R2, R3 |
| 10 | `[[6,9],[1,6],[6,7],[2,6]]` | `2` | M1, M3, R1, R2, R3 |
| 11 | `[[0,5],[5,10],[10,15],[0,15]]` | `2` | A2, A3, M1, M3, R1, R2 |
| 12 | `[[9,10],[4,9],[4,17]]` | `2` | A2, A3, M1, M3, R1, R2, R3 |

La trampa clave es **el desempate**. R3 es la más maliciosa: `[[1,5],[5,10]]` pasa por casualidad (el cierre se generó antes), pero `[[5,10],[1,5]]` no. Solo se ve si sabés que el sort estable depende del orden de entrada.

---

## S1 · Domingo — El rectángulo escondido

**LeetCode 84 · Largest Rectangle in Histogram** — https://leetcode.com/problems/largest-rectangle-in-histogram/ · Brutal · Pila monótona con centinela

**Enunciado.** Cada barra tiene ancho 1. Devolvé el área del rectángulo más grande que entra completo dentro del histograma.

**Ejemplo.** `[2,1,5,6,2,3]` → `10`

**Restricciones.** 0 ≤ n ≤ 10⁵ · 0 ≤ h ≤ 10⁴.

**Codificación.** `input: number[]` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Pila creciente · Cada barra sabe dónde termina al llegar una más baja | | ✔ óptimo O(n) |
| | A1 | Expandir desde cada barra · Ir a izquierda y derecha mientras no baje | | ✔ subóptimo O(n²), activeSteps=[0] |
| | A2 | Dos punteros desde los extremos · Como "Container With Most Water" | mover el lado más bajo | ✘ **silenciosa**, rompe solo 8 |
| | A3 | Altura × barras que la alcanzan · Contar cuántas barras son ≥ h | ignora la contigüidad | ✘ **silenciosa**, rompe 7, 8, 11, 12 |
| Memoria | M0 | Pila de índices + centinela 0 al final | `heights.concat(0)` | ✔ |
| | M1 | Pila de alturas · El ancho es cuántas sacaste | `width = popped` | ✘ **silenciosa**, rompe 6, 7, 8, 11 |
| | M2 | Pila de índices, sin centinela · Lo que queda en la pila no importa | no vacía al final | ✘ **silenciosa**, rompe 3, 4, 5, 7, 9, 11 |
| | M3 | Pila decreciente · Sacás cuando llega una más alta | dirección invertida | ✘ rompe 1, 3–9, 11, 12 |
| Regla | R0 | Ancho = `i − nuevoTope − 1` · O `i` si la pila queda vacía | | ✔ |
| | R1 | Ancho = `i − sacado` · Desde la barra que sacaste | ignora las más altas a su izquierda | ✘ **silenciosa**, rompe 6, 7, 8, 11 |
| | R2 | Ancho = `i − nuevoTope` · Sin el −1 | off-by-one | ✘ rompe 1, 4, 5, 7, 8, 11, 12 |
| | R3 | Pila vacía → ancho 1 · Si no queda nadie, solo ella | olvida el prefijo | ✘ **silenciosa**, rompe 6, 7, 9 |

Combos que pasan: `(0,0,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[2, 1, 5, 6, 2, 3]` | `10` | M3, R2 |
| 2 | `[]` | `0` | — |
| 3 | `[7]` | `7` | M2, M3 |
| 4 | `[2, 4]` | `4` | M2, M3, R2 |
| 5 | `[1, 2, 3, 4, 5]` | `9` | M2, M3, R2 |
| 6 | `[5, 4, 3, 2, 1]` | `9` | M1, M3, R1, R3 |
| 7 | `[2, 1, 2]` | `3` | A3, M1, M2, M3, R1, R2, R3 |
| 8 | `[6, 2, 5, 4, 5, 1, 6]` | `12` | A2, A3, M1, M3, R1, R2 |
| 9 | `[3, 3, 3, 3]` | `12` | M2, M3, R3 |
| 10 | `[0, 0, 0]` | `0` | — |
| 11 | `[4, 2, 0, 3, 2, 5]` | `6` | A3, M1, M2, M3, R1, R2 |
| 12 | `[2, 1, 4, 5, 1, 3, 3]` | `8` | A3, M3, R2 |

Por qué es brutal: 6 de 8 trampas pasan el ejemplo, y A2 rompe un único caso. R1 es la que comete hasta quien conoce la técnica: el ancho tiene que extenderse hasta el **nuevo** tope, no hasta la barra sacada.

**Variante opcional (4º paso, "Predecí").** Antes de enviar, el jugador ve `[2,1,2]` y elige el output que produce su combo (4 opciones: 3, 2, 4, 6). Si acierta, suma bonus. Así se valida que entendió el ancho sin depender de los casos ocultos.

---

## S2 · Lunes — El corrector

**LeetCode 72 · Edit Distance** — https://leetcode.com/problems/edit-distance/ · Medio en este formato (Hard en LC) · DP sobre prefijos

**Enunciado.** Devolvé la mínima cantidad de operaciones (insertar, borrar o reemplazar un carácter) para transformar `a` en `b`.

**Ejemplo.** `"horse"`, `"ros"` → `3`

**Restricciones.** 0 ≤ |a|, |b| ≤ 500 · minúsculas.

**Codificación.** `input: a`, `other: b` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | DP sobre prefijos · `dp[i][j]` = costo entre `a[:i]` y `b[:j]` | | ✔ óptimo O(nm) |
| | A1 | Vía LCS · `n + m − 2·LCS` | solo insertar/borrar | ✘ rompe 1, 6, 9, 10, 11, 12 |
| | A2 | Alinear y contar · Diferencias posición a posición + diferencia de largos | Hamming | ✘ rompe 1, 7, 10, 12 |
| | A3 | Letras en común · `max(n,m) − \|multiset(a) ∩ multiset(b)\|` | ignora el orden | ✘ rompe 1, 6, 8, 12 |
| Memoria | M0 | Dos filas · `prev` y `cur` | O(m) memoria | ✔ |
| | M1 | Tabla completa · `(n+1)×(m+1)` | O(nm) memoria | ✔ subóptimo (memoria) |
| | M2 | Una sola fila in place · Pisás la diagonal sin guardarla | `row[j] = f(row[j-1], row[j], row[j-1])` | ✘ rompe 1, 5–12 |
| | M3 | Tabla sin bordes · `dp[i][0]` y `dp[0][j]` en 0 | olvida el caso base | ✘ rompe 1, 3, 4, 6, 7, 8, 10 |
| Regla | R0 | Iguales → diagonal · Si no, `1 + min(diag, arriba, izq)` | | ✔ |
| | R1 | Sin reemplazo · `1 + min(arriba, izq)` | | ✘ rompe 1, 6, 9, 10, 11, 12 |
| | R2 | Compará `a[i]` con `b[j]` · Índices de la tabla | off-by-one (`dp` está corrido en 1) | ✘ **silenciosa**, rompe solo 7 |
| | R3 | Distintos → diagonal + 1 · Reemplazar siempre conviene | | ✘ rompe 1, 9, 10, 12 |

Combos que pasan: `(0,0,0)` y `(0,1,0)`. Acá la eficiencia se mide en **memoria**: los dos son O(nm) en tiempo.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `"horse", "ros"` | `3` | A1, A2, A3, M2, M3, R1, R3 |
| 2 | `"", ""` | `0` | — |
| 3 | `"", "abc"` | `3` | M3 |
| 4 | `"abc", ""` | `3` | M3 |
| 5 | `"abc", "abc"` | `0` | M2 |
| 6 | `"intention", "execution"` | `5` | A1, A3, M2, M3, R1 |
| 7 | `"abc", "bc"` | `1` | A2, M2, M3, R2 |
| 8 | `"ab", "ba"` | `2` | A3, M2, M3 |
| 9 | `"kitten", "sitting"` | `3` | A1, M2, R1, R3 |
| 10 | `"sunday", "saturday"` | `3` | A1, A2, M2, M3, R1, R3 |
| 11 | `"a", "b"` | `1` | A1, M2, R1 |
| 12 | `"abcdef", "azced"` | `3` | A1, A2, A3, M2, R1, R3 |

**3×4 se queda corto acá.** El ejemplo delata 7 de 8 trampas. Por eso va un lunes en modo normal. Para subir la dificultad hay dos variantes compatibles con el engine:

- **Micro-paso "Predecí la celda"**: antes de enviar se muestra la tabla parcial de `"horse"/"ros"` y se pregunta `dp[2][2]` (`"ho"` → `"ro"`), con 4 opciones: 1, 2, 0, 3. La respuesta es 1. Falla quien no tiene claro qué significa el estado.
- **Ocultar la ejecución del ejemplo** en hard mode: todas las trampas pasan a ser silenciosas.

---

## S2 · Martes — Memoria corta

**LeetCode 146 · LRU Cache** — https://leetcode.com/problems/lru-cache/ · Medio · Diseño de estructura (hashmap + orden de recencia)

**Enunciado.** Implementá una caché de capacidad `cap`. `get(k)` devuelve el valor o −1. `put(k, v)` inserta o actualiza. Si te pasás de capacidad, desalojás la clave usada hace más tiempo. Tanto leer como escribir cuentan como "usar".

**Ejemplo.** `cap=2: put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)` → `[1,-1,-1,3,4]`

**Restricciones.** 1 ≤ cap ≤ 3000 · hasta 2·10⁵ operaciones · las dos operaciones en O(1).

**Codificación.** `input: number[]` con tripletas `[op, key, val]` (`op` 0 = get, 1 = put; `val` se ignora en get), `target: cap` → `number[]` con los resultados de cada `get`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Hashmap ordenado por recencia · `Map` (orden de inserción) o hashmap + lista doble | | ✔ óptimo O(1) |
| | A1 | Lista de claves por recencia · Mover al final con búsqueda lineal | `keys.splice(indexOf(k),1)` | ✔ subóptimo O(cap) por op |
| | A2 | Cola FIFO + Map · Sale la primera que entró | sin refresco | ✘ rompe 1, 4, 5, 6, 7, 10, 11 |
| | A3 | Menos frecuente · Sale la menos usada (desempate por antigüedad) | LFU | ✘ rompe 1, 8 |
| Memoria | M0 | `Map` + borrar y reinsertar · El primero es el más viejo | `map.keys().next()` | ✔ |
| | M1 | Objeto JS · `cache[k] = v`, desalojás `Object.keys(cache)[0]` | **las claves enteras se iteran ascendentes**, no por inserción | ✘ rompe 1, 5, 7, 8, 11 |
| | M2 | Map + array de orden · Array aparte con las claves | O(cap) remove | ✔ subóptimo |
| | M3 | Map + contador propio de tamaño · `size++` en cada put | no descuenta al actualizar | ✘ **silenciosa**, rompe 4, 5, 9, 12 |
| Regla | R0 | Leer y escribir refrescan · Desalojás después de insertar si `size > cap` | | ✔ |
| | R1 | Solo escribir refresca · `get` no toca el orden | | ✘ rompe 1, 6, 10, 11 |
| | R2 | Desalojar antes de insertar · Si `size >= cap`, sacás uno | también al actualizar una clave existente | ✘ **silenciosa**, rompe solo 12 |
| | R3 | Sale el más reciente · El último de la estructura | | ✘ rompe 1, 4, 5, 6, 7, 8, 10, 11 |

Combos que pasan: `(0,0,0)`, `(0,2,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `cap=2: put(1,1),put(2,2),get(1),put(3,3),get(2),put(4,4),get(1),get(3),get(4)` | `[1, -1, -1, 3, 4]` | A2, A3, M1, R1, R3 |
| 2 | `cap=1: get(1)` | `[-1]` | — |
| 3 | `cap=1: put(1,1),put(2,2),get(1),get(2)` | `[-1, 2]` | — |
| 4 | `cap=2: put(2,1),put(1,1),put(2,3),put(4,1),get(1),get(2)` | `[-1, 3]` | A2, M3, R3 |
| 5 | `cap=2: put(1,1),put(2,2),put(1,10),put(3,3),get(1),get(2),get(3)` | `[10, -1, 3]` | A2, M1, M3, R3 |
| 6 | `cap=2: put(5,5),put(1,1),get(5),put(9,9),get(1),get(5),get(9)` | `[5, -1, 5, 9]` | A2, R1, R3 |
| 7 | `cap=3: put(1,1),put(2,2),put(3,3),put(1,4),put(4,4),get(2),get(1)` | `[-1, 4]` | A2, M1, R3 |
| 8 | `cap=2: put(2,1),put(2,2),get(2),put(1,1),put(4,1),get(2)` | `[2, -1]` | A3, M1, R3 |
| 9 | `cap=1: put(7,7),put(7,8),get(7)` | `[8]` | M3 |
| 10 | `cap=2: put(3,3),put(1,1),get(3),put(2,2),get(1),get(3),get(2)` | `[3, -1, 3, 2]` | A2, R1, R3 |
| 11 | `cap=3: put(1,1),put(2,2),put(3,3),put(4,4),get(4),get(3),get(2),get(1),put(5,5),get(1),get(2),get(3),get(4),get(5)` | `[4, 3, 2, -1, -1, 2, 3, -1, 5]` | A2, M1, R1, R3 |
| 12 | `cap=2: get(2),put(2,6),get(1),put(1,5),put(1,2),get(1),get(2)` | `[-1, -1, 2, 6]` | M3, R2 |

La trampa más rica es M1, específica de JS y de nivel staff: un objeto con claves enteras **no** respeta el orden de inserción. La más fina es R2: desalojar antes de un `put` sobre una clave existente, que solo se ve en el caso 12.

**Variante opcional.** Es un problema de diseño: encaja un micro-paso **"Predecí la salida"** sobre una secuencia corta (por ejemplo el caso 4) antes de enviar.

---

## S2 · Miércoles — Vuelto exacto

**LeetCode 322 · Coin Change** — https://leetcode.com/problems/coin-change/ · Medio+ · DP (unbounded knapsack, mínimo)

**Enunciado.** Con monedas ilimitadas de cada denominación, devolvé la mínima cantidad de monedas que suman `amount`, o −1 si no se puede.

**Ejemplo.** `[1,2,5]`, `amount = 11` → `3`

**Restricciones.** 1 ≤ monedas ≤ 12 · 0 ≤ amount ≤ 10⁴.

**Codificación.** `input: coins`, `target: amount` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | DP por monto · `dp[a]` = mínimo para `a` | bottom-up | ✔ óptimo O(amount·n) |
| | A1 | Recursión sin memo · Probar cada moneda | | ✔ subóptimo (exponencial), activeSteps=[0] |
| | A2 | Greedy · Siempre la moneda más grande que entre | | ✘ **silenciosa**, rompe 4, 7, 9, 12 |
| | A3 | Contar combinaciones · `ways[a] += ways[a−c]` | confunde con LC 518 | ✘ rompe los 12 |
| Memoria | M0 | Array con ∞ y `dp[0] = 0` | | ✔ |
| | M1 | Array en 0 | `min` nunca sube | ✘ rompe 1, 2, 4–12 |
| | M2 | Array en −1 ("imposible") | `min` se queda con −1 | ✘ rompe 1, 4, 7, 8, 9, 10, 12 |
| | M3 | `dp[0] = 1` · El monto 0 "es una forma" | +1 en todo | ✘ rompe 1, 3, 4, 7, 8, 9, 10, 12 |
| Regla | R0 | `dp[a] = min(dp[a], dp[a−c]+1)` · Y ∞ → −1 al final | | ✔ |
| | R1 | Devolver `dp[amount]` tal cual · Ya es el mínimo | no convierte ∞ en −1 | ✘ **silenciosa**, rompe 2, 5, 6, 11 |
| | R2 | Pisar con la última moneda · `dp[a] = dp[a−c]+1` | sin `min` | ✘ **silenciosa**, rompe 4, 7, 9, 12 |
| | R3 | Primera que llega · Solo si `dp[a]` está vacío | | ✘ rompe 1, 4, 8, 9, 12 |

Combos que pasan: `(0,0,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[1, 2, 5], amount=11` | `3` | A3, M1, M2, M3, R3 |
| 2 | `[2], amount=3` | `-1` | A3, M1, R1 |
| 3 | `[1], amount=0` | `0` | A3, M3 |
| 4 | `[1, 3, 4], amount=6` | `2` | A2, A3, M1, M2, M3, R2, R3 |
| 5 | `[2, 5], amount=3` | `-1` | A3, M1, R1 |
| 6 | `[3, 7], amount=5` | `-1` | A3, M1, R1 |
| 7 | `[2, 3], amount=7` | `3` | A2, A3, M1, M2, M3, R2 |
| 8 | `[5, 10, 25], amount=30` | `2` | A3, M1, M2, M3, R3 |
| 9 | `[1, 5, 6, 9], amount=11` | `2` | A2, A3, M1, M2, M3, R2, R3 |
| 10 | `[7], amount=14` | `2` | A3, M1, M2, M3 |
| 11 | `[4, 3], amount=2` | `-1` | A3, M1, R1 |
| 12 | `[9, 6, 5, 1], amount=12` | `2` | A2, A3, M1, M2, M3, R2 |

La trampa clave es el **greedy**, que pasa el ejemplo porque {1,2,5} es un sistema canónico. A1 necesita casos chicos para terminar; con un presupuesto de pasos y un caso grande pasaría a ser TLE (ver "Cambios de scoring").

---

## S2 · Jueves — El del medio

**LeetCode 295 · Find Median from Data Stream** — https://leetcode.com/problems/find-median-from-data-stream/ · Difícil · Dos heaps

**Enunciado.** Llegan números de a uno. Después de cada uno, devolvé la mediana de todos los que llegaron. Con cantidad par, es el **promedio exacto** de los dos del medio (puede tener decimales).

**Ejemplo.** `[5,15,1,3]` → `[5,10,5,4]`

**Restricciones.** hasta 5·10⁴ números · −10⁵ ≤ x ≤ 10⁵ · cada consulta en O(log n).

**Codificación.** `input: number[]` → `number[]` (floats).

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Dos mitades · Max-heap abajo, min-heap arriba | | ✔ óptimo O(log n) por inserción |
| | A1 | Lista ordenada · Inserción binaria | `splice` O(n) | ✔ subóptimo, activeSteps=[0] |
| | A2 | Promedio corrido · La media se parece a la mediana | | ✘ rompe 1, 5, 7, 9, 11, 12 |
| | A3 | Un heap acotado · Guardar los ⌈i/2⌉ menores; la mediana es el tope | descarta lo que después necesita | ✘ rompe 1, 4, 5, 6, 7, 9–12 |
| Memoria | M0 | Max-heap (negado) + min-heap | | ✔ |
| | M1 | Dos min-heaps · Ambos con el comparador por defecto | se olvida de negar | ✘ rompe 1, 5, 6, 7, 9, 11, 12 |
| | M2 | Array reordenado en cada inserción · `push + sort` | O(n log n) por inserción | ✔ subóptimo, activeSteps=[0,1] |
| | M3 | Deque ordenada por extremos · Si es menor al primero va adelante; si no, atrás | | ✘ rompe 1, 5, 7, 9, 11, 12 |
| Regla | R0 | Pasar por abajo y rebalancear · `low ← x; high ← pop(low); if \|high\|>\|low\| low ← pop(high)` | promedio exacto si es par | ✔ |
| | R1 | Insertar abajo y balancear por tamaño · Sin pasar por el otro heap | rompe el invariante `max(low) ≤ min(high)` | ✘ **silenciosa**, rompe 5, 11 |
| | R2 | Par → tope de abajo · La mediana inferior alcanza | | ✘ rompe 1, 4, 5, 6, 7, 9–12 |
| | R3 | Par → `(a+b) >> 1` · División entera | trunca y redondea mal los negativos | ✘ **silenciosa**, rompe 4, 5, 6, 7, 9, 10, 11 |

Combos que pasan: `(0,0,0)`, `(0,2,·)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[5, 15, 1, 3]` | `[5, 10, 5, 4]` | A2, A3, M1, M3, R2 |
| 2 | `[]` | `[]` | — |
| 3 | `[7]` | `[7]` | — |
| 4 | `[1, 2]` | `[1, 1.5]` | A3, R2, R3 |
| 5 | `[2, 1, 5, 7, 2, 0, 5]` | `[2, 1.5, 2, 3.5, 2, 2, 2]` | A2, A3, M1, M3, R1, R2, R3 |
| 6 | `[-1, -2, -3, -4, -5]` | `[-1, -1.5, -2, -2.5, -3]` | A3, M1, R2, R3 |
| 7 | `[6, 10, 2, 6, 5, 0, 6, 3, 1, 0, 0]` | `[6, 8, 6, 6, 6, 5.5, 6, 5.5, 5, 4, 3]` | A2, A3, M1, M3, R2, R3 |
| 8 | `[1, 1, 1, 1]` | `[1, 1, 1, 1]` | — |
| 9 | `[10, 9, 8, 1, 2, 3]` | `[10, 9.5, 9, 8.5, 8, 5.5]` | A2, A3, M1, M3, R2, R3 |
| 10 | `[-3, 2]` | `[-3, -0.5]` | A3, R2, R3 |
| 11 | `[1, 3, 5, 7, 9, 2, 4, 6, 8]` | `[1, 2, 3, 4, 5, 4, 4, 4.5, 5]` | A2, A3, M1, M3, R1, R2, R3 |
| 12 | `[100, -100, 50, -50, 0]` | `[100, 0, 50, 0, 0]` | A2, A3, M1, M3, R2 |

La trampa clave es R3: el ejemplo tiene sumas pares en los dos pasos pares (20 y 8), así que la división entera "funciona". R1 es la trampa de invariante, que solo aparece cuando llega un número chico después de uno grande.

Nota de implementación: JS no trae heap. El template tiene que incluir uno mínimo, o el paso Memoria tiene que ofrecer "heap de la stdlib" como texto y ejecutar la misma implementación de base.

---

## S2 · Viernes — El cable que sobra

**LeetCode 684 · Redundant Connection** — https://leetcode.com/problems/redundant-connection/ · Difícil · Union-Find

**Enunciado.** Una red de `n` nodos era un árbol, y alguien agregó un cable de más. Devolvé el cable que podés sacar para que vuelva a ser un árbol. Si hay varios, el que aparece **último** en la entrada.

**Ejemplo.** `[[1,2],[1,3],[2,3]]` → `[2,3]`

**Restricciones.** 3 ≤ n ≤ 1000 · n aristas · nodos 1..n.

**Codificación.** `input: number[]` aplanado → `number[]` (par).

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Unir en orden · La primera arista que une dos nodos ya conectados | Union-Find | ✔ óptimo O(n·α(n)) |
| | A1 | DFS antes de cada arista · ¿Ya hay camino entre u y v? | | ✔ subóptimo O(n²), activeSteps=[0] |
| | A2 | Por grados · La última arista con ambos extremos de grado ≥ 2 | | ✘ **silenciosa**, rompe 4, 12 |
| | A3 | Ordenar las aristas primero · Para que sea determinístico | Union-Find sobre `sorted(edges)` | ✘ **silenciosa**, rompe 2, 4, 5, 6, 7, 8, 10, 12 |
| Memoria | M0 | Padres + compresión de camino + rango | | ✔ |
| | M1 | Padres sin compresión · `find` sube hasta la raíz | árbol degenerado O(n) | ✔ subóptimo |
| | M2 | Etiqueta de componente · `comp[u] = comp[v]` al unir | quick-find sin re-etiquetar | ✘ rompe 1, 2, 4, 5, 8, 9, 11 |
| | M3 | Nodos vistos · Si ya viste los dos extremos, es el cable de más | `Set` | ✘ **silenciosa**, rompe 5, 8, 9, 10, 12 |
| Regla | R0 | Comparar raíces; si difieren, unir raíces | | ✔ |
| | R1 | Unir nodos, no raíces · `parent[u] = v` | | ✘ rompe 1, 5, 9, 11 |
| | R2 | Comparar padres directos · `parent[u] == parent[v]` | sin `find` | ✘ **silenciosa**, rompe 8, 9 |
| | R3 | Unir y después preguntar · `union(u,v); if find(u)==find(v)` | siempre verdadero | ✘ rompe los 12 |

Combos que pasan: `(0,0,0)`, `(0,1,0)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[[1,2],[1,3],[2,3]]` | `[2, 3]` | M2, R1, R3 |
| 2 | `[[1,2],[2,3],[3,4],[1,4],[1,5]]` | `[1, 4]` | A3, M2, R3 |
| 3 | `[[1,2],[2,1]]` | `[2, 1]` | R3 |
| 4 | `[[1,2],[2,3],[1,3],[3,4],[4,5]]` | `[1, 3]` | A2, A3, M2, R3 |
| 5 | `[[3,4],[1,2],[2,4],[3,5],[2,5]]` | `[2, 5]` | A3, M2, M3, R1, R3 |
| 6 | `[[1,4],[3,4],[1,3],[1,2],[4,5]]` | `[1, 3]` | A3, R3 |
| 7 | `[[2,3],[5,2],[1,5],[4,2],[4,1]]` | `[4, 1]` | A3, R3 |
| 8 | `[[1,2],[3,4],[2,3],[1,4]]` | `[1, 4]` | A3, M2, M3, R2, R3 |
| 9 | `[[1,5],[3,4],[3,5],[4,5],[2,4]]` | `[4, 5]` | M2, M3, R1, R2, R3 |
| 10 | `[[4,5],[1,2],[2,4],[3,4],[2,3]]` | `[2, 3]` | A3, M3, R3 |
| 11 | `[[1,3],[3,4],[1,5],[3,5],[2,3]]` | `[3, 5]` | M2, R1, R3 |
| 12 | `[[9,10],[5,8],[2,6],[1,5],[3,8],[4,9],[8,10],[4,10],[6,8],[7,9]]` | `[4, 10]` | A2, A3, M3, R3 |

Nota: el caso 3 `[[1,2],[2,1]]` es un multigrafo; LC no lo permite. Lo dejo porque castiga R3 sin ambigüedad, pero se puede reemplazar sin perder cobertura. La trampa clave es M3 ("si ya vi los dos nodos, hay ciclo"), que parece obvia y es falsa cuando se juntan dos componentes.

---

## S2 · Sábado — Siempre para arriba

**LeetCode 300 · Longest Increasing Subsequence** — https://leetcode.com/problems/longest-increasing-subsequence/ · Difícil+ · DP O(n log n) (patience sorting)

**Enunciado.** Devolvé el largo de la subsecuencia **estrictamente** creciente más larga. Podés saltear elementos, pero no reordenar.

**Ejemplo.** `[10,9,2,5,3,7,101,18]` → `4`

**Restricciones.** 0 ≤ n ≤ 2500 (LC). Para que la eficiencia importe, el target es O(n log n).

**Codificación.** `input: number[]` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Colas mínimas · `tails[k]` = menor final de una subsecuencia de largo k+1 | | ✔ óptimo O(n log n) |
| | A1 | DP cuadrática · `best[i] = 1 + max(best[j])` con `a[j] < a[i]` | | ✔ subóptimo O(n²), activeSteps=[0] |
| | A2 | Greedy · Agregar si supera al último elegido | | ✘ rompe 1, 5, 6, 8, 9, 11 |
| | A3 | Racha creciente · El tramo contiguo más largo | | ✘ rompe 1, 5, 6, 7, 9, 11, 12 |
| Memoria | M0 | `tails` y reemplazar la primera cola ≥ x | | ✔ |
| | M1 | `tails` conservando la cola más grande · `tails[i] = max(tails[i], x)` | | ✘ rompe 1, 5, 6, 8, 9, 11 |
| | M2 | Pila monótona · Sacar mientras el tope ≥ x; quedarse con el tamaño máximo | | ✘ **silenciosa**, rompe 5, 7, 11, 12 |
| | M3 | Solo la última cola · Si no la supera, la reemplaza | | ✘ **silenciosa**, rompe 7, 8, 9, 11 |
| Regla | R0 | `lowerBound` · Primera cola ≥ x | | ✔ |
| | R1 | `upperBound` · Primera cola > x | acepta iguales como crecientes | ✘ **silenciosa**, rompe 4, 8, 9, 12 |
| | R2 | Búsqueda lineal · Primera cola ≥ x, recorriendo | O(n·L) | ✔ subóptimo |
| | R3 | Una posición antes · `lowerBound − 1` | | ✘ **silenciosa**, rompe 5, 6, 8, 9, 11 |

Combos que pasan: `(0,0,0)`, `(0,0,2)` y `(1,·,·)`.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `[10, 9, 2, 5, 3, 7, 101, 18]` | `4` | A2, A3, M1 |
| 2 | `[]` | `0` | — |
| 3 | `[7]` | `1` | — |
| 4 | `[7, 7, 7, 7]` | `1` | R1 |
| 5 | `[0, 1, 0, 3, 2, 3]` | `4` | A2, A3, M1, M2, R3 |
| 6 | `[1, 10, 2, 3, 4]` | `4` | A2, A3, M1, R3 |
| 7 | `[5, 6, 7, 1, 2, 8]` | `4` | A3, M2, M3 |
| 8 | `[4, 10, 4, 3, 8, 9]` | `3` | A2, M1, M3, R1, R3 |
| 9 | `[3, 5, 6, 2, 5, 4, 19, 5, 6, 7, 12]` | `6` | A2, A3, M1, M3, R1, R3 |
| 10 | `[9, 8, 7, 6]` | `1` | — |
| 11 | `[0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15]` | `6` | A2, A3, M1, M2, M3, R3 |
| 12 | `[2, 2, 3, 3, 1, 4]` | `3` | A3, M2, R1 |

La trampa clave es R1 (`bisect_right`): es la diferencia entre "creciente" y "no decreciente", y el ejemplo no tiene repetidos. M2 es tentadora para quien viene de pilas monótonas: produce el largo correcto en muchos casos, pero tira prefijos que todavía sirven.

---

## S2 · Domingo — Ping a todos

**LeetCode 743 · Network Delay Time** — https://leetcode.com/problems/network-delay-time/ · Brutal · Dijkstra (vs BFS, Bellman-Ford, Prim)

**Enunciado.** Una red de `n` nodos con enlaces dirigidos `(u, v, ms)`. Desde el nodo `k` mandás un ping. Devolvé cuánto tarda en llegar a **todos**; si alguno nunca lo recibe, −1.

**Ejemplo.** `n=4, k=2, [[2,1,1],[2,3,1],[3,4,1]]` → `2`

**Restricciones.** 1 ≤ n ≤ 100 · 1 ≤ |E| ≤ 6000 · 0 ≤ w ≤ 100.

**Codificación.** `input: number[]` = `[k, u0,v0,w0, u1,v1,w1, …]`, `target: n` → `number`.

| Paso | # | Opción | Código | Veredicto |
|---|---|---|---|---|
| Enfoque | A0 | Dijkstra · Siempre expandís el nodo más cercano todavía abierto | heap | ✔ óptimo O((V+E) log V) |
| | A1 | Relajar todo n−1 veces · Bellman-Ford | | ✔ subóptimo O(V·E), activeSteps=[0,2] |
| | A2 | BFS · Primer camino que llega, sumando pesos | menor cantidad de saltos ≠ menor tiempo | ✘ **silenciosa**, rompe 5, 7, 8, 10, 12 |
| | A3 | Cola FIFO sin reencolar · Cada nodo se procesa una vez | SPFA a medias | ✘ **silenciosa**, rompe 10, 12 |
| Memoria | M0 | Min-heap de `(distancia acumulada, nodo)` + `dist[]` | | ✔ |
| | M1 | Min-heap de `(peso de la arista, nodo)` · El enlace más barato primero | **reflejo de Prim** | ✘ **silenciosa**, rompe solo 6 |
| | M2 | Sin heap · Buscar linealmente el mínimo abierto | O(V²) | ✔ subóptimo (óptimo si el grafo es denso) |
| | M3 | Max-heap · El comparador al revés | | ✘ **silenciosa**, rompe 5, 7, 8, 10, 12 |
| Regla | R0 | Cerrar al sacar · Descartar entradas viejas; `max(dist)`, −1 si queda ∞ | | ✔ |
| | R1 | Cerrar al descubrir · Apenas lo ves, su distancia queda fija | | ✘ **silenciosa**, rompe 5, 7, 8, 10, 12 |
| | R2 | Máximo de los alcanzados · Ignorar los ∞ | sin −1 | ✘ **silenciosa**, rompe 4, 9, 11 |
| | R3 | Sumar todos los tiempos · Tiempo total de la red | `sum(dist)` | ✘ rompe 1, 5, 6, 7, 8, 10, 12 |

Combos que pasan: `(0,0,0)`, `(0,2,0)`, `(0,2,1)` y los Bellman-Ford `(1,·,0|1)`. Con M2, R1 no cambia nada porque el O(V²) cierra al sacar por construcción; en el template, con M2 la Regla solo decide la salida.

| # | Entrada | Esperado | Lo rompen |
|---|---|---|---|
| 1 | `n=4, k=2, [[2,1,1],[2,3,1],[3,4,1]]` | `2` | R3 |
| 2 | `n=1, k=1, []` | `0` | — |
| 3 | `n=2, k=1, [[1,2,1]]` | `1` | — |
| 4 | `n=2, k=2, [[1,2,1]]` | `-1` | R2 |
| 5 | `n=3, k=1, [[1,2,10],[1,3,1],[3,2,1]]` | `2` | A2, M3, R1, R3 |
| 6 | `n=6, k=1, [[1,2,1],[2,3,1],[3,4,1],[4,5,1],[1,6,2],[6,5,1]]` | `3` | M1, R3 |
| 7 | `n=3, k=1, [[1,2,5],[2,3,1],[1,3,10]]` | `6` | A2, M3, R1, R3 |
| 8 | `n=5, k=1, [[1,2,2],[1,3,7],[2,3,1],[3,4,1],[2,5,9],[4,5,1]]` | `5` | A2, M3, R1, R3 |
| 9 | `n=3, k=1, [[1,2,1],[2,1,1]]` | `-1` | R2 |
| 10 | `n=4, k=1, [[1,2,4],[1,3,1],[3,2,1],[2,4,1],[3,4,9]]` | `3` | A2, A3, M3, R1, R3 |
| 11 | `n=3, k=2, [[1,2,1],[2,3,2],[1,3,2]]` | `-1` | R2 |
| 12 | `n=5, k=3, [[3,1,4],[3,2,1],[2,1,1],[1,4,1],[2,4,6],[4,5,2],[1,5,7]]` | `5` | A2, A3, M3, R1, R3 |

Por qué es brutal: 6 de 7 trampas pasan el ejemplo (que es un árbol con pesos 1, donde BFS = Dijkstra). M1 (Prim) rompe un único caso, construido a propósito: una cadena de aristas de peso 1 hacia el nodo 5 contra un atajo `1→6 (2), 6→5 (1)`. Prim cierra el 5 por la cadena porque cada arista es más barata, aunque el camino sea más largo.

**Bonus "Elegí la complejidad"** (encaja perfecto acá): después de enviar, el jugador elige entre O((V+E) log V), O(V²), O(V·E) y O(V+E) para su combo, y además "¿cuál conviene con E ≈ V²?". La respuesta es O(V²): M2 es mejor que el heap en grafos densos. Eso premia criterio, no memoria.

---

## Cambios al engine (mínimos, compatibles)

1. **`Output` suma `string`** (Min Window). Para Course Schedule, Min Window y Redundant Connection, `correct()` pasa a ser un validador por `Kind`, como ya se hace con `two-sum` (`src/lib/engine.ts:77`).
2. **Presupuesto de ejecución.** Hoy `run()` ejecuta `new Function(...)` sin límite (`src/lib/engine.ts:16`) y lo hace **en el server** (`/api/game`, `/api/simulate`). La trampa M2 de Correlativas no termina, así que con este catálogo un combo puede colgar la función. Propuesta: los templates llaman a `tick()` dentro de cada loop (se inyecta como `emit`), y `tick` corta después de N pasos (por ejemplo 2·10⁵) devolviendo `{ ok: false, error: "TLE" }`. El caso cuenta como fallado y el feedback dice "no terminó". Esto además habilita casos grandes para que O(n²) sea TLE (ver scoring).
3. **Heap en templates** (Mediana, Ping a todos): un min-heap de 15 líneas compartido en el preámbulo del template, no expuesto como opción.
4. **`activeSteps`** por kind, como hoy (`src/lib/challenges.ts:74`), con las entradas marcadas en cada tabla.
5. **Selección por día de semana.** `dailyChallenge` rota con `% 6` desde el rollout (`src/lib/challenges.ts:66`). Para la curva hace falta mapear `getUTCDay()` → tier y elegir dentro del tier (`catalog[tier][week % len]`). Hay que conservar la regla de no cambiar días ya emitidos.

## Cambios de scoring propuestos

El scoring actual (`src/lib/engine.ts:87-92`) es `90·ratio + (7|2)·ratio + 3·ratio·(1 − t/300)`. Problemas para jugadores top:

- **El crédito parcial es demasiado generoso.** Si una trampa silenciosa rompe 1 de 12 casos, el puntaje queda en ~89. Caer en la trampa más fina del día cuesta 11 puntos: no separa al que la vio del que no.
- **La eficiencia pesa poco.** 7 vs 2 puntos: elegir O(n²) a sabiendas cuesta 5.
- **El tiempo pesa 3 puntos** y el desempate es por `elapsed`, así que entre perfectos gana el más rápido, pero el puntaje no lo refleja.

Propuesta (total 100, todo calculado en el server):

| Componente | Puntos | Regla | Por qué |
|---|---|---|---|
| Corrección | 65 | 12/12 → 65. Si no, `round(40 · (pasados/12)²)` | Abre una brecha clara entre resolver y casi resolver: 11/12 → 34. La trampa fina pasa a ser el centro del juego. |
| Eficiencia | 15 | Solo si 12/12: óptimo 15, subóptimo 5 | La decisión de complejidad importa de verdad, pero nunca vale más que acertar. |
| Tiempo | 10 | Solo si 12/12: 10 si t ≤ 45 s; lineal hasta 0 en 300 s | Premia el dominio sin castigar la lectura del enunciado. 45 s es lo que tarda un experto en leer y elegir. |
| "Elegí la complejidad" | 5 | Post-envío, antes de revelar: elegir la O() del propio combo | Mide entendimiento, no adivinanza. No es explotable: elegís la complejidad de lo que ya mandaste. |
| Modo difícil | 5 | Opt-in al empezar, se bloquea hasta el reset: sin `detail` en las opciones, sin ejecutar el ejemplo y sin vista previa del código | Las trampas visibles pasan a ser silenciosas. Es el modo para los top. Se muestra en la tarjeta de share. |

Extras:

- **Multiplicador semanal por dificultad.** En el ranking semanal (`weekRange`), Medio ×1, Medio+ ×1,2, Difícil ×1,5, Difícil+ ×1,75, Brutal ×2. Así el domingo define la semana, como el crucigrama del NYT del sábado. El puntaje diario se muestra sin multiplicar.
- **Reintentos: no.** Un solo envío por día es lo que le da peso al resultado y a la tarjeta. Si se agregan reintentos, que sea como máximo 1, a −25 fijos, y sin mostrar qué caso falló hasta el envío final (si no, los 12 casos funcionan como oráculo).
- **Casos TLE.** Con el presupuesto de pasos, sumar un caso 13 "grande" (por ejemplo n = 10⁵ en el histograma) hace que el subóptimo falle por TLE en vez de perder 10 puntos. Lo dejo **apagado** por defecto, porque convierte la eficiencia en corrección, y eso es una decisión de producto. Recomiendo activarlo solo en hard mode.
- **Desempate**: puntaje, luego tiempo, luego modo difícil. Ya está casi así en las queries del ranking.

## Banco de reserva (próximas semanas)

Técnicas que pidieron y quedaron afuera de estas dos semanas, con la trampa principal ya identificada (sin verificar todavía):

- **Trie** — Word Search II (212): podar el nodo después de encontrar una palabra vs devolver duplicados.
- **Bits** — Single Number II (137): contar bits módulo 3 vs XOR (pasa si el único aparece una vez y los demás dos veces).
- **0-1 BFS** — Minimum Obstacle Removal (2290): deque con `appendleft` para peso 0 vs BFS común.
- **Quickselect vs heap** — Kth Largest (215): `k` vs `n−k` en Lomuto, deduplicar con Set.
- **Two pointers + sort** — 3Sum (15): saltear duplicados del primer índice vs de los tres.
- **Intervalos** — Non-overlapping Intervals (435): ordenar por fin vs por inicio.
