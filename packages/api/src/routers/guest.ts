import { ORPCError } from "@orpc/server";
import { z } from "zod";

import type { Context } from "../context";
import { publicProcedure } from "../base";
import { allowRequest } from "../invites/rate-limit";
import { openGuest, respondGuest, resolveGuest } from "../invites/store";
import { guard } from "./errors";

/** Link parts from `/i/<clientId>/<partyId>.<secret>`. */
const linkInput = z.object({
  clientId: z.string().min(1),
  partyId: z.string().min(1),
  secret: z.string().min(1),
});

const rsvpInput = linkInput.extend({
  status: z.enum(["yes", "maybe", "no"]),
  headCount: z.number().int().optional(),
});

/**
 * Per-IP fixed-window limits on link resolve and RSVP (spec 12). A venue's shared Wi-Fi can
 * exceed these for a burst; the limit is sized so ordinary use stays under it.
 */
const WINDOW_MS = 60_000;
const RESOLVE_PER_WINDOW = 240;
const RSVP_PER_WINDOW = 60;

async function throttle(context: Context, action: string, limit: number): Promise<void> {
  if (await allowRequest(context.db, `${action}:${context.clientIp}`, limit, WINDOW_MS)) return;
  throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many requests. Try again in a minute." });
}

export const guestRouter = {
  resolve: publicProcedure.input(linkInput).handler(async ({ context, input }) => {
    await throttle(context, "resolve", RESOLVE_PER_WINDOW);
    return resolveGuest(context.db, context.inviteLinkKey, input.clientId, input.partyId, input.secret);
  }),
  recordOpen: publicProcedure.input(linkInput).handler(({ context, input }) =>
    openGuest(context.db, context.inviteLinkKey, input.clientId, input.partyId, input.secret),
  ),
  rsvp: publicProcedure.input(rsvpInput).handler(async ({ context, input }) => {
    await throttle(context, "rsvp", RSVP_PER_WINDOW);
    return guard(() =>
      respondGuest(
        context.db,
        context.inviteLinkKey,
        input.clientId,
        input.partyId,
        input.secret,
        input.status,
        input.headCount,
      ),
    );
  }),
};
