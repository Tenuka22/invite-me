import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { DEFAULT_CARD, PRESETS, cardSchema } from "../invites/card";
import { isGoogleMapsUrl, resolveMapsUrl } from "../invites/maps";
import {
  createInvitation,
  deleteInvitation,
  ensureClient,
  getInvitation,
  listInvitations,
  saveInvitation,
} from "../invites/store";
import { protectedProcedure } from "../index";
import { guard } from "./errors";

const invitationId = z.object({ id: z.string().min(1) });

export const invitationsRouter = {
  /** The designs a host can start from, with sample content for thumbnails. */
  templates: protectedProcedure.handler(() => PRESETS.map((preset) => ({ preset, card: { ...DEFAULT_CARD, preset } }))),
  list: protectedProcedure.handler(({ context }) =>
    guard(async () => listInvitations(context.db, await ensureClient(context.db, context.session.user.id))),
  ),
  get: protectedProcedure.input(invitationId).handler(({ context, input }) =>
    guard(async () => getInvitation(context.db, await ensureClient(context.db, context.session.user.id), input.id)),
  ),
  create: protectedProcedure.input(z.object({ preset: z.enum(PRESETS) })).handler(({ context, input }) =>
    guard(async () => createInvitation(context.db, await ensureClient(context.db, context.session.user.id), input.preset)),
  ),
  save: protectedProcedure.input(z.object({ id: z.string().min(1), card: cardSchema })).handler(({ context, input }) =>
    guard(async () =>
      saveInvitation(context.db, await ensureClient(context.db, context.session.user.id), input.id, input.card),
    ),
  ),
  remove: protectedProcedure.input(invitationId).handler(({ context, input }) =>
    guard(async () => deleteInvitation(context.db, await ensureClient(context.db, context.session.user.id), input.id)),
  ),
  /** Reads venue coordinates from a pasted Google Maps link, following short links server-side. */
  resolveMaps: protectedProcedure.input(z.object({ url: z.string().max(500) })).handler(async ({ input }) => {
    if (!isGoogleMapsUrl(input.url)) {
      throw new ORPCError("BAD_REQUEST", { message: "Paste a link from Google Maps (Share, then Copy link)." });
    }
    const geo = await resolveMapsUrl(input.url);
    if (!geo) {
      throw new ORPCError("BAD_REQUEST", {
        message: "That link has no location in it. In Google Maps, open the place, tap Share, then Copy link.",
      });
    }
    return geo;
  }),
};
