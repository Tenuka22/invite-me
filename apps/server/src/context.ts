import type { Context as ApiContext } from "@invite-me/api/context";
import type { Context as HonoContext } from "hono";

import { ENV } from "./env.server";
import { createAuth, getDb } from "./services";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const auth = await createAuth(db);
  const session = await auth.api.getSession({ headers: context.req.raw.headers });
  return {
    db,
    userId: session?.user.id ?? null,
    inviteLinkKey: ENV.INVITE_LINK_KEY,
    clientIp: context.req.header("cf-connecting-ip") ?? "local",
  };
}
