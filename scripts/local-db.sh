#!/usr/bin/env bash
# Local DB stack: Homebrew Postgres (data dir outside the repo) + scripts/neon-http-shim.mjs,
# a local SQL-over-HTTP endpoint, so the app keeps using @neondatabase/serverless exactly
# like prod. Never reads or touches .env.local.
#
#   scripts/local-db.sh up       start Postgres + shim, create DBs, run setup-db.mjs on both
#   scripts/local-db.sh down     stop both (data dir is kept)
#   scripts/local-db.sh reset    down + wipe data dir + up
#   scripts/local-db.sh env      print the env overrides (eval "$(scripts/local-db.sh env)")
#   scripts/local-db.sh exec -- <cmd>        run <cmd> against the local dev DB (e.g. pnpm start)
#   scripts/local-db.sh exec-test -- <cmd>   same, pointed at the throwaway test DB
#
# Env knobs: DAILYLEET_PGDATA (data dir), DAILYLEET_PGPORT (54329), DAILYLEET_SHIM_PORT (54444),
#            DAILYLEET_DB (dailyleet), PG_BIN (/opt/homebrew/bin).
#
# Why not Neon's open-source proxy in Docker: it re-authenticates every query over fresh
# connections, ships Neon's per-endpoint rate limits, and through Docker Desktop's port
# forwarder some requests stalled for seconds at >~50 concurrent sockets. Fine for a smoke
# test, useless for load tests and flaky for concurrency tests.
set -euo pipefail

PG_BIN=${PG_BIN:-/opt/homebrew/bin}
PGDATA=${DAILYLEET_PGDATA:-${TMPDIR:-/tmp}/dailyleet-pgdata}
PGPORT=${DAILYLEET_PGPORT:-54329}
SHIM_PORT=${DAILYLEET_SHIM_PORT:-54444}
DB=${DAILYLEET_DB:-dailyleet}
TEST_DB=${DB}_test
ROOT=$(cd "$(dirname "$0")/.." && pwd)
# macOS postmaster aborts ("became multithreaded during startup") without a valid LC_ALL.
export LC_ALL=C

local_env() {
  echo "DATABASE_URL=postgres://postgres@localhost:${PGPORT}/$1"
  echo "DAILYLEET_LOCAL_NEON_ENDPOINT=http://127.0.0.1:${SHIM_PORT}/sql"
}

start_postgres() {
  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    mkdir -p "$PGDATA"
    # Loopback-only trust: throwaway local data, and nothing listens beyond localhost.
    "$PG_BIN/initdb" -D "$PGDATA" -U postgres --auth=trust --locale=C -E UTF8 >/dev/null
    {
      echo "port = $PGPORT"
      echo "listen_addresses = 'localhost'"
      echo "max_connections = 300"
      echo "shared_buffers = 256MB"
    } >>"$PGDATA/postgresql.conf"
  fi
  if ! "$PG_BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
    "$PG_BIN/pg_ctl" -D "$PGDATA" -l "$PGDATA/server.log" -w start >/dev/null
  fi
  for db in "$DB" "$TEST_DB"; do
    "$PG_BIN/psql" -h localhost -p "$PGPORT" -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 \
      || "$PG_BIN/createdb" -h localhost -p "$PGPORT" -U postgres "$db"
  done
}

start_shim() {
  stop_shim
  SHIM_PG="postgres://postgres@127.0.0.1:${PGPORT}" SHIM_PORT="$SHIM_PORT" SHIM_WARM="$DB,$TEST_DB" \
    nohup node "$ROOT/scripts/neon-http-shim.mjs" </dev/null >"$PGDATA/shim.log" 2>&1 &
  echo $! >"$PGDATA/shim.pid"
  for _ in $(seq 1 120); do
    if curl -s -o /dev/null -X POST "http://127.0.0.1:${SHIM_PORT}/sql" -d '{}'; then return 0; fi
    sleep 0.25
  done
  echo "shim did not come up on :$SHIM_PORT" >&2; cat "$PGDATA/shim.log" >&2; exit 1
}

stop_shim() {
  if [ -f "$PGDATA/shim.pid" ]; then kill "$(cat "$PGDATA/shim.pid")" 2>/dev/null || true; rm -f "$PGDATA/shim.pid"; fi
}

up() {
  start_postgres
  start_shim
  (cd "$ROOT" && env $(local_env "$DB") node scripts/setup-db.mjs)
  (cd "$ROOT" && env $(local_env "$TEST_DB") node scripts/setup-db.mjs)
  echo "Local DB up: postgres localhost:$PGPORT (data $PGDATA), shim 127.0.0.1:$SHIM_PORT, DBs $DB / $TEST_DB"
}

down() {
  stop_shim
  if [ -f "$PGDATA/PG_VERSION" ] && "$PG_BIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then "$PG_BIN/pg_ctl" -D "$PGDATA" -m fast -w stop >/dev/null; fi
  echo "Local DB down (data kept in $PGDATA)."
}

# Node 20's fetch sporadically stalled request bodies against the shim (25s); 22 didn't.
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then echo "warning: use Node >= 22 (Vercel's runtime); Node 20 fetch stalls sporadically here" >&2; fi

case "${1:-}" in
  up) up ;;
  down) down ;;
  reset) down; rm -rf "$PGDATA"; up ;;
  env) local_env "$DB" | sed 's/^/export /' ;;
  exec)
    shift; [ "${1:-}" = "--" ] && shift
    eval "$(local_env "$DB" | sed 's/^/export /')"
    exec "$@" ;;
  exec-test)
    shift; [ "${1:-}" = "--" ] && shift
    eval "$(local_env "$TEST_DB" | sed 's/^/export /')"
    exec "$@" ;;
  *) echo "usage: $0 up|down|reset|env|exec|exec-test -- <cmd>" >&2; exit 2 ;;
esac
