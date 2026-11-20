import { ORPCError } from "@orpc/server";

import { leaderboard } from "../invites/leaderboard";
import { publicProcedure } from "../base";

/** Who the leaderboard ranks: invitations where the caller is owner or admin, couples first by engagement. */
export const leaderboardRouter = {
  get: publicProcedure.handler(async ({ context }) => {
    if (!context.userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
    return leaderboard(context.db, context.inviteLinkKey, context.userId);
  }),
};
