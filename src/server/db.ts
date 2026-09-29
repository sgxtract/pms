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
