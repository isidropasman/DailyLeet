import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;
export type Row = Record<string, unknown>;

// The driver's fetch has no deadline: a stalled DB would pin every in-flight invocation
// until the platform kills it. Failing fast lets callers degrade (see GET /api/game).
const QUERY_TIMEOUT_MS = 8_000;
// Local/E2E only: the HTTP driver can't speak to plain Postgres, so scripts/local-db.sh
// runs a local SQL-over-HTTP endpoint and this pins every query to it.
const localEndpoint = process.env.DAILYLEET_LOCAL_NEON_ENDPOINT;
if (localEndpoint) neonConfig.fetchEndpoint = localEndpoint;

neonConfig.fetchFunction = (url: string, init: RequestInit = {}) => {
  const timeout = AbortSignal.timeout(QUERY_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
};

let client: { url: string; sql: Sql } | null = null;

export function database(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (client?.url !== url) client = { url, sql: neon(url) };
  return client.sql;
}
