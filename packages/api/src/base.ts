import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

// Leaf module: routers import this at module scope, so nothing here may import
// a router — otherwise the bundled worker can initialize routers before `o`
// is set (circular import: server → routers → index → routers → …).
export const o = os.$context<Context>();

export const publicProcedure = o;

const requireUser = o.middleware(async ({ context, next }) => {
  if (!context.userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
  return next({ context: { userId: context.userId } });
});

/** Procedures that need a signed-in host. `context.userId` is non-null inside. */
export const protectedProcedure = o.use(requireUser);
