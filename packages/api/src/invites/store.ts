import { and, desc, eq } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { client, event, party as partyTable } from "@invite-me/db/schema/invites";

import { type Card, DEFAULT_CARD, cardSchema } from "./card";
import {
  AGE_GROUPS,
  type AgeGroup,
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

export type PartyView = Party & {
  status: PartyStatus;
  /** Path the QR and share link point to. Rebuilt from the key on every read. */
  guestPath: string;
  createdAt: number;
};

/** Fields a guest may see. No link, no host bookkeeping. */
export type GuestParty = Pick<
  Party,
  "displayName" | "invitedAs" | "ageGroup" | "seats" | "seatLabel" | "rules" | "locale" | "rsvp" | "confirmedSeats"
>;

/** `closed` covers wrong secret, unknown party, and revoked alike, so nothing leaks. */
export type GuestResult = { state: "open"; party: GuestParty; card: Card } | { state: "closed" };

const CLOSED: GuestResult = { state: "closed" };

function toDomain(row: PartyRow): Party {
  return {
    id: row.id,
    eventId: row.eventId,
    displayName: row.displayName,
    invitedAs: row.invitedAs as InvitedAs,
    ageGroup: AGE_GROUPS.includes(row.ageGroup as AgeGroup) ? (row.ageGroup as AgeGroup) : null,
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
  };
}

function toGuest(p: Party): GuestParty {
  return {
    displayName: p.displayName,
    invitedAs: p.invitedAs,
    ageGroup: p.ageGroup,
    seats: p.seats,
    seatLabel: p.seatLabel,
    rules: p.rules,
    locale: p.locale,
    rsvp: p.rsvp,
    confirmedSeats: p.confirmedSeats,
  };
}

/** user id -> client id. A host's client row never changes once created, so each isolate asks D1 once per user. */
const clientIds = new Map<string, string>();

/** Returns the host's client id, creating the row on first use. Unique on user_id. */
export async function ensureClient(db: Database, userId: string): Promise<string> {
  const known = clientIds.get(userId);
  if (known) return known;
  const id = await lookupOrCreateClient(db, userId);
  clientIds.set(userId, id);
  return id;
}

async function lookupOrCreateClient(db: Database, userId: string): Promise<string> {
  const existing = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId)).limit(1);
  if (existing[0]) return existing[0].id;
  const id = randomToken();
  await db.insert(client).values({ id, userId }).onConflictDoNothing();
  const created = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId)).limit(1);
  if (!created[0]) throw new InviteError("NOT_FOUND", "Host account could not be initialised");
  return created[0].id;
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

export type InvitationView = { id: string; card: Card; createdAt: number };

function cardOf(row: typeof event.$inferSelect): Card {
  const raw = row.card ? cardSchema.parse(JSON.parse(row.card)) : DEFAULT_CARD;
  return { ...raw, preset: row.preset as Card["preset"] };
}

function toInvitation(row: typeof event.$inferSelect): InvitationView {
  return { id: row.id, card: cardOf(row), createdAt: row.createdAt.getTime() };
}

async function loadEvent(db: Database, clientId: string, eventId: string): Promise<typeof event.$inferSelect> {
  const rows = await db
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.clientId, clientId)))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return rows[0];
}

/** All of a host's invitations, newest first. */
export async function listInvitations(db: Database, clientId: string): Promise<InvitationView[]> {
  const rows = await db.select().from(event).where(eq(event.clientId, clientId)).orderBy(desc(event.createdAt));
  return rows.map(toInvitation);
}

export async function getInvitation(db: Database, clientId: string, eventId: string): Promise<InvitationView> {
  return toInvitation(await loadEvent(db, clientId, eventId));
}

/** Starts a new invitation from a template's sample content. */
export async function createInvitation(
  db: Database,
  clientId: string,
  preset: Card["preset"],
): Promise<InvitationView> {
  const card: Card = { ...DEFAULT_CARD, preset };
  const id = randomToken();
  const [row] = await db
    .insert(event)
    .values({ id, clientId, eventType: "wedding", preset, card: JSON.stringify(card) })
    .returning();
  if (!row) throw new InviteError("NOT_FOUND", "Invitation not found");
  return toInvitation(row);
}

export async function saveInvitation(
  db: Database,
  clientId: string,
  eventId: string,
  card: Card,
): Promise<InvitationView> {
  const [row] = await db
    .update(event)
    .set({ card: JSON.stringify(card), preset: card.preset })
    .where(and(eq(event.id, eventId), eq(event.clientId, clientId)))
    .returning();
  if (!row) throw new InviteError("NOT_FOUND", "Invitation not found");
  return toInvitation(row);
}

/** Deletes the invitation and its guests. */
export async function deleteInvitation(db: Database, clientId: string, eventId: string): Promise<void> {
  // Both deletes in one round trip; the party delete is scoped to the host, so a foreign id removes nothing.
  const [, removed] = await db.batch([
    db.delete(partyTable).where(and(eq(partyTable.eventId, eventId), eq(partyTable.clientId, clientId))),
    db.delete(event).where(and(eq(event.id, eventId), eq(event.clientId, clientId))).returning({ id: event.id }),
  ]);
  if (removed.length === 0) throw new InviteError("NOT_FOUND", "Invitation not found");
}

/** The card a guest sees: their invitation's, or for guests from before invitations were separate, the host's first. */
async function cardForParty(db: Database, clientId: string, party: Party, joined: typeof event.$inferSelect | null): Promise<Card> {
  if (joined) return cardOf(joined);
  if (party.eventId) return (await getInvitation(db, clientId, party.eventId)).card;
  const first = await db.select().from(event).where(eq(event.clientId, clientId)).orderBy(event.createdAt).limit(1);
  return first[0] ? cardOf(first[0]) : DEFAULT_CARD;
}

export async function createPartyFor(
  db: Database,
  key: string,
  clientId: string,
  input: Omit<CreatePartyInput, "id">,
): Promise<PartyView> {
  await loadEvent(db, clientId, input.eventId);
  const domain = createParty({ ...input, id: randomToken() });
  const row: typeof partyTable.$inferInsert = {
    id: domain.id,
    eventId: domain.eventId,
    clientId,
    displayName: domain.displayName,
    invitedAs: domain.invitedAs,
    ageGroup: domain.ageGroup,
    seats: domain.seats,
    seatLabel: domain.seatLabel,
    rules: domain.rules,
    locale: domain.locale,
  };
  const [saved] = await db.insert(partyTable).values(row).returning();
  if (!saved) throw new InviteError("NOT_FOUND", "Party not found");
  return toView(key, clientId, saved);
}

export async function listParties(
  db: Database,
  key: string,
  clientId: string,
  eventId: string,
): Promise<PartyView[]> {
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
  const [saved] = await db
    .update(partyTable)
    .set({ shared: next.shared })
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)))
    .returning();
  if (!saved) throw new InviteError("NOT_FOUND", "Party not found");
  return toView(key, clientId, saved);
}

export async function revokeParty(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
): Promise<PartyView> {
  const next = revoke(toDomain(await loadParty(db, clientId, partyId)));
  const [saved] = await db
    .update(partyTable)
    .set({ revoked: next.revoked })
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)))
    .returning();
  if (!saved) throw new InviteError("NOT_FOUND", "Party not found");
  return toView(key, clientId, saved);
}

/**
 * Guest-side authorization. Recomputes the link secret and compares in constant
 * time; returns the party only when the secret matches and it is not revoked.
 */
async function authorizeGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
): Promise<GuestRow | null> {
  const expected = await deriveLinkSecret(key, clientId, partyId);
  if (!timingSafeEqual(expected, secret)) return null;
  // One round trip: the party and its invitation come back together (the card is needed right after).
  const rows = await db
    .select({ party: partyTable, event })
    .from(partyTable)
    .leftJoin(event, and(eq(event.id, partyTable.eventId), eq(event.clientId, partyTable.clientId)))
    .where(and(eq(partyTable.id, partyId), eq(partyTable.clientId, clientId)))
    .limit(1);
  if (!rows[0]) return null;
  const party = toDomain(rows[0].party);
  return party.revoked ? null : { party, event: rows[0].event };
}

type GuestRow = { party: Party; event: typeof event.$inferSelect | null };

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

async function openResult(
  db: Database,
  clientId: string,
  party: Party,
  joined: typeof event.$inferSelect | null,
): Promise<GuestResult> {
  return { state: "open", party: toGuest(party), card: await cardForParty(db, clientId, party, joined) };
}

export async function resolveGuest(
  db: Database,
  key: string,
  clientId: string,
  partyId: string,
  secret: string,
): Promise<GuestResult> {
  const found = await authorizeGuest(db, key, clientId, partyId, secret);
  return found ? openResult(db, clientId, found.party, found.event) : CLOSED;
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
  const found = await authorizeGuest(db, key, clientId, partyId, secret);
  if (!found) return CLOSED;
  const next = recordOpen(found.party, now);
  await persistGuestState(db, clientId, next);
  return openResult(db, clientId, next, found.event);
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
  const found = await authorizeGuest(db, key, clientId, partyId, secret);
  if (!found) return CLOSED;
  const next = setRsvp(found.party, status, headCount);
  await persistGuestState(db, clientId, next);
  return openResult(db, clientId, next, found.event);
}
