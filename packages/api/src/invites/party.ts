export class InviteError extends Error {
  constructor(
    readonly code: "INVALID_INPUT" | "REVOKED" | "SEATS_EXCEEDED" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "InviteError";
  }
}

export type InvitedAs = "single" | "couple" | "group";
export type RsvpStatus = "pending" | "yes" | "maybe" | "no";
export type PartyStatus = "created" | "shared" | "opened" | "responded" | "revoked";

export type Party = {
  id: string;
  displayName: string;
  invitedAs: InvitedAs;
  seats: number;
  seatLabel: string | null;
  rules: string | null;
  locale: string;
  shared: boolean;
  opens: number;
  firstOpenedAt: number | null;
  lastOpenedAt: number | null;
  rsvp: RsvpStatus;
  confirmedSeats: number;
  revoked: boolean;
};

export type CreatePartyInput = {
  id: string;
  displayName: string;
  invitedAs: InvitedAs;
  /** Required for `group`; ignored otherwise. */
  groupSize?: number;
  seatLabel?: string | null;
  rules?: string | null;
  locale: string;
};

const MAX_NAME = 80;
const MAX_LABEL = 80;
const MAX_RULES = 500;
export const MAX_GROUP_SEATS = 50;

export function seatsFor(invitedAs: InvitedAs, groupSize?: number): number {
  if (invitedAs === "single") return 1;
  if (invitedAs === "couple") return 2;
  if (!Number.isInteger(groupSize) || groupSize! < 1 || groupSize! > MAX_GROUP_SEATS) {
    throw new InviteError(
      "INVALID_INPUT",
      `Group size must be a whole number from 1 to ${MAX_GROUP_SEATS}`,
    );
  }
  return groupSize!;
}

function trimmedOrNull(value: string | null | undefined, max: number, field: string): string | null {
  const v = value?.trim() ?? "";
  if (v.length > max) throw new InviteError("INVALID_INPUT", `${field} is longer than ${max} characters`);
  return v === "" ? null : v;
}

export function createParty(input: CreatePartyInput): Party {
  const displayName = input.displayName.trim();
  if (displayName === "" || displayName.length > MAX_NAME) {
    throw new InviteError("INVALID_INPUT", `Name must be 1 to ${MAX_NAME} characters`);
  }
  return {
    id: input.id,
    displayName,
    invitedAs: input.invitedAs,
    seats: seatsFor(input.invitedAs, input.groupSize),
    seatLabel: trimmedOrNull(input.seatLabel, MAX_LABEL, "Seat label"),
    rules: trimmedOrNull(input.rules, MAX_RULES, "Rules"),
    locale: input.locale,
    shared: false,
    opens: 0,
    firstOpenedAt: null,
    lastOpenedAt: null,
    rsvp: "pending",
    confirmedSeats: 0,
    revoked: false,
  };
}

function assertActive(party: Party): void {
  if (party.revoked) throw new InviteError("REVOKED", "This invitation is no longer available");
}

export function markShared(party: Party): Party {
  assertActive(party);
  return { ...party, shared: true };
}

/** Records one successful render of the card. Call only after the client has rendered. */
export function recordOpen(party: Party, now: number): Party {
  assertActive(party);
  return {
    ...party,
    opens: party.opens + 1,
    firstOpenedAt: party.firstOpenedAt ?? now,
    lastOpenedAt: now,
  };
}

/**
 * `yes` must carry a head-count of 1..seats. `maybe` and `no` carry none.
 * Calling again replaces the previous answer.
 */
export function setRsvp(party: Party, status: Exclude<RsvpStatus, "pending">, headCount?: number): Party {
  assertActive(party);
  if (status !== "yes") {
    return { ...party, rsvp: status, confirmedSeats: 0 };
  }
  if (!Number.isInteger(headCount) || headCount! < 1) {
    throw new InviteError("INVALID_INPUT", "Please enter how many people are coming");
  }
  if (headCount! > party.seats) {
    throw new InviteError("SEATS_EXCEEDED", `Only ${party.seats} seat(s) were reserved for you`);
  }
  return { ...party, rsvp: "yes", confirmedSeats: headCount! };
}

export function revoke(party: Party): Party {
  return { ...party, revoked: true };
}

export function statusOf(party: Party): PartyStatus {
  if (party.revoked) return "revoked";
  if (party.rsvp !== "pending") return "responded";
  if (party.opens > 0) return "opened";
  if (party.shared) return "shared";
  return "created";
}
