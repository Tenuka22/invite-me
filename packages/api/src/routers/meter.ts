import { z } from "zod";

import { computeMeter } from "../invites/meter";
import { ensureClient, listParties } from "../invites/store";
import { protectedProcedure } from "../base";
import { guard } from "./errors";

export const meterRouter = {
  get: protectedProcedure.input(z.object({ eventId: z.string().min(1) })).handler(({ context, input }) =>
    guard(async () => {
      const clientId = await ensureClient(context.db, context.userId);
      return computeMeter(await listParties(context.db, context.inviteLinkKey, clientId, input.eventId));
    }),
  ),
};
