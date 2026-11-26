import type { RouterClient } from "@orpc/server";

import { invitationsRouter } from "./invitations";
import { guestRouter } from "./guest";
import { meterRouter } from "./meter";
import { partiesRouter } from "./parties";
import { protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
  invitations: invitationsRouter,
  meter: meterRouter,
  invite: guestRouter,
  parties: partiesRouter,
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
