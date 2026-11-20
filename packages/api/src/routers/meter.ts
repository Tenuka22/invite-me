import { z } from "zod";

import { requireAccess } from "../invites/access";
import { computeMeter } from "../invites/meter";
import { listParties } from "../invites/store";
import { publicProcedure } from "../base";
import { guard } from "./errors";

export const meterRouter = {
  get: publicProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .handler(async ({ context, input }) =>
      guard(async () => {
        await requireAccess(context.db, input.eventId, context.userId);
        return listParties(context.db, context.inviteLinkKey, input.eventId).then(computeMeter);
      }),
    ),
};
