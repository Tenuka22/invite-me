import { eq } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { event as eventTable, eventAdmin } from "@invite-me/db/schema/invites";

import { type Card, EMPTY_CARD, cardSchema } from "./card";
import { computeMeter, type Meter } from "./meter";
import { listParties } from "./store";

export type LeaderboardCouple = {
  eventId: string;
  coupleName: string;
  venue: string;
  city: string;
  /** Seats with a "yes" RSVP. */
  confirmedSeats: number;
  /** Parties with "maybe". */
  maybe: number;
  /** Parties with "no". */
  no: number;
  /** Seats of parties that opened the invitation. */
  opens: number;
  /** All seats allotted across the invitation's parties. */
  invitedSeats: number;
  /** Parties not yet shared. */
  notShared: number;
  score: number;
};

/** Documented metric: rank couples by confirmed seats, then opens, maybe replies and share state. */
export function leaderboardScore(m: Pick<Meter, "confirmedSeats" | "maybe" | "openedSeats" | "no" | "notShared">): number {
  return m.confirmedSeats * 2 + m.maybe * 1.5 + m.openedSeats * 0.5 - m.no + m.notShared;
}

/** Invitations visible to the caller (owner or admin), couples ranked best first. */
export async function leaderboard(
  db: Database,
  key: string,
  userId: string,
): Promise<LeaderboardCouple[]> {
  const rows = await db
    .select({ event: eventTable })
    .from(eventAdmin)
    .innerJoin(eventTable, eq(eventTable.id, eventAdmin.eventId))
    .where(eq(eventAdmin.userId, userId))
    .orderBy(eventTable.createdAt);
  const couples = await Promise.all(
    rows.map(async ({ event: row }): Promise<LeaderboardCouple> => {
      const parties = await listParties(db, key, row.id);
      const meter = computeMeter(parties);
      const card: Card = row.card ? cardSchema.parse(JSON.parse(row.card)) : EMPTY_CARD;
      return {
        eventId: row.id,
        coupleName: [card.name1, card.name2].map((name) => name.trim()).filter(Boolean).join(" & ") || "Untitled couple",
        venue: card.venueName.trim(),
        city: card.city.trim(),
        confirmedSeats: meter.confirmedSeats,
        maybe: meter.maybe,
        no: meter.no,
        opens: meter.openedSeats,
        invitedSeats: meter.allottedSeats,
        notShared: meter.notShared,
        score: leaderboardScore(meter),
      };
    }),
  );
  return couples.sort((a, b) => b.score - a.score || a.coupleName.localeCompare(b.coupleName));
}
