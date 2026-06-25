import { Pool, type QueryResultRow } from "pg";

// One shared connection pool for the whole app (Next.js can call this
// from many route handlers — we don't want a new pool every time).
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (!global._pgPool) {
  global._pgPool = pool;
}

// Tiny helper so route handlers can just do:
//   const { rows } = await query("SELECT * FROM businesses WHERE id = $1", [id]);
export async function query<T extends QueryResultRow = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}
