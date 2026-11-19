import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { guestRouter } from "./guest";
import { invitationsRouter } from "./invitations";
import { meterRouter } from "./meter";
import { partiesRouter } from "./parties";

export const appRouter = {
  invitations: invitationsRouter,
  meter: meterRouter,
  invite: guestRouter,
  parties: partiesRouter,
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
