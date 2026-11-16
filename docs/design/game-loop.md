# DailyLeet — Loop diario y retención

Tesis: Wordle, Connections y Queens no retienen por el puzzle, sino por **tres cosas que se refuerzan entre sí**:

1. Un evento compartido y escaso: todos juegan el mismo puzzle, uno por día, y no se puede adelantar.
2. Un resultado que se puede mostrar sin spoilear, que convierte cada partida en adquisición.
3. Una identidad acumulada (racha, liga, "soy de los que lo sacan el domingo") que duele perder.

Para engineers top se suma una cuarta: **status técnico**. Sacar 100 el domingo tiene que significar algo, y eso exige un ranking íntegro y una dificultad creíble. Todo lo que sigue está al servicio de esas cuatro cosas.

## 1. El ritmo del día

- **Reset 00:00 UTC**, igual que el backend (`dailyChallenge` usa `toISOString().slice(0,10)`). En Argentina son las **21:00**. Es un buen horario: el desafío nuevo cae después del laburo, y el "ya jugué el de hoy" se comenta a la mañana siguiente. No lo movería a medianoche local: un único reset global es lo que permite que la tarjeta de share diga "#612" y todos hablen del mismo desafío.
- Consecuencia que hay que comunicar: el día de juego de un argentino va de 21:00 a 21:00. La UI tiene que mostrar siempre **"Nuevo desafío en 3:12:04"**, y el recordatorio de racha se manda en función del reset, no de la medianoche local.
- **Una partida ranked por día.** Ya es así (`attempts` por `player_id, day`). No agregar reintentos: la escasez es el producto.
- **Duración 5 minutos.** La mantendría. Con el catálogo v2, un experto resuelve un Medio en 60–90 s y un Brutal en 3–4 min. El reloj apura de verdad recién el fin de semana, que es lo buscado.

## 2. Curva semanal

| Lun | Mar | Mié | Jue | Vie | Sáb | Dom |
|---|---|---|---|---|---|---|
| Medio | Medio | Medio+ | Difícil | Difícil | Difícil+ | Brutal |

Por qué así:

- **El lunes reengancha.** El que se perdió el fin de semana vuelve a un desafío que puede sacar. Perder el lunes después de un domingo brutal es la principal causa de corte de racha que quiero evitar.
- **El domingo es el evento.** Hay más tiempo, se juega en grupo, y el puntaje pesa ×2 en la liga semanal (ver `challenges.md`). Es el desafío que se discute.
- **La dificultad se calibra con datos, no con la etiqueta de LeetCode.** Bandas objetivo de % de jugadores con 12/12: Lun 55–70 %, Mié 35–50 %, Vie 20–35 %, Dom 8–20 %. Si un domingo cae fuera de su banda dos semanas seguidas, el desafío se mueve de tier. Esto obliga a medir desde el día 1.
- **Hay que tocar el scheduler**: hoy rota con `% 6` desde el rollout, sin relación con el día de la semana (`src/lib/challenges.ts:66`).

## 3. Rachas

Reglas:

- **Racha = días UTC consecutivos con un envío ranked**, aunque el puntaje sea bajo. Si la racha exige 12/12, un domingo brutal la corta y la gente se va. Castigar perder es la mecánica más fuerte de churn en juegos diarios.
- **Racha perfecta** aparte (días consecutivos con 12/12): es el flex para los top. Se muestra en el perfil y en la tarjeta.
- **Freeze**: se gana 1 cada 7 días de racha, máximo 2 guardados, y se consume solo. No se compra: con plata, la racha pierde valor como señal.
- **Sin "reparar racha" desde el archivo.** Jugar un día pasado no puede contar, porque las soluciones ya circularon.
- **Hitos visibles**: 7, 30, 100 y 365 días, con un badge en la tarjeta de share. Que sean pocos y que importen.

## 4. Tarjeta de share (sin spoilers)

```
DailyLeet #612 · Dom · Brutal
🟩🟩🟩🟩🟩🟥🟩🟩🟩🟩🟩🟩  11/12
⏱ 2:41 · 🔥 9 · 🧠 difícil
dailyleet.app
```

- **La fila de 12 cuadrados son los casos**, en el orden fijo de la tabla, y es la que va por defecto. No revela la respuesta: los casos son ocultos y "falló el 6" no se puede usar para nada. Lo que sí transmite es lo que hace viral a Wordle: "casi" (11/12) es una historia.
- **No mostrar por paso** (Enfoque/Memoria/Regla) mientras el día esté vivo. Con 3 pasos de 4 opciones, "me equivoqué en Regla" reduce el espacio a buscar de 64 a 4. La fila por paso (🟩 óptima, 🟨 correcta pero subóptima, 🟥 trampa) se habilita **recién después del reset**, en la vista de archivo.
- **No mostrar el puntaje sobre 100** en la primera línea: 11/12 se entiende sin contexto. El puntaje va en el ranking.
- La tarjeta actual (`src/lib/share.ts`) muestra el título y el puntaje. El título está bien, porque no revela la técnica (por eso los títulos son "Correlativas" y no "Topological Sort").
- Un enlace a la tarjeta en OG image para LinkedIn y Slack, con el mismo grid. El público son engineers: LinkedIn es el canal donde un "100 el domingo" se postea.

## 5. Grupos y competencia

Ya existen grupos con código de invitación y ranking diario y semanal por grupo. Es lo más valioso que hay: el ranking global es para los top 50, **el de grupo es para todos los demás.** LinkedIn Games ganó exactamente así, con rankings por empresa y por escuela.

- **Grupos de equipo como caso principal.** El onboarding de un grupo tiene que estar pensado para "mi equipo de backend": nombre, link para Slack, ranking semanal.
- **Resumen semanal del grupo** (domingo, después del reset): campeón, mejor domingo, rachas. Una imagen compartible. Es la pieza que hace volver el lunes.
- **Integración con Slack (P1)**: un post diario en el canal a una hora configurable (por defecto 13:00 local): "Hoy: Correlativas (Difícil). 4 de 9 jugaron. Mejor: Juli, 97." Sin spoilers y con el link. Es el recordatorio más efectivo posible, porque llega por presión social y no por una notificación del sistema.
- **Ligas (P2)**: divisiones de 30 jugadores con nivel parecido; los 5 primeros suben y los 5 últimos bajan. La semana usa `weekRange` (lunes a domingo UTC). Solo vale la pena con más de 1–2k WAU; antes, divisiones vacías desmotivan.

## 6. Notificaciones

- **El email primero**, no web push. Los engineers no aceptan push de sitios web, y en iOS el push exige instalar una PWA.
- Hay que distinguir dos mensajes y no mandar más que esos:
  1. **"El de hoy es Difícil: Correlativas"**, a la hora que elija el jugador (por defecto 09:00 local). Es opt-in en el primer share o en el primer 12/12.
  2. **"Tu racha de 9 corre peligro"**, 2 h antes del reset, solo si hay racha ≥ 3 y no jugó.
- Nunca más de 1 por día. Frenar el recordatorio de racha si se ignoró 3 veces seguidas.

## 7. Anti-cheat

Hay que asumirlo: son 64 combos. La respuesta del día entra en un tweet ("pila de índices, `>`, `i − top`"), y eso no se puede evitar del todo. El objetivo es que **hacer trampa no sea gratis ni anónimo**, y que el ranking de grupo, que es el que importa, siga teniendo sentido.

**Hallazgos concretos en el código actual (arreglar antes del catálogo v2):**

- **Oráculo abierto.** `/api/simulate` con `practice: true` devuelve `evaluate()` completo para **cualquier** `kind`, incluido el de hoy (`src/app/api/simulate/route.ts:12-14`), y la UI de práctica lista todos los desafíos. Con 64 POST se obtiene la solución exacta antes del intento ranked. Arreglo: rechazar la evaluación en práctica del `kind` del día hasta que el jugador tenga un envío ranked hoy, o hasta el reset.
- **Guest como intento descartable.** Una ventana privada crea un guest nuevo (`src/lib/identity.ts:11`) con su propio intento, que muestra los 12 casos al enviar. Al loguearse gana el intento de la cuenta. Arreglo: el ranking global y el de grupo muestran solo cuentas autenticadas; los guests juegan, pero no rankean. No se puede cerrar del todo, pero cuesta 64 ventanas o razonar con 12 casos expuestos.

**Mitigaciones, en orden de costo/beneficio:**

1. **Opciones mezcladas por jugador y día** (`seed = hash(day, player_id)`). El cliente manda índices mostrados y el server los traduce a canónicos. Así "la B, la D, la A" no sirve. Costo bajo.
2. **Tarjeta sin detalle por paso hasta el reset** (sección 4).
3. **Ranking con señales, no con bloqueos.** Marcar 12/12 en menos de 25 s en Difícil+ y Brutal, y mostrar esos resultados con un indicador en el global (no en el de grupo). No banear automáticamente: los falsos positivos en jugadores top son carísimos.
4. **Hard mode sin `detail`**: reduce un poco el valor de una filtración, porque la gente comparte títulos y los títulos se vuelven ambiguos sin detalle. Es marginal como anti-cheat, pero es bueno para el juego.
5. **Paráfrasis de opciones** (2 o 3 redacciones por opción, elegidas por seed): ensucia las filtraciones textuales. Costo medio, porque hay que escribir 3×4×2 textos más por desafío. P2.
6. **Casos aleatorizados por día**: un generador con seed y familias de casos, incluyendo una familia "asesina" por trampa, verificado en CI con un script como `verify.py` (cada trampa rompe ≥ 1 caso y la referencia coincide). **No evita que se filtre el combo**, que es el ataque real. Sirve para cuando un desafío se repita en semanas futuras y para que nadie memorice los 12 casos. P2, solo cuando el catálogo empiece a rotar.

Lo que **no** haría: captcha, detección de pestañas, ni límites de tiempo mínimos. Castigan al jugador honesto y rápido, que es justamente el público.

## 8. Archivo y práctica

- **Archivo** con todos los días pasados, jugables en práctica: sin ranking ni racha, con el post-mortem completo. Gratis por ahora. Si algún día se monetiza, el archivo es el candidato natural (como el NYT Crossword), no el desafío del día.
- **Post-mortem después de enviar** (P1): la trampa del día explicada en 3 líneas, el caso que la delata y la **distribución de elecciones por opción** ("el 41 % eligió `>=`"). Es el equivalente a las estadísticas de Wordle: convierte perder en contenido y da tema para el Slack del equipo.
- **Práctica por técnica**, filtrando el archivo por tag (pila monótona, union-find…). Es más útil para preparar entrevistas, que es un motivo de uso legítimo y distinto del diario.
- Usar la distribución para **mantener el catálogo**: una opción con menos del 3 % de elecciones no es plausible y hay que reemplazarla. Una trampa con más del 60 % es la estrella del desafío y hay que mantenerla.

## 9. Onboarding (día 1)

Problema: el primer contacto puede ser un domingo Brutal, y un usuario que entra por un share de "11/12" se encuentra con un histograma con 6 trampas silenciosas. Se va.

- **Tutorial de 60 s con el catálogo viejo.** Two Sum y Valid Parentheses ya existen con todos sus templates: se reusan como tutorial guiado y no rankeado. Se explica el formato (3 decisiones, 12 casos ocultos, ejecutar el ejemplo) en una partida de verdad. Así el catálogo actual no se tira: pasa a ser el onboarding.
- **Expectativa explícita antes de empezar**: "Hoy es domingo: Brutal. El 14 % saca 12/12." Perder un brutal sabiendo que es brutal no frustra; perderlo creyendo que era el nivel normal sí.
- **Primer día con `detail` siempre visible**, aunque después se elija hard mode.
- **No pedir cuenta antes de jugar** (ya es así con guests). Se pide en el momento de mayor intención: al querer compartir, entrar a un grupo o guardar la racha. "Creá tu cuenta para no perder tu racha de 1" funciona a partir del día 2.
- Si el usuario llegó por el link de invitación a un grupo, el primer resultado aterriza en el ranking de ese grupo, no en el global.

## 10. Prioridades

D1 = vuelve al día siguiente; D7 = juega 7 días después. Los efectos son hipótesis direccionales para validar con datos, no proyecciones.

### P0 — antes de lanzar el catálogo v2

| # | Qué | Efecto esperado | Por qué primero |
|---|---|---|---|
| 1 | Cerrar el oráculo de `/api/simulate`, rankear solo cuentas autenticadas y mezclar opciones por jugador | D7 (indirecto): el ranking de grupo deja de poder falsearse | Con desafíos difíciles, la tentación de hacer trampa sube. Si el top del grupo hace trampa la primera semana, el ranking muere y con él el motivo para volver. |
| 2 | Presupuesto de ejecución (`tick()` con TLE) + scheduler por día de semana | Habilitante: sin esto no se puede lanzar el catálogo | Con el catálogo v2, un combo trampa puede colgar el `new Function` en el server. La curva semanal es la mitad del diseño. |
| 3 | Tarjeta de share con grid de 12 casos + countdown al reset | Adquisición (más installs por share) y D1 en los que llegan por share | El share es el único canal de crecimiento de un juego diario. Hoy la tarjeta es texto con el puntaje: no genera curiosidad. |
| 4 | Racha + freeze automático + hitos | D7, lo principal | Es la mecánica de retención más probada del género, y es barata (una columna y una query). |
| 5 | Tutorial con el catálogo viejo + expectativa de dificultad | D1, lo principal | Con el catálogo v2, el día 1 es la mayor fuente de fuga. El costo es mínimo porque los templates ya existen. |

### P1 — semanas 2 a 4

- **Scoring nuevo + hard mode + multiplicador semanal** (en `challenges.md`). Efecto: D7 y D30 en el segmento top, que es el que genera los shares más creíbles. Va después de P0 porque cambia los puntajes históricos y conviene hacerlo junto con el catálogo nuevo, no antes.
- **Post-mortem con distribución de elecciones.** Efecto: D1. Perder con una explicación clara y un "al 41 % le pasó lo mismo" hace volver mañana.
- **Resumen semanal del grupo + integración con Slack.** Efecto: D7 en equipos, el mayor multiplicador social posible.
- **Email con el desafío del día y aviso de racha en peligro.** Efecto: D7. Se activa con opt-in, después del primer share o del primer 12/12.
- **Archivo jugable.** Efecto: tiempo de sesión y retención de los que se enganchan fuerte; poco efecto en D1.

### P2 — con tracción (> 1–2k WAU)

- Ligas por divisiones.
- Casos aleatorizados con verificación en CI.
- Paráfrasis de opciones.
- "Elegí la complejidad" y "Predecí" como micro-pasos.
- Perfil con estadísticas por técnica ("caés en las trampas de igualdad").

## 11. Qué medir desde el día 1

- D1 y D7 por cohorte de **día de semana de llegada**. Hipótesis: los que llegan un domingo retienen peor. Si se confirma, el tutorial es P0 bien puesto.
- % de 12/12 por día contra la banda del tier (sección 2).
- Distribución de elecciones por opción y por paso.
- Tasa de share por resultado (12/12 vs 11/12 vs ≤ 8/12). Hipótesis: 11/12 se comparte más que 12/12 los fines de semana.
- Rachas cortadas y si se consumió un freeze.
- Tiempo hasta el primer envío, por tier.
