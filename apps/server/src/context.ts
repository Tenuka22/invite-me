import type { Context as ApiContext } from "@invite-me/api/context";
import type { Context as HonoContext } from "hono";
import { ENV } from "./env.server";
import { getDb } from "./services";
import { createAuth } from "./services";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const session = await (
    await createAuth(db)
  ).api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
    inviteLinkKey: ENV.INVITE_LINK_KEY,
    clientIp: context.req.header("cf-connecting-ip") ?? "local",
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
