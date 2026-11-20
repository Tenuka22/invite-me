import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "../index";
import { cardSchema } from "../invites/card";
import {
  PRESET,
  TEMPLATES,
  adminInviteLinks,
  createInvitation,
  getInvitation,
  grantAdmin,
  listInvitations,
  saveCard,
} from "../invites/store";
import { deriveAdminInviteSecret, timingSafeEqual } from "../invites/token";
import { guard } from "./errors";

const invitationId = z.object({ id: z.string().min(1) });

export const invitationsRouter = {
  templates: publicProcedure.handler(() => TEMPLATES),
  list: publicProcedure.handler(async ({ context }) => {
    const userId = context.userId;
    if (!userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
    return guard(() => listInvitations(context.db, userId));
  }),
  create: publicProcedure
    .input(z.object({ template: z.enum([PRESET]) }))
    .handler(async ({ context, input }) => {
      const userId = context.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
      return guard(() => createInvitation(context.db, input.template, userId));
    }),
  get: publicProcedure.input(invitationId).handler(({ context, input }) =>
    guard(() => getInvitation(context.db, context.userId, input.id)),
  ),
  saveCard: publicProcedure.input(invitationId.extend({ card: cardSchema })).handler(({ context, input }) =>
    guard(() => saveCard(context.db, context.userId, input.id, input.card)),
  ),
  adminLinks: publicProcedure.input(invitationId).handler(({ context, input }) =>
    guard(() => adminInviteLinks(context.db, context.inviteLinkKey, context.userId, input.id)),
  ),
  /** Public: takes admin for the signed-in user when the secret matches. */
  adminGrant: publicProcedure
    .input(z.object({ eventId: z.string().min(1), secret: z.string().min(1) }))
    .handler(async ({ context, input }) => {
      const expected = await deriveAdminInviteSecret(context.inviteLinkKey, input.eventId);
      if (!context.userId || !timingSafeEqual(expected, input.secret)) {
        throw new ORPCError("UNAUTHORIZED", { message: "Not an admin invite" });
      }
      await grantAdmin(context.db, input.eventId, context.userId);
      return { eventId: input.eventId };
    }),
};
