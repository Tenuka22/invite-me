import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";
import { clientIdForUser } from "./invites/host";

export const o = os.$context<Context>();

export const publicProcedure = o;

/** Requires a logged-in user and resolves them to their client id. Every host-owned route goes through this. */
const requireHost = o.middleware(async ({ context, next }) => {
  if (!context.userId) {
    throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
  }
  const clientId = await clientIdForUser(context.db, context.userId);
  return next({ context: { clientId } });
});

export const hostProcedure = publicProcedure.use(requireHost);
