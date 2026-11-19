import { z } from "zod";

import { createPartyFor, listParties, markPartyShared, revokeParty } from "../invites/store";
import { hostProcedure } from "../index";
import { guard } from "./errors";

const partyInput = z.object({
  eventId: z.string().min(1),
  displayName: z.string().min(1),
  invitedAs: z.enum(["single", "couple", "group"]),
  groupSize: z.number().int().optional(),
  seatLabel: z.string().nullable().optional(),
  rules: z.string().nullable().optional(),
  locale: z.enum(["en", "si"]),
});

const partyId = z.object({ id: z.string().min(1) });

export const partiesRouter = {
  list: hostProcedure.handler(({ context }) =>
    guard(() => listParties(context.db, context.inviteLinkKey, context.clientId)),
  ),
  create: hostProcedure.input(partyInput).handler(({ context, input }) =>
    guard(() => createPartyFor(context.db, context.inviteLinkKey, context.clientId, input)),
  ),
  markShared: hostProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => markPartyShared(context.db, context.inviteLinkKey, context.clientId, input.id)),
  ),
  revoke: hostProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => revokeParty(context.db, context.inviteLinkKey, context.clientId, input.id)),
  ),
};
