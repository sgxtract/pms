import "server-only";
import postgres from "postgres";
import { env } from "@/server/env";

declare global {
  var __pmsSql: postgres.Sql | undefined;
}

export const sql =
  globalThis.__pmsSql ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: postgres.camel,
  });

if (env.NODE_ENV !== "production") {
  globalThis.__pmsSql = sql;
}

export type Db = postgres.Sql;

// Runs `callback` inside one transaction. If it throws, everything is
// rolled back. Inside the callback, use `tx` for every query; the global
// `sql` would run on a different connection, outside the transaction.
//
// The cast works around a typing bug in postgres.js 3.4.8, where the
// transaction object isn't recognised as callable (porsager/postgres#1143).
// At runtime it behaves exactly like `sql`.
export async function transaction<T>(
  callback: (tx: Db) => Promise<T>,
): Promise<T> {
  const result = await sql.begin((tx) => callback(tx as unknown as Db));
  return result as T;
}

// Checks the error's fields rather than using `instanceof`, which fails
// when the library is loaded more than once (as the dev server may do).
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  if (typeof error !== "object" || error === null) return false;

  const { code, constraint_name: constraintName } = error as {
    code?: unknown;
    constraint_name?: unknown;
  };

  return code === "23505" && constraintName === constraint;
}
