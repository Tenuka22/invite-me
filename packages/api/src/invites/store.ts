import { and, eq } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { event, party as partyTable } from "@invite-me/db/schema/invites";

import { type Card, EMPTY_CARD, cardSchema } from "./card";
import {
  type CreatePartyInput,
  InviteError,
  type InvitedAs,
  type Party,
  type PartyStatus,
  type RsvpStatus,
  createParty,
  markShared,
  recordOpen,
  revoke,
  setRsvp,
  statusOf,
} from "./party";
import { deriveLinkSecret, randomToken, timingSafeEqual } from "./token";

type PartyRow = typeof partyTable.$inferSelect;
type EventRow = typeof event.$inferSelect;

/** Template ids. Stored on each invitation so later templates need no schema change. */
export const PRESET = "traditional-golden-caller";

export const TEMPLATES = [{ id: PRESET, name: "Traditional golden caller" }] as const;

export type InvitationView = {
  id: string;
  template: string;
  createdAt: number;
  card: Card;
};

export type PartyView = Party & {
  status: PartyStatus;
  /** Path the QR and share link point to. Rebuilt from the key on every read. */
  guestPath: string;
  createdAt: number;
  /** Invitation whose card the guest sees. */
  eventId: string | null;
};

/** Fields a guest may see. No link, no host bookkeeping. */
export type GuestParty = Pick<
  Party,
  | "displayName"
  | "invitedAs"
  | "seats"
  | "seatLabel"
  | "rules"
  | "locale"
  | "rsvp"
  | "confirmedSeats"
>;

/** `closed` covers wrong secret, unknown party, revoked, and no invitation alike, so nothing leaks. */
export type GuestResult = { state: "open"; party: GuestParty; card: Card } | { state: "closed" };

const CLOSED: GuestResult = { state: "closed" };

function toDomain(row: PartyRow): Party {
  return {
    id: row.id,
    displayName: row.displayName,
    invitedAs: row.invitedAs as InvitedAs,
    seats: row.seats,
    seatLabel: row.seatLabel,
    rules: row.rules,
    locale: row.locale,
    shared: row.shared,
    opens: row.opens,
    firstOpenedAt: row.firstOpenedAt?.getTime() ?? null,
    lastOpenedAt: row.lastOpenedAt?.getTime() ?? null,
    rsvp: row.rsvp as RsvpStatus,
    confirmedSeats: row.confirmedSeats,
    revoked: row.revoked,
  };
}

async function toView(key: string, clientId: string, row: PartyRow): Promise<PartyView> {
  const p = toDomain(row);
  const secret = await deriveLinkSecret(key, clientId, p.id);
  return {
    ...p,
    status: statusOf(p),
    guestPath: `/i/${clientId}/${p.id}.${secret}`,
    createdAt: row.createdAt.getTime(),
    eventId: row.eventId,
  };
}

function toGuest(p: Party): GuestParty {
  return {
    displayName: p.displayName,
    invitedAs: p.invitedAs,
    seats: p.seats,
    seatLabel: p.seatLabel,
    rules: p.rules,
    locale: p.locale,
    rsvp: p.rsvp,
    confirmedSeats: p.confirmedSeats,
  };
}

function toInvitation(row: EventRow): InvitationView {
  return {
    id: row.id,
    template: row.preset,
    createdAt: row.createdAt.getTime(),
    card: row.card ? cardSchema.parse(JSON.parse(row.card)) : EMPTY_CARD,
  };
}

export async function getParty(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
): Promise<PartyView> {
  return toView(key, clientId, await loadParty(db, clientId, partyId));
}

export async function updatePartyFor(
  db: Database,
  key: string,
  clientId: string,
  input: { id: string; displayName: string; seatLabel: string | null; rules: string | null },
): Promise<PartyView> {
  await loadParty(db, clientId, input.id);
  await db
    .update(partyTable)
    .set({ displayName: input.displayName, seatLabel: input.seatLabel, rules: input.rules })
    .where(and(eq(partyTable.id, input.id), eq(partyTable.clientId, clientId)));
  return toView(key, clientId, await loadParty(db, clientId, input.id));
}

export async function deletePartyFor(db: Database, clientId: string, partyId: string): Promise<void> {
  await loadParty(db, clientId, partyId);
  await db.delete(partyTable).where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)));
}

/** Owner-checked read. Every host write goes through here first. */
async function loadEvent(db: Database, clientId: string, eventId: string): Promise<EventRow> {
  const rows = await db
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.clientId, clientId)))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return rows[0];
}

async function loadParty(db: Database, clientId: string, partyId: string): Promise<PartyRow> {
  const rows = await db
    .select()
    .from(partyTable)
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Party not found");
  return rows[0];
}

export async function createInvitation(
  db: Database,
  clientId: string,
  template: string,
): Promise<InvitationView> {
  const id = randomToken();
  await db.insert(event).values({ id, clientId, eventType: "wedding", preset: template });
  return toInvitation(await loadEvent(db, clientId, id));
}

export async function listInvitations(db: Database, clientId: string): Promise<InvitationView[]> {
  const rows = await db
    .select()
    .from(event)
    .where(eq(event.clientId, clientId))
    .orderBy(event.createdAt);
  return rows.map(toInvitation);
}

export async function getInvitation(
  db: Database,
  clientId: string,
  eventId: string,
): Promise<InvitationView> {
  return toInvitation(await loadEvent(db, clientId, eventId));
}

/** Persists the card for one invitation. Returns the card as stored. */
export async function saveCard(
  db: Database,
  clientId: string,
  eventId: string,
  card: Card,
): Promise<Card> {
  await loadEvent(db, clientId, eventId);
  await db
    .update(event)
    .set({ card: JSON.stringify(card) })
    .where(and(eq(event.id, eventId), eq(event.clientId, clientId)));
  return card;
}

/** Guest-side read of an invitation's card. Only used after the party's link secret checks out. */
async function getCard(db: Database, eventId: string): Promise<Card> {
  const rows = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return toInvitation(rows[0]).card;
}

/** The invitation must belong to the caller; the party's guest card comes from it. */
export async function createPartyFor(
  db: Database,
  key: string,
  clientId: string,
  input: Omit<CreatePartyInput, "id"> & { eventId: string },
): Promise<PartyView> {
  const { eventId, ...partyInput } = input;
  await loadEvent(db, clientId, eventId);
  const domain = createParty({ ...partyInput, id: randomToken() });
  const row: typeof partyTable.$inferInsert = {
    id: domain.id,
    clientId,
    eventId,
    displayName: domain.displayName,
    invitedAs: domain.invitedAs,
    seats: domain.seats,
    seatLabel: domain.seatLabel,
    rules: domain.rules,
    locale: domain.locale,
  };
  await db.insert(partyTable).values(row);
  return toView(key, clientId, await loadParty(db, clientId, domain.id));
}

export async function listParties(
  db: Database,
  key: string,
  clientId: string,
  eventId: string,
): Promise<PartyView[]> {
  await loadEvent(db, clientId, eventId);
  const rows = await db
    .select()
    .from(partyTable)
    .where(and(eq(partyTable.clientId, clientId), eq(partyTable.eventId, eventId)))
    .orderBy(partyTable.createdAt);
  return Promise.all(rows.map((row) => toView(key, clientId, row)));
}

export async function markPartyShared(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
): Promise<PartyView> {
  const next = markShared(toDomain(await loadParty(db, clientId, partyId)));
  await db
    .update(partyTable)
    .set({ shared: next.shared })
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)));
  return toView(key, clientId, await loadParty(db, clientId, partyId));
}

export async function revokeParty(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
): Promise<PartyView> {
  const next = revoke(toDomain(await loadParty(db, clientId, partyId)));
  await db
    .update(partyTable)
    .set({ revoked: next.revoked })
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)));
  return toView(key, clientId, await loadParty(db, clientId, partyId));
}

/**
 * Guest-side authorization. Recomputes the link secret and compares in constant
 * time; returns the row only when the secret matches and it is not revoked.
 */
async function authorizeGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
): Promise<PartyRow | null> {
  const expected = await deriveLinkSecret(key, clientId, partyId);
  if (!timingSafeEqual(expected, secret)) return null;
  const rows = await db
    .select()
    .from(partyTable)
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)))
    .limit(1);
  if (!rows[0] || rows[0].revoked) return null;
  return rows[0];
}

async function persistGuestState(db: Database, clientId: string, next: Party): Promise<void> {
  await db
    .update(partyTable)
    .set({
      opens: next.opens,
      firstOpenedAt: next.firstOpenedAt === null ? null : new Date(next.firstOpenedAt),
      lastOpenedAt: next.lastOpenedAt === null ? null : new Date(next.lastOpenedAt),
      rsvp: next.rsvp,
      confirmedSeats: next.confirmedSeats,
    })
    .where(and(eq(partyTable.id, next.id), eq(partyTable.clientId, clientId)));
}

/** Parties created before invitations existed have no eventId and cannot be opened. */
async function openResult(
  db: Database,
  eventId: string | null,
  party: Party,
): Promise<GuestResult> {
  if (!eventId) return CLOSED;
  return { state: "open", party: toGuest(party), card: await getCard(db, eventId) };
}

export async function resolveGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
): Promise<GuestResult> {
  const row = await authorizeGuest(db, key, clientId, partyId, secret);
  return row ? openResult(db, row.eventId, toDomain(row)) : CLOSED;
}

/** Call after the guest's card has rendered. Counts one open. */
export async function openGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
  now: number = Date.now(),
): Promise<GuestResult> {
  const row = await authorizeGuest(db, key, clientId, partyId, secret);
  if (!row) return CLOSED;
  const next = recordOpen(toDomain(row), now);
  await persistGuestState(db, clientId, next);
  return openResult(db, row.eventId, next);
}

/** Throws InviteError for invalid head-counts; the router maps it to a client error. */
export async function respondGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
  status: Exclude<RsvpStatus, "pending">,
  headCount?: number,
): Promise<GuestResult> {
  const row = await authorizeGuest(db, key, clientId, partyId, secret);
  if (!row) return CLOSED;
  const next = setRsvp(toDomain(row), status, headCount);
  await persistGuestState(db, clientId, next);
  return openResult(db, row.eventId, next);
}
