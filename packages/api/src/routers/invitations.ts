import { z } from "zod";

import { hostProcedure, publicProcedure } from "../index";
import { cardSchema } from "../invites/card";
import {
  PRESET,
  TEMPLATES,
  createInvitation,
  getInvitation,
  listInvitations,
  saveCard,
} from "../invites/store";
import { guard } from "./errors";

const invitationId = z.object({ id: z.string().min(1) });

export const invitationsRouter = {
  templates: publicProcedure.handler(() => TEMPLATES),
  list: hostProcedure.handler(({ context }) => guard(() => listInvitations(context.db, context.clientId))),
  create: hostProcedure
    .input(z.object({ template: z.enum([PRESET]) }))
    .handler(({ context, input }) => guard(() => createInvitation(context.db, context.clientId, input.template))),
  get: hostProcedure.input(invitationId).handler(({ context, input }) =>
    guard(() => getInvitation(context.db, context.clientId, input.id)),
  ),
  saveCard: hostProcedure.input(invitationId.extend({ card: cardSchema })).handler(({ context, input }) =>
    guard(() => saveCard(context.db, context.clientId, input.id, input.card)),
  ),
};
