import { computeMeter } from "../invites/meter";
import { listParties } from "../invites/store";
import { hostProcedure } from "../index";

export const meterRouter = {
  get: hostProcedure.handler(async ({ context }) =>
    computeMeter(await listParties(context.db, context.inviteLinkKey, context.clientId)),
  ),
};
