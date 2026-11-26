import { z } from "zod";

import { AGE_GROUPS } from "../invites/party";
import { createPartyFor, ensureClient, listParties, markPartyShared, revokeParty } from "../invites/store";
import { protectedProcedure } from "../index";
import { guard } from "./errors";

const partyInput = z.object({
  eventId: z.string().min(1),
  displayName: z.string().min(1),
  invitedAs: z.enum(["single", "couple", "group"]),
  ageGroup: z.enum(AGE_GROUPS).nullable().optional(),
  groupSize: z.number().int().optional(),
  seatLabel: z.string().nullable().optional(),
  rules: z.string().nullable().optional(),
  locale: z.enum(["en", "si"]),
});

const partyId = z.object({ id: z.string().min(1) });

export const partiesRouter = {
  list: protectedProcedure.input(z.object({ eventId: z.string().min(1) })).handler(({ context, input }) =>
    guard(async () => {
      const clientId = await ensureClient(context.db, context.session.user.id);
      return listParties(context.db, context.inviteLinkKey, clientId, input.eventId);
    }),
  ),
  create: protectedProcedure.input(partyInput).handler(({ context, input }) =>
    guard(async () => {
      const clientId = await ensureClient(context.db, context.session.user.id);
      return createPartyFor(context.db, context.inviteLinkKey, clientId, input);
    }),
  ),
  markShared: protectedProcedure.input(partyId).handler(({ context, input }) =>
    guard(async () => {
      const clientId = await ensureClient(context.db, context.session.user.id);
      return markPartyShared(context.db, context.inviteLinkKey, clientId, input.id);
    }),
  ),
  revoke: protectedProcedure.input(partyId).handler(({ context, input }) =>
    guard(async () => {
      const clientId = await ensureClient(context.db, context.session.user.id);
      return revokeParty(context.db, context.inviteLinkKey, clientId, input.id);
    }),
  ),
};
