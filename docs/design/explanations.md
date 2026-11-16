# Explicaciones post-partida

Objetivo: que después de enviar, el jugador entienda **por qué** su programa funciona o falla, qué gana la solución óptima y cómo reconocer esta clase de problemas la próxima vez. Se lee en el celular en 60 segundos: primero el resumen y el detalle a un toque.

Código: contenido y lógica en `src/lib/explanations.ts`, UI en `src/app/explanation.tsx` (montada desde `src/app/execution.tsx`) y verificación contra el engine en `tests/explanations.test.ts`.

## Estructura (en orden de lectura)

| # | Sección | Visible sin tocar | Detalle expandible | Fuente |
|---|---------|-------------------|--------------------|--------|
| 0 | **Veredicto** | Badge (óptima / más lenta / incorrecta) + titular con complejidad o cantidad de fallas | — | `explainResult` |
| 1 | **La idea clave** | Invariante en 1–2 oraciones | «Por qué funciona» | `keyIdea` |
| 2 | **Tu solución** (abierta) | Complejidad de *tu* combinación | Cada decisión activa con veredicto y por qué; decisiones que no se usaron; caso más chico que falla con entrada, esperado y resultado; la decisión culpable y su traza | `explainResult` |
| 3 | **Por qué cada decisión** | Teaser | Por paso activo: las 4 opciones con veredicto, costo o «se rompe con X»; la elección del jugador marcada | `steps`, `cost` |
| 4 | **Trade-offs reales** | Teaser | 3 situaciones en las que la opción «peor» es la correcta en producción | `tradeOffs` |
| 5 | **Cómo pensar este tipo de problemas** | La heurística «si ves X, pensá en Y» | Por qué, problemas para practicar y recurso original | `pattern`, `related` |
| 6 | **Pregunta de entrevista** | La pregunta | Respuesta oculta | `interview` |

## Reglas de contenido

- **Veredictos relativos al óptimo.** Cada opción se juzga cambiando *solo esa decisión* en la combinación `optimal`. Esto da afirmaciones verificables. Si una opción «incorrecta» funciona con otro enfoque (por ejemplo, la regla «Solo terminar vacío» con «Eliminar parejas»), el `why` lo aclara y la sección «Tu solución» la muestra como «válida con tu enfoque», no como error.
- **Tres veredictos:** `óptima` (pasa 12/12 y el engine la marca `efficient`), `correcta pero más lenta` (pasa 12/12, no `efficient`) e `incorrecta` (falla al menos un caso).
- **Toda opción incorrecta lleva contraejemplo.** El tipo lo exige. El contraejemplo **es el caso oculto más chico que falla** con esa sustitución, con una traza breve en texto. Así, si el jugador se equivocó en una sola decisión, la traza coincide exactamente con su caso fallido.
- **La complejidad sale de una función.** Usamos `cost(choices) → { time, space }`. Una sola fuente alimenta el titular, «Tu solución» y cada opción. Se declara la notación (`n`, `k`).
- **Decisiones inactivas** (`activeSteps`): no se explican opciones que no se ejecutaron. Se muestra una línea del tipo «Con «X», el programa no usa la decisión de Memoria…».
- **Tono:** rioplatense, frases cortas y una idea por oración. `why` ≤ 2 oraciones; traza ≤ 3.

## Cómo se arma «Tu solución» (`explainResult(kind, choices, evaluation)`)

Es una función pura y no importa el engine, así que los casos ocultos no llegan al bundle del cliente. Usa solo `evaluation.tests`, que el cliente ya recibe después de enviar.

1. Estado: `incorrecta` si `passed < total`; si no, `óptima` o `más lenta` según `efficient`.
2. Por cada paso activo: el título de la opción elegida, su veredicto y su `why`.
3. Caso fallido: el de menor tamaño (`input.length + other.length`); ante un empate, el primero.
4. Culpable: la primera decisión activa (enfoque → memoria → regla) cuyo veredicto es `incorrecta`. El test garantiza que toda combinación que falla tiene al menos una.
5. Traza: la del contraejemplo del culpable, con `sameCase` indicando si es el mismo caso que falló.

Devuelve `null` si no hubo tests (envío vencido o partida vieja). En ese caso, la UI muestra el bloque anterior (feedback + `lesson` + recurso).

## Agregar un desafío nuevo

Los desafíos nuevos viven en `src/lib/challenges/<kind>/explanation.ts`; el proceso completo está en `adding-a-challenge.md`. Para un kind nuevo:

1. Registrá el módulo (`src/lib/challenges/registry.ts`). `explanations` incorpora `explanation` de cada módulo automáticamente.
2. Corré `evaluate(kind, [a, m, r], 0)` para las 64 combinaciones y anotá qué rompe qué. Para cada sustitución del óptimo, `smallestFailing(result.tests)` te da el contraejemplo.
3. Completá `optimal`, `notation`, `cost`, `keyIdea`, los 3×4 `steps` (con `broken(why, input, trace, { target | other })` para las incorrectas), `tradeOffs`, `pattern`, `related` e `interview`.
4. Si el óptimo no es O(n), declará `optimalTime` (regex sobre `cost().time`).
5. `pnpm test`: los tests recorren todos los kinds automáticamente y verifican veredictos, contraejemplos (deben ser el caso fallido más chico, verificado con `checkCase` del engine), consistencia entre la complejidad declarada y `efficient`, y `explainResult` sobre las 64 combinaciones.

Plantilla mínima por opción:

```ts
{ verdict: "óptima", why: "Qué hace y por qué gana, en una oración." },
{ verdict: "correcta pero más lenta", why: "Por qué es correcta y dónde paga el costo." },
broken("Qué invariante rompe.", input, "Traza en 2–3 oraciones que termina en «Devuelve X; esperado Y».", { target }),
```

## Checklist de calidad por desafío

- [ ] La idea clave nombra el **invariante**, no el algoritmo.
- [ ] Cada trade-off describe una situación real (tamaño del input, streaming, inmutabilidad, Unicode, caché o escrituras).
- [ ] La heurística sirve para reconocer el patrón en un problema que nunca viste.
- [ ] La pregunta de entrevista extiende el problema y, si se puede, reutiliza una opción «incorrecta» que en esa variante pasa a ser correcta (por ejemplo, días consecutivos en Stock II).
