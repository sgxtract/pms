import { connection } from "next/server";
import { sql } from "@/server/db";

export async function GET() {
  await connection();

  try {
    await sql`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
