import { os } from "@orpc/server";

import type { Context } from "./context";
import { guestRouter } from "./routers/guest";
import { invitationsRouter } from "./routers/invitations";
import { leaderboardRouter } from "./routers/leaderboard";
import { meterRouter } from "./routers/meter";
import { partiesRouter } from "./routers/parties";
import { profileRouter } from "./routers/profile";

export const o = os.$context<Context>();

export const publicProcedure = o;

export const appRouter = {
  invitations: invitationsRouter,
  meter: meterRouter,
  invite: guestRouter,
  parties: partiesRouter,
  leaderboard: leaderboardRouter,
  profile: profileRouter,
  healthCheck: publicProcedure.handler(() => "OK"),
};
export type AppRouter = typeof appRouter;
