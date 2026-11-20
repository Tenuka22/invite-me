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
import { requireAccess } from "../invites/access";
import { publicProcedure } from "../index";
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
  list: publicProcedure.input(z.object({ eventId: z.string().min(1) })).handler(({ context, input }) =>
    guard(async () => {
      await requireAccess(context.db, input.eventId, context.userId);
      return listParties(context.db, context.inviteLinkKey, input.eventId);
    }),
  ),
  get: publicProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => getParty(context.db, context.inviteLinkKey, context.userId, input.id)),
  ),
  update: publicProcedure.input(partyUpdate).handler(({ context, input }) =>
    guard(() => updatePartyFor(context.db, context.inviteLinkKey, context.userId, input)),
  ),
  delete: publicProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => deletePartyFor(context.db, context.userId, input.id)),
  ),
  create: publicProcedure.input(partyInput).handler(({ context, input }) =>
    guard(() => createPartyFor(context.db, context.inviteLinkKey, context.userId, input)),
  ),
  markShared: publicProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => markPartyShared(context.db, context.inviteLinkKey, context.userId, input.id)),
  ),
  revoke: publicProcedure.input(partyId).handler(({ context, input }) =>
    guard(() => revokeParty(context.db, context.inviteLinkKey, context.userId, input.id)),
  ),
};
