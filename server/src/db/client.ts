import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { env } from "../env.ts";
import { schema } from "./schema.ts";

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  pool ??= new pg.Pool({ connectionString: env().DATABASE_URL, max: 10 });
  return pool;
}

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let database: Database | undefined;

export function db(): Database {
  database ??= drizzle(getPool(), { schema });
  return database;
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
  database = undefined;
}
