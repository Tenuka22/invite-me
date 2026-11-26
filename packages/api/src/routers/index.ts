import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../base";
import { guestRouter } from "./guest";
import { invitationsRouter } from "./invitations";
import { meterRouter } from "./meter";
import { partiesRouter } from "./parties";

export { o, protectedProcedure, publicProcedure } from "../base";

export const appRouter = {
  invitations: invitationsRouter,
  meter: meterRouter,
  invite: guestRouter,
  parties: partiesRouter,
  healthCheck: publicProcedure.handler(() => "OK"),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
