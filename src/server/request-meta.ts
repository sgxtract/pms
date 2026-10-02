import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";

export type RequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
};

export async function getRequestMeta(): Promise<RequestMeta> {
  const headerStore = await headers();

  const candidate =
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  return {
    ipAddress: candidate && isIP(candidate) ? candidate : null,
    userAgent: headerStore.get("user-agent")?.slice(0, 500) ?? null,
  };
}
