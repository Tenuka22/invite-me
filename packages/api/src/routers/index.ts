import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { guestRouter } from "./guest";
import { invitationsRouter } from "./invitations";
import { leaderboardRouter } from "./leaderboard";
import { meterRouter } from "./meter";
import { partiesRouter } from "./parties";
import { profileRouter } from "./profile";

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
