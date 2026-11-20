import { z } from "zod";

import {
  createPartyFor,
  deletePartyFor,
  getParty,
  listParties,
  markPartyShared,
  revokeParty,
  updatePartyFor,
} from "../invites/store";
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

const partyUpdate = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1).max(80),
  seatLabel: z.string().trim().max(60).nullable(),
  rules: z.string().trim().max(400).nullable(),
});

export const partiesRouter = {
  list: hostProcedure.input(z.object({ eventId: z.string().min(1) })).handler(({ context, input }) =>
    guard(() => listParties(context.db, context.inviteLinkKey, context.clientId, input.eventId)),
  ),
  get: hostProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => getParty(context.db, context.inviteLinkKey, context.clientId, input.id)),
  ),
  update: hostProcedure.input(partyUpdate).handler(({ context, input }) =>
    guard(() => updatePartyFor(context.db, context.inviteLinkKey, context.clientId, input)),
  ),
  delete: hostProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => deletePartyFor(context.db, context.clientId, input.id)),
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
