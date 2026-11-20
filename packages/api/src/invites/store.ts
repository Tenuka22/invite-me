import { and, eq } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { event, eventAdmin, party as partyTable } from "@invite-me/db/schema/invites";

import { requireAccess, requireOwner, type AccessRole } from "./access";
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
import { clientIdForUser } from "./host";
import { deriveAdminInviteSecret, deriveLinkSecret, randomToken, timingSafeEqual } from "./token";

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
  /** This caller's access: the owner, or a bride/groom granted admin. */
  role: AccessRole;
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

function toInvitation(row: EventRow, role: AccessRole): InvitationView {
  return {
    id: row.id,
    template: row.preset,
    createdAt: row.createdAt.getTime(),
    card: row.card ? cardSchema.parse(JSON.parse(row.card)) : EMPTY_CARD,
    role,
  };
}

export async function updatePartyFor(
  db: Database,
  key: string,
  userId: string | null,
  input: { id: string; displayName: string; seatLabel: string | null; rules: string | null },
): Promise<PartyView> {
  const row = await loadPartyRow(db, input.id);
  await requireOwner(db, row.eventId ?? "", userId);
  await db.update(partyTable).set({ displayName: input.displayName, seatLabel: input.seatLabel, rules: input.rules }).where(eq(partyTable.id, input.id));
  return toView(key, row.clientId, await loadPartyRow(db, input.id));
}

export async function deletePartyFor(db: Database, userId: string | null, partyId: string): Promise<void> {
  const row = await loadPartyRow(db, partyId);
  await requireOwner(db, row.eventId ?? "", userId);
  await db.delete(partyTable).where(eq(partyTable.id, partyId));
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

/** Owner-side load by invitation id. */
async function loadEventRow(db: Database, eventId: string): Promise<EventRow> {
  const rows = await db
    .select()
    .from(event)
    .where(eq(event.id, eventId))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return rows[0];
}

/** Owner-side load by party id. */
async function loadPartyRow(db: Database, partyId: string): Promise<PartyRow> {
  const rows = await db
    .select()
    .from(partyTable)
    .where(eq(partyTable.id, partyId))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Party not found");
  return rows[0];
}

export async function createInvitation(
  db: Database,
  template: string,
  ownerId: string,
): Promise<InvitationView> {
  const id = randomToken();
  const clientId = await clientIdForUser(db, ownerId);
  await db.insert(event).values({ id, clientId, eventType: "wedding", preset: template });
  await db.insert(eventAdmin).values({
    id: randomToken(),
    eventId: id,
    userId: ownerId,
    role: "owner",
  });
  return toInvitation(await loadEvent(db, clientId, id), "owner");
}

/** All invitations where the caller is owner or admin (themselves or brides/grooms granted control). */
export async function listInvitations(db: Database, userId: string): Promise<InvitationView[]> {
  const rows = await db
    .select({ event: event, role: eventAdmin.role })
    .from(eventAdmin)
    .innerJoin(event, eq(event.id, eventAdmin.eventId))
    .where(eq(eventAdmin.userId, userId))
    .orderBy(event.createdAt);
  return rows.map(({ event: row, role }) => toInvitation(row, role as AccessRole));
}

export async function getInvitation(
  db: Database,
  userId: string | null,
  eventId: string,
): Promise<InvitationView> {
  await requireAccess(db, eventId, userId);
  const rows = await db
    .select({ event: event, role: eventAdmin.role })
    .from(eventAdmin)
    .innerJoin(event, eq(event.id, eventAdmin.eventId))
    .where(and(eq(eventAdmin.eventId, eventId), eq(eventAdmin.userId, userId!)))
    .limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return toInvitation(rows[0].event, rows[0].role as AccessRole);
}

/** Persists the card for one invitation. Returns the card as stored. Owner only. */
export async function saveCard(
  db: Database,
  userId: string | null,
  eventId: string,
  card: Card,
): Promise<Card> {
  await requireOwner(db, eventId, userId);
  await loadEvent(db, (await loadEventRow(db, eventId)).clientId, eventId);
  await db
    .update(event)
    .set({ card: JSON.stringify(card) })
    .where(eq(event.id, eventId));
  return card;
}

/** Grants a user admin access to an invitation (bridges them into the event's admin list). */
export async function grantAdmin(db: Database, eventId: string, userId: string): Promise<void> {
  await db
    .insert(eventAdmin)
    .values({ id: randomToken(), eventId, userId, role: "admin" })
    .onConflictDoNothing({ target: [eventAdmin.eventId, eventAdmin.userId] });
}

/** The admin invite URL for others to take admin: `/admin/invite/<eventId>.<secret>`. */
export async function adminInviteLinks(
  db: Database,
  key: string,
  userId: string | null,
  eventId: string,
): Promise<{ eventId: string; secret: string }> {
  await requireAccess(db, eventId, userId);
  const secret = await deriveAdminInviteSecret(key, eventId);
  return { eventId, secret };
}

/** Guest-side read of an invitation's card. Only used after the party's link secret checks out. */
async function getCard(db: Database, eventId: string): Promise<Card> {
  const rows = await db.select().from(event).where(eq(event.id, eventId)).limit(1);
  if (!rows[0]) throw new InviteError("NOT_FOUND", "Invitation not found");
  return toInvitation(rows[0], "admin").card;
}

/** The invitation must belong to the caller; the party's guest card comes from it. Owner only. */
export async function createPartyFor(
  db: Database,
  key: string,
  userId: string | null,
  input: Omit<CreatePartyInput, "id"> & { eventId: string },
): Promise<PartyView> {
  await requireOwner(db, input.eventId, userId);
  const { eventId, ...partyInput } = input;
  const row = await loadEventRow(db, eventId);
  const domain = createParty({ ...partyInput, id: randomToken() });
  const insert: typeof partyTable.$inferInsert = {
    id: domain.id,
    clientId: row.clientId,
    eventId,
    displayName: domain.displayName,
    invitedAs: domain.invitedAs,
    seats: domain.seats,
    seatLabel: domain.seatLabel,
    rules: domain.rules,
    locale: domain.locale,
  };
  await db.insert(partyTable).values(insert);
  return toView(key, row.clientId, await loadPartyRow(db, domain.id));
}

export async function listParties(db: Database, key: string, eventId: string): Promise<PartyView[]> {
  const clientId = (await loadEventRow(db, eventId)).clientId;
  const rows = await db
    .select()
    .from(partyTable)
    .where(eq(partyTable.eventId, eventId))
    .orderBy(partyTable.createdAt);
  return Promise.all(rows.map((row) => toView(key, clientId, row)));
}

export async function getParty(
  db: Database,
  key: string,
  userId: string | null,
  partyId: string,
): Promise<PartyView> {
  const row = await loadPartyRow(db, partyId);
  await requireAccess(db, row.eventId ?? "", userId);
  return toView(key, row.clientId, row);
}

export async function markPartyShared(
  db: Database,
  key: string,
  userId: string | null,
  partyId: string,
): Promise<PartyView> {
  const row = await loadPartyRow(db, partyId);
  await requireOwner(db, row.eventId ?? "", userId);
  const next = markShared(toDomain(row));
  await db
    .update(partyTable)
    .set({ shared: next.shared })
    .where(eq(partyTable.id, partyId));
  return toView(key, row.clientId, await loadPartyRow(db, partyId));
}

export async function revokeParty(
  db: Database,
  key: string,
  userId: string | null,
  partyId: string,
): Promise<PartyView> {
  const row = await loadPartyRow(db, partyId);
  await requireOwner(db, row.eventId ?? "", userId);
  const next = revoke(toDomain(row));
  await db
    .update(partyTable)
    .set({ revoked: next.revoked })
    .where(eq(partyTable.id, partyId));
  return toView(key, row.clientId, await loadPartyRow(db, partyId));
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
