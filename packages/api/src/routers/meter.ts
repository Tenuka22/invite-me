import { z } from "zod";

import { computeMeter } from "../invites/meter";
import { listParties } from "../invites/store";
import { hostProcedure } from "../index";
import { guard } from "./errors";

export const meterRouter = {
  get: hostProcedure.input(z.object({ eventId: z.string().min(1) })).handler(({ context, input }) =>
    guard(() =>
      listParties(context.db, context.inviteLinkKey, context.clientId, input.eventId).then(
        computeMeter,
      ),
    ),
  ),
};
