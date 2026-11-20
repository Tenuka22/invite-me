import type { RouterClient } from "@orpc/server";

import { guestRouter } from "./routers/guest";
import { invitationsRouter } from "./routers/invitations";
import { leaderboardRouter } from "./routers/leaderboard";
import { meterRouter } from "./routers/meter";
import { partiesRouter } from "./routers/parties";
import { profileRouter } from "./routers/profile";

export { o, publicProcedure } from "./base";
import { publicProcedure } from "./base";

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
export type AppRouterClient = RouterClient<typeof appRouter>;
