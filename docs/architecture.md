# Arquitectura de backend: escala, rankings y retención

Estado al 2026-11-15. Para quien opera DailyLeet en Vercel + Neon. Runtime Node (default; Edge está deprecado en Vercel).

## 1. Modelo de tráfico (supuestos explícitos)

| Supuesto | Valor | Por qué |
|---|---|---|
| DAU | 1.000.000 | objetivo de dimensionamiento |
| Juegan el diario | 60% → 600k submits/día | juegos diarios tipo Wordle |
| Pico post-reset (00:00 UTC) | 10% del DAU en 15 min → ~110 jugadores/s | todos abren apenas cambia el desafío |
| Pico viral | otro 10% en 15 min, encima del anterior | un share grande |
| Requests por sesión | 3 × `GET /api/game` + `start` + `submit` + 2–4 lecturas de ranking | carga, refresh post-submit, modal ranking/grupo |
| Peak sostenido | ~110 × 8 ≈ 900 req/s; ráfagas ×2–3 → **2–3k req/s** en el minuto pico | |
| Escrituras pico | ~110 submits/s + ~110 starts/s + altas de guest | |
| Filas `attempts` del día | hasta ~600k; semana ~4M | |

Postgres (Neon) es el único estado. Cada query del driver HTTP de Neon es un round-trip HTTPS (~3–10 ms misma región).

## 2. Cuellos de botella encontrados (antes)

1. **Ranking diario y semanal agregados en cada GET**: `ORDER BY (result->>'score')::int` y `SUM(...) GROUP BY` sobre los 7 días, sin índices utilizables. Es O(filas del día/semana) por request de cada usuario logueado: con 100k filas son cientos de ms por query, con 1M son segundos. A 1–2k GET/s esto satura el compute de Neon y tira el sitio entero (es *la* caída esperable del día 1 viral).
2. **`memberships` sin índice por `player_id`**: "mis grupos" era seq scan en cada GET.
3. **Clerk Backend API en cada GET logueado** (`hasTestAccess` → `users.getUser`): rate limit de Clerk mucho antes que el de la DB, y como estaba dentro del `try`, un 429 de Clerk devolvía 503 y **no se podía jugar**.
4. **6–7 round-trips secuenciales por GET**.
5. **Sin timeout en el driver**: una DB lenta deja cada invocación colgada hasta que la plataforma la mata; con Fluid compute se acumulan.
6. **Todo o nada**: si fallaba el ranking, el GET entero era 503.
7. **Solo top-50**: el jugador #12.345 no tenía feedback de posición (retención).
8. Sin rate limiting; un `start` concurrente (doble click) podía, con el `INSERT … RETURNING` naïf, devolver vacío (lo detectaron los tests nuevos; ver §5).

## 3. Arquitectura actual (implementado)

```
Cliente ──GET /api/game────────────► Route Handler (Node)
   │        ├─ core (debe andar): identidad, intento del día, test attempt, grupos  ── Postgres (3 queries en paralelo)
   │        └─ extras (pueden fallar → leaderboard.available=false):
   │             ├─ top-50 global diario/semanal  ── unstable_cache (TTL 5s, tag) ── Postgres índice
   │             ├─ mi entrada fresca (merge sobre el cache)                     ── PK lookups
   │             ├─ rank exacto: histograma cacheado (15s) + COUNT acotado a mi bucket
   │             └─ racha (players.current/best_streak)
   ├──POST submit──► 1 sola sentencia: UPDATE attempts + upsert weekly_scores + update racha (atómico)
   │                   └─ si cambió el top-50 → revalidateTag(tag, "max")
   └──GET /api/leaderboard?period=daily|weekly  (público, sin cookies, Cache-Control s-maxage=5, swr=30) → CDN
```

### Datos
- `attempts.score`: columna **generada** (`(result->>'score')::int STORED`). No la escribe la app, así que nunca se desincroniza, ni siquiera con código viejo durante un deploy.
- `attempts_daily_board (day, score DESC, elapsed, player_id) WHERE score IS NOT NULL`: top-50 diario = index scan + LIMIT.
- `weekly_scores (week_start, player_id) → score, elapsed, days` + índice `(week_start, score DESC, elapsed, player_id)`: agregación incremental en el submit, en la **misma sentencia** que marca el intento (CTEs con escritura). Semana ISO lunes–domingo en UTC, igual que `weekRange`.
- `players.current_streak / best_streak / last_played_day`.
- `memberships_player (player_id)`.

### Submit idempotente y concurrente
`UPDATE … WHERE result IS NULL` dentro del mismo statement que mueve semanal y racha: un submit duplicado concurrente bloquea por el row lock, re-evalúa `result IS NULL` (READ COMMITTED), no matchea y no toca los agregados. Si perdió la carrera, re-lee en un statement nuevo (el snapshot del primero es anterior al commit ganador). Lo mismo para `start` concurrente.

### Ranking casi en tiempo real
- Top-50 global cacheado 5 s con `unstable_cache` + tags. Next 16 sin `cacheComponents` (el proyecto usa `force-dynamic`): `unstable_cache` es lo que persiste entre deploys; `"use cache"` requeriría migrar toda la app a Cache Components.
- El submit **solo** llama `revalidateTag(tag, "max")` si la nueva entrada entra al top-50. Revalidar en cada submit convertiría el pico de submits en un pico de cache misses.
- El que acaba de jugar siempre se ve: su entrada fresca se mergea sobre el board cacheado (`leadersFor`).
- Grupos: se leen en vivo (son chicos; joins por PK + índice).
- Staleness máxima para terceros: ~5 s (board) / ~15 s (totales del rank).

### Rank propio sin escanear el día
`rank = (jugadores en buckets mejores, del histograma cacheado) + (COUNT exacto dentro de mi bucket) + 1`.
- Diario: buckets por `(score, elapsed)` (pocos miles de filas máx.), el COUNT es sobre empates exactos `(score, elapsed)` → acotado.
- Semanal: buckets por `score`, COUNT `(elapsed, player_id) < (…)` dentro del score → range scan del índice.
- El histograma cuesta un index scan del día cada 15 s, no por request.

### Degradación
| Falla | Efecto |
|---|---|
| Query de ranking/racha falla o timeout | GET responde 200 con `leaders: []`, `leaderboard.available: false`; se puede jugar y enviar |
| Clerk API caída / rate limited | `canTest: false`; el juego sigue. Resultado cacheado 5 min (grant/revoke de testers demora ≤5 min) |
| Cache de Next falla en el submit | el submit ya commiteó; se ignora |
| DB lenta | cada query aborta a los 8 s (`fetchFunction` con `AbortSignal.timeout`) → 503 rápido en vez de colgar |
| DB caída | GET/POST core → 503 (no hay estado fuera de Postgres); `/api/leaderboard` cacheado en CDN sigue sirviendo stale hasta 30 s |
| Abuso de POST | limitador en memoria por instancia: 120/min por IP, 30/min por jugador → 429 + `Retry-After` |

### Rate limiting: qué es y qué no
El limitador en memoria (`src/lib/rate-limit.ts`) es best-effort **por instancia** (Fluid reutiliza instancias, así que frena a un cliente que martilla, pero no es global). No agregué Redis para esto a propósito. El límite global correcto sin código es una regla de **Vercel Firewall (rate limit por IP)** sobre `POST /api/game` y sobre `GET /api/game` sin cookie (cada GET sin cookie crea un `players`): configurarla en el dashboard. Ojo con NATs corporativos/universidades al fijar el umbral por IP.

## 4. Conexiones (serverless)
- Driver HTTP de Neon (`neon()`), una instancia por proceso. Sin conexiones TCP propias, así que no hay agotamiento de pool por invocaciones concurrentes.
- En Vercel usar la URL **pooled** (`-pooler`) en `DATABASE_URL`; la unpooled solo para migraciones largas si hiciera falta.
- Sin `sql.transaction` en el hot path: el submit es un único statement.

## 5. Migraciones
`node scripts/setup-db.mjs` (`pnpm db:setup`) es idempotente y aditivo: `IF NOT EXISTS`, columna generada, índices, y **reconstruye** `weekly_scores` y rachas desde `attempts` (fuente de verdad) bajo `LOCK TABLE attempts IN SHARE MODE` (bloquea submits, no lecturas, durante el rebuild: segundos con ~1M filas).

Rollout:
1. Correr `setup-db` contra prod (agrega columna generada → reescribe `attempts` con lock exclusivo; con la tabla chica de hoy es instantáneo, con millones de filas hacerlo en horario valle).
2. Deployar.
3. Volver a correr `setup-db`: reconcilia submits que atendió el deploy anterior (no actualizaba `weekly_scores` ni rachas).

Ojo: `CREATE INDEX` sin `CONCURRENTLY` bloquea escrituras mientras se construye. Hoy da igual; si `attempts` ya es grande, crear los índices a mano con `CONCURRENTLY` antes.

## 6. API: campos nuevos (todo aditivo)

`GET /api/game` agrega:
```ts
streak: { current: number; best: number; lastPlayedDay: string | null; playedToday: boolean } | null
rank: { daily: { rank: number; total: number } | null; weekly: { rank: number; total: number } | null }
leaderboard: { available: boolean; updatedAt: number | null }   // updatedAt = epoch ms del snapshot del board
```
- `streak.current` ya viene "envejecida": si el último día jugado no es hoy ni ayer (UTC), vale 0. `playedToday=false` con `current>0` = racha en riesgo.
- `rank` se calcula para todos (también guests) si ya enviaron hoy/esta semana; los boards (`leaders`, `weeklyLeaders`) siguen siendo solo para logueados, como antes.
- `rank` es global aunque se pida `?group=`.

`POST /api/game {action:"submit"}` agrega `streak` (misma forma). `GET /api/leaderboard?period=daily|weekly` es nuevo: `{ period, day, week, updatedAt, leaders: {name, score, elapsed}[] }`, cacheable en CDN. Recomendado para que la UI refresque el ranking sin pegarle a `/api/game`.

Cambio de comportamiento menor: el board diario ahora desempata por `player_id` después de `elapsed` (antes el orden entre empates exactos era indefinido).

## 7. Próximos pasos y umbrales

| Señal | Umbral | Acción |
|---|---|---|
| CPU de Neon en el pico | >60% sostenido | subir compute / autoscaling max; después read replica para histograma y boards |
| Histograma del día | >200 ms o >~2–3M intentos/día | **Redis sorted sets** (Upstash vía Vercel Marketplace): `ZADD` en el submit con score compuesto `score*1e6 + (300-elapsed)*…`, `ZREVRANK` exacto, `ZREVRANGE 0 49`. Postgres sigue siendo la fuente de verdad; el ZSET se reconstruye desde `attempts` |
| `GET /api/game` del pico | >~3k req/s | la UI pasa el polling a `/api/leaderboard` (CDN) y `/api/game` queda para estado propio |
| Escrituras | >~2k submits/s | sigue sin contención (una fila por jugador); recién ahí colas (Vercel Queues) para agregados |
| Abuso | cualquier 429 masivo | regla de Vercel Firewall |
| Grupos | >~5k miembros | tope de miembros o tratarlos como board cacheado |

Retención, siguiente: streak freeze (un "comodín" por semana: columna `freezes_available` y que `submit` acepte hueco de 1 día consumiendo uno), recordatorio push/email a quien tiene `playedToday=false && current>=3` antes del reset (cron), hitos de racha (7/30/100).

## 8. Stack local (tests, load test, E2E)

Requiere Homebrew Postgres (`/opt/homebrew/bin`) y **Node 22** (el runtime de Vercel). Nada toca `.env.local` ni la DB real.

```bash
pnpm db:local            # Postgres local (:54329) + shim SQL-over-HTTP (:54444), crea dailyleet y dailyleet_test, corre setup-db en ambas
pnpm test:db             # integración contra dailyleet_test (hace TRUNCATE; se niega si la URL no es local *_test)
bash scripts/local-db.sh exec -- pnpm start --port 3200   # app contra la DB local
bash scripts/local-db.sh exec -- pnpm test:e2e            # Playwright contra la DB local
pnpm loadtest -- --base http://localhost:3200 --players 1000 --concurrency 50 --reads 2
pnpm loadtest -- --seed 100000 && bash scripts/local-db.sh exec -- pnpm db:setup   # volumen + rebuild de derivados
pnpm db:local:down       # baja todo; los datos quedan en DAILYLEET_PGDATA (default $TMPDIR/dailyleet-pgdata)
```

- `exec` exporta `DATABASE_URL` local y `DAILYLEET_LOCAL_NEON_ENDPOINT`. Next y `process.loadEnvFile` (Playwright) **no pisan** variables ya definidas, así que ganan sobre `.env.local`.
- `src/lib/db.ts` solo cambia si `DAILYLEET_LOCAL_NEON_ENDPOINT` está seteada (`neonConfig.fetchEndpoint`); prod sigue con el driver de Neon tal cual.
- `scripts/neon-http-shim.mjs` implementa el subconjunto del protocolo HTTP de Neon que usa `neon()` (query simple + `transaction([...])`, array mode, texto crudo) sobre `pg` (devDependency nueva, solo local). Loguea requests de >1 s en `$DAILYLEET_PGDATA/shim.log`.

Por qué no el proxy oficial de Neon en Docker (`local-neon-http-proxy`), que fue lo primero que probé:
- re-autentica cada query (PBKDF2 + 2 conexiones nuevas al "control plane"): ~100 ms por query;
- trae los rate limits de Neon (300 auth/min por endpoint), que el test de concurrencia pasa enseguida;
- el port-forward de Docker Desktop dejó colgados requests varios segundos con >~50 sockets simultáneos (desde dentro de la red de Docker no pasaba). Inservible para load test y flaky para tests de concurrencia.

El shim abre todas las conexiones del pool al arrancar y nunca las cierra: abrir backends en medio de la carga a veces tardaba ~25 s en este Mac (por eso `up` puede tardar ~30 s).

Con Node 20 apareció además un cuelgue esporádico del cliente `fetch` (el shim recibía headers y el body 25 s después); con Node 22 no se reprodujo en 15 corridas seguidas. Vercel corre Node 22/24, así que no afecta prod, pero corré los tests locales con 22.

## 9. Load test local: resultados (2026-11-15)

Máquina: MacBook (Apple Silicon, compartida con otros procesos), Node 22, `next start`, Postgres 18 local + shim. DB con 100k jugadores sembrados, ~126k intentos del día y ~526k en total, 123k filas de `weekly_scores`. Mismo árbol base en ambos casos: "antes" = código original, "después" = el original + solo los archivos de este cambio. Flujo guest por jugador virtual: `GET → start → submit → GET`, con un `x-forwarded-for` distinto por jugador.

**Costo de las queries de ranking** (camino logueado, `EXPLAIN ANALYZE`, misma DB):

| Query | Antes | Después |
|---|---|---|
| Top-50 diario | 95 ms (seq scan paralelo de `attempts` + sort) | 0,47 ms (index-only scan, 50 filas) |
| Top-50 semanal | 477 ms (seq scan de 7 días + external merge sort a disco, ~110 MB) | 0,22 ms (index-only scan de `weekly_scores`) |
| Rank propio (por request) | no existía | 0,03–0,13 ms (COUNT dentro del bucket) |
| Histograma del rank (cada 15 s, cacheado) | no existía | 23 ms diario / 11 ms semanal |

Ese es el cambio que importa para no caerse: antes cada GET logueado costaba ~570 ms de CPU de DB (≈2 GET/s por core); después, ~1 ms + lecturas cacheadas.

**HTTP, camino guest** (latencias en ms; los guests no leían ranking antes, así que el "después" hace *más* trabajo: rank, racha y timeouts):

| Corrida | p50 | p95 | p99 | error % |
|---|---|---|---|---|
| antes, c=50, 1000 jugadores | 42 | 85 | (25 s)* | 1,3 (cuelgues, 0 respuestas de error) |
| antes, c=100, 1500 jugadores | 74 | 105 | (25 s)* | 0 |
| después, c=50, 1000 jugadores | 76 | 159 | (25 s)* | 0,7 |
| después, c=100, 1500 jugadores | 136 | 274 | (25 s)* | 1,0 |
| después + 2 lecturas `/api/leaderboard` por jugador, c=50 | 53 | 120 | 203 | 0,2 |
| después + 2 lecturas, c=100 | 116 | 379 | (25 s)* | 1,6 |

\* Las colas de p99/max están contaminadas por cuelgues de ~25 s del loopback de macOS en esta máquina (paquetes perdidos con retransmisión, más evidente al abrir conexiones), que pegan **igual en antes y después**: con exactamente el mismo cliente se vieron requests de hasta 922 s en "antes". El shim los registra en `shim.log` como queries de 25.140 ms sobre conexiones ya abiertas. La diferencia está en qué pasa con ellos: antes el request queda colgado indefinidamente; después la query aborta a los 8 s y el usuario recibe un 503 (o el GET responde sin ranking). Es decir, los "errores" de después son mayormente esos cuelgues convertidos en fallas rápidas.

Lectura honesta:
- El p50/p95 del guest sube (~+35 ms a c=50) porque ahora cada GET calcula rank y racha (2 queries más). Es el costo de la feature de retención; con el driver HTTP en la misma región de Neon son 1–2 round-trips de ~5 ms.
- `/api/leaderboard` sale del cache de Next a ~35–65 ms p50 local; en Vercel va a CDN (`s-maxage=5`) y no toca la función.
- Verificado a mano: `GET /api/game` con `weekly_scores` bloqueada (`LOCK … ACCESS EXCLUSIVE`) responde **200** en 8 s con `leaderboard.available=false` y la racha presente.
- No probado: Vercel (cold starts, Fluid, CDN, Data Cache distribuido, `revalidateTag` entre regiones), latencia real a Neon, camino logueado por HTTP (Clerk no se puede scriptear sin instancia real; por eso el costo logueado se midió a nivel query), y un pico real de 2–3k req/s (una laptop con Postgres local satura bastante antes).
