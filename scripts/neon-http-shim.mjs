// Local stand-in for Neon's SQL-over-HTTP endpoint, so @neondatabase/serverless (prod's
// driver, unchanged) can run against a plain local Postgres. Implements only what the
// driver's `neon()` HTTP mode sends: single queries and non-interactive transactions,
// array mode + raw text output. Local dev/test only; never deployed.
//
//   SHIM_PG=postgres://postgres@127.0.0.1:54329 SHIM_PORT=54444 SHIM_WARM=dailyleet,dailyleet_test node scripts/neon-http-shim.mjs
//
// The database comes from the request's Neon-Connection-String, so one shim serves both
// the dev and the test DB.
import { createServer } from 'node:http';
import pg from 'pg';

const base = new URL(process.env.SHIM_PG ?? 'postgres://postgres@127.0.0.1:54329');
const port = Number(process.env.SHIM_PORT ?? 54444);
const rawText = { getTypeParser: () => value => value };
const pools = new Map();

function poolFor(connectionString) {
  const database = new URL(connectionString).pathname.slice(1);
  if (!/^[a-z0-9_]+$/.test(database)) throw Object.assign(new Error(`invalid database "${database}"`), { status: 400 });
  let pool = pools.get(database);
  if (!pool) {
    const url = new URL(base);
    url.pathname = `/${database}`;
    // Plays the role of Neon's PgBouncer: many HTTP callers, few backend connections.
    // idleTimeoutMillis 0: never drop idle backends. Reconnect bursts overflow macOS's
    // listen backlog (kern.ipc.somaxconn=128) and dropped SYNs retry for ~25s.
    pool = new pg.Pool({ connectionString: url.toString(), max: Number(process.env.SHIM_POOL ?? 40), idleTimeoutMillis: 0 });
    pools.set(database, pool);
  }
  return pool;
}

async function run(client, { query, params = [] }) {
  const result = await client.query({ text: query, values: params, rowMode: 'array', types: rawText });
  return {
    command: result.command,
    rowCount: result.rowCount,
    rows: result.rows,
    fields: result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID, tableID: f.tableID, columnID: f.columnID, dataTypeSize: f.dataTypeSize, dataTypeModifier: f.dataTypeModifier, format: f.format })),
    rowAsArray: true,
  };
}

async function handle(headers, body) {
  const pool = poolFor(headers['neon-connection-string'] ?? '');
  const client = await pool.connect();
  try {
    if (!Array.isArray(body.queries)) return await run(client, body);
    const mode = [headers['neon-batch-isolation-level'] && `ISOLATION LEVEL ${headers['neon-batch-isolation-level'].replace(/[^A-Za-z ]/g, '')}`,
      headers['neon-batch-read-only'] === 'true' && 'READ ONLY', headers['neon-batch-deferrable'] === 'true' && 'DEFERRABLE'].filter(Boolean).join(' ');
    await client.query(`BEGIN ${mode}`);
    try {
      const results = [];
      for (const query of body.queries) results.push(await run(client, query));
      await client.query('COMMIT');
      return { results };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    }
  } finally {
    client.release();
  }
}

const server = createServer((request, response) => {
  if (request.method !== 'POST') { response.writeHead(405).end(); return; }
  const chunks = [];
  request.on('data', chunk => chunks.push(chunk));
  const received = performance.now();
  request.on('end', async () => {
    const started = performance.now();
    response.on('finish', () => {
      const total = performance.now() - received;
      if (total > 1000) process.stdout.write(`slow request: ${total.toFixed(0)}ms (body ${(started - received).toFixed(0)}ms, handled ${(handled - started).toFixed(0)}ms) pool=${[...pools.values()].map(p => `${p.totalCount}/${p.idleCount}/${p.waitingCount}`)} ${query.slice(0, 80).replace(/\s+/g, ' ')}\n`);
    });
    let handled = started;
    let query = '';
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      query = body.query ?? body.queries?.map(q => q.query).join(' ; ') ?? '';
      const payload = await handle(request.headers, body);
      handled = performance.now();
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
    } catch (error) {
      const { message, code, detail, hint, position, severity, where, table, column, schema, dataType, constraint, routine } = error;
      response.writeHead(error.status ?? 400, { 'content-type': 'application/json' })
        .end(JSON.stringify({ message, code, detail, hint, position, severity, where, table, column, schema, dataType, constraint, routine }));
    }
  });
});
// Outlive undici's idle keep-alive (4s) so the client always closes first; otherwise a
// request can land on a socket the server is closing and fail with "fetch failed".
server.keepAliveTimeout = 60_000;
server.headersTimeout = 61_000;
// Opening backends mid-load sometimes took ~25s on macOS loopback (dropped SYNs during a
// connect burst), so every pool is filled one connection at a time before serving.
async function warm(database) {
  const pool = poolFor(`postgres://x/${database}`);
  const clients = [];
  for (let i = 0; i < pool.options.max; i++) clients.push(await pool.connect());
  for (const client of clients) client.release();
}
for (const database of (process.env.SHIM_WARM ?? '').split(',').filter(Boolean)) await warm(database);
server.listen(port, '127.0.0.1', () => process.stdout.write(`neon-http-shim listening on 127.0.0.1:${port}\n`));
